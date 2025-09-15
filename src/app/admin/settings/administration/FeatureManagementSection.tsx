"use client";

import { useState } from "react";

interface FeatureManagementSettings {
  moduleConfiguration: {
    enabledModules: {
      hrManagement: boolean;
      payroll: boolean;
      performanceManagement: boolean;
      timeAttendance: boolean;
      benefitsAdministration: boolean;
      recruitment: boolean;
      learningDevelopment: boolean;
      complianceReporting: boolean;
    };
    moduleSettings: Array<{
      module: string;
      enabled: boolean;
      features: string[];
      permissions: string[];
      customizations: string[];
    }>;
  };
  featureFlags: {
    betaFeatures: {
      enabled: boolean;
      features: Array<{
        id: string;
        name: string;
        description: string;
        enabled: boolean;
        targetUsers: string[];
        rolloutPercentage: number;
      }>;
    };
    experimentalFeatures: {
      enabled: boolean;
      features: Array<{
        id: string;
        name: string;
        description: string;
        enabled: boolean;
        riskLevel: string;
        testingGroup: string[];
      }>;
    };
    customFeatureToggles: Array<{
      id: string;
      name: string;
      description: string;
      enabled: boolean;
      conditions: string[];
      targetRoles: string[];
    }>;
  };
  customizationOptions: {
    fieldCustomization: {
      enabled: boolean;
      customFields: Array<{
        id: string;
        name: string;
        type: string;
        module: string;
        required: boolean;
        visible: boolean;
        validation: string;
      }>;
      fieldPermissions: Array<{
        field: string;
        roles: string[];
        permissions: string[];
      }>;
    };
    workflowCustomization: {
      enabled: boolean;
      customWorkflows: Array<{
        id: string;
        name: string;
        type: string;
        steps: Array<{
          step: number;
          name: string;
          assignee: string;
          required: boolean;
        }>;
        conditions: string[];
      }>;
      workflowTemplates: Array<{
        name: string;
        type: string;
        description: string;
        steps: number;
        estimatedDuration: number;
      }>;
    };
    uiCustomization: {
      enabled: boolean;
      themes: Array<{
        id: string;
        name: string;
        primaryColor: string;
        secondaryColor: string;
        fontFamily: string;
        active: boolean;
      }>;
      layoutOptions: {
        sidebarPosition: string;
        headerStyle: string;
        dashboardLayout: string;
        mobileOptimization: boolean;
      };
      branding: {
        logoUrl: string;
        faviconUrl: string;
        companyColors: string[];
        customCss: string;
      };
    };
  };
  [key: string]: unknown;
}

interface FeatureManagementSectionProps {
  formData: FeatureManagementSettings;
  onInputChange: (field: string, value: unknown) => void;
  onNestedInputChange: (parent: string, field: string, value: unknown) => void;
}

const MODULES = [
  "HR Management", "Payroll", "Performance Management", "Time & Attendance",
  "Benefits Administration", "Recruitment", "Learning & Development", "Compliance Reporting"
];

const FIELD_TYPES = ["text", "number", "date", "dropdown", "checkbox", "file", "textarea"];
const WORKFLOW_TYPES = ["Approval", "Review", "Notification", "Data Processing", "Report Generation"];
const RISK_LEVELS = ["Low", "Medium", "High", "Critical"];
const THEMES = ["Default", "Dark", "Corporate", "Minimal", "Colorful"];

