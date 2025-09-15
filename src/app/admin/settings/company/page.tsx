"use client";

import { useState, useEffect } from "react";
import CompanyProfileSection from "./CompanyProfileSection";
import BusinessConfigSection from "./BusinessConfigSection";
import OfficeLocationsSection from "./OfficeLocationsSection";
import OrgStructureSection from "./OrgStructureSection";
import DocumentCommSection from "./DocumentCommSection";
import ComplianceLegalSection from "./ComplianceLegalSection";

interface CompanySettings {
  // Company Profile
  companyName: string;
  displayName: string;
  registrationNumber: string;
  taxId: string;
  industryType: string;
  companySize: string;
  foundedDate: string;
  websiteUrl: string;
  description: string;
  
  // Contact Information
  primaryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  mailingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  primaryPhone: string;
  primaryEmail: string;
  hrEmail: string;
  supportEmail: string;
  
  // Branding
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  emailSignature: string;
  
  // Business Configuration
  workingHours: {
    mondayToFriday: { start: string; end: string };
    weekendDays: string[];
    timeZone: string;
  };
  holidays: {
    national: string[];
    company: string[];
    floating: number;
  };
  fiscalYear: {
    startMonth: string;
    payrollYear: string;
  };
  
  // Office Locations
  primaryOffice: {
    name: string;
    address: string;
    contact: string;
    hrRepresentative: string;
    timeZone: string;
  };
  branchOffices: Array<{
    name: string;
    address: string;
    contact: string;
    hrRepresentative: string;
    timeZone: string;
  }>;
  remoteWorkPolicy: {
    allowed: boolean;
    hybrid: boolean;
    geographicRestrictions: string[];
  };
  
  // Organizational Structure
  reportingStructure: {
    type: string;
    maxApprovalLevels: number;
    skipLevelApproval: boolean;
  };
  costCenters: Array<{
    name: string;
    department: string;
    projectAllocation: boolean;
  }>;
  
  // Document & Communication Settings
  documentConfig: {
    employeeIdFormat: string;
    documentRefFormat: string;
    invoiceNumberFormat: string;
    authorizedSignatories: Array<{
      name: string;
      title: string;
      signatureTemplate: string;
    }>;
    retentionPolicy: {
      employeeRecords: number;
      taxDocuments: number;
      performanceReviews: number;
    };
  };
  
  communicationPrefs: {
    emailTemplates: {
      welcome: string;
      termination: string;
      generalNotification: string;
    };
    notificationSettings: {
      emailEnabled: boolean;
      smsEnabled: boolean;
      pushEnabled: boolean;
    };
    localization: {
      defaultLanguage: string;
      multiLanguageSupport: boolean;
      dateFormat: string;
      timeFormat: string;
      currencyFormat: string;
    };
  };
  
