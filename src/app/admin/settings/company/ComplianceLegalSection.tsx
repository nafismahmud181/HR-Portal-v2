"use client";

import { useState } from "react";

interface CompanySettings {
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
  };
  [key: string]: unknown;
}

interface ComplianceLegalSectionProps {
  formData: CompanySettings;
  onInputChange: (field: string, value: string | number | boolean | string[]) => void;
  onNestedInputChange: (parent: string, field: string, value: unknown) => void;
}

const COUNTRIES = [
  "United States", "Canada", "United Kingdom", "Germany", "France", 
  "Australia", "Japan", "India", "Brazil", "Mexico"
];

const US_STATES = [
  "Alabama", "Alaska", "Arizona", "Arkansas", "California", "Colorado", "Connecticut",
  "Delaware", "Florida", "Georgia", "Hawaii", "Idaho", "Illinois", "Indiana", "Iowa",
  "Kansas", "Kentucky", "Louisiana", "Maine", "Maryland", "Massachusetts", "Michigan",
  "Minnesota", "Mississippi", "Missouri", "Montana", "Nebraska", "Nevada", "New Hampshire",
  "New Jersey", "New Mexico", "New York", "North Carolina", "North Dakota", "Ohio",
  "Oklahoma", "Oregon", "Pennsylvania", "Rhode Island", "South Carolina", "South Dakota",
  "Tennessee", "Texas", "Utah", "Vermont", "Virginia", "Washington", "West Virginia",
  "Wisconsin", "Wyoming"
];


