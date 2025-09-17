"use client";

interface AdministrationSettings {
  onboardingFieldConfig: {
    personalInformation: {
      personalEmail: { enabled: boolean; required: boolean; label: string };
      personalPhone: { enabled: boolean; required: boolean; label: string };
      dateOfBirth: { enabled: boolean; required: boolean; label: string };
      gender: { enabled: boolean; required: boolean; label: string };
      maritalStatus: { enabled: boolean; required: boolean; label: string };
      nationality: { enabled: boolean; required: boolean; label: string };
      profilePhoto: { enabled: boolean; required: boolean; label: string };
    };
    addressInformation: {
      currentAddress: { enabled: boolean; required: boolean; label: string };
      permanentAddress: { enabled: boolean; required: boolean; label: string };
      sameAsCurrent: { enabled: boolean; required: boolean; label: string };
    };
    emergencyContacts: {
      primaryEmergencyContact: { enabled: boolean; required: boolean; label: string };
      secondaryEmergencyContact: { enabled: boolean; required: boolean; label: string };
    };
    bankingTaxInfo: {
      bankDetails: { enabled: boolean; required: boolean; label: string };
      taxInformation: { enabled: boolean; required: boolean; label: string };
    };
    documents: {
      governmentId: { enabled: boolean; required: boolean; label: string };
      socialSecurityCard: { enabled: boolean; required: boolean; label: string };
      i9Documents: { enabled: boolean; required: boolean; label: string };
      directDepositForm: { enabled: boolean; required: boolean; label: string };
      resume: { enabled: boolean; required: boolean; label: string };
      certifications: { enabled: boolean; required: boolean; label: string };
      transcripts: { enabled: boolean; required: boolean; label: string };
    };
  };
  [key: string]: unknown;
}

interface OnboardingFieldConfigSectionProps {
  formData: AdministrationSettings;
  onInputChange: (field: string, value: unknown) => void;
  onNestedInputChange: (parent: string, field: string, value: unknown) => void;
}

export default function OnboardingFieldConfigSection({
  formData,
  onNestedInputChange
}: OnboardingFieldConfigSectionProps) {
  const config = formData.onboardingFieldConfig;

  const handleFieldConfigChange = (
    section: keyof typeof config,
    field: string,
    property: 'enabled' | 'required' | 'label',
    value: boolean | string
  ) => {
    onNestedInputChange('onboardingFieldConfig', `${section}.${field}.${property}`, value);
  };

  const renderFieldConfig = (
    section: keyof typeof config,
    field: string,
    fieldConfig: { enabled: boolean; required: boolean; label: string }
  ) => {
    return (
      <div key={field} className="bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900 capitalize">
            {field.replace(/([A-Z])/g, ' $1').trim()}
          </h4>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={fieldConfig.enabled}
                onChange={(e) => handleFieldConfigChange(section, field, 'enabled', e.target.checked)}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">Enabled</span>
            </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={fieldConfig.required}
              onChange={(e) => handleFieldConfigChange(section, field, 'required', e.target.checked)}
              disabled={!fieldConfig.enabled}
              className="rounded border-gray-300 disabled:opacity-50"
            />
            <span className="text-sm text-gray-600">Required</span>
          </label>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Field Label
        </label>
        <input
          type="text"
          value={fieldConfig.label}
          onChange={(e) => handleFieldConfigChange(section, field, 'label', e.target.value)}
          disabled={!fieldConfig.enabled}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
        />
      </div>
    </div>
    );
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Onboarding Field Configuration</h2>
        <p className="text-gray-600">
          Customize which fields are shown and required during the employee onboarding process.
        </p>
      </div>

      {/* Personal Information Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-blue-600">👤</span>
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(config.personalInformation).map(([field, fieldConfig]) =>
            renderFieldConfig('personalInformation', field, fieldConfig)
          )}
        </div>
      </div>

      {/* Address Information Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-green-600">🏠</span>
          Address Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(config.addressInformation).map(([field, fieldConfig]) =>
            renderFieldConfig('addressInformation', field, fieldConfig)
          )}
        </div>
      </div>

      {/* Emergency Contacts Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-red-600">🚨</span>
          Emergency Contacts
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(config.emergencyContacts).map(([field, fieldConfig]) =>
            renderFieldConfig('emergencyContacts', field, fieldConfig)
          )}
        </div>
      </div>

      {/* Banking & Tax Information Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-purple-600">💰</span>
          Banking & Tax Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(config.bankingTaxInfo).map(([field, fieldConfig]) =>
            renderFieldConfig('bankingTaxInfo', field, fieldConfig)
          )}
        </div>
      </div>

      {/* Documents Section */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-orange-600">📄</span>
          Document Uploads
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(config.documents).map(([field, fieldConfig]) =>
            renderFieldConfig('documents', field, fieldConfig)
          )}
        </div>
      </div>

      {/* Preview Section */}
      <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <span className="text-blue-600">👁️</span>
          Preview
        </h3>
        <p className="text-blue-800 mb-4">
          Based on your current configuration, the onboarding form will include:
        </p>
        <div className="space-y-2">
          {Object.entries(config).map(([sectionName, section]) => (
            <div key={sectionName} className="bg-white p-3 rounded border">
              <h4 className="font-medium text-gray-900 capitalize mb-2">
                {sectionName.replace(/([A-Z])/g, ' $1').trim()}
              </h4>
              <div className="text-sm text-gray-600">
                {Object.entries(section).map(([field, fieldConfig]) => (
                  <div key={field} className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${fieldConfig.enabled ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                    <span className={fieldConfig.enabled ? 'text-gray-900' : 'text-gray-500'}>
                      {fieldConfig.label}
                      {fieldConfig.required && fieldConfig.enabled && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Configuration Tips:</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• <strong>Enabled:</strong> Controls whether the field appears in the onboarding form</li>
          <li>• <strong>Required:</strong> Makes the field mandatory (only available when enabled)</li>
          <li>• <strong>Label:</strong> Customize how the field is displayed to employees</li>
          <li>• Changes take effect immediately for new onboarding sessions</li>
          <li>• Existing employee data will not be affected by configuration changes</li>
        </ul>
      </div>
    </div>
  );
}
