"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";

interface CompanyInfo {
  legalName: string;
  displayName: string;
  industry: string;
  website: string;
  country: string;
}

interface CompanySize {
  employeeCount: number;
  growthExpectation: string;
  remoteWork: string;
  currentHrMethod: string;
}

interface UseCases {
  priorities: string[];
  goLiveTimeline: string;
}

interface AdminContact {
  firstName: string;
  lastName: string;
  jobTitle: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  timezone: string;
}

const INDUSTRIES = [
  "Technology",
  "Healthcare", 
  "Finance",
  "Retail",
  "Manufacturing",
  "Education",
  "Non-profit",
  "Other"
];

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "India",
  "Other"
];

const GROWTH_OPTIONS = [
  "Stay the same (0-10% growth)",
  "Moderate growth (11-50% growth)", 
  "Rapid growth (50%+ growth)"
];

const REMOTE_OPTIONS = [
  "No, all employees work in office",
  "Yes, some employees work remotely",
  "Yes, we're fully remote"
];

const HR_METHOD_OPTIONS = [
  "Spreadsheets and manual processes",
  "Basic HR software",
  "Multiple disconnected tools",
  "This is our first HR system"
];

const PRIORITY_OPTIONS = [
  "Employee information management",
  "Payroll processing and tax compliance",
  "Time tracking and attendance",
  "Performance reviews and goal setting",
  "Benefits administration",
  "Recruitment and onboarding",
  "Document management and e-signatures",
  "Compliance and reporting",
  "Employee self-service portal"
];


const JOB_TITLES = [
  "CEO",
  "HR Manager",
  "HR Director", 
  "Office Manager",
  "Operations Manager",
  "Owner",
  "Other"
];

const TIMEZONES = [
  "Eastern Time (UTC-5)",
  "Central Time (UTC-6)",
  "Mountain Time (UTC-7)",
  "Pacific Time (UTC-8)",
  "Alaska Time (UTC-9)",
  "Hawaii Time (UTC-10)"
];