  // Compliance & Legal Settings
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


export default function CompanySettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "warning" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info"
  });

  const [formData, setFormData] = useState<CompanySettings>({
    companyName: "",
    displayName: "",
    registrationNumber: "",
    taxId: "",
    industryType: "",
    companySize: "",
    foundedDate: "",
    websiteUrl: "",
    description: "",
    primaryAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    },
    mailingAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    },
    primaryPhone: "",
    primaryEmail: "",
    hrEmail: "",
    supportEmail: "",
    logo: "",
    favicon: "",
    primaryColor: "#f97316",
    secondaryColor: "#1f2937",
    emailSignature: "",
    workingHours: {
      mondayToFriday: { start: "09:00", end: "17:00" },
      weekendDays: [],
      timeZone: "UTC+00:00"
    },
    holidays: {
      national: [],
      company: [],
      floating: 0
    },
    fiscalYear: {
      startMonth: "January",
      payrollYear: "2024"
    },
    primaryOffice: {
      name: "",
      address: "",
      contact: "",
      hrRepresentative: "",
      timeZone: "UTC+00:00"
    },
    branchOffices: [],
    remoteWorkPolicy: {
      allowed: false,
      hybrid: false,
      geographicRestrictions: []
    },
    reportingStructure: {
      type: "traditional",
      maxApprovalLevels: 3,
      skipLevelApproval: false
    },
    costCenters: [],
    documentConfig: {
      employeeIdFormat: "EMP{YYYY}-{###}",
      documentRefFormat: "DOC-{YYYY}-{MM}-{###}",
      invoiceNumberFormat: "INV-{YYYY}-{###}",
      authorizedSignatories: [],
      retentionPolicy: {
        employeeRecords: 7,
        taxDocuments: 7,
        performanceReviews: 3
      }
    },
    communicationPrefs: {
      emailTemplates: {
        welcome: "Welcome to {companyName}! We're excited to have you join our team.",
        termination: "This letter confirms the termination of your employment with {companyName}.",
        generalNotification: "This is a general notification from {companyName}."
      },
      notificationSettings: {
        emailEnabled: true,
        smsEnabled: false,
        pushEnabled: true
      },
      localization: {
        defaultLanguage: "en-US",
        multiLanguageSupport: false,
        dateFormat: "MM/DD/YYYY",
        timeFormat: "12-hour",
        currencyFormat: "USD"
      }
    },
    complianceSettings: {
      regulatoryCompliance: {
        laborLaw: {
          jurisdiction: "",
          country: "US",
          state: "",
          minimumWage: 0,
          overtimeRegulations: {
            enabled: true,
            multiplier: 1.5,
            dailyThreshold: 8,
            weeklyThreshold: 40
          },
          breakRequirements: {
            mealBreakRequired: false,
            mealBreakDuration: 30,
            restBreakRequired: false,
            restBreakDuration: 15,
            restBreakFrequency: 4
          }
        },
        dataProtection: {
          gdprCompliant: false,
          dataRetentionPeriod: 7,
          employeeConsentRequired: true,
          dataProcessingPurposes: [],
          dataSharingRestrictions: []
        },
        equalOpportunity: {
          eeoReportingRequired: false,
          diversityTracking: false,
          accessibilityCompliant: false,
          reasonableAccommodationPolicy: ""
        }
      },
      insuranceBenefits: {
        workersCompensation: {
          provider: "",
          policyNumber: "",
          coverageAmount: 0,
          effectiveDate: "",
          expirationDate: ""
        },
        unemploymentInsurance: {
          stateAccountNumber: "",
          federalAccountNumber: "",
          contributionRate: 0,
          wageBase: 0
        },
        healthSafety: {
          oshaCompliant: false,
          safetyTrainingRequired: false,
          incidentReportingRequired: false,
          emergencyProcedures: ""
        },
        professionalLiability: {
          provider: "",
          policyNumber: "",
          coverageAmount: 0,
          effectiveDate: "",
          expirationDate: ""
        }
      }
    }
  });

  const tabs = [
    { id: "profile", label: "Company Profile", icon: "🏢" },
    { id: "business", label: "Business Config", icon: "⚙️" },
    { id: "locations", label: "Office Locations", icon: "📍" },
    { id: "structure", label: "Org Structure", icon: "🏗️" },
    { id: "documents", label: "Documents & Comm", icon: "📄" },
    { id: "compliance", label: "Compliance & Legal", icon: "⚖️" }
  ];

  useEffect(() => {
    loadCompanySettings();
  }, []);

  const loadCompanySettings = async () => {
    setLoading(true);
    try {
      // TODO: Load from Firebase
      setLoading(false);
    } catch (error) {
      console.error("Error loading company settings:", error);
      setLoading(false);
    }
  };

  const showModal = (title: string, message: string, type: "success" | "error" | "warning" | "info" = "info") => {
    setModal({
      isOpen: true,
      title,
      message,
      type
    });
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parent: string, field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent as keyof CompanySettings] as Record<string, unknown>),
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // TODO: Save to Firebase
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      showModal("Success", "Company settings saved successfully!", "success");
    } catch (error) {
      console.error("Error saving company settings:", error);
      showModal("Error", "Failed to save company settings. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff] text-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f97316] mx-auto"></div>
          <p className="mt-2 text-[14px] text-[#6b7280]">Loading company settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-semibold">Company Settings</h1>
            <p className="mt-2 text-[14px] text-[#6b7280]">Manage your organization&apos;s configuration and settings.</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[#f97316] text-white rounded-md text-[14px] font-medium hover:bg-[#ea580c] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#e5e7eb] mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-[14px] ${
                  activeTab === tab.id
                    ? "border-[#f97316] text-[#f97316]"
                    : "border-transparent text-[#6b7280] hover:text-[#374151] hover:border-[#d1d5db]"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === "profile" && <CompanyProfileSection formData={formData} onInputChange={handleInputChange} onNestedInputChange={handleNestedInputChange} />}
          {activeTab === "business" && <BusinessConfigSection formData={formData} onInputChange={handleInputChange} onNestedInputChange={handleNestedInputChange} />}
          {activeTab === "locations" && <OfficeLocationsSection formData={formData} onInputChange={handleInputChange} onNestedInputChange={handleNestedInputChange} />}
          {activeTab === "structure" && <OrgStructureSection formData={formData} onInputChange={handleInputChange} onNestedInputChange={handleNestedInputChange} />}
          {activeTab === "documents" && <DocumentCommSection formData={formData} onInputChange={handleInputChange} onNestedInputChange={handleNestedInputChange} />}
          {activeTab === "compliance" && <ComplianceLegalSection formData={formData} onInputChange={handleInputChange} onNestedInputChange={handleNestedInputChange} />}
        </div>

        {/* Modal */}
        {modal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  modal.type === "success" ? "bg-green-100" :
                  modal.type === "error" ? "bg-red-100" :
                  modal.type === "warning" ? "bg-yellow-100" :
                  "bg-blue-100"
                }`}>
                  <span className={`text-sm ${
                    modal.type === "success" ? "text-green-600" :
                    modal.type === "error" ? "text-red-600" :
                    modal.type === "warning" ? "text-yellow-600" :
                    "text-blue-600"
                  }`}>
                    {modal.type === "success" ? "✓" :
                     modal.type === "error" ? "✕" :
                     modal.type === "warning" ? "⚠" : "ℹ"}
                  </span>
                </div>
                <h3 className="text-lg font-semibold">{modal.title}</h3>
              </div>
              <p className="text-[#6b7280] mb-6 whitespace-pre-line">{modal.message}</p>
              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-[#f97316] text-white rounded-md text-[14px] font-medium hover:bg-[#ea580c]"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
