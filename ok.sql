DROP PROCEDURE IF EXISTS sp_create_bill_v12;
DELIMITER $$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_create_bill_v12`(
    IN p_concessionaire_id INT,
    IN p_present_reading INT,
    IN p_bill_number VARCHAR(50),
    IN p_free_water INT,
    IN p_force_initial TINYINT(1),
    IN p_user_id INT,
    IN p_request_id VARCHAR(100)
)
BEGIN
    DECLARE v_lock_id INT DEFAULT NULL;
    DECLARE v_billing_id INT DEFAULT 0;
    DECLARE v_reading_id INT DEFAULT 0;

    DECLARE v_prev_reading INT DEFAULT 0;
    DECLARE v_raw_consumption INT DEFAULT 0;
    DECLARE v_billable INT DEFAULT 0;

    DECLARE v_discount_percent DECIMAL(7,4) DEFAULT 0;
    DECLARE v_discount_thresh INT DEFAULT 0;
    DECLARE v_tax_percent DECIMAL(7,4) DEFAULT 0;
    DECLARE v_penalize_after_days INT DEFAULT 14;
    DECLARE v_penalty_percent DECIMAL(7,4) DEFAULT 10.00;

    DECLARE v_min_rate DECIMAL(12,2) DEFAULT 0;
    DECLARE v_rate_11_20 DECIMAL(12,2) DEFAULT 0;
    DECLARE v_rate_21_30 DECIMAL(12,2) DEFAULT 0;
    DECLARE v_rate_31_40 DECIMAL(12,2) DEFAULT 0;
    DECLARE v_rate_41_above DECIMAL(12,2) DEFAULT 0;

    DECLARE v_water_charge DECIMAL(12,2) DEFAULT 0;
    DECLARE v_discount_amount DECIMAL(12,2) DEFAULT 0;
    DECLARE v_tax_amount DECIMAL(12,2) DEFAULT 0;
    DECLARE v_penalty_amount DECIMAL(12,2) DEFAULT 0;
    DECLARE v_arrears_amount DECIMAL(12,2) DEFAULT 0;
    DECLARE v_total_water_bill DECIMAL(12,2) DEFAULT 0;
    DECLARE v_total_amount DECIMAL(12,2) DEFAULT 0;

    DECLARE v_scf_monthly DECIMAL(12,2) DEFAULT 0;
    DECLARE v_scf_total_cap DECIMAL(12,2) DEFAULT 0;
    DECLARE v_scf_unpaid DECIMAL(12,2) DEFAULT 0;
    DECLARE v_scf_amount DECIMAL(12,2) DEFAULT 0;

    DECLARE v_is_discounted TINYINT DEFAULT 0;
    DECLARE v_is_tax_exempt TINYINT DEFAULT 0;
    DECLARE v_is_due_exempt TINYINT DEFAULT 0;
    DECLARE v_is_initial_billing TINYINT DEFAULT 0;

    DECLARE v_existing_bill_count INT DEFAULT 0;
    DECLARE v_billing_date DATE DEFAULT CURDATE();
    DECLARE v_due_date DATE DEFAULT NULL;
    DECLARE v_status VARCHAR(20) DEFAULT 'unpaid';
    DECLARE v_scf_status VARCHAR(20) DEFAULT 'unpaid';

    DECLARE v_prev_bill_id INT DEFAULT NULL;
    DECLARE v_prev_bill_due_date DATE DEFAULT NULL;
    DECLARE v_prev_bill_arrears DECIMAL(12,2) DEFAULT 0;
    DECLARE v_prev_bill_water DECIMAL(12,2) DEFAULT 0;
    DECLARE v_prev_bill_scf DECIMAL(12,2) DEFAULT 0;
    DECLARE v_prev_main_paid DECIMAL(12,2) DEFAULT 0;
    DECLARE v_prev_scf_paid DECIMAL(12,2) DEFAULT 0;
    DECLARE v_prev_outstanding_water DECIMAL(12,2) DEFAULT 0;
    DECLARE v_prev_outstanding_scf DECIMAL(12,2) DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    IF COALESCE(TRIM(p_request_id), '') = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'request_id is required';
    END IF;

    IF COALESCE(p_user_id, 0) <= 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'user_id is required';
    END IF;

    IF EXISTS (SELECT 1 FROM billing WHERE request_id = p_request_id) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Duplicate request_id';
    END IF;

    IF p_bill_number IS NULL OR TRIM(p_bill_number) = '' THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Bill number is required';
    END IF;

    IF EXISTS (SELECT 1 FROM billing WHERE bill_number = p_bill_number) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Duplicate bill_number';
    END IF;

    IF p_present_reading IS NULL OR p_present_reading < 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Present reading must be non-negative';
    END IF;

    IF p_free_water IS NULL OR p_free_water < 0 THEN
        SET p_free_water = 0;
    END IF;

    -- Lock concessionaire row
    SELECT concessionaire_id
    INTO v_lock_id
    FROM concessionaire
    WHERE concessionaire_id = p_concessionaire_id
    FOR UPDATE;

    IF v_lock_id IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Invalid concessionaire_id';
    END IF;

    -- Settings
    SELECT
        CAST(MAX(CASE WHEN settings_key='discount_percent' THEN settings_value END) AS DECIMAL(7,4)),
        CAST(MAX(CASE WHEN settings_key='discount_thresh_hold' THEN settings_value END) AS SIGNED),
        CAST(MAX(CASE WHEN settings_key='tax_percent' THEN settings_value END) AS DECIMAL(7,4)),
        CAST(MAX(CASE WHEN settings_key='penalize_after_days' THEN settings_value END) AS SIGNED),
        CAST(MAX(CASE WHEN settings_key='penalty_percent' THEN settings_value END) AS DECIMAL(7,4))
    INTO
        v_discount_percent,
        v_discount_thresh,
        v_tax_percent,
        v_penalize_after_days,
        v_penalty_percent
    FROM system_settings;

    SET v_discount_percent = COALESCE(v_discount_percent, 7.00);
    SET v_discount_thresh = COALESCE(v_discount_thresh, 30);
    SET v_tax_percent = COALESCE(v_tax_percent, 2.00);
    SET v_penalize_after_days = COALESCE(v_penalize_after_days, 14);
    SET v_penalty_percent = COALESCE(v_penalty_percent, 10.00);

    -- Concessionaire flags
    SELECT is_discounted, is_tax_exempt, is_due_exempt
    INTO v_is_discounted, v_is_tax_exempt, v_is_due_exempt
    FROM concessionaire
    WHERE concessionaire_id = p_concessionaire_id;

    -- Service rates
    SELECT s.min_rate, s.rate_11_20, s.rate_21_30, s.rate_31_40, s.rate_41_above
    INTO v_min_rate, v_rate_11_20, v_rate_21_30, v_rate_31_40, v_rate_41_above
    FROM services s
    JOIN concessionaire c ON c.service_id = s.service_id
    WHERE c.concessionaire_id = p_concessionaire_id
    LIMIT 1;

    IF v_min_rate IS NULL THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Service rates not found';
    END IF;

    -- Previous reading
    SELECT present_reading
    INTO v_prev_reading
    FROM reading
    WHERE concessionaire_id = p_concessionaire_id
    ORDER BY reading_date DESC, reading_id DESC
    LIMIT 1;

    SET v_prev_reading = COALESCE(v_prev_reading, 0);

    IF v_prev_reading > 0 AND p_present_reading < v_prev_reading AND p_force_initial = 0 THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Present reading cannot be lower than previous reading';
    END IF;

    SET v_raw_consumption = GREATEST(p_present_reading - v_prev_reading, 0);
    SET v_billable = GREATEST(v_raw_consumption - p_free_water, 0);

    -- Initial billing handling
    SELECT COUNT(*)
    INTO v_existing_bill_count
    FROM billing
    WHERE concessionaire_id = p_concessionaire_id;

    IF p_force_initial = 1 THEN
        UPDATE billing
        SET is_initial = 0
        WHERE concessionaire_id = p_concessionaire_id
          AND COALESCE(is_initial,0) = 1;

        SET v_is_initial_billing = 1;
    ELSEIF v_existing_bill_count = 0 THEN
        SET v_is_initial_billing = 1;
    ELSE
        SET v_is_initial_billing = 0;
    END IF;

    -- Water charge
    IF v_billable = 0 THEN
        IF v_is_initial_billing = 1 THEN
            SET v_water_charge = 0.00;
        ELSE
            SET v_water_charge = v_min_rate;
        END IF;
    ELSE
        IF v_is_initial_billing = 1 AND v_billable < 10 THEN
            SET v_water_charge = ROUND(v_billable * (v_min_rate / 10), 2);
        ELSE
            SET v_water_charge = v_min_rate;

            IF v_billable > 10 THEN
                SET v_water_charge = v_water_charge + LEAST(v_billable - 10, 10) * v_rate_11_20;
            END IF;

            IF v_billable > 20 THEN
                SET v_water_charge = v_water_charge + LEAST(v_billable - 20, 10) * v_rate_21_30;
            END IF;

            IF v_billable > 30 THEN
                SET v_water_charge = v_water_charge + LEAST(v_billable - 30, 10) * v_rate_31_40;
            END IF;

            IF v_billable > 40 THEN
                SET v_water_charge = v_water_charge + (v_billable - 40) * v_rate_41_above;
            END IF;

            SET v_water_charge = ROUND(v_water_charge, 2);
        END IF;
    END IF;

    -- Tax and discount
    IF v_is_tax_exempt = 1 THEN
        SET v_tax_amount = 0.00;
    ELSE
        SET v_tax_amount = ROUND(v_water_charge * (v_tax_percent / 100), 2);
    END IF;

    IF v_is_discounted = 1 AND v_billable <= v_discount_thresh THEN
        SET v_discount_amount = ROUND((v_water_charge + v_tax_amount) * (v_discount_percent / 100), 2);
    ELSE
        SET v_discount_amount = 0.00;
    END IF;

    SET v_total_water_bill = ROUND(v_water_charge + v_tax_amount - v_discount_amount, 2);

    -- Carry forward from the latest previous bill only
    IF v_existing_bill_count > 0 AND p_force_initial = 0 THEN
        SELECT
            b.billing_id,
            b.due_date,
            b.arrears_amount,
            b.water_charge,
            b.scf_amount
        INTO
            v_prev_bill_id,
            v_prev_bill_due_date,
            v_prev_bill_arrears,
            v_prev_bill_water,
            v_prev_bill_scf
        FROM billing b
        WHERE b.concessionaire_id = p_concessionaire_id
        ORDER BY b.billing_date DESC, b.billing_id DESC
        LIMIT 1;

        SELECT
            COALESCE(SUM(COALESCE(p.arrears_paid,0) + COALESCE(p.water_paid,0)), 0),
            COALESCE(SUM(COALESCE(p.scf_paid,0)), 0)
        INTO
            v_prev_main_paid,
            v_prev_scf_paid
        FROM payment p
        WHERE p.billing_id = v_prev_bill_id;

        SET v_prev_outstanding_water = GREATEST((v_prev_bill_arrears + v_prev_bill_water) - v_prev_main_paid, 0);
        SET v_prev_outstanding_scf = GREATEST(v_prev_bill_scf - v_prev_scf_paid, 0);

        SET v_arrears_amount = v_prev_outstanding_water;

        IF v_prev_bill_due_date IS NOT NULL
           AND v_prev_bill_due_date < v_billing_date
           AND v_prev_outstanding_water > 0
           AND v_is_due_exempt = 0 THEN
            SET v_penalty_amount = ROUND(v_prev_outstanding_water * (v_penalty_percent / 100), 2);
        ELSE
            SET v_penalty_amount = 0.00;
        END IF;

        SET v_scf_amount = LEAST(v_prev_outstanding_scf + v_scf_monthly, v_scf_total_cap);
    ELSE
        SET v_arrears_amount = 0.00;
        SET v_penalty_amount = 0.00;
        SET v_scf_amount = LEAST(v_scf_monthly, v_scf_total_cap);
    END IF;

    SET v_scf_amount = GREATEST(v_scf_amount, 0);

    -- Total
    SET v_total_amount = ROUND(v_total_water_bill + v_arrears_amount + v_penalty_amount + v_scf_amount, 2);

    IF v_is_due_exempt = 1 THEN
        SET v_due_date = NULL;
    ELSE
        SET v_due_date = DATE_ADD(v_billing_date, INTERVAL v_penalize_after_days DAY);
    END IF;

    IF v_total_amount <= 0 THEN
        SET v_status = 'paid';
    ELSE
        SET v_status = 'unpaid';
    END IF;

    IF v_scf_amount <= 0 THEN
        SET v_scf_status = 'paid';
    ELSE
        SET v_scf_status = 'unpaid';
    END IF;

    -- Save reading
    INSERT INTO reading (
        concessionaire_id,
        previous_reading,
        present_reading,
        reading_date
    )
    VALUES (
        p_concessionaire_id,
        v_prev_reading,
        p_present_reading,
        v_billing_date
    );

    SET v_reading_id = LAST_INSERT_ID();

    -- Save billing
    INSERT INTO billing (
        bill_number,
        concessionaire_id,
        reading_id,
        billing_date,
        due_date,
        free_water,
        consumption,
        water_charge,
        discount_amount,
        tax_amount,
        total_water_bill,
        scf_amount,
        arrears_amount,
        penalty_amount,
        total_amount,
        status,
        scf_status,
        is_initial,
        request_id,
        created_by_user_id,
        updated_by_user_id,
        tax_percent_used,
        discount_percent_used,
        penalty_percent_used,
        scf_monthly_used,
        scf_total_cap_used
    )
    VALUES (
        p_bill_number,
        p_concessionaire_id,
        v_reading_id,
        v_billing_date,
        v_due_date,
        GREATEST(p_free_water, 0),
        v_raw_consumption,
        v_water_charge,
        v_discount_amount,
        v_tax_amount,
        v_total_water_bill,
        v_scf_amount,
        v_arrears_amount,
        v_penalty_amount,
        v_total_amount,
        v_status,
        v_scf_status,
        v_is_initial_billing,
        p_request_id,
        p_user_id,
        p_user_id,
        v_tax_percent,
        v_discount_percent,
        v_penalty_percent,
        v_scf_monthly,
        v_scf_total_cap
    );

    SET v_billing_id = LAST_INSERT_ID();

    -- Audit billing insert
    INSERT INTO audit_log (
        entity_name,
        entity_id,
        action_type,
        old_data,
        new_data,
        changed_by_user_id,
        request_id
    )
    VALUES (
        'billing',
        v_billing_id,
        'INSERT',
        NULL,
        JSON_OBJECT(
            'billing_id', v_billing_id,
            'bill_number', p_bill_number,
            'concessionaire_id', p_concessionaire_id,
            'water_charge', v_water_charge,
            'tax_amount', v_tax_amount,
            'discount_amount', v_discount_amount,
            'arrears_amount', v_arrears_amount,
            'penalty_amount', v_penalty_amount,
            'scf_amount', v_scf_amount,
            'total_amount', v_total_amount,
            'status', v_status,
            'scf_status', v_scf_status,
            'request_id', p_request_id,
            'user_id', p_user_id
        ),
        p_user_id,
        p_request_id
    );

    COMMIT;

    SELECT
        v_billing_id AS billing_id,
        p_concessionaire_id AS concessionaire_id,
        v_prev_reading AS previous_reading,
        p_present_reading AS present_reading,
        v_raw_consumption AS raw_consumption,
        v_billable AS billable_consumption,
        v_water_charge AS water_charge,
        v_tax_amount AS tax_amount,
        v_discount_amount AS discount_amount,
        v_total_water_bill AS total_water_bill,
        v_scf_amount AS scf_amount,
        v_arrears_amount AS arrears_amount,
        v_penalty_amount AS penalty_amount,
        v_total_amount AS grand_total,
        v_status AS status,
        v_scf_status AS scf_status,
        p_request_id AS request_id;
END$$

DELIMITER ;