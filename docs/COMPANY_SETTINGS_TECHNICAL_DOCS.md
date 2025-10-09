# Company Settings - Technical Documentation

## Overview

This document provides technical details about the Company Settings page implementation, including the Business Config and Compliance & Legal tabs functionality.

---

## Recent Updates

### ✅ Sonner Toast Integration
**Date**: Current Session  
**Files Modified**: `src/app/admin/settings/company/page.tsx`

Replaced custom modal system with shadcn Sonner toast notifications for a better user experience.

**Changes Made:**
- Added `toast` import from "sonner"
- Removed modal state management
- Removed `showModal()` and `closeModal()` helper functions
- Removed 40+ lines of custom modal JSX
- Replaced all notifications with toast calls

**Toast Implementation Examples:**
```typescript
// Success
toast.success("Settings Saved", {
  description: "Company settings saved successfully!"
});

// Error
toast.error("Save Failed", {
  description: "Failed to save company settings. Please try again."
});
```

**Benefits:**
- Non-blocking notifications (top-right corner)
- Auto-dismiss after a few seconds
- Multiple toasts can stack
- Consistent with administration page

---

### ✅ Business Config Tab - Fully Functional
**Files**: 
- `src/app/admin/settings/company/BusinessConfigSection.tsx`
- `src/app/admin/settings/company/page.tsx`

**Enhancements Added:**
- Keyboard support (Enter key) for adding company holidays
- Keyboard support (Enter key) for adding geographic restrictions

**Functions:**
```typescript
// Add company holiday
const addCompanyHoliday = () => {
  if (newCompanyHoliday.trim()) {
    const updatedHolidays = [...formData.holidays.company, newCompanyHoliday.trim()];
    onNestedInputChange("holidays", "company", updatedHolidays);
    setNewCompanyHoliday("");
  }
};

// Handle Enter key press
const handleCompanyHolidayKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addCompanyHoliday();
  }
};
```

**Data Structure:**
```typescript
workingHours: {
  mondayToFriday: { start: string; end: string };
  weekendDays: string[];
  timeZone: string;
}
holidays: {
  national: string[];
  company: string[];
  floating: number;
}
fiscalYear: {
  startMonth: string;
  payrollYear: string;
}
remoteWorkPolicy: {
  allowed: boolean;
  hybrid: boolean;
  geographicRestrictions: string[];
}
```

---

### ✅ Compliance & Legal Tab - Fully Functional
**Files**: 
- `src/app/admin/settings/company/ComplianceLegalSection.tsx`
- `src/app/admin/settings/company/page.tsx`

**Enhancements Added:**
- Keyboard support (Enter key) for adding data processing purposes
- Keyboard support (Enter key) for adding data sharing restrictions

**Functions:**
```typescript
// Add data processing purpose
const addDataPurpose = () => {
  if (newDataPurpose.trim()) {
    const updatedPurposes = [...formData.complianceSettings.regulatoryCompliance.dataProtection.dataProcessingPurposes, newDataPurpose.trim()];
    onNestedInputChange("complianceSettings", "regulatoryCompliance", {
      ...formData.complianceSettings.regulatoryCompliance,
      dataProtection: {
        ...formData.complianceSettings.regulatoryCompliance.dataProtection,
        dataProcessingPurposes: updatedPurposes
      }
    });
    setNewDataPurpose("");
  }
};

// Handle Enter key press
const handleDataPurposeKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addDataPurpose();
  }
};
```

