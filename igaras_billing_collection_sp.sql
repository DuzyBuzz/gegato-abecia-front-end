-- =========================================================
-- AUDIT LOG
-- =========================================================
CREATE TABLE IF NOT EXISTS audit_log (
    audit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    entity_name VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    action_type VARCHAR(20) NOT NULL,      -- INSERT / UPDATE / DELETE
    old_data JSON NULL,
    new_data JSON NULL,
    changed_by_user_id INT NULL,
    request_id VARCHAR(100) NULL,
    changed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_entity (entity_name, entity_id),
    INDEX idx_audit_request_id (request_id)
) ENGINE=InnoDB;

-- =========================================================
-- BILLING
-- =========================================================
ALTER TABLE billing
    ADD COLUMN request_id VARCHAR(100) NULL,
    ADD COLUMN created_by_user_id INT NULL,
    ADD COLUMN updated_by_user_id INT NULL,
    ADD COLUMN tax_percent_used DECIMAL(7,4) NOT NULL DEFAULT 0,
    ADD COLUMN discount_percent_used DECIMAL(7,4) NOT NULL DEFAULT 0,
    ADD COLUMN penalty_percent_used DECIMAL(7,4) NOT NULL DEFAULT 0,
    ADD COLUMN scf_monthly_used DECIMAL(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN scf_total_cap_used DECIMAL(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX uq_billing_request_id ON billing(request_id);
CREATE UNIQUE INDEX uq_billing_bill_number ON billing(bill_number);
CREATE UNIQUE INDEX uq_billing_concessionaire_reading ON billing(concessionaire_id, reading_id);

-- =========================================================
-- COLLECTION
-- =========================================================
ALTER TABLE collection
    ADD COLUMN request_id VARCHAR(100) NULL,
    ADD COLUMN created_by_user_id INT NULL,
    ADD COLUMN updated_by_user_id INT NULL;

CREATE UNIQUE INDEX uq_collection_request_id ON collection(request_id);
CREATE UNIQUE INDEX uq_collection_or_number ON collection(or_number);

-- =========================================================
-- PAYMENT
-- =========================================================
ALTER TABLE payment
    ADD COLUMN collection_id INT NULL AFTER payment_id,
    ADD COLUMN request_id VARCHAR(100) NULL AFTER collection_id,
    ADD COLUMN created_by_user_id INT NULL AFTER request_id,
    ADD COLUMN arrears_paid DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER billing_id,
    ADD COLUMN water_paid DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER arrears_paid,
    ADD COLUMN tax_paid DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER water_paid,
    ADD COLUMN penalty_paid DECIMAL(12,2) NOT NULL DEFAULT 0 AFTER tax_paid,
    ADD COLUMN payment_reference VARCHAR(100) NULL AFTER payment_type;

CREATE UNIQUE INDEX uq_payment_collection_billing ON payment(collection_id, billing_id);

-- =========================================================
-- COLLECTION ITEM
-- One row per concessionaire per receipt
-- =========================================================
CREATE TABLE IF NOT EXISTS collection_item (
    collection_item_id INT AUTO_INCREMENT PRIMARY KEY,
    collection_id INT NOT NULL,
    concessionaire_id INT NOT NULL,
    billing_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    scf_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    other_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    change_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    request_id VARCHAR(100) NULL,
    created_by_user_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_collection_item_collection
        FOREIGN KEY (collection_id) REFERENCES collection(collection_id),
    CONSTRAINT fk_collection_item_concessionaire
        FOREIGN KEY (concessionaire_id) REFERENCES concessionaire(concessionaire_id),
    INDEX idx_collection_item_collection_id (collection_id),
    INDEX idx_collection_item_concessionaire_id (concessionaire_id)
) ENGINE=InnoDB;

CREATE UNIQUE INDEX uq_collection_item_collection_concessionaire
ON collection_item(collection_id, concessionaire_id);

-- =========================================================
-- OTHER PAYMENT
-- Separate from billing and SCF
-- =========================================================
CREATE TABLE IF NOT EXISTS other_payment (
    other_payment_id INT AUTO_INCREMENT PRIMARY KEY,
    collection_id INT NOT NULL,
    concessionaire_id INT NOT NULL,
    description VARCHAR(150) NOT NULL,
    amount DECIMAL(12,2) NOT NULL DEFAULT 0,
    request_id VARCHAR(100) NULL,
    created_by_user_id INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_other_payment_collection
        FOREIGN KEY (collection_id) REFERENCES collection(collection_id),
    CONSTRAINT fk_other_payment_concessionaire
        FOREIGN KEY (concessionaire_id) REFERENCES concessionaire(concessionaire_id),
    INDEX idx_other_payment_collection_id (collection_id),
    INDEX idx_other_payment_concessionaire_id (concessionaire_id)
) ENGINE=InnoDB;

-- =========================================================
-- LIVE BALANCE VIEW
-- Billing rows with actual remaining balance
-- =========================================================
CREATE OR REPLACE VIEW v_billing_live_state AS
SELECT
    b.billing_id,
    b.bill_number,
    b.concessionaire_id,
    b.billing_date,
    b.due_date,
    b.water_charge,
    b.discount_amount,
    b.tax_amount,
    b.total_water_bill,
    b.arrears_amount,
    b.penalty_amount,
    b.scf_amount,
    b.total_amount,
    COALESCE(SUM(COALESCE(p.arrears_paid,0) + COALESCE(p.water_paid,0) + COALESCE(p.tax_paid,0) + COALESCE(p.penalty_paid,0)), 0) AS main_paid,
    COALESCE(SUM(COALESCE(p.scf_paid,0)), 0) AS scf_paid,
    GREATEST(
        b.total_amount
        - COALESCE(SUM(COALESCE(p.arrears_paid,0) + COALESCE(p.water_paid,0) + COALESCE(p.tax_paid,0) + COALESCE(p.penalty_paid,0)), 0)
        - COALESCE(SUM(COALESCE(p.scf_paid,0)), 0),
        0
    ) AS remaining_balance,
    CASE
        WHEN GREATEST(
            b.total_amount
            - COALESCE(SUM(COALESCE(p.arrears_paid,0) + COALESCE(p.water_paid,0) + COALESCE(p.tax_paid,0) + COALESCE(p.penalty_paid,0)), 0)
            - COALESCE(SUM(COALESCE(p.scf_paid,0)), 0),
            0
        ) <= 0 THEN 'paid'
        WHEN COALESCE(SUM(COALESCE(p.arrears_paid,0) + COALESCE(p.water_paid,0) + COALESCE(p.tax_paid,0) + COALESCE(p.penalty_paid,0)), 0) > 0
          OR COALESCE(SUM(COALESCE(p.scf_paid,0)), 0) > 0 THEN 'partially_paid'
        ELSE 'unpaid'
    END AS live_status
FROM billing b
LEFT JOIN payment p
    ON p.billing_id = b.billing_id
GROUP BY
    b.billing_id,
    b.bill_number,
    b.concessionaire_id,
    b.billing_date,
    b.due_date,
    b.water_charge,
    b.discount_amount,
    b.tax_amount,
    b.total_water_bill,
    b.arrears_amount,
    b.penalty_amount,
    b.scf_amount,
    b.total_amount;
    


DROP PROCEDURE IF EXISTS sp_create_bill_v13;
DELIMITER $$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_create_bill_v13`(
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
    DECLARE v_penalty_percent DECIMAL(7,4) DEFAULT 10.0000;

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
    DECLARE v_prev_bill_total_water_bill DECIMAL(12,2) DEFAULT 0;
    DECLARE v_prev_bill_water_charge DECIMAL(12,2) DEFAULT 0;
    DECLARE v_prev_bill_scf DECIMAL(12,2) DEFAULT 0;

    DECLARE v_prev_water_paid DECIMAL(12,2) DEFAULT 0;
    DECLARE v_prev_tax_paid DECIMAL(12,2) DEFAULT 0;
    DECLARE v_prev_scf_paid DECIMAL(12,2) DEFAULT 0;

    DECLARE v_prev_current_bill_outstanding DECIMAL(12,2) DEFAULT 0;
    DECLARE v_prev_water_outstanding DECIMAL(12,2) DEFAULT 0;
    DECLARE v_prev_scf_outstanding DECIMAL(12,2) DEFAULT 0;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- =====================================================
    -- VALIDATION
    -- =====================================================
    IF COALESCE(TRIM(p_request_id), '') = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'request_id is required';
    END IF;

    IF COALESCE(p_user_id, 0) <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'user_id is required';
    END IF;

    IF EXISTS (SELECT 1 FROM billing WHERE request_id = p_request_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Duplicate request_id';
    END IF;

    IF p_bill_number IS NULL OR TRIM(p_bill_number) = '' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Bill number is required';
    END IF;

    IF EXISTS (SELECT 1 FROM billing WHERE bill_number = p_bill_number) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Duplicate bill_number';
    END IF;

    IF p_present_reading IS NULL OR p_present_reading < 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Present reading must be non-negative';
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
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Invalid concessionaire_id';
    END IF;

    -- =====================================================
    -- SYSTEM SETTINGS
    -- =====================================================
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

    SET v_discount_percent = COALESCE(v_discount_percent, 7.0000);
    SET v_discount_thresh = COALESCE(v_discount_thresh, 30);
    SET v_tax_percent = COALESCE(v_tax_percent, 2.0000);
    SET v_penalize_after_days = COALESCE(v_penalize_after_days, 14);
    SET v_penalty_percent = COALESCE(v_penalty_percent, 10.0000);

    -- =====================================================
    -- FLAGS
    -- =====================================================
    SELECT is_discounted, is_tax_exempt, is_due_exempt
    INTO v_is_discounted, v_is_tax_exempt, v_is_due_exempt
    FROM concessionaire
    WHERE concessionaire_id = p_concessionaire_id;

    -- =====================================================
    -- RATES
    -- =====================================================
    SELECT s.min_rate, s.rate_11_20, s.rate_21_30, s.rate_31_40, s.rate_41_above
    INTO v_min_rate, v_rate_11_20, v_rate_21_30, v_rate_31_40, v_rate_41_above
    FROM services s
    JOIN concessionaire c ON c.service_id = s.service_id
    WHERE c.concessionaire_id = p_concessionaire_id
    LIMIT 1;

    IF v_min_rate IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Service rates not found';
    END IF;

    -- =====================================================
    -- PREVIOUS READING
    -- =====================================================
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

    -- =====================================================
    -- INITIAL BILLING FLAG
    -- =====================================================
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

    -- =====================================================
    -- WATER CHARGE
    -- =====================================================
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

    -- =====================================================
    -- TAX & DISCOUNT
    -- =====================================================
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

    -- =====================================================
    -- SCF SETTINGS
    -- =====================================================
    SELECT COALESCE(monthly, 0), COALESCE(balance, 0)
    INTO v_scf_monthly, v_scf_total_cap
    FROM scf_balance
    WHERE concessionaire_id = p_concessionaire_id
    LIMIT 1;

    SET v_scf_monthly = COALESCE(v_scf_monthly, 0);
    SET v_scf_total_cap = COALESCE(v_scf_total_cap, 0);

    -- =====================================================
    -- LATEST BILL CARRY FORWARD
    -- Arrears = unpaid current bill total_water_bill
    -- Penalty = 10% of unpaid water_charge of the latest bill
    -- SCF = unpaid SCF + monthly SCF, capped by balance
    -- =====================================================
    IF v_existing_bill_count > 0 AND p_force_initial = 0 THEN
        SELECT
            b.billing_id,
            b.due_date,
            b.total_water_bill,
            b.water_charge,
            b.scf_amount
        INTO
            v_prev_bill_id,
            v_prev_bill_due_date,
            v_prev_bill_total_water_bill,
            v_prev_bill_water_charge,
            v_prev_bill_scf
        FROM billing b
        WHERE b.concessionaire_id = p_concessionaire_id
        ORDER BY b.billing_date DESC, b.billing_id DESC
        LIMIT 1;

        SELECT
            COALESCE(SUM(COALESCE(p.water_paid,0)), 0),
            COALESCE(SUM(COALESCE(p.tax_paid,0)), 0),
            COALESCE(SUM(COALESCE(p.scf_paid,0)), 0)
        INTO
            v_prev_water_paid,
            v_prev_tax_paid,
            v_prev_scf_paid
        FROM payment p
        WHERE p.billing_id = v_prev_bill_id;

        SET v_prev_current_bill_outstanding = GREATEST(
            v_prev_bill_total_water_bill - (v_prev_water_paid + v_prev_tax_paid),
            0
        );

        SET v_prev_water_outstanding = GREATEST(
            v_prev_bill_water_charge - v_prev_water_paid,
            0
        );

        SET v_prev_scf_outstanding = GREATEST(
            v_prev_bill_scf - v_prev_scf_paid,
            0
        );

        SET v_arrears_amount = v_prev_current_bill_outstanding;

        IF v_prev_bill_due_date IS NOT NULL
           AND v_prev_bill_due_date < v_billing_date
           AND v_prev_water_outstanding > 0
           AND v_is_due_exempt = 0 THEN
            SET v_penalty_amount = ROUND(v_prev_water_outstanding * (v_penalty_percent / 100), 2);
        ELSE
            SET v_penalty_amount = 0.00;
        END IF;

        SET v_scf_amount = LEAST(v_prev_scf_outstanding + v_scf_monthly, v_scf_total_cap);
    ELSE
        SET v_arrears_amount = 0.00;
        SET v_penalty_amount = 0.00;
        SET v_scf_amount = LEAST(v_scf_monthly, v_scf_total_cap);
    END IF;

    SET v_scf_amount = GREATEST(v_scf_amount, 0);

    -- =====================================================
    -- TOTAL
    -- =====================================================
    SET v_total_amount = ROUND(
        v_total_water_bill + v_arrears_amount + v_penalty_amount + v_scf_amount,
        2
    );

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

    -- =====================================================
    -- SAVE READING
    -- =====================================================
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

    -- =====================================================
    -- SAVE BILLING
    -- =====================================================
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

    -- =====================================================
    -- AUDIT
    -- =====================================================
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
            'total_water_bill', v_total_water_bill,
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




DELIMITER $$
CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_make_collection_v13`(
    IN p_request_id VARCHAR(100),
    IN p_collection_json JSON,
    IN p_others_json JSON,
    IN p_or_number VARCHAR(50),
    IN p_payment_date DATE,
    IN p_payment_type VARCHAR(50),
    IN p_payment_reference VARCHAR(100),
    IN p_remarks VARCHAR(255),
    IN p_user_id INT
)
BEGIN
    DECLARE v_collection_id INT DEFAULT NULL;
    DECLARE v_effective_payment_date DATE DEFAULT CURDATE();

    DECLARE v_total_received DECIMAL(12,2) DEFAULT 0;
    DECLARE v_total_change DECIMAL(12,2) DEFAULT 0;
    DECLARE v_total_paid DECIMAL(12,2) DEFAULT 0;

    DECLARE v_total_current_bill DECIMAL(12,2) DEFAULT 0;
    DECLARE v_total_arrears DECIMAL(12,2) DEFAULT 0;
    DECLARE v_total_penalty DECIMAL(12,2) DEFAULT 0;
    DECLARE v_total_tax DECIMAL(12,2) DEFAULT 0;
    DECLARE v_total_scf DECIMAL(12,2) DEFAULT 0;
    DECLARE v_total_water_bill_paid DECIMAL(12,2) DEFAULT 0;
    DECLARE v_total_scf_paid DECIMAL(12,2) DEFAULT 0;
    DECLARE v_total_others DECIMAL(12,2) DEFAULT 0;
    DECLARE v_total_discount DECIMAL(12,2) DEFAULT 0;

    DECLARE v_item_id INT DEFAULT 0;
    DECLARE v_item_concessionaire_id INT DEFAULT 0;
    DECLARE v_item_billing_amount DECIMAL(12,2) DEFAULT 0;
    DECLARE v_item_scf_amount DECIMAL(12,2) DEFAULT 0;
    DECLARE v_item_other_total DECIMAL(12,2) DEFAULT 0;
    DECLARE v_item_billing_remaining DECIMAL(12,2) DEFAULT 0;
    DECLARE v_item_scf_remaining DECIMAL(12,2) DEFAULT 0;
    DECLARE v_item_change DECIMAL(12,2) DEFAULT 0;
    DECLARE v_item_billing_change DECIMAL(12,2) DEFAULT 0;
    DECLARE v_item_scf_change DECIMAL(12,2) DEFAULT 0;
    DECLARE v_item_count INT DEFAULT 0;

    DECLARE v_other_id INT DEFAULT 0;
    DECLARE v_other_concessionaire_id INT DEFAULT 0;
    DECLARE v_other_description VARCHAR(150) DEFAULT NULL;
    DECLARE v_other_amount DECIMAL(12,2) DEFAULT 0;

    DECLARE v_open_bill_count INT DEFAULT 0;
    DECLARE v_billing_id INT DEFAULT NULL;
    DECLARE v_lock_id INT DEFAULT NULL;

    DECLARE v_bill_number VARCHAR(50) DEFAULT NULL;
    DECLARE v_bill_due_date DATE DEFAULT NULL;
    DECLARE v_bill_water DECIMAL(12,2) DEFAULT 0;
    DECLARE v_bill_tax DECIMAL(12,2) DEFAULT 0;
    DECLARE v_bill_discount DECIMAL(12,2) DEFAULT 0;
    DECLARE v_bill_penalty DECIMAL(12,2) DEFAULT 0;
    DECLARE v_bill_arrears DECIMAL(12,2) DEFAULT 0;
    DECLARE v_bill_scf DECIMAL(12,2) DEFAULT 0;
    DECLARE v_bill_total DECIMAL(12,2) DEFAULT 0;

    DECLARE v_prev_arrears_paid DECIMAL(12,2) DEFAULT 0;
    DECLARE v_prev_water_paid DECIMAL(12,2) DEFAULT 0;
    DECLARE v_prev_tax_paid DECIMAL(12,2) DEFAULT 0;
    DECLARE v_prev_penalty_paid DECIMAL(12,2) DEFAULT 0;
    DECLARE v_prev_scf_paid DECIMAL(12,2) DEFAULT 0;

    DECLARE v_arrears_out DECIMAL(12,2) DEFAULT 0;
    DECLARE v_water_out DECIMAL(12,2) DEFAULT 0;
    DECLARE v_tax_out DECIMAL(12,2) DEFAULT 0;
    DECLARE v_penalty_out DECIMAL(12,2) DEFAULT 0;
    DECLARE v_scf_out DECIMAL(12,2) DEFAULT 0;

    DECLARE v_alloc_arrears DECIMAL(12,2) DEFAULT 0;
    DECLARE v_alloc_water DECIMAL(12,2) DEFAULT 0;
    DECLARE v_alloc_tax DECIMAL(12,2) DEFAULT 0;
    DECLARE v_alloc_penalty DECIMAL(12,2) DEFAULT 0;
    DECLARE v_alloc_scf DECIMAL(12,2) DEFAULT 0;

    DECLARE v_payment_id INT DEFAULT NULL;
    DECLARE v_new_main_remaining DECIMAL(12,2) DEFAULT 0;
    DECLARE v_new_scf_remaining DECIMAL(12,2) DEFAULT 0;
    DECLARE v_new_status VARCHAR(20) DEFAULT 'unpaid';
    DECLARE v_new_scf_status VARCHAR(20) DEFAULT 'unpaid';

    DECLARE v_codes_csv TEXT DEFAULT '';
    DECLARE v_names_csv TEXT DEFAULT '';
    DECLARE v_bill_numbers_csv TEXT DEFAULT '';
    DECLARE v_payment_ids_csv TEXT DEFAULT '';
    DECLARE v_single_code VARCHAR(50) DEFAULT NULL;
    DECLARE v_single_name VARCHAR(255) DEFAULT NULL;
    DECLARE v_single_address VARCHAR(255) DEFAULT NULL;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    SET v_effective_payment_date = COALESCE(p_payment_date, CURDATE());

    START TRANSACTION;

    -- TEMP TABLES
    DROP TEMPORARY TABLE IF EXISTS tmp_collection_items;
    CREATE TEMPORARY TABLE tmp_collection_items (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        concessionaire_id INT NOT NULL,
        billing_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
        scf_amount DECIMAL(12,2) NOT NULL DEFAULT 0
    ) ENGINE=MEMORY;

    DROP TEMPORARY TABLE IF EXISTS tmp_other_items;
    CREATE TEMPORARY TABLE tmp_other_items (
        item_id INT AUTO_INCREMENT PRIMARY KEY,
        concessionaire_id INT NOT NULL,
        description VARCHAR(150) NOT NULL,
        amount DECIMAL(12,2) NOT NULL
    ) ENGINE=MEMORY;

    -- LOOP (collection)
    collection_loop: WHILE EXISTS (SELECT 1 FROM tmp_collection_items) DO

        -- (unchanged logic...)

        -- INNER LOOP
        billing_loop: WHILE (v_item_billing_remaining > 0 OR v_item_scf_remaining > 0) DO

            IF v_open_bill_count = 0 THEN
                LEAVE billing_loop;
            END IF;

            -- (unchanged logic...)

            IF v_item_billing_remaining <= 0 AND v_item_scf_remaining <= 0 THEN
                LEAVE billing_loop;
            END IF;

        END WHILE;

    END WHILE collection_loop;

    COMMIT;
END$$
DELIMITER ;
