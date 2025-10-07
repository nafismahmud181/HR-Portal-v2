# Onboarding Field Configuration Fix

## 🐛 Issue Reported

In `/admin/settings/administration` page, when configuring the **Onboarding Field Configuration** option, only the **Personal Information** section was affecting the `/employee/onboarding` page. The other sections (Address Information, Emergency Contacts, Banking & Tax Info, and Documents) were not being applied.

## 🔍 Root Cause

The employee onboarding page (`src/app/employee/onboarding/page.tsx`) was only checking the field configuration for **Step 1 (Personal Information)**. The remaining steps (2-5) had hardcoded fields that ignored the configuration settings from the admin panel.

### What Was Working ✅
- **Step 1 (Personal Information)**: Fields were properly wrapped with `fieldConfig.personalInformation.{field}.enabled` checks
- Configuration was loading correctly from Firestore (`organizations/{orgId}/settings/administration`)
- Validation logic was respecting the field configuration

### What Wasn't Working ❌
- **Step 2 (Address Information)**: Fields were hardcoded - no `fieldConfig.addressInformation` checks
- **Step 3 (Emergency Contacts)**: Fields were hardcoded - no `fieldConfig.emergencyContacts` checks
- **Step 4 (Banking & Tax Info)**: Fields were hardcoded - no `fieldConfig.bankingTaxInfo` checks
- **Step 5 (Documents)**: Document fields were hardcoded - no `fieldConfig.documents` checks

## ✅ Solution Implemented

Updated the employee onboarding page to respect the field configuration for ALL steps:

### Step 2 (Address Information) - Lines 583-766
**Before:**
```typescript
case 2:
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-[16px] font-medium mb-4">Current Address</h3>
        // All fields hardcoded, always shown
      </div>
      <div>
        <h3 className="text-[16px] font-medium mb-4">Permanent Address</h3>
        // All fields hardcoded, always shown
      </div>
    </div>
  );
```

**After:**
```typescript
case 2:
  return (
    <div className="space-y-6">
      {fieldConfig.addressInformation.currentAddress.enabled && (
        <div>
          <h3>{fieldConfig.addressInformation.currentAddress.label}</h3>
          // Fields now shown conditionally
        </div>
      )}
      {fieldConfig.addressInformation.permanentAddress.enabled && (
        <div>
          <h3>{fieldConfig.addressInformation.permanentAddress.label}</h3>
          // Fields now shown conditionally
        </div>
      )}
    </div>
  );
```

### Step 3 (Emergency Contacts) - Lines 768-907
**Before:**
```typescript
case 3:
  return (
    <div className="space-y-6">
      <div>
        <h3>Primary Emergency Contact</h3>
        // Always shown
      </div>
      <div>
        <h3>Secondary Emergency Contact (Optional)</h3>
        // Always shown
      </div>
    </div>
  );
```

**After:**
```typescript
case 3:
  return (
    <div className="space-y-6">
      {fieldConfig.emergencyContacts.primaryEmergencyContact.enabled && (
        <div>
          <h3>{fieldConfig.emergencyContacts.primaryEmergencyContact.label}</h3>
          // Fields now shown conditionally
        </div>
      )}
      {fieldConfig.emergencyContacts.secondaryEmergencyContact.enabled && (
        <div>
          <h3>{fieldConfig.emergencyContacts.secondaryEmergencyContact.label}</h3>
          // Fields now shown conditionally
        </div>
      )}
    </div>
  );
```

### Step 4 (Banking & Tax Info) - Lines 909-1030
**Before:**
```typescript
case 4:
  return (
    <div className="space-y-6">
      <div>
        <h3>Bank Details</h3>
        // Always shown
      </div>
      <div>
        <h3>Tax Information</h3>
        // Always shown
      </div>
    </div>
  );
```

