# Funeral Contract Entry Form - Testing Guide

## Overview
The funeral contract entry form has been enhanced with:
- ✅ **Sample Data Pre-population** - Form loads with realistic test data automatically
- ✅ **Enhanced Validation** - Detailed toast messages showing all required fields
- ✅ **Money Formatting** - Price and discount fields formatted to 2 decimal places (₱)
- ✅ **API Integration** - Full integration with FuneralServiceService to save contracts

---

## Sample Data Included

### Section 1: Contract Information
```
Contract Number: FCS-2024-001234
Contract Date: Today's date
Service Type: Standard Funeral Service
Contract Price: ₱45,000.00
Discount: ₱5,000.00
Due Date: 30 days from today
Checked By: Admin User
Financial Assistance: DSWD
```

### Section 2: Deceased Information
```
Name: Juan Dela Cruz
Date of Birth: 1945-03-15 (Age auto-calculated)
Gender: Male
Civil Status: Married
Date of Death: 2024-03-10
Time of Death: 14:30
Place of Death: St. Luke's Medical Center, Quezon City
Address: #123 Sampaguita St., Barangay San Isidro, Quezon City
Parents: Jose Dela Cruz (Father), Maria Santos Cruz (Mother)
Informant: Maria Dela Cruz (Daughter)
Religion: Roman Catholic
```

### Section 3: Contractee Information
```
Contractee Name: Maria Dela Cruz
Age: 45
Gender: Female
Civil Status: Married
Contact: +63 917 123 4567
Location: San Isidro, Quezon City, Metro Manila
Plan: Premium Package (PLAN-2024-001)
```

### Section 4-11: Additional Sections
All other sections are pre-populated with realistic funeral service data including:
- Casket/Urn information
- Delivery details
- Transfer and burial/cremation schedule
- Embalming and makeup records
- Medical information
- Government documents and signatures
- Administrative timestamps

---

## Testing Steps

### 1. Form Loading
1. Navigate to the Funeral Contract Entry form
2. Observe that all fields are **automatically populated** with sample data
3. Notice the breadcrumb navigation at top showing "Currently viewing: 1"
4. Scroll through form to see color-coded sections (1-11)

### 2. Money Field Testing
1. Navigate to Section 1 (Contract Information)
2. Verify **Contract Price** field shows: ₱45,000.00
3. Verify **Discount** field shows: ₱5,000.00
4. Both fields have helper text: "Format: 2 decimal places"
5. Try editing these fields:
   - Enter `1234` → Auto-formats to `1234.00`
   - Enter `999.5` → Auto-formats to `999.50`
   - Enter `50000.999` → Auto-formats to `50000.99`

### 3. Auto-Calculate Age
1. Navigate to Section 2 (Deceased Information)
2. Verify **Age** field shows: 79 (auto-calculated from DOB)
3. Change **Date of Birth** to a different date
4. Observe **Age** field updates immediately
5. Age calculation accounts for current date

### 4. Breadcrumb Navigation
1. Click number buttons (1-11) in the sticky breadcrumb
2. Form smoothly scrolls to that section
3. Section number button highlights with blue background when viewing that section
4. Breadcrumb stays visible when scrolling
5. All 11 sections accessible via breadcrumb

### 5. Validation Testing

#### Test Required Field Validation:
1. Click the **Save Contract** button
2. Form validates successfully (all required fields are filled)
3. Success message shows: "Contract Saved Successfully"

#### To test validation error message:
1. Clear the **Contract Number** field (Section 1)
2. Clear the **First Name** field (Section 2)
3. Click **Save Contract**
4. Toast shows error with missing field list:
   ```
   Validation Error - 2 field(s) missing
   
   Required Fields (Money in 2 decimals):
   - Contract Number
   - First Name
   ```

### 6. API Integration Testing

#### Success Case:
1. Ensure form has all required fields (already pre-filled)
2. Click **Save Contract** button
3. Toast shows: "Processing: Saving contract to database..."
4. After API response:
   - Green success toast appears
   - Shows: "Contract Saved Successfully"
   - Includes: "Contract ID: [ID from API]"
   - Form resets to empty
   - Auto-navigates back to previous page after 2 seconds