**Data Structure:**
```typescript
complianceSettings: {
  regulatoryCompliance: {
    laborLaw: {
      jurisdiction: string;
      country: string;
      state: string;
      minimumWage: number;
      overtimeRegulations: {
        enabled: boolean;
        multiplier: number;
        dailyThreshold: number;
        weeklyThreshold: number;
      };
      breakRequirements: {
        mealBreakRequired: boolean;
        mealBreakDuration: number;
        restBreakRequired: boolean;
        restBreakDuration: number;
        restBreakFrequency: number;
      };
    };
    dataProtection: {
      gdprCompliant: boolean;
      dataRetentionPeriod: number;
      employeeConsentRequired: boolean;
      dataProcessingPurposes: string[];
      dataSharingRestrictions: string[];
    };
    equalOpportunity: {
      eeoReportingRequired: boolean;
      diversityTracking: boolean;
      accessibilityCompliant: boolean;
      reasonableAccommodationPolicy: string;
    };
  };
  insuranceBenefits: {
    workersCompensation: {
      provider: string;
      policyNumber: string;
      coverageAmount: number;
      effectiveDate: string;
      expirationDate: string;
    };
    unemploymentInsurance: {
      stateAccountNumber: string;
      federalAccountNumber: string;
      contributionRate: number;
      wageBase: number;
    };
    healthSafety: {
      oshaCompliant: boolean;
      safetyTrainingRequired: boolean;
      incidentReportingRequired: boolean;
      emergencyProcedures: string;
    };
    professionalLiability: {
      provider: string;
      policyNumber: string;
      coverageAmount: number;
      effectiveDate: string;
      expirationDate: string;
    };
  };
}
```

---

## Architecture

### Component Structure

```
page.tsx (Main Container)
├── CompanyProfileSection.tsx
├── BusinessConfigSection.tsx
│   ├── Working Hours & Calendar
│   ├── Holiday Calendar
│   ├── Fiscal Year Settings
│   └── Remote Work Policy
├── OfficeLocationsSection.tsx
├── OrgStructureSection.tsx
├── DocumentCommSection.tsx
└── ComplianceLegalSection.tsx
    ├── Regulatory Compliance
    │   ├── Labor Law Compliance
    │   ├── Data Protection Compliance
    │   └── Equal Opportunity Settings
    └── Insurance & Benefits
        ├── Workers' Compensation
        ├── Unemployment Insurance
        ├── Health & Safety Compliance
        └── Professional Liability Coverage
```

### State Management

**Main State:**
```typescript
const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(true);
const [saving, setSaving] = useState(false);
const [activeTab, setActiveTab] = useState("profile");
const [formData, setFormData] = useState<CompanySettings>({ ... });
```

**Data Flow:**
1. User authentication via Firebase Auth
2. Load organization data from Firestore
3. Map data to `formData` state
4. Child components receive props:
   - `formData` - Current form state
   - `onInputChange` - For flat field updates
   - `onNestedInputChange` - For nested object updates
5. User interactions trigger state updates
6. Save button writes to Firestore

### Firebase Integration

**Collection**: `organizations`

**Document ID**: User UID or organization ID

**Save Operation:**
```typescript
const handleSave = async () => {
  setSaving(true);
  try {
    // Find organization
    const orgsRef = collection(db, "organizations");
    const q = query(orgsRef, where("createdBy", "==", user.uid));
    const querySnapshot = await getDocs(q);
    
    // Update data
    const updateData = {
      workingHours: formData.workingHours,
      holidays: formData.holidays,
      fiscalYear: formData.fiscalYear,
      remoteWorkPolicy: formData.remoteWorkPolicy,
      complianceSettings: formData.complianceSettings,
      // ... other fields
      lastUpdated: new Date().toISOString(),
      updatedBy: user.uid
    };
    
    // Save to Firestore
    await setDoc(orgRef, updateData, { merge: true });
    
    toast.success("Settings Saved", {
      description: "Company settings saved successfully!"
    });
  } catch (error) {
    toast.error("Save Failed", {
      description: error.message
    });
  } finally {
    setSaving(false);
  }
};
```

**Load Operation:**
```typescript
const loadCompanySettings = async (user: User) => {
  setLoading(true);
  try {
    // Query for organization
    const orgsRef = collection(db, "organizations");
    const q = query(orgsRef, where("createdBy", "==", user.uid));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const orgData = querySnapshot.docs[0].data();
      
      // Map to form data
      setFormData(prev => ({
        ...prev,
        workingHours: { ...prev.workingHours, ...orgData.workingHours },
        holidays: { ...prev.holidays, ...orgData.holidays },
        // ... other fields
      }));
    }
  } catch (error) {
    console.error("Error loading company settings:", error);
  } finally {
    setLoading(false);
  }
};
```