export default function ComplianceLegalSection({ formData, onNestedInputChange }: ComplianceLegalSectionProps) {
  const [newDataPurpose, setNewDataPurpose] = useState("");
  const [newDataRestriction, setNewDataRestriction] = useState("");

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

  const removeDataPurpose = (index: number) => {
    const updatedPurposes = formData.complianceSettings.regulatoryCompliance.dataProtection.dataProcessingPurposes.filter((_: string, i: number) => i !== index);
    onNestedInputChange("complianceSettings", "regulatoryCompliance", {
      ...formData.complianceSettings.regulatoryCompliance,
      dataProtection: {
        ...formData.complianceSettings.regulatoryCompliance.dataProtection,
        dataProcessingPurposes: updatedPurposes
      }
    });
  };

  const addDataRestriction = () => {
    if (newDataRestriction.trim()) {
      const updatedRestrictions = [...formData.complianceSettings.regulatoryCompliance.dataProtection.dataSharingRestrictions, newDataRestriction.trim()];
      onNestedInputChange("complianceSettings", "regulatoryCompliance", {
        ...formData.complianceSettings.regulatoryCompliance,
        dataProtection: {
          ...formData.complianceSettings.regulatoryCompliance.dataProtection,
          dataSharingRestrictions: updatedRestrictions
        }
      });
      setNewDataRestriction("");
    }
  };

  const removeDataRestriction = (index: number) => {
    const updatedRestrictions = formData.complianceSettings.regulatoryCompliance.dataProtection.dataSharingRestrictions.filter((_: string, i: number) => i !== index);
    onNestedInputChange("complianceSettings", "regulatoryCompliance", {
      ...formData.complianceSettings.regulatoryCompliance,
      dataProtection: {
        ...formData.complianceSettings.regulatoryCompliance.dataProtection,
        dataSharingRestrictions: updatedRestrictions
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Regulatory Compliance */}
      <section>
        <h2 className="text-[20px] font-semibold mb-6">Regulatory Compliance</h2>
        
        {/* Labor Law Compliance */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Labor Law Compliance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-[14px] font-medium mb-2">Country</label>
              <select
                value={formData.complianceSettings.regulatoryCompliance.laborLaw.country}
                onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                  ...formData.complianceSettings.regulatoryCompliance,
                  laborLaw: {
                    ...formData.complianceSettings.regulatoryCompliance.laborLaw,
                    country: e.target.value
                  }
                })}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              >
                <option value="">Select country</option>
                {COUNTRIES.map((country) => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">State/Province</label>
              <select
                value={formData.complianceSettings.regulatoryCompliance.laborLaw.state}
                onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                  ...formData.complianceSettings.regulatoryCompliance,
                  laborLaw: {
                    ...formData.complianceSettings.regulatoryCompliance.laborLaw,
                    state: e.target.value
                  }
                })}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              >
                <option value="">Select state/province</option>
                {US_STATES.map((state) => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Minimum Wage ($)</label>
              <input
                type="number"
                value={formData.complianceSettings.regulatoryCompliance.laborLaw.minimumWage}
                onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                  ...formData.complianceSettings.regulatoryCompliance,
                  laborLaw: {
                    ...formData.complianceSettings.regulatoryCompliance.laborLaw,
                    minimumWage: parseFloat(e.target.value) || 0
                  }
                })}
                min="0"
                step="0.01"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
          </div>

          {/* Overtime Regulations */}
          <div className="mb-6">
            <h4 className="text-[14px] font-medium mb-3">Overtime Regulations</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.complianceSettings.regulatoryCompliance.laborLaw.overtimeRegulations.enabled}
                  onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                    ...formData.complianceSettings.regulatoryCompliance,
                    laborLaw: {
                      ...formData.complianceSettings.regulatoryCompliance.laborLaw,
                      overtimeRegulations: {
                        ...formData.complianceSettings.regulatoryCompliance.laborLaw.overtimeRegulations,
                        enabled: e.target.checked
                      }
                    }
                  })}
                  className="rounded border-[#d1d5db]"
                />
                <span className="text-[14px] font-medium">Overtime regulations apply</span>
              </div>
              
              <div>
                <label className="block text-[14px] font-medium mb-2">Overtime Multiplier</label>
                <input
                  type="number"
                  value={formData.complianceSettings.regulatoryCompliance.laborLaw.overtimeRegulations.multiplier}
                  onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                    ...formData.complianceSettings.regulatoryCompliance,
                    laborLaw: {
                      ...formData.complianceSettings.regulatoryCompliance.laborLaw,
                      overtimeRegulations: {
                        ...formData.complianceSettings.regulatoryCompliance.laborLaw.overtimeRegulations,
                        multiplier: parseFloat(e.target.value) || 1.5
                      }
                    }
                  })}
                  min="1"
                  step="0.1"
                  className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                />
              </div>
              
              <div>
                <label className="block text-[14px] font-medium mb-2">Daily Threshold (hours)</label>
                <input
                  type="number"
                  value={formData.complianceSettings.regulatoryCompliance.laborLaw.overtimeRegulations.dailyThreshold}
                  onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                    ...formData.complianceSettings.regulatoryCompliance,
                    laborLaw: {
                      ...formData.complianceSettings.regulatoryCompliance.laborLaw,
                      overtimeRegulations: {
                        ...formData.complianceSettings.regulatoryCompliance.laborLaw.overtimeRegulations,
                        dailyThreshold: parseInt(e.target.value) || 8
                      }
                    }
                  })}
                  min="1"
                  max="24"
                  className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                />
              </div>
              
              <div>
                <label className="block text-[14px] font-medium mb-2">Weekly Threshold (hours)</label>
                <input
                  type="number"
                  value={formData.complianceSettings.regulatoryCompliance.laborLaw.overtimeRegulations.weeklyThreshold}
                  onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                    ...formData.complianceSettings.regulatoryCompliance,
                    laborLaw: {
                      ...formData.complianceSettings.regulatoryCompliance.laborLaw,
                      overtimeRegulations: {
                        ...formData.complianceSettings.regulatoryCompliance.laborLaw.overtimeRegulations,
                        weeklyThreshold: parseInt(e.target.value) || 40
                      }
                    }
                  })}
                  min="1"
                  max="168"
                  className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                />
              </div>
            </div>
          </div>

          {/* Break Requirements */}
          <div>
            <h4 className="text-[14px] font-medium mb-3">Break Requirements</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={formData.complianceSettings.regulatoryCompliance.laborLaw.breakRequirements.mealBreakRequired}
                    onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                      ...formData.complianceSettings.regulatoryCompliance,
                      laborLaw: {
                        ...formData.complianceSettings.regulatoryCompliance.laborLaw,
                        breakRequirements: {
                          ...formData.complianceSettings.regulatoryCompliance.laborLaw.breakRequirements,
                          mealBreakRequired: e.target.checked
                        }
                      }
                    })}
                    className="rounded border-[#d1d5db]"
                  />
                  <span className="text-[14px] font-medium">Meal break required</span>
                </div>
                <div>
                  <label className="block text-[14px] font-medium mb-2">Meal Break Duration (minutes)</label>
                  <input
                    type="number"
                    value={formData.complianceSettings.regulatoryCompliance.laborLaw.breakRequirements.mealBreakDuration}
                    onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                      ...formData.complianceSettings.regulatoryCompliance,
                      laborLaw: {
                        ...formData.complianceSettings.regulatoryCompliance.laborLaw,
                        breakRequirements: {
                          ...formData.complianceSettings.regulatoryCompliance.laborLaw.breakRequirements,
                          mealBreakDuration: parseInt(e.target.value) || 30
                        }
                      }
                    })}
                    min="0"
                    max="120"
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <input
                    type="checkbox"
                    checked={formData.complianceSettings.regulatoryCompliance.laborLaw.breakRequirements.restBreakRequired}
                    onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                      ...formData.complianceSettings.regulatoryCompliance,
                      laborLaw: {
                        ...formData.complianceSettings.regulatoryCompliance.laborLaw,
                        breakRequirements: {
                          ...formData.complianceSettings.regulatoryCompliance.laborLaw.breakRequirements,
                          restBreakRequired: e.target.checked
                        }
                      }
                    })}
                    className="rounded border-[#d1d5db]"
                  />
                  <span className="text-[14px] font-medium">Rest break required</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[14px] font-medium mb-2">Rest Break Duration (minutes)</label>
                    <input
                      type="number"
                      value={formData.complianceSettings.regulatoryCompliance.laborLaw.breakRequirements.restBreakDuration}
                      onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                        ...formData.complianceSettings.regulatoryCompliance,
                        laborLaw: {
                          ...formData.complianceSettings.regulatoryCompliance.laborLaw,
                          breakRequirements: {
                            ...formData.complianceSettings.regulatoryCompliance.laborLaw.breakRequirements,
                            restBreakDuration: parseInt(e.target.value) || 15
                          }
                        }
                      })}
                      min="0"
                      max="60"
                      className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                    />
                  </div>
                  <div>
                    <label className="block text-[14px] font-medium mb-2">Break Frequency (hours)</label>
                    <input
                      type="number"
                      value={formData.complianceSettings.regulatoryCompliance.laborLaw.breakRequirements.restBreakFrequency}
                      onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                        ...formData.complianceSettings.regulatoryCompliance,
                        laborLaw: {
                          ...formData.complianceSettings.regulatoryCompliance.laborLaw,
                          breakRequirements: {
                            ...formData.complianceSettings.regulatoryCompliance.laborLaw.breakRequirements,
                            restBreakFrequency: parseInt(e.target.value) || 4
                          }
                        }
                      })}
                      min="1"
                      max="12"
                      className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Data Protection Compliance */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Data Protection Compliance</h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.complianceSettings.regulatoryCompliance.dataProtection.gdprCompliant}
                  onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                    ...formData.complianceSettings.regulatoryCompliance,
                    dataProtection: {
                      ...formData.complianceSettings.regulatoryCompliance.dataProtection,
                      gdprCompliant: e.target.checked
                    }
                  })}
                  className="rounded border-[#d1d5db]"
                />
                <span className="text-[14px] font-medium">GDPR Compliant</span>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.complianceSettings.regulatoryCompliance.dataProtection.employeeConsentRequired}
                  onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                    ...formData.complianceSettings.regulatoryCompliance,
                    dataProtection: {
                      ...formData.complianceSettings.regulatoryCompliance.dataProtection,
                      employeeConsentRequired: e.target.checked
                    }
                  })}
                  className="rounded border-[#d1d5db]"
                />
                <span className="text-[14px] font-medium">Employee consent required</span>
              </div>
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Data Retention Period (years)</label>
              <input
                type="number"
                value={formData.complianceSettings.regulatoryCompliance.dataProtection.dataRetentionPeriod}
                onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                  ...formData.complianceSettings.regulatoryCompliance,
                  dataProtection: {
                    ...formData.complianceSettings.regulatoryCompliance.dataProtection,
                    dataRetentionPeriod: parseInt(e.target.value) || 7
                  }
                })}
                min="1"
                max="50"
                className="w-32 rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Data Processing Purposes</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDataPurpose}
                    onChange={(e) => setNewDataPurpose(e.target.value)}
                    placeholder="Add data processing purpose"
                    className="flex-1 rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                  />
                  <button
                    onClick={addDataPurpose}
                    className="px-3 py-2 bg-[#f97316] text-white rounded-md text-[14px] hover:bg-[#ea580c]"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {formData.complianceSettings.regulatoryCompliance.dataProtection.dataProcessingPurposes.map((purpose: string, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-[#f9fafb] px-3 py-2 rounded-md">
                      <span className="text-[14px]">{purpose}</span>
                      <button
                        onClick={() => removeDataPurpose(index)}
                        className="text-[#dc2626] hover:text-[#b91c1c] text-[12px]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Data Sharing Restrictions</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDataRestriction}
                    onChange={(e) => setNewDataRestriction(e.target.value)}
                    placeholder="Add data sharing restriction"
                    className="flex-1 rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                  />
                  <button
                    onClick={addDataRestriction}
                    className="px-3 py-2 bg-[#f97316] text-white rounded-md text-[14px] hover:bg-[#ea580c]"
                  >
                    Add
                  </button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {formData.complianceSettings.regulatoryCompliance.dataProtection.dataSharingRestrictions.map((restriction: string, index: number) => (
                    <div key={index} className="flex items-center justify-between bg-[#f9fafb] px-3 py-2 rounded-md">
                      <span className="text-[14px]">{restriction}</span>
                      <button
                        onClick={() => removeDataRestriction(index)}
                        className="text-[#dc2626] hover:text-[#b91c1c] text-[12px]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Equal Opportunity Settings */}
        <div>
          <h3 className="text-[16px] font-medium mb-4">Equal Opportunity Settings</h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.complianceSettings.regulatoryCompliance.equalOpportunity.eeoReportingRequired}
                  onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                    ...formData.complianceSettings.regulatoryCompliance,
                    equalOpportunity: {
                      ...formData.complianceSettings.regulatoryCompliance.equalOpportunity,
                      eeoReportingRequired: e.target.checked
                    }
                  })}
                  className="rounded border-[#d1d5db]"
                />
                <span className="text-[14px] font-medium">EEO reporting required</span>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.complianceSettings.regulatoryCompliance.equalOpportunity.diversityTracking}
                  onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                    ...formData.complianceSettings.regulatoryCompliance,
                    equalOpportunity: {
                      ...formData.complianceSettings.regulatoryCompliance.equalOpportunity,
                      diversityTracking: e.target.checked
                    }
                  })}
                  className="rounded border-[#d1d5db]"
                />
                <span className="text-[14px] font-medium">Diversity tracking enabled</span>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.complianceSettings.regulatoryCompliance.equalOpportunity.accessibilityCompliant}
                  onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                    ...formData.complianceSettings.regulatoryCompliance,
                    equalOpportunity: {
                      ...formData.complianceSettings.regulatoryCompliance.equalOpportunity,
                      accessibilityCompliant: e.target.checked
                    }
                  })}
                  className="rounded border-[#d1d5db]"
                />
                <span className="text-[14px] font-medium">Accessibility compliant</span>
              </div>
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Reasonable Accommodation Policy</label>
              <textarea
                value={formData.complianceSettings.regulatoryCompliance.equalOpportunity.reasonableAccommodationPolicy}
                onChange={(e) => onNestedInputChange("complianceSettings", "regulatoryCompliance", {
                  ...formData.complianceSettings.regulatoryCompliance,
                  equalOpportunity: {
                    ...formData.complianceSettings.regulatoryCompliance.equalOpportunity,
                    reasonableAccommodationPolicy: e.target.value
                  }
                })}
                placeholder="Describe your reasonable accommodation policy..."
                rows={4}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Insurance & Benefits */}
      <section>
        <h2 className="text-[20px] font-semibold mb-6">Insurance & Benefits</h2>
        
        {/* Workers' Compensation */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Workers&apos; Compensation Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[14px] font-medium mb-2">Insurance Provider</label>
              <input
                type="text"
                value={formData.complianceSettings.insuranceBenefits.workersCompensation.provider}
                onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                  ...formData.complianceSettings.insuranceBenefits,
                  workersCompensation: {
                    ...formData.complianceSettings.insuranceBenefits.workersCompensation,
                    provider: e.target.value
                  }
                })}
                placeholder="Insurance company name"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Policy Number</label>
              <input
                type="text"
                value={formData.complianceSettings.insuranceBenefits.workersCompensation.policyNumber}
                onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                  ...formData.complianceSettings.insuranceBenefits,
                  workersCompensation: {
                    ...formData.complianceSettings.insuranceBenefits.workersCompensation,
                    policyNumber: e.target.value
                  }
                })}
                placeholder="Policy number"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Coverage Amount ($)</label>
              <input
                type="number"
                value={formData.complianceSettings.insuranceBenefits.workersCompensation.coverageAmount}
                onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                  ...formData.complianceSettings.insuranceBenefits,
                  workersCompensation: {
                    ...formData.complianceSettings.insuranceBenefits.workersCompensation,
                    coverageAmount: parseFloat(e.target.value) || 0
                  }
                })}
                min="0"
                step="1000"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Effective Date</label>
              <input
                type="date"
                value={formData.complianceSettings.insuranceBenefits.workersCompensation.effectiveDate}
                onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                  ...formData.complianceSettings.insuranceBenefits,
                  workersCompensation: {
                    ...formData.complianceSettings.insuranceBenefits.workersCompensation,
                    effectiveDate: e.target.value
                  }
                })}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Expiration Date</label>
              <input
                type="date"
                value={formData.complianceSettings.insuranceBenefits.workersCompensation.expirationDate}
                onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                  ...formData.complianceSettings.insuranceBenefits,
                  workersCompensation: {
                    ...formData.complianceSettings.insuranceBenefits.workersCompensation,
                    expirationDate: e.target.value
                  }
                })}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
          </div>
        </div>

        {/* Unemployment Insurance */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Unemployment Insurance Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[14px] font-medium mb-2">State Account Number</label>
              <input
                type="text"
                value={formData.complianceSettings.insuranceBenefits.unemploymentInsurance.stateAccountNumber}
                onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                  ...formData.complianceSettings.insuranceBenefits,
                  unemploymentInsurance: {
                    ...formData.complianceSettings.insuranceBenefits.unemploymentInsurance,
                    stateAccountNumber: e.target.value
                  }
                })}
                placeholder="State unemployment account number"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Federal Account Number</label>
              <input
                type="text"
                value={formData.complianceSettings.insuranceBenefits.unemploymentInsurance.federalAccountNumber}
                onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                  ...formData.complianceSettings.insuranceBenefits,
                  unemploymentInsurance: {
                    ...formData.complianceSettings.insuranceBenefits.unemploymentInsurance,
                    federalAccountNumber: e.target.value
                  }
                })}
                placeholder="Federal unemployment account number"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Contribution Rate (%)</label>
              <input
                type="number"
                value={formData.complianceSettings.insuranceBenefits.unemploymentInsurance.contributionRate}
                onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                  ...formData.complianceSettings.insuranceBenefits,
                  unemploymentInsurance: {
                    ...formData.complianceSettings.insuranceBenefits.unemploymentInsurance,
                    contributionRate: parseFloat(e.target.value) || 0
                  }
                })}
                min="0"
                max="100"
                step="0.01"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Wage Base ($)</label>
              <input
                type="number"
                value={formData.complianceSettings.insuranceBenefits.unemploymentInsurance.wageBase}
                onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                  ...formData.complianceSettings.insuranceBenefits,
                  unemploymentInsurance: {
                    ...formData.complianceSettings.insuranceBenefits.unemploymentInsurance,
                    wageBase: parseFloat(e.target.value) || 0
                  }
                })}
                min="0"
                step="1000"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
          </div>
        </div>

        {/* Health & Safety Compliance */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Health & Safety Compliance</h3>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.complianceSettings.insuranceBenefits.healthSafety.oshaCompliant}
                  onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                    ...formData.complianceSettings.insuranceBenefits,
                    healthSafety: {
                      ...formData.complianceSettings.insuranceBenefits.healthSafety,
                      oshaCompliant: e.target.checked
                    }
                  })}
                  className="rounded border-[#d1d5db]"
                />
                <span className="text-[14px] font-medium">OSHA Compliant</span>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.complianceSettings.insuranceBenefits.healthSafety.safetyTrainingRequired}
                  onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                    ...formData.complianceSettings.insuranceBenefits,
                    healthSafety: {
                      ...formData.complianceSettings.insuranceBenefits.healthSafety,
                      safetyTrainingRequired: e.target.checked
                    }
                  })}
                  className="rounded border-[#d1d5db]"
                />
                <span className="text-[14px] font-medium">Safety training required</span>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.complianceSettings.insuranceBenefits.healthSafety.incidentReportingRequired}
                  onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                    ...formData.complianceSettings.insuranceBenefits,
                    healthSafety: {
                      ...formData.complianceSettings.insuranceBenefits.healthSafety,
                      incidentReportingRequired: e.target.checked
                    }
                  })}
                  className="rounded border-[#d1d5db]"
                />
                <span className="text-[14px] font-medium">Incident reporting required</span>
              </div>
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Emergency Procedures</label>
              <textarea
                value={formData.complianceSettings.insuranceBenefits.healthSafety.emergencyProcedures}
                onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                  ...formData.complianceSettings.insuranceBenefits,
                  healthSafety: {
                    ...formData.complianceSettings.insuranceBenefits.healthSafety,
                    emergencyProcedures: e.target.value
                  }
                })}
                placeholder="Describe emergency procedures and protocols..."
                rows={4}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
          </div>
        </div>

        {/* Professional Liability Coverage */}
        <div>
          <h3 className="text-[16px] font-medium mb-4">Professional Liability Coverage</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[14px] font-medium mb-2">Insurance Provider</label>
              <input
                type="text"
                value={formData.complianceSettings.insuranceBenefits.professionalLiability.provider}
                onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                  ...formData.complianceSettings.insuranceBenefits,
                  professionalLiability: {
                    ...formData.complianceSettings.insuranceBenefits.professionalLiability,
                    provider: e.target.value
                  }
                })}
                placeholder="Insurance company name"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Policy Number</label>
              <input
                type="text"
                value={formData.complianceSettings.insuranceBenefits.professionalLiability.policyNumber}
                onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                  ...formData.complianceSettings.insuranceBenefits,
                  professionalLiability: {
                    ...formData.complianceSettings.insuranceBenefits.professionalLiability,
                    policyNumber: e.target.value
                  }
                })}
                placeholder="Policy number"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Coverage Amount ($)</label>
              <input
                type="number"
                value={formData.complianceSettings.insuranceBenefits.professionalLiability.coverageAmount}
                onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                  ...formData.complianceSettings.insuranceBenefits,
                  professionalLiability: {
                    ...formData.complianceSettings.insuranceBenefits.professionalLiability,
                    coverageAmount: parseFloat(e.target.value) || 0
                  }
                })}
                min="0"
                step="1000"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Effective Date</label>
              <input
                type="date"
                value={formData.complianceSettings.insuranceBenefits.professionalLiability.effectiveDate}
                onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                  ...formData.complianceSettings.insuranceBenefits,
                  professionalLiability: {
                    ...formData.complianceSettings.insuranceBenefits.professionalLiability,
                    effectiveDate: e.target.value
                  }
                })}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Expiration Date</label>
              <input
                type="date"
                value={formData.complianceSettings.insuranceBenefits.professionalLiability.expirationDate}
                onChange={(e) => onNestedInputChange("complianceSettings", "insuranceBenefits", {
                  ...formData.complianceSettings.insuranceBenefits,
                  professionalLiability: {
                    ...formData.complianceSettings.insuranceBenefits.professionalLiability,
                    expirationDate: e.target.value
                  }
                })}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
