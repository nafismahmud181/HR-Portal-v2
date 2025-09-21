"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
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
  const [user, setUser] = useState<User | null>(null);
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
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await loadCompanySettings(user);
      } else {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const loadCompanySettings = async (user: User) => {
    setLoading(true);
    try {
      console.log("Loading company settings for user:", user.uid);
      
      // Query for organization where user is the creator
      const orgsRef = collection(db, "organizations");
      const q = query(orgsRef, where("createdBy", "==", user.uid));
      console.log("Querying organizations with createdBy:", user.uid);
      
      let querySnapshot = await getDocs(q);
      console.log("Query result:", querySnapshot.empty ? "No organizations found" : `${querySnapshot.docs.length} organizations found`);
      
      // If no organization found with createdBy, try alternative queries
      if (querySnapshot.empty) {
        console.log("No organization found with createdBy, trying alternative queries...");
        
        // Try direct document access where user.uid matches orgId
        try {
          const directDocRef = doc(db, "organizations", user.uid);
          const directDocSnapshot = await getDoc(directDocRef);
          if (directDocSnapshot.exists()) {
            console.log("Found organization with direct user.uid match");
            querySnapshot = { empty: false, docs: [directDocSnapshot] } as typeof querySnapshot;
          }
        } catch (directError) {
          console.log("Direct document access failed:", directError);
        }
        
        // If still empty, try to find any organization the user might have access to
        if (querySnapshot.empty) {
          try {
            const allOrgsQuery = query(orgsRef);
            const allOrgsSnapshot = await getDocs(allOrgsQuery);
            console.log("Total organizations in database:", allOrgsSnapshot.docs.length);
            
            // Look for organizations where the user might be the creator (check all docs)
            for (const doc of allOrgsSnapshot.docs) {
              const data = doc.data();
              if (data.createdBy === user.uid || doc.id === user.uid) {
                console.log("Found matching organization:", doc.id);
                querySnapshot = { empty: false, docs: [doc] } as typeof querySnapshot;
                break;
              }
            }
          } catch (allOrgsError) {
            console.log("All orgs query failed:", allOrgsError);
          }
        }
      }
      
      if (!querySnapshot.empty) {
        const orgDoc = querySnapshot.docs[0];
        const orgData = orgDoc.data();
        
        // Map organization data to form data
        setFormData(prev => ({
          ...prev,
          // Company Profile
          companyName: orgData.legalName || orgData.name || "",
          displayName: orgData.displayName || orgData.name || "",
          industryType: orgData.industry || "",
          websiteUrl: orgData.website || "",
          companySize: orgData.size || "",
          foundedDate: orgData.foundedDate || "",
          description: orgData.description || "",
          
          // Contact Information
          primaryAddress: {
            street: orgData.adminAddress?.street || "",
            city: orgData.adminAddress?.city || "",
            state: orgData.adminAddress?.state || "",
            zipCode: orgData.adminAddress?.zip || "",
            country: orgData.country || ""
          },
          mailingAddress: {
            street: orgData.mailingAddress?.street || "",
            city: orgData.mailingAddress?.city || "",
            state: orgData.mailingAddress?.state || "",
            zipCode: orgData.mailingAddress?.zip || "",
            country: orgData.mailingAddress?.country || ""
          },
          primaryPhone: orgData.adminPhone || "",
          primaryEmail: orgData.adminEmail || "",
          hrEmail: orgData.hrEmail || "",
          supportEmail: orgData.supportEmail || "",
          
          // Branding
          logo: orgData.logo || "",
          favicon: orgData.favicon || "",
          primaryColor: orgData.primaryColor || "#f97316",
          secondaryColor: orgData.secondaryColor || "#1f2937",
          emailSignature: orgData.emailSignature || "",
          
          // Working hours and business config
          workingHours: {
            ...prev.workingHours,
            ...orgData.workingHours,
            timeZone: orgData.timezone || prev.workingHours.timeZone
          },
          holidays: {
            ...prev.holidays,
            ...orgData.holidays
          },
          fiscalYear: {
            ...prev.fiscalYear,
            ...orgData.fiscalYear
          },
          
          // Office locations
          primaryOffice: {
            ...prev.primaryOffice,
            ...orgData.primaryOffice
          },
          branchOffices: orgData.branchOffices || [],
          remoteWorkPolicy: {
            ...prev.remoteWorkPolicy,
            ...orgData.remoteWorkPolicy,
            allowed: orgData.remoteWork?.includes("remote") || false,
            hybrid: orgData.remoteWork?.includes("some") || false,
            geographicRestrictions: orgData.remoteWorkPolicy?.geographicRestrictions || []
          },
          
          // Organizational structure
          reportingStructure: {
            ...prev.reportingStructure,
            ...orgData.reportingStructure
          },
          costCenters: orgData.costCenters || [],
          
          // Document & Communication Settings
          documentConfig: {
            ...prev.documentConfig,
            ...orgData.documentConfig,
            employeeIdFormat: orgData.documentConfig?.employeeIdFormat || "EMP{YYYY}-{###}",
            documentRefFormat: orgData.documentConfig?.documentRefFormat || "DOC-{YYYY}-{MM}-{###}",
            invoiceNumberFormat: orgData.documentConfig?.invoiceNumberFormat || "INV-{YYYY}-{###}",
            authorizedSignatories: orgData.documentConfig?.authorizedSignatories || [],
            retentionPolicy: {
              ...prev.documentConfig.retentionPolicy,
              ...orgData.documentConfig?.retentionPolicy
            }
          },
          communicationPrefs: {
            ...prev.communicationPrefs,
            ...orgData.communicationPrefs,
            emailTemplates: {
              ...prev.communicationPrefs.emailTemplates,
              ...orgData.communicationPrefs?.emailTemplates
            },
            notificationSettings: {
              ...prev.communicationPrefs.notificationSettings,
              ...orgData.communicationPrefs?.notificationSettings
            },
            localization: {
              ...prev.communicationPrefs.localization,
              ...orgData.communicationPrefs?.localization
            }
          },
          
          // Compliance & Legal Settings
          complianceSettings: {
            ...prev.complianceSettings,
            ...orgData.complianceSettings
          }
        }));
      }
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
      if (!user) {
        showModal("Error", "User not authenticated. Please log in again.", "error");
        return;
      }

      console.log("Saving company settings for user:", user.uid);

      // Find the organization where user is the creator
      const orgsRef = collection(db, "organizations");
      const q = query(orgsRef, where("createdBy", "==", user.uid));
      console.log("Querying organizations for save with createdBy:", user.uid);
      
      let querySnapshot = await getDocs(q);
      console.log("Save query result:", querySnapshot.empty ? "No organizations found" : `${querySnapshot.docs.length} organizations found`);
      
      // If no organization found with createdBy, try alternative approaches
      if (querySnapshot.empty) {
        console.log("No organization found with createdBy for save, trying alternatives...");
        
        // Try direct document access where user.uid matches orgId
        try {
          const directDocRef = doc(db, "organizations", user.uid);
          const directDocSnapshot = await getDoc(directDocRef);
          if (directDocSnapshot.exists()) {
            console.log("Found organization with direct user.uid match for save");
            querySnapshot = { empty: false, docs: [directDocSnapshot] } as typeof querySnapshot;
          }
        } catch (directError) {
          console.log("Direct document access failed for save:", directError);
        }
      }
      
      if (querySnapshot.empty) {
        showModal("Error", "Organization not found. Please contact support.", "error");
        return;
      }

      const orgDoc = querySnapshot.docs[0];
      const orgId = orgDoc.id;
      const orgRef = doc(db, "organizations", orgId);

      // Prepare the data to save
      const updateData = {
        // Company Profile
        name: formData.companyName,
        displayName: formData.displayName,
        legalName: formData.companyName,
        industry: formData.industryType,
        website: formData.websiteUrl,
        size: formData.companySize,
        foundedDate: formData.foundedDate,
        description: formData.description,
        
        // Contact Information
        adminAddress: {
          street: formData.primaryAddress.street,
          city: formData.primaryAddress.city,
          state: formData.primaryAddress.state,
          zip: formData.primaryAddress.zipCode,
          country: formData.primaryAddress.country
        },
        mailingAddress: {
          street: formData.mailingAddress.street,
          city: formData.mailingAddress.city,
          state: formData.mailingAddress.state,
          zip: formData.mailingAddress.zipCode,
          country: formData.mailingAddress.country
        },
        adminPhone: formData.primaryPhone,
        adminEmail: formData.primaryEmail,
        hrEmail: formData.hrEmail,
        supportEmail: formData.supportEmail,
        
        // Branding
        logo: formData.logo,
        favicon: formData.favicon,
        primaryColor: formData.primaryColor,
        secondaryColor: formData.secondaryColor,
        emailSignature: formData.emailSignature,
        
        // Business Configuration
        workingHours: formData.workingHours,
        holidays: formData.holidays,
        fiscalYear: formData.fiscalYear,
        timezone: formData.workingHours.timeZone,
        
        // Office Locations
        primaryOffice: formData.primaryOffice,
        branchOffices: formData.branchOffices,
        remoteWorkPolicy: formData.remoteWorkPolicy,
        
        // Organizational Structure
        reportingStructure: formData.reportingStructure,
        costCenters: formData.costCenters,
        
        // Document & Communication Settings
        documentConfig: formData.documentConfig,
        communicationPrefs: formData.communicationPrefs,
        
        // Compliance & Legal Settings
        complianceSettings: formData.complianceSettings,
        
        // Update timestamp
        lastUpdated: new Date().toISOString(),
        updatedBy: user.uid
      };

      // Save to Firebase
      console.log("Attempting to save to organization:", orgId);
      console.log("Update data keys:", Object.keys(updateData));
      
      await setDoc(orgRef, updateData, { merge: true });
      
      showModal("Success", "Company settings saved successfully!", "success");
      console.log("Company settings saved successfully");
    } catch (error) {
      console.error("Error saving company settings:", error);
      showModal("Error", `Failed to save company settings: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`, "error");
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">Access Denied</h1>
          <p className="text-[#6b7280] mt-2">You must be logged in to access this page.</p>
        </div>
      </div>
    );
  }

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