---

## Feature Implementation Status

### Business Config Tab
| Feature | Status | Notes |
|---------|--------|-------|
| Working Hours | ✅ | Time inputs with timezone selector |
| Weekend Days | ✅ | Toggle buttons for each day |
| National Holidays | ✅ | Checkbox list of common holidays |
| Company Holidays | ✅ | Add/remove with Enter key support |
| Floating Holidays | ✅ | Number input (0-10) |
| Fiscal Year | ✅ | Month dropdown + year input |
| Remote Work | ✅ | Toggle checkboxes |
| Geographic Restrictions | ✅ | Add/remove with Enter key support |

### Compliance & Legal Tab
| Feature | Status | Notes |
|---------|--------|-------|
| Labor Law Settings | ✅ | Country, state, wage, overtime, breaks |
| Data Protection | ✅ | GDPR, retention, purposes, restrictions |
| Equal Opportunity | ✅ | EEO, diversity, accessibility |
| Workers' Compensation | ✅ | Provider, policy, coverage, dates |
| Unemployment Insurance | ✅ | Account numbers, rates, wage base |
| Health & Safety | ✅ | OSHA, training, incident reporting |
| Professional Liability | ✅ | Provider, policy, coverage, dates |

---

## UI/UX Patterns

### Form Inputs
- **Text inputs**: Standard with focus ring
- **Number inputs**: With min/max validation and step
- **Checkboxes**: Rounded with custom styling
- **Dropdowns**: White background with focus ring
- **Date pickers**: Native date input
- **Textareas**: 4 rows for long text

### Colors
- Primary: `#f97316` (Orange)
- Text: `#1a1a1a` (Dark gray)
- Muted: `#6b7280` (Gray)
- Border: `#d1d5db` (Light gray)
- Background: `#ffffff` (White)
- Success: Green tones
- Error: Red tones

### Buttons
- **Primary**: Orange background, white text
- **Add**: Orange button with hover effect
- **Remove**: Red text with hover effect

---

## Testing

### Manual Testing Checklist

**Business Config:**
- [ ] Set working hours and timezone
- [ ] Toggle weekend days
- [ ] Select national holidays
- [ ] Add/remove company holidays (test Enter key)
- [ ] Set floating holidays
- [ ] Configure fiscal year
- [ ] Enable remote/hybrid work
- [ ] Add/remove geographic restrictions (test Enter key)
- [ ] Save and verify data persists

**Compliance & Legal:**
- [ ] Set labor law settings
- [ ] Configure overtime rules
- [ ] Set break requirements
- [ ] Enable GDPR compliance
- [ ] Add data processing purposes (test Enter key)
- [ ] Add data sharing restrictions (test Enter key)
- [ ] Enable EEO settings
- [ ] Fill insurance information
- [ ] Save and verify data persists

### Integration Testing
1. Create new organization
2. Navigate to Company Settings
3. Fill all Business Config fields
4. Fill all Compliance & Legal fields
5. Click Save Changes
6. Refresh page
7. Verify all data loaded correctly
8. Modify several fields
9. Save again
10. Verify updates persisted

---

## Known Issues

None currently reported.

---

## Future Enhancements

1. **Validation**:
   - Add form validation before save
   - Show inline error messages
   - Prevent save with invalid data

2. **Bulk Operations**:
   - Import holidays from file
   - Export settings as JSON
   - Copy settings between organizations

3. **Audit Trail**:
   - Track who changed what
   - Show change history
   - Rollback to previous versions

4. **Templates**:
   - Save configuration templates
   - Quick setup for new organizations
   - Industry-specific defaults

---

## Contributing

When adding new features to Company Settings:

1. Add fields to the `CompanySettings` interface
2. Initialize default values in `useState`
3. Add loading logic in `loadCompanySettings`
4. Add save logic in `handleSave`
5. Create or update section component
6. Add to appropriate tab
7. Test save/load cycle
8. Update this documentation

---

## Contact

For questions or support:
- System Administrator
- Development Team
- HRMS Support

---

**Last Updated**: October 2024  
**Maintained By**: Development Team