**After:**
```typescript
case 4:
  return (
    <div className="space-y-6">
      {fieldConfig.bankingTaxInfo.bankDetails.enabled && (
        <div>
          <h3>{fieldConfig.bankingTaxInfo.bankDetails.label}</h3>
          // Fields now shown conditionally
        </div>
      )}
      {fieldConfig.bankingTaxInfo.taxInformation.enabled && (
        <div>
          <h3>{fieldConfig.bankingTaxInfo.taxInformation.label}</h3>
          // Fields now shown conditionally
        </div>
      )}
    </div>
  );
```

### Step 5 (Documents) - Lines 1032-1139
**Before:**
```typescript
case 5:
  return (
    <div className="space-y-6">
      <div>
        <h3>Required Documents</h3>
        {[
          { key: 'governmentId', label: 'Government ID', required: true },
          { key: 'socialSecurityCard', label: 'Social Security Card', required: true },
          // Hardcoded list
        ].map(...)}
      </div>
      <div>
        <h3>Optional Documents</h3>
        {[
          { key: 'resume', label: 'Resume/CV' },
          // Hardcoded list
        ].map(...)}
      </div>
    </div>
  );
```

**After:**
```typescript
case 5:
  return (
    <div className="space-y-6">
      <div>
        <h3>Document Uploads</h3>
        {Object.entries(fieldConfig.documents)
          .filter(([_, config]) => config.enabled && config.required)
          .map(([key, config]) => (
            // Dynamically show required documents based on config
          ))}
      </div>
      {Object.entries(fieldConfig.documents).some(([_, config]) => config.enabled && !config.required) && (
        <div>
          <h3>Optional Documents</h3>
          {Object.entries(fieldConfig.documents)
            .filter(([_, config]) => config.enabled && !config.required)
            .map(([key, config]) => (
              // Dynamically show optional documents based on config
            ))}
        </div>
      )}
    </div>
  );
```

## 🎯 How It Works Now

### Admin Configuration Flow
1. Admin goes to `/admin/settings/administration`
2. Scrolls to **Onboarding Field Configuration** section
3. For each field, admin can:
   - ✅ **Enable/Disable** the field (controls visibility)
   - ✅ **Mark as Required** (adds validation)
   - ✅ **Customize Label** (changes display text)
4. Click **Save Configuration**
5. Settings saved to Firestore: `organizations/{orgId}/settings/administration`

### Employee Onboarding Flow
1. Employee accesses `/employee/onboarding`
2. System loads configuration from Firestore
3. **Each step now respects the configuration:**
   - Disabled fields are hidden completely
   - Required fields show red asterisk (*)
   - Custom labels are displayed
   - Validation checks configuration before allowing next step

## 🧪 Testing Checklist

To verify the fix works correctly:

### Test Case 1: Disable Address Fields
1. Go to `/admin/settings/administration`
2. In **Address Information**, disable "Permanent Address"
3. Save configuration
4. Go to `/employee/onboarding`
5. Navigate to Step 2
6. ✅ **Expected:** Only "Current Address" section should be visible

### Test Case 2: Make Emergency Contact Optional
1. Go to `/admin/settings/administration`
2. In **Emergency Contacts**, uncheck "Required" for "Primary Emergency Contact"
3. Save configuration
4. Go to `/employee/onboarding`
5. Navigate to Step 3
6. ✅ **Expected:** No red asterisk (*) on primary emergency contact fields
7. Should be able to proceed to next step without filling it

### Test Case 3: Disable Banking Information
1. Go to `/admin/settings/administration`
2. In **Banking & Tax Information**, disable "Bank Details"
3. Save configuration
4. Go to `/employee/onboarding`
5. Navigate to Step 4
6. ✅ **Expected:** Only "Tax Information" section should be visible

### Test Case 3b: Completely Hide Banking & Tax Step
1. Go to `/admin/settings/administration`
2. In **Banking & Tax Information**, disable BOTH "Bank Details" AND "Tax Information"
3. Save configuration
4. Go to `/employee/onboarding`
5. ✅ **Expected:** 
   - Step 4 "Banking & Tax" should be completely hidden
   - Progress bar should only show 4 steps instead of 5
   - Step numbers should adjust automatically (no gaps)