export default function FeatureManagementSection({ formData, onInputChange, onNestedInputChange }: FeatureManagementSectionProps) {
  const [newBetaFeature, setNewBetaFeature] = useState({
    name: "",
    description: "",
    targetUsers: [] as string[],
    rolloutPercentage: 0
  });
  const [newCustomField, setNewCustomField] = useState({
    name: "",
    type: "text",
    module: "",
    required: false,
    visible: true,
    validation: ""
  });
  const [newCustomWorkflow, setNewCustomWorkflow] = useState({
    name: "",
    type: "",
    steps: [] as Array<{ step: number; name: string; assignee: string; required: boolean }>,
    conditions: [] as string[]
  });

  const addBetaFeature = () => {
    if (newBetaFeature.name.trim()) {
      const updatedFeatures = [...formData.featureFlags.betaFeatures.features, {
        id: Date.now().toString(),
        ...newBetaFeature,
        enabled: false
      }];
      onNestedInputChange("featureFlags", "betaFeatures", {
        ...formData.featureFlags.betaFeatures,
        features: updatedFeatures
      });
      setNewBetaFeature({
        name: "",
        description: "",
        targetUsers: [],
        rolloutPercentage: 0
      });
    }
  };

  const removeBetaFeature = (id: string) => {
    const updatedFeatures = formData.featureFlags.betaFeatures.features.filter((feature: { id: string }) => feature.id !== id);
    onNestedInputChange("featureFlags", "betaFeatures", {
      ...formData.featureFlags.betaFeatures,
      features: updatedFeatures
    });
  };

  const addCustomField = () => {
    if (newCustomField.name.trim() && newCustomField.module) {
      const updatedFields = [...formData.customizationOptions.fieldCustomization.customFields, {
        id: Date.now().toString(),
        ...newCustomField
      }];
      onNestedInputChange("customizationOptions", "fieldCustomization", {
        ...formData.customizationOptions.fieldCustomization,
        customFields: updatedFields
      });
      setNewCustomField({
        name: "",
        type: "text",
        module: "",
        required: false,
        visible: true,
        validation: ""
      });
    }
  };

  const removeCustomField = (id: string) => {
    const updatedFields = formData.customizationOptions.fieldCustomization.customFields.filter((field: { id: string }) => field.id !== id);
    onNestedInputChange("customizationOptions", "fieldCustomization", {
      ...formData.customizationOptions.fieldCustomization,
      customFields: updatedFields
    });
  };

  const addCustomWorkflow = () => {
    if (newCustomWorkflow.name.trim() && newCustomWorkflow.type) {
      const updatedWorkflows = [...formData.customizationOptions.workflowCustomization.customWorkflows, {
        id: Date.now().toString(),
        ...newCustomWorkflow
      }];
      onNestedInputChange("customizationOptions", "workflowCustomization", {
        ...formData.customizationOptions.workflowCustomization,
        customWorkflows: updatedWorkflows
      });
      setNewCustomWorkflow({
        name: "",
        type: "",
        steps: [],
        conditions: []
      });
    }
  };

  const removeCustomWorkflow = (id: string) => {
    const updatedWorkflows = formData.customizationOptions.workflowCustomization.customWorkflows.filter((workflow: { id: string }) => workflow.id !== id);
    onNestedInputChange("customizationOptions", "workflowCustomization", {
      ...formData.customizationOptions.workflowCustomization,
      customWorkflows: updatedWorkflows
    });
  };

  return (
    <div className="space-y-8">
      {/* Module Configuration */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <h2 className="text-[20px] font-semibold mb-6">Module Configuration</h2>
        
        {/* Enabled Modules */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Enabled Modules</h3>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(formData.moduleConfiguration.enabledModules).map(([module, enabled]) => (
              <label key={module} className="flex items-center space-x-2 p-3 border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb]">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => onNestedInputChange("moduleConfiguration", "enabledModules", {
                    ...formData.moduleConfiguration.enabledModules,
                    [module]: e.target.checked
                  })}
                  className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-[14px]">{module.replace(/([A-Z])/g, ' $1').trim()}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Module Settings */}
        <div>
          <h3 className="text-[16px] font-medium mb-4">Module Settings</h3>
          <div className="space-y-3">
            {formData.moduleConfiguration.moduleSettings.map((module, index) => (
              <div key={index} className="border border-[#e5e7eb] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[14px] font-medium">{module.module}</h4>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={module.enabled}
                      onChange={(e) => {
                        const updatedSettings = [...formData.moduleConfiguration.moduleSettings];
                        updatedSettings[index] = { ...module, enabled: e.target.checked };
                        onNestedInputChange("moduleConfiguration", "moduleSettings", updatedSettings);
                      }}
                      className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                    />
                    <span className="text-[12px]">Enabled</span>
                  </label>
                </div>
                <div className="text-[12px] text-[#6b7280]">
                  Features: {module.features.length} | Permissions: {module.permissions.length} | Customizations: {module.customizations.length}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <h2 className="text-[20px] font-semibold mb-6">Feature Flags</h2>
        
        {/* Beta Features */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-medium">Beta Features</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.featureFlags.betaFeatures.enabled}
                onChange={(e) => onNestedInputChange("featureFlags", "betaFeatures", {
                  ...formData.featureFlags.betaFeatures,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable beta features</span>
            </label>
          </div>
          
          {formData.featureFlags.betaFeatures.enabled && (
            <div className="space-y-4">
              <div className="space-y-3">
                {formData.featureFlags.betaFeatures.features.map((feature) => (
                  <div key={feature.id} className="border border-[#e5e7eb] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[14px] font-medium">{feature.name}</h4>
                      <div className="flex items-center space-x-2">
                        <label className="flex items-center space-x-1">
                          <input
                            type="checkbox"
                            checked={feature.enabled}
                            onChange={(e) => {
                              const updatedFeatures = formData.featureFlags.betaFeatures.features.map(f => 
                                f.id === feature.id ? { ...f, enabled: e.target.checked } : f
                              );
                              onNestedInputChange("featureFlags", "betaFeatures", {
                                ...formData.featureFlags.betaFeatures,
                                features: updatedFeatures
                              });
                            }}
                            className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                          />
                          <span className="text-[12px]">Enabled</span>
                        </label>
                        <button
                          onClick={() => removeBetaFeature(feature.id)}
                          className="text-red-600 hover:text-red-700 text-[12px]"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <p className="text-[12px] text-[#6b7280] mb-2">{feature.description}</p>
                    <div className="text-[11px] text-[#6b7280]">
                      Rollout: {feature.rolloutPercentage}% | Target Users: {feature.targetUsers.length}
                    </div>
                  </div>
                ))}
                
                <div className="border-2 border-dashed border-[#d1d5db] rounded-lg p-4">
                  <h4 className="text-[14px] font-medium mb-3">Add Beta Feature</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[12px] font-medium text-[#374151] mb-1 block">Feature Name</label>
                      <input
                        type="text"
                        value={newBetaFeature.name}
                        onChange={(e) => setNewBetaFeature(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[12px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-[#374151] mb-1 block">Rollout %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={newBetaFeature.rolloutPercentage}
                        onChange={(e) => setNewBetaFeature(prev => ({ ...prev, rolloutPercentage: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[12px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[12px] font-medium text-[#374151] mb-1 block">Description</label>
                      <textarea
                        value={newBetaFeature.description}
                        onChange={(e) => setNewBetaFeature(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[12px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                        rows={2}
                      />
                    </div>
                  </div>
                  <button
                    onClick={addBetaFeature}
                    className="mt-3 px-3 py-1 bg-[#f97316] text-white rounded text-[12px] hover:bg-[#ea580c]"
                  >
                    Add Feature
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Experimental Features */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-medium">Experimental Features</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.featureFlags.experimentalFeatures.enabled}
                onChange={(e) => onNestedInputChange("featureFlags", "experimentalFeatures", {
                  ...formData.featureFlags.experimentalFeatures,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable experimental features</span>
            </label>
          </div>
          
          {formData.featureFlags.experimentalFeatures.enabled && (
            <div className="space-y-3">
              {formData.featureFlags.experimentalFeatures.features.map((feature) => (
                <div key={feature.id} className="border border-[#e5e7eb] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[14px] font-medium">{feature.name}</h4>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-[10px] ${
                        feature.riskLevel === 'Low' ? 'bg-green-100 text-green-800' :
                        feature.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        feature.riskLevel === 'High' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {feature.riskLevel}
                      </span>
                      <label className="flex items-center space-x-1">
                        <input
                          type="checkbox"
                          checked={feature.enabled}
                          onChange={(e) => {
                            const updatedFeatures = formData.featureFlags.experimentalFeatures.features.map(f => 
                              f.id === feature.id ? { ...f, enabled: e.target.checked } : f
                            );
                            onNestedInputChange("featureFlags", "experimentalFeatures", {
                              ...formData.featureFlags.experimentalFeatures,
                              features: updatedFeatures
                            });
                          }}
                          className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                        />
                        <span className="text-[12px]">Enabled</span>
                      </label>
                    </div>
                  </div>
                  <p className="text-[12px] text-[#6b7280]">{feature.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom Feature Toggles */}
        <div>
          <h3 className="text-[16px] font-medium mb-4">Custom Feature Toggles</h3>
          <div className="space-y-3">
            {formData.featureFlags.customFeatureToggles.map((toggle) => (
              <div key={toggle.id} className="border border-[#e5e7eb] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[14px] font-medium">{toggle.name}</h4>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={toggle.enabled}
                      onChange={(e) => {
                        const updatedToggles = formData.featureFlags.customFeatureToggles.map(t => 
                          t.id === toggle.id ? { ...t, enabled: e.target.checked } : t
                        );
                        onNestedInputChange("featureFlags", "customFeatureToggles", updatedToggles);
                      }}
                      className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                    />
                    <span className="text-[12px]">Enabled</span>
                  </label>
                </div>
                <p className="text-[12px] text-[#6b7280]">{toggle.description}</p>
                <div className="text-[11px] text-[#6b7280] mt-1">
                  Target Roles: {toggle.targetRoles.join(", ")} | Conditions: {toggle.conditions.length}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customization Options */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <h2 className="text-[20px] font-semibold mb-6">Customization Options</h2>
        
        {/* Field Customization */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-medium">Field Customization</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.customizationOptions.fieldCustomization.enabled}
                onChange={(e) => onNestedInputChange("customizationOptions", "fieldCustomization", {
                  ...formData.customizationOptions.fieldCustomization,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable field customization</span>
            </label>
          </div>
          
          {formData.customizationOptions.fieldCustomization.enabled && (
            <div className="space-y-4">
              <div className="space-y-3">
                {formData.customizationOptions.fieldCustomization.customFields.map((field) => (
                  <div key={field.id} className="border border-[#e5e7eb] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[14px] font-medium">{field.name}</h4>
                      <button
                        onClick={() => removeCustomField(field.id)}
                        className="text-red-600 hover:text-red-700 text-[12px]"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[12px] text-[#6b7280]">
                      <div>Type: {field.type}</div>
                      <div>Module: {field.module}</div>
                      <div>Required: {field.required ? "Yes" : "No"}</div>
                      <div>Visible: {field.visible ? "Yes" : "No"}</div>
                    </div>
                  </div>
                ))}
                
                <div className="border-2 border-dashed border-[#d1d5db] rounded-lg p-4">
                  <h4 className="text-[14px] font-medium mb-3">Add Custom Field</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[12px] font-medium text-[#374151] mb-1 block">Field Name</label>
                      <input
                        type="text"
                        value={newCustomField.name}
                        onChange={(e) => setNewCustomField(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[12px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-[#374151] mb-1 block">Field Type</label>
                      <select
                        value={newCustomField.type}
                        onChange={(e) => setNewCustomField(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[12px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      >
                        {FIELD_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-[#374151] mb-1 block">Module</label>
                      <select
                        value={newCustomField.module}
                        onChange={(e) => setNewCustomField(prev => ({ ...prev, module: e.target.value }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[12px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      >
                        <option value="">Select module</option>
                        {MODULES.map(module => (
                          <option key={module} value={module}>{module}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-[#374151] mb-1 block">Validation</label>
                      <input
                        type="text"
                        value={newCustomField.validation}
                        onChange={(e) => setNewCustomField(prev => ({ ...prev, validation: e.target.value }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[12px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex items-center space-x-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newCustomField.required}
                        onChange={(e) => setNewCustomField(prev => ({ ...prev, required: e.target.checked }))}
                        className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                      />
                      <span className="text-[12px]">Required</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newCustomField.visible}
                        onChange={(e) => setNewCustomField(prev => ({ ...prev, visible: e.target.checked }))}
                        className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                      />
                      <span className="text-[12px]">Visible</span>
                    </label>
                  </div>
                  <button
                    onClick={addCustomField}
                    className="mt-3 px-3 py-1 bg-[#f97316] text-white rounded text-[12px] hover:bg-[#ea580c]"
                  >
                    Add Field
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Workflow Customization */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-medium">Workflow Customization</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.customizationOptions.workflowCustomization.enabled}
                onChange={(e) => onNestedInputChange("customizationOptions", "workflowCustomization", {
                  ...formData.customizationOptions.workflowCustomization,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable workflow customization</span>
            </label>
          </div>
          
          {formData.customizationOptions.workflowCustomization.enabled && (
            <div className="space-y-4">
              <div className="space-y-3">
                {formData.customizationOptions.workflowCustomization.customWorkflows.map((workflow) => (
                  <div key={workflow.id} className="border border-[#e5e7eb] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[14px] font-medium">{workflow.name}</h4>
                      <button
                        onClick={() => removeCustomWorkflow(workflow.id)}
                        className="text-red-600 hover:text-red-700 text-[12px]"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="text-[12px] text-[#6b7280]">
                      Type: {workflow.type} | Steps: {workflow.steps.length} | Conditions: {workflow.conditions.length}
                    </div>
                  </div>
                ))}
                
                <div className="border-2 border-dashed border-[#d1d5db] rounded-lg p-4">
                  <h4 className="text-[14px] font-medium mb-3">Add Custom Workflow</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[12px] font-medium text-[#374151] mb-1 block">Workflow Name</label>
                      <input
                        type="text"
                        value={newCustomWorkflow.name}
                        onChange={(e) => setNewCustomWorkflow(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[12px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-[#374151] mb-1 block">Workflow Type</label>
                      <select
                        value={newCustomWorkflow.type}
                        onChange={(e) => setNewCustomWorkflow(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[12px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      >
                        <option value="">Select type</option>
                        {WORKFLOW_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={addCustomWorkflow}
                    className="mt-3 px-3 py-1 bg-[#f97316] text-white rounded text-[12px] hover:bg-[#ea580c]"
                  >
                    Add Workflow
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* UI Customization */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-medium">UI Customization</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.customizationOptions.uiCustomization.enabled}
                onChange={(e) => onNestedInputChange("customizationOptions", "uiCustomization", {
                  ...formData.customizationOptions.uiCustomization,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable UI customization</span>
            </label>
          </div>
          
          {formData.customizationOptions.uiCustomization.enabled && (
            <div className="space-y-4">
              <div>
                <h4 className="text-[14px] font-medium mb-3">Themes</h4>
                <div className="grid grid-cols-2 gap-3">
                  {formData.customizationOptions.uiCustomization.themes.map((theme) => (
                    <div key={theme.id} className={`border rounded-lg p-3 cursor-pointer ${
                      theme.active ? 'border-[#f97316] bg-orange-50' : 'border-[#e5e7eb] hover:border-[#d1d5db]'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-[12px] font-medium">{theme.name}</h5>
                        <input
                          type="radio"
                          name="theme"
                          checked={theme.active}
                          onChange={() => {
                            const updatedThemes = formData.customizationOptions.uiCustomization.themes.map(t => 
                              ({ ...t, active: t.id === theme.id })
                            );
                            onNestedInputChange("customizationOptions", "uiCustomization", {
                              ...formData.customizationOptions.uiCustomization,
                              themes: updatedThemes
                            });
                          }}
                          className="text-[#f97316] focus:ring-[#f97316]"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: theme.primaryColor }}
                        ></div>
                        <div 
                          className="w-4 h-4 rounded border"
                          style={{ backgroundColor: theme.secondaryColor }}
                        ></div>
                        <span className="text-[10px] text-[#6b7280]">{theme.fontFamily}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="text-[14px] font-medium mb-3">Layout Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[14px] font-medium text-[#374151] mb-2 block">Sidebar Position</label>
                    <select
                      value={formData.customizationOptions.uiCustomization.layoutOptions.sidebarPosition}
                      onChange={(e) => onNestedInputChange("customizationOptions", "uiCustomization", {
                        ...formData.customizationOptions.uiCustomization,
                        layoutOptions: {
                          ...formData.customizationOptions.uiCustomization.layoutOptions,
                          sidebarPosition: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                      <option value="top">Top</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[14px] font-medium text-[#374151] mb-2 block">Header Style</label>
                    <select
                      value={formData.customizationOptions.uiCustomization.layoutOptions.headerStyle}
                      onChange={(e) => onNestedInputChange("customizationOptions", "uiCustomization", {
                        ...formData.customizationOptions.uiCustomization,
                        layoutOptions: {
                          ...formData.customizationOptions.uiCustomization.layoutOptions,
                          headerStyle: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                    >
                      <option value="standard">Standard</option>
                      <option value="minimal">Minimal</option>
                      <option value="compact">Compact</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.customizationOptions.uiCustomization.layoutOptions.mobileOptimization}
                      onChange={(e) => onNestedInputChange("customizationOptions", "uiCustomization", {
                        ...formData.customizationOptions.uiCustomization,
                        layoutOptions: {
                          ...formData.customizationOptions.uiCustomization.layoutOptions,
                          mobileOptimization: e.target.checked
                        }
                      })}
                      className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                    />
                    <span className="text-[14px]">Enable mobile optimization</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h4 className="text-[14px] font-medium mb-3">Branding</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[14px] font-medium text-[#374151] mb-2 block">Logo URL</label>
                    <input
                      type="url"
                      value={formData.customizationOptions.uiCustomization.branding.logoUrl}
                      onChange={(e) => onNestedInputChange("customizationOptions", "uiCustomization", {
                        ...formData.customizationOptions.uiCustomization,
                        branding: {
                          ...formData.customizationOptions.uiCustomization.branding,
                          logoUrl: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="text-[14px] font-medium text-[#374151] mb-2 block">Favicon URL</label>
                    <input
                      type="url"
                      value={formData.customizationOptions.uiCustomization.branding.faviconUrl}
                      onChange={(e) => onNestedInputChange("customizationOptions", "uiCustomization", {
                        ...formData.customizationOptions.uiCustomization,
                        branding: {
                          ...formData.customizationOptions.uiCustomization.branding,
                          faviconUrl: e.target.value
                        }
                      })}
                      className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="text-[14px] font-medium text-[#374151] mb-2 block">Custom CSS</label>
                  <textarea
                    value={formData.customizationOptions.uiCustomization.branding.customCss}
                    onChange={(e) => onNestedInputChange("customizationOptions", "uiCustomization", {
                      ...formData.customizationOptions.uiCustomization,
                      branding: {
                        ...formData.customizationOptions.uiCustomization.branding,
                        customCss: e.target.value
                      }
                    })}
                    className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                    rows={4}
                    placeholder="/* Custom CSS rules */"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