#### Error Handling:
If API call fails:
1. Red error toast appears
2. Shows: "Failed to Save Contract"
3. Includes error message from API
4. Message is sticky (doesn't auto-dismiss)
5. User can retry without losing data

---

## API Endpoint Information

### Service: FuneralServiceService
**Location**: `src/app/services/funeral-service.service.ts`

**Method**: `save(service: FuneralService)`
**URL**: `${environment.api}/funeralservice/save`
**HTTP Method**: POST

**Payload Structure**:
```typescript
{
  contractNo: string;
  type: string;
  contractDate: Date | string;
  price: number;          // 2 decimal format
  discount: number;       // 2 decimal format
  firstName: string;
  lastName: string;
  dateOfBirth: Date | string;
  age: number;
  gender: string;
  civilStatus: string;
  dateOfDeath: Date | string;
  // ... 55 total fields
}
```

---

## Form Fields Summary

### Required Fields (Must be filled):
1. ✅ Contract Number
2. ✅ Service Type (Type of Service)
3. ✅ Contract Date
4. ✅ Contract Price
5. ✅ First Name
6. ✅ Last Name
7. ✅ Date of Birth
8. ✅ Age
9. ✅ Gender
10. ✅ Civil Status
11. ✅ Date of Death
12. ✅ Place of Death
13. ✅ Address
14. ✅ Contractee Name
15. ✅ Contractee Age
16. ✅ Contact Number
17. ✅ Barangay
18. ✅ District
19. ✅ City/Municipality
20. ✅ Casket Type

### Optional Fields:
- Financial Assistance
- Discount
- Due Date
- Checked By
- Middle Name
- Time of Death
- Place of Birth
- Religion
- Parents' Names
- Informant
- And all other fields in sections 4-11

---

## Known Features

### Parent Component Integration
- Form tracks `contractId` from route parameters
- If no contractId exists, generates temporary ID on save
- Auto-navigates after successful save
- Respects user role (Admin vs Biller) for navigation paths

### Combobox (Dropdown) Integration
- All dropdowns pre-load data from Firestore
- Searchable dropdowns available for:
  - Service Type
  - Financial Assistance
  - Gender
  - Civil Status
  - Casket Type
  - Urn Type
  - Autopsy
  - ID Type
  - Delivery Status

### Display Names Mapping
All 95+ fields have professional display names for error messages:
- `contractNo` → "Contract Number"
- `price` → "Contract Price"
- etc.

---

## Troubleshooting

### Form Not Showing Sample Data
- Check that `initializeSampleData()` is called in `ngOnInit()`
- Verify `patchValue()` is being used instead of `setValue()`

### Money Fields Not Formatting
- Ensure the `valueChanges` subscription in `ngOnInit()` is active
- Check that `toFixed(2)` formatting is applied
- Browser cache may need clearing

### API Call Failing
- Verify `environment.api` is correctly configured
- Check network tab in browser DevTools for actual API URL
- Ensure backend service is running and accessible
- Check CORS settings on backend

### Validation Toast Not Showing Required Fields
- Verify `getInvalidFields()` method returns all invalid controls
- Check that `fieldDisplayNames` mapping is complete
- Ensure `isFieldInvalid()` is working correctly

---

## Testing Checklist

- [ ] Form loads with sample data pre-filled
- [ ] Age auto-calculates from date of birth
- [ ] Money fields format to 2 decimals (₱XX,XXX.00)
- [ ] Breadcrumb navigation works (all 11 sections)
- [ ] Section highlighting updates when scrolling
- [ ] Validation toast shows missing required fields
- [ ] Save button calls API endpoint
- [ ] Success toast appears on save
- [ ] Form resets after successful save
- [ ] Auto-navigation works after save
- [ ] Error handling works for API failures
- [ ] All 11 sections have proper color coding
- [ ] Sticky header and breadcrumb visible while scrolling
- [ ] Responsive design works on mobile/tablet/desktop
- [ ] Dropdown searches work for searchable fields

---

## Sample Values Used in Data

| Field | Sample Value |
|-------|--------------|
| Deceased Name | Juan Dela Cruz |
| Contact Name | Maria Dela Cruz |
| Phone | +63 917 123 4567 |
| Contract Price | ₱45,000.00 |
| Discount | ₱5,000.00 |
| Age | 79 (auto-calculated) |
| Service Type | Standard Funeral Service |
| Location | Quezon City, Metro Manila |
| Chapel Rental | ₱15,000 |

---

**Last Updated**: March 2024  
**Form Status**: Ready for Testing ✅