### Test Case 4: Configure Document Requirements
1. Go to `/admin/settings/administration`
2. In **Documents**, disable "I-9 Documents"
3. Mark "Resume" as Required
4. Save configuration
5. Go to `/employee/onboarding`
6. Navigate to Step 5
7. ✅ **Expected:** 
   - "I-9 Documents" should not appear
   - "Resume" should appear in required documents section

### Test Case 5: Custom Labels
1. Go to `/admin/settings/administration`
2. Change "Personal Email" label to "Your Email Address"
3. Save configuration
4. Go to `/employee/onboarding`
5. ✅ **Expected:** Field label should show "Your Email Address" instead of "Personal Email"

## 📊 Benefits

### For Admins
- ✅ Full control over onboarding form fields
- ✅ Can customize based on company needs
- ✅ Can simplify onboarding for different roles
- ✅ Can comply with different regional requirements

### For Employees
- ✅ See only relevant fields
- ✅ Faster onboarding experience
- ✅ Clear indication of required vs optional fields
- ✅ Customized field labels that match company terminology

### For Developers
- ✅ Centralized configuration management
- ✅ No code changes needed for field customization
- ✅ Validation logic respects configuration
- ✅ Consistent behavior across all steps

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Admin Panel                             │
│         /admin/settings/administration                       │
│                                                               │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ Onboarding Field Configuration                      │    │
│  │                                                      │    │
│  │ Personal Information:                                │    │
│  │   ☑ Personal Email     [Required] ☑                 │    │
│  │   ☑ Phone Number       [Required] ☑                 │    │
│  │                                                      │    │
│  │ Address Information:                                 │    │
│  │   ☑ Current Address    [Required] ☑                 │    │
│  │   ☑ Permanent Address  [Required] ☐                 │    │
│  │                                                      │    │
│  │ [Save Configuration]                                 │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Save to Firestore
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firestore Database                        │
│                                                               │
│  organizations/{orgId}/settings/administration               │
│  {                                                            │
│    onboardingFieldConfig: {                                  │
│      personalInformation: { ... },                           │
│      addressInformation: { ... },                            │
│      emergencyContacts: { ... },                             │
│      bankingTaxInfo: { ... },                                │
│      documents: { ... }                                      │
│    }                                                          │
│  }                                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Load configuration
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Employee Onboarding                        │
│              /employee/onboarding                            │
│                                                               │
│  Step 1: Personal Information                                │
│  ├─ ✅ Personal Email (required) *                           │
│  └─ ✅ Phone Number (required) *                             │
│                                                               │
│  Step 2: Address Information                                 │
│  ├─ ✅ Current Address (required) *                          │
│  └─ ⚠️  Permanent Address (not required)                    │
│                                                               │
│  [Configuration determines what fields appear and validation]│
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Impact

### Before Fix
- Only 1 out of 5 steps respected configuration (20%)
- Admin configuration was mostly ignored
- Couldn't customize onboarding based on company needs

### After Fix
- All 5 steps respect configuration (100%)
- Full admin control over onboarding form
- Flexible onboarding experience

## 📝 Files Modified

- **File:** `src/app/employee/onboarding/page.tsx`
- **Lines Changed:** ~400 lines
- **Sections Updated:**
  - Case 2 (Address Information) - Lines 583-766
  - Case 3 (Emergency Contacts) - Lines 768-907
  - Case 4 (Banking & Tax) - Lines 909-1030
  - Case 5 (Documents) - Lines 1032-1139

## ✅ Status

**Status:** ✅ **FIXED**  
**Tested:** ✅ **No linter errors**  
**Ready:** ✅ **Ready for testing**

---

*Fixed on: October 7, 2025*  
*Issue: Onboarding field configuration not applying to steps 2-5*  
*Solution: Updated all steps to respect fieldConfig from admin settings*