export default function CompanySetupPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return () => unsub();
  }, []);

  const totalSteps = 4;
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  // Live preview component
  const renderLivePreview = () => (
    <div className="bg-[#f8f9fa] p-8 h-full">
      <div className="bg-white rounded-lg shadow-sm p-10 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-[#1a1a1a] uppercase tracking-wide">
            Company Profile Preview
          </h3>
          <p className="text-sm text-[#6b7280] mt-2">This is how your company will appear</p>
        </div>

        <div className="space-y-6">
          {/* Company Header */}
          <div className="border-b border-[#e5e7eb] pb-4">
            <h4 className="text-lg font-semibold text-[#1a1a1a]">
              {companyInfo.displayName || companyInfo.legalName || "Your Company Name"}
            </h4>
            {companyInfo.legalName && companyInfo.displayName && companyInfo.legalName !== companyInfo.displayName && (
              <p className="text-sm text-[#6b7280] mt-1">
                Legal: {companyInfo.legalName}
              </p>
            )}
            {companyInfo.industry && (
              <p className="text-sm text-[#f97316] font-medium mt-1">
                {companyInfo.industry}
              </p>
            )}
          </div>

          {/* Company Details */}
          <div className="space-y-3">
            {companyInfo.website && (
              <div>
                <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Website</span>
                <p className="text-sm text-[#1a1a1a]">{companyInfo.website}</p>
              </div>
            )}
            
            {companyInfo.country && (
              <div>
                <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Location</span>
                <p className="text-sm text-[#1a1a1a]">{companyInfo.country}</p>
              </div>
            )}

            {companySize.employeeCount && (
              <div>
                <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Team Size</span>
                <p className="text-sm text-[#1a1a1a]">{companySize.employeeCount} employees</p>
              </div>
            )}

            {companySize.remoteWork && (
              <div>
                <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Work Model</span>
                <p className="text-sm text-[#1a1a1a]">
                  {companySize.remoteWork === "No, all employees work in office" ? "Office-based" :
                   companySize.remoteWork === "Yes, some employees work remotely" ? "Hybrid" :
                   companySize.remoteWork === "Yes, we're fully remote" ? "Fully Remote" : companySize.remoteWork}
                </p>
              </div>
            )}

            {useCases.priorities.length > 0 && (
              <div>
                <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Priorities</span>
                <div className="mt-1 space-y-1">
                  {useCases.priorities.map((priority, index) => (
                    <p key={index} className="text-sm text-[#1a1a1a]">• {priority}</p>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Admin Contact Preview */}
          {(adminContact.firstName || adminContact.lastName) && (
            <div className="border-t border-[#e5e7eb] pt-4">
              <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Primary Contact</span>
              <p className="text-sm text-[#1a1a1a] mt-1">
                {adminContact.firstName} {adminContact.lastName}
                {adminContact.jobTitle && ` • ${adminContact.jobTitle}`}
              </p>
              {adminContact.phone && (
                <p className="text-sm text-[#6b7280] mt-1">{adminContact.phone}</p>
              )}
            </div>
          )}
        </div>

        <div className="text-right mt-8">
          <p className="text-sm text-[#6b7280] font-cursive">
            {adminContact.firstName && adminContact.lastName 
              ? `${adminContact.firstName} ${adminContact.lastName}` 
              : "Your Signature"}
          </p>
        </div>
      </div>
    </div>
  );

  // Form data state
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    legalName: "",
    displayName: "",
    industry: "",
    website: "",
    country: ""
  });

  const [sameAsLegalName, setSameAsLegalName] = useState(false);

  const [companySize, setCompanySize] = useState<CompanySize>({
    employeeCount: 10,
    growthExpectation: "Moderate growth (11-50% growth)",
    remoteWork: "Yes, some employees work remotely",
    currentHrMethod: "Spreadsheets and manual processes"
  });

  const [useCases, setUseCases] = useState<UseCases>({
    priorities: [],
    goLiveTimeline: ""
  });

  const [adminContact, setAdminContact] = useState<AdminContact>({
    firstName: "",
    lastName: "",
    jobTitle: "HR Manager",
    phone: "",
    streetAddress: "",
    city: "",
    state: "",
    zip: "",
    timezone: "Eastern Time (UTC-5)"
  });

  const handleCompanyInfoChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo(prev => {
      const updated = { ...prev, [field]: value };
      // If legal name changes and checkbox is checked, update display name too
      if (field === 'legalName' && sameAsLegalName) {
        updated.displayName = value;
      }
      return updated;
    });
  };

  const handleSameAsLegalNameChange = (checked: boolean) => {
    setSameAsLegalName(checked);
    if (checked) {
      setCompanyInfo(prev => ({ ...prev, displayName: prev.legalName }));
    }
  };

  const handleCompanySizeChange = (field: keyof CompanySize, value: string | number) => {
    setCompanySize(prev => ({ ...prev, [field]: value }));
  };

  const handlePriorityToggle = (priority: string) => {
    setUseCases(prev => {
      const newPriorities = prev.priorities.includes(priority)
        ? prev.priorities.filter(p => p !== priority)
        : [...prev.priorities, priority];
      
      // Limit to 3 selections
      if (newPriorities.length > 3) {
        return prev;
      }
      
      return { ...prev, priorities: newPriorities };
    });
  };

  const handleAdminContactChange = (field: keyof AdminContact, value: string) => {
    setAdminContact(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!companyInfo.legalName.trim()) {
      setError("Legal company name is required");
      return false;
    }
    if (!companyInfo.industry) {
      setError("Industry is required");
      return false;
    }
    if (!companyInfo.country) {
      setError("Country is required");
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!adminContact.firstName.trim()) {
      setError("First name is required");
      return false;
    }
    if (!adminContact.lastName.trim()) {
      setError("Last name is required");
      return false;
    }
    if (!adminContact.jobTitle) {
      setError("Job title is required");
      return false;
    }
    if (!adminContact.phone.trim()) {
      setError("Phone number is required");
      return false;
    }
    if (!adminContact.streetAddress.trim()) {
      setError("Street address is required");
      return false;
    }
    if (!adminContact.city.trim()) {
      setError("City is required");
      return false;
    }
    if (!adminContact.state.trim()) {
      setError("State is required");
      return false;
    }
    if (!adminContact.zip.trim()) {
      setError("ZIP code is required");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError("");
    
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!validateStep4()) {
      return;
    }

    if (!user) {
      setError("You must be logged in to complete setup");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Find the organization document for this user
      const orgId = user.uid; // Assuming orgId is same as admin user ID for now
      
      // Check if organization document exists, create if it doesn't
      const orgRef = doc(db, "organizations", orgId);
      const orgDoc = await getDoc(orgRef);
      
      if (!orgDoc.exists()) {
        // Create the organization document first
        await setDoc(orgRef, {
          name: companyInfo.displayName || companyInfo.legalName,
          createdBy: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        
        // Create admin user membership
        await setDoc(doc(db, "organizations", orgId, "users", user.uid), {
          uid: user.uid,
          email: user.email || "",
          role: "admin",
          createdAt: serverTimestamp(),
        });
      }
      
      // Update organization document with all collected data
      await updateDoc(orgRef, {
        // Company info
        legalName: companyInfo.legalName,
        displayName: companyInfo.displayName || companyInfo.legalName,
        industry: companyInfo.industry,
        website: companyInfo.website,
        country: companyInfo.country,
        
        // Company size & structure
        employeeCount: companySize.employeeCount,
        growthExpectation: companySize.growthExpectation,
        remoteWork: companySize.remoteWork,
        currentHrMethod: companySize.currentHrMethod,
        
        // Use cases
        priorities: useCases.priorities,
        
        // Admin contact
        adminFirstName: adminContact.firstName,
        adminLastName: adminContact.lastName,
        adminJobTitle: adminContact.jobTitle,
        adminPhone: adminContact.phone,
        adminAddress: {
          street: adminContact.streetAddress,
          city: adminContact.city,
          state: adminContact.state,
          zip: adminContact.zip
        },
        timezone: adminContact.timezone,
        
        // Mark setup as completed
        setupCompleted: true,
        setupCompletedAt: new Date()
      });

      // Redirect to admin dashboard
      router.push("/admin");
    } catch (err) {
      console.error("Error completing company setup:", err);
      setError("Failed to save company information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">Tell us about your company</h2>
        <p className="text-sm text-[#6b7280]">Step 1 of 4 • Company Information</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Legal Company Name *
          </label>
          <input
            type="text"
            value={companyInfo.legalName}
            onChange={(e) => handleCompanyInfoChange("legalName", e.target.value)}
            placeholder="Acme Corporation Inc."
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
          />
          <p className="text-xs text-[#6b7280] mt-1">This appears on official documents</p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="sameAsLegalName"
            checked={sameAsLegalName}
            onChange={(e) => handleSameAsLegalNameChange(e.target.checked)}
            className="h-4 w-4 text-[#f97316] focus:ring-[#f97316] border-[#d1d5db] rounded"
          />
          <label htmlFor="sameAsLegalName" className="ml-2 text-sm text-[#374151]">
            Same as Legal Company Name
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={companyInfo.displayName}
            onChange={(e) => handleCompanyInfoChange("displayName", e.target.value)}
            placeholder="Acme Corp"
            disabled={sameAsLegalName}
            className={`w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151] ${sameAsLegalName ? 'bg-[#f9fafb] text-[#6b7280]' : ''}`}
          />
          <p className="text-xs text-[#6b7280] mt-1">How employees see your company - defaults to legal</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Industry *
          </label>
          <select
            value={companyInfo.industry}
            onChange={(e) => handleCompanyInfoChange("industry", e.target.value)}
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 appearance-none bg-white text-[#374151]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              paddingRight: '40px',
              backgroundSize: '26px 26px' 
            }}
          >
            <option value="" className="text-[#6b7280]">Select Industry</option>
            {INDUSTRIES.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Company Website
          </label>
          <input
            type="url"
            value={companyInfo.website}
            onChange={(e) => handleCompanyInfoChange("website", e.target.value)}
            placeholder="https://www.acmecorp.com"
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
          />
          <p className="text-xs text-[#6b7280] mt-1">Optional</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Primary Location (Country) *
          </label>
          <select
            value={companyInfo.country}
            onChange={(e) => handleCompanyInfoChange("country", e.target.value)}
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 appearance-none bg-white text-[#374151]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              paddingRight: '40px',
              backgroundSize: '26px 26px' 
            }}
          >
            <option value="" className="text-[#6b7280]">Select Country</option>
            {COUNTRIES.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-[#fef7ed] border border-[#f97316] p-4 rounded-lg">
        <p className="text-sm text-[#c2410c]">
          <strong>Why we need this:</strong> Helps us configure compliance settings and suggest relevant features
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-[#1f2937] text-white rounded-md hover:bg-[#111827] focus:outline-none focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">Company size and structure</h2>
        <p className="text-sm text-[#6b7280]">Step 2 of 4 • Company Size</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Current number of employees *
          </label>
          <input
            type="number"
            min="1"
            value={companySize.employeeCount}
            onChange={(e) => handleCompanySizeChange("employeeCount", parseInt(e.target.value) || 1)}
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
          />
          <p className="text-xs text-[#6b7280] mt-1">Include full-time, part-time, contractors</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-3">
            Expected growth in next 12 months
          </label>
          <div className="space-y-3">
            {GROWTH_OPTIONS.map(option => (
              <label key={option} className="flex items-start cursor-pointer group">
                <input
                  type="radio"
                  name="growth"
                  value={option}
                  checked={companySize.growthExpectation === option}
                  onChange={(e) => handleCompanySizeChange("growthExpectation", e.target.value)}
                  className="mt-1 mr-3 text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-sm text-[#374151] group-hover:text-[#1a1a1a]">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-3">
            Do you have remote employees?
          </label>
          <div className="space-y-3">
            {REMOTE_OPTIONS.map(option => (
              <label key={option} className="flex items-start cursor-pointer group">
                <input
                  type="radio"
                  name="remote"
                  value={option}
                  checked={companySize.remoteWork === option}
                  onChange={(e) => handleCompanySizeChange("remoteWork", e.target.value)}
                  className="mt-1 mr-3 text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-sm text-[#374151] group-hover:text-[#1a1a1a]">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-3">
            Current HR management method
          </label>
          <div className="space-y-3">
            {HR_METHOD_OPTIONS.map(option => (
              <label key={option} className="flex items-start cursor-pointer group">
                <input
                  type="radio"
                  name="hrMethod"
                  value={option}
                  checked={companySize.currentHrMethod === option}
                  onChange={(e) => handleCompanySizeChange("currentHrMethod", e.target.value)}
                  className="mt-1 mr-3 text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-sm text-[#374151] group-hover:text-[#1a1a1a]">{option}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleBack}
          className="px-6 py-3 border border-[#d1d5db] text-[#374151] rounded-md hover:bg-[#f9fafb] focus:outline-none focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 font-medium"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-[#1f2937] text-white rounded-md hover:bg-[#111827] focus:outline-none focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">What&apos;s most important for your company?</h2>
        <p className="text-sm text-[#6b7280]">Step 3 of 4 • Company Priorities</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-3">
            Select your top 3 priorities: (Check up to 3)
          </label>
          <div className="space-y-3">
            {PRIORITY_OPTIONS.map(option => (
              <label key={option} className="flex items-start cursor-pointer group">
                <input
                  type="checkbox"
                  checked={useCases.priorities.includes(option)}
                  onChange={() => handlePriorityToggle(option)}
                  disabled={!useCases.priorities.includes(option) && useCases.priorities.length >= 3}
                  className="mt-1 mr-3 text-[#f97316] focus:ring-[#f97316] disabled:opacity-50"
                />
                <span className={`text-sm ${useCases.priorities.includes(option) ? 'text-[#1a1a1a]' : 'text-[#374151]'} group-hover:text-[#1a1a1a] ${!useCases.priorities.includes(option) && useCases.priorities.length >= 3 ? 'opacity-50' : ''}`}>
                  {option}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-[#6b7280] mt-2">
            Selected: {useCases.priorities.length}/3
          </p>
        </div>

      </div>

      <div className="flex justify-between">
        <button
          onClick={handleBack}
          className="px-6 py-3 border border-[#d1d5db] text-[#374151] rounded-md hover:bg-[#f9fafb] focus:outline-none focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 font-medium"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-[#1f2937] text-white rounded-md hover:bg-[#111827] focus:outline-none focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">Your contact information</h2>
        <p className="text-sm text-[#6b7280]">Step 4 of 4 • Contact Details</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              First Name *
            </label>
            <input
              type="text"
              value={adminContact.firstName}
              onChange={(e) => handleAdminContactChange("firstName", e.target.value)}
              className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Last Name *
            </label>
            <input
              type="text"
              value={adminContact.lastName}
              onChange={(e) => handleAdminContactChange("lastName", e.target.value)}
              className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Job Title *
          </label>
          <select
            value={adminContact.jobTitle}
            onChange={(e) => handleAdminContactChange("jobTitle", e.target.value)}
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 appearance-none bg-white text-[#374151]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              paddingRight: '40px',
              backgroundSize: '26px 26px' 
            }}
          >
            {JOB_TITLES.map(title => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={adminContact.phone}
            onChange={(e) => handleAdminContactChange("phone", e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
          />
          <p className="text-xs text-[#6b7280] mt-1">For account security and support</p>
        </div>

        <div className="border-t border-[#e5e7eb] pt-6">
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">Company Address</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">
                Street Address *
              </label>
              <input
                type="text"
                value={adminContact.streetAddress}
                onChange={(e) => handleAdminContactChange("streetAddress", e.target.value)}
                className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={adminContact.city}
                  onChange={(e) => handleAdminContactChange("city", e.target.value)}
                  className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={adminContact.state}
                  onChange={(e) => handleAdminContactChange("state", e.target.value)}
                  className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  ZIP *
                </label>
                <input
                  type="text"
                  value={adminContact.zip}
                  onChange={(e) => handleAdminContactChange("zip", e.target.value)}
                  className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Time Zone *
          </label>
          <select
            value={adminContact.timezone}
            onChange={(e) => handleAdminContactChange("timezone", e.target.value)}
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 appearance-none bg-white text-[#374151]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              paddingRight: '40px',
              backgroundSize: '26px 26px' 
            }}
          >
            {TIMEZONES.map(timezone => (
              <option key={timezone} value={timezone}>{timezone}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleBack}
          className="px-6 py-3 border border-[#d1d5db] text-[#374151] rounded-md hover:bg-[#f9fafb] focus:outline-none focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 font-medium"
        >
          Back
        </button>
        <button
          onClick={handleComplete}
          disabled={loading}
          className="px-6 py-3 bg-[#1f2937] text-white rounded-md hover:bg-[#111827] focus:outline-none focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Completing..." : "Complete Setup"}
        </button>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">Access Denied</h1>
          <p className="text-[#6b7280] mt-2">You must be logged in to access this page.</p>
          <Link href="/login" className="inline-block mt-4 text-[#f97316] hover:text-[#ea580c]">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#e5e7eb] px-6 flex items-center h-15">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#f97316] rounded"></div>
          <span className="text-lg font-semibold text-[#1a1a1a]">HRMS Tech</span>
        </div>
      </div>

      {/* Fixed Progress Indicator */}
      <div className="fixed top-15 left-0 right-0 z-40 bg-white border-b border-[#e5e7eb] px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#6b7280]">
            Section {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-medium text-[#6b7280]">
            {progressPercentage}% Complete
          </span>
        </div>
        <div className="w-full bg-[#e5e7eb] rounded-full h-1">
          <div 
            className="bg-[#f97316] h-1 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Split Panel Layout */}
      <div className="flex pt-32 h-screen">
        {/* Left Panel - Form */}
        <div className="w-2/5 bg-white p-6 pl-12 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-[#fef2f2] border border-[#ef4444] rounded-md">
              <p className="text-sm text-[#ef4444]">{error}</p>
            </div>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Right Panel - Live Preview */}
        <div className="w-3/5 overflow-y-auto">
          {renderLivePreview()}
        </div>
      </div>
    </div>
  );
}
