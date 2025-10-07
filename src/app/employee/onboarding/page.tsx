"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collectionGroup, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { uploadEmployeeDocument, createFileMetadata, formatFileSize, getFileTypeIcon, FileMetadata } from "@/lib/file-upload";

interface OnboardingFieldConfig {
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
}

interface OnboardingData {
  // Step 1: Personal Information
  personalEmail: string;
  personalPhone: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  nationality: string;
  profilePhoto: FileMetadata | null;
  
  // Step 2: Address Information
  currentAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  permanentAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  sameAsCurrent: boolean;
  
  // Step 3: Emergency Contacts
  primaryEmergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  secondaryEmergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  
  // Step 4: Banking & Tax Information
  bankDetails: {
    bankName: string;
    accountNumber: string;
    routingNumber: string;
    accountType: string;
  };
  taxInformation: {
    ssn: string;
    taxFilingStatus: string;
    allowances: number;
  };
  
  // Step 5: Documents
  documents: {
    governmentId: FileMetadata | null;
    socialSecurityCard: FileMetadata | null;
    i9Documents: FileMetadata | null;
    directDepositForm: FileMetadata | null;
    resume: FileMetadata | null;
    certifications: FileMetadata | null;
    transcripts: FileMetadata | null;
  };
}

export default function EmployeeOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [currentStep, setCurrentStep] = useState(1);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const [orgId, setOrgId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [fieldConfig, setFieldConfig] = useState<OnboardingFieldConfig | null>(null);

  // Helper function to set default field configuration
  const setDefaultFieldConfig = () => {
    setFieldConfig({
      personalInformation: {
        personalEmail: { enabled: true, required: true, label: "Personal Email" },
        personalPhone: { enabled: true, required: true, label: "Personal Phone Number" },
        dateOfBirth: { enabled: true, required: true, label: "Date of Birth" },
        gender: { enabled: true, required: false, label: "Gender" },
        maritalStatus: { enabled: true, required: false, label: "Marital Status" },
        nationality: { enabled: true, required: true, label: "Nationality" },
        profilePhoto: { enabled: true, required: false, label: "Profile Photo" }
      },
      addressInformation: {
        currentAddress: { enabled: true, required: true, label: "Current Address" },
        permanentAddress: { enabled: true, required: true, label: "Permanent Address" },
        sameAsCurrent: { enabled: true, required: false, label: "Same as Current Address" }
      },
      emergencyContacts: {
        primaryEmergencyContact: { enabled: true, required: true, label: "Primary Emergency Contact" },
        secondaryEmergencyContact: { enabled: true, required: false, label: "Secondary Emergency Contact" }
      },
      bankingTaxInfo: {
        bankDetails: { enabled: true, required: true, label: "Banking Information" },
        taxInformation: { enabled: true, required: true, label: "Tax Information" }
      },
      documents: {
        governmentId: { enabled: true, required: true, label: "Government ID" },
        socialSecurityCard: { enabled: true, required: true, label: "Social Security Card" },
        i9Documents: { enabled: true, required: true, label: "I-9 Verification Documents" },
        directDepositForm: { enabled: true, required: true, label: "Direct Deposit Form" },
        resume: { enabled: true, required: false, label: "Resume/CV" },
        certifications: { enabled: true, required: false, label: "Certifications" },
        transcripts: { enabled: true, required: false, label: "Education Transcripts" }
      }
    });
  };

  const [formData, setFormData] = useState<OnboardingData>({
    personalEmail: "",
    personalPhone: "",
    dateOfBirth: "",
    gender: "",
    maritalStatus: "",
    nationality: "",
    profilePhoto: null,
    currentAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    },
    permanentAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    },
    sameAsCurrent: false,
    primaryEmergencyContact: {
      name: "",
      relationship: "",
      phone: "",
      email: ""
    },
    secondaryEmergencyContact: {
      name: "",
      relationship: "",
      phone: "",
      email: ""
    },
    bankDetails: {
      bankName: "",
      accountNumber: "",
      routingNumber: "",
      accountType: ""
    },
    taxInformation: {
      ssn: "",
      taxFilingStatus: "",
      allowances: 0
    },
    documents: {
      governmentId: null,
      socialSecurityCard: null,
      i9Documents: null,
      directDepositForm: null,
      resume: null,
      certifications: null,
      transcripts: null
    }
  });

  // Helper function to check if a step has any enabled fields
  const isStepEnabled = (stepNumber: number): boolean => {
    if (!fieldConfig) return false;
    
    switch (stepNumber) {
      case 1:
        return Object.values(fieldConfig.personalInformation).some(field => field.enabled);
      case 2:
        return Object.values(fieldConfig.addressInformation).some(field => field.enabled);
      case 3:
        return Object.values(fieldConfig.emergencyContacts).some(field => field.enabled);
      case 4:
        return Object.values(fieldConfig.bankingTaxInfo).some(field => field.enabled);
      case 5:
        return Object.values(fieldConfig.documents).some(field => field.enabled);
      default:
        return false;
    }
  };

  // Get only enabled steps
  const enabledSteps = [
    { id: 1, title: "Personal Information", description: "Complete your personal details" },
    { id: 2, title: "Address Information", description: "Provide your address details" },
    { id: 3, title: "Emergency Contacts", description: "Add emergency contact information" },
    { id: 4, title: "Banking & Tax", description: "Set up payroll information" },
    { id: 5, title: "Document Upload", description: "Upload required documents" }
  ].filter(step => isStepEnabled(step.id));

  const steps = enabledSteps;

  const handleFileUpload = async (field: keyof OnboardingData['documents'] | 'profilePhoto', file: File) => {
    if (!orgId || !employeeId) {
      setError("Missing organization or employee ID");
      return;
    }

    setUploadProgress(prev => ({
      ...prev,
      [field]: 0
    }));

    try {
      const result = await uploadEmployeeDocument(
        file,
        orgId,
        employeeId,
        field,
        (progress) => {
          setUploadProgress(prev => ({
            ...prev,
            [field]: progress
          }));
        }
      );

      if (result.success && result.downloadURL) {
        const fileMetadata = createFileMetadata(file, result.downloadURL);
        
        if (field === 'profilePhoto') {
          setFormData(prev => ({
            ...prev,
            profilePhoto: fileMetadata
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            documents: {
              ...prev.documents,
              [field]: fileMetadata
            }
          }));
        }
      } else {
        setError(result.error || "Upload failed");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploadProgress(prev => ({
        ...prev,
        [field]: 0
      }));
    }
  };

  const handleInputChange = (field: string, value: unknown) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof OnboardingData] as Record<string, unknown>),
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const validateStep = (stepIndex: number): boolean => {
    if (!fieldConfig || !steps[stepIndex]) return false;
    
    const stepNumber = steps[stepIndex].id;
    
    switch (stepNumber) {
      case 1:
        const personalRequired = fieldConfig.personalInformation;
        return !!(personalRequired.personalEmail.enabled && personalRequired.personalEmail.required ? formData.personalEmail : true) &&
               !!(personalRequired.personalPhone.enabled && personalRequired.personalPhone.required ? formData.personalPhone : true) &&
               !!(personalRequired.dateOfBirth.enabled && personalRequired.dateOfBirth.required ? formData.dateOfBirth : true) &&
               !!(personalRequired.nationality.enabled && personalRequired.nationality.required ? formData.nationality : true);
      case 2:
        const addressRequired = fieldConfig.addressInformation;
        return !!(addressRequired.currentAddress.enabled && addressRequired.currentAddress.required ? 
          (formData.currentAddress.street && formData.currentAddress.city && formData.currentAddress.state && formData.currentAddress.zipCode && formData.currentAddress.country) : true) &&
               !!(addressRequired.permanentAddress.enabled && addressRequired.permanentAddress.required ? 
          (formData.permanentAddress.street && formData.permanentAddress.city && formData.permanentAddress.state && formData.permanentAddress.zipCode && formData.permanentAddress.country) : true);
      case 3:
        const emergencyRequired = fieldConfig.emergencyContacts;
        return !!(emergencyRequired.primaryEmergencyContact.enabled && emergencyRequired.primaryEmergencyContact.required ? 
          (formData.primaryEmergencyContact.name && formData.primaryEmergencyContact.relationship && formData.primaryEmergencyContact.phone) : true);
      case 4:
        const bankingRequired = fieldConfig.bankingTaxInfo;
        return !!(bankingRequired.bankDetails.enabled && bankingRequired.bankDetails.required ? 
          (formData.bankDetails.bankName && formData.bankDetails.accountNumber && formData.bankDetails.routingNumber) : true) &&
               !!(bankingRequired.taxInformation.enabled && bankingRequired.taxInformation.required ? formData.taxInformation.ssn : true);
      case 5:
        const docsRequired = fieldConfig.documents;
        return !!(docsRequired.governmentId.enabled && docsRequired.governmentId.required ? formData.documents.governmentId : true) &&
               !!(docsRequired.socialSecurityCard.enabled && docsRequired.socialSecurityCard.required ? formData.documents.socialSecurityCard : true) &&
               !!(docsRequired.i9Documents.enabled && docsRequired.i9Documents.required ? formData.documents.i9Documents : true);
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      try {
        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (snap.empty) {
          setError("Organization membership not found.");
          setLoading(false);
          return;
        }
        const membershipRef = snap.docs[0].ref;
        const parentOrg = membershipRef.parent.parent;
        const foundOrgId = parentOrg ? parentOrg.id : null;
        setOrgId(foundOrgId);
        setEmployeeId(user.uid);

        if (foundOrgId) {
          const empRef = doc(db, "organizations", foundOrgId, "employees", user.uid);
          const empSnap = await getDoc(empRef);
          if (empSnap.exists()) {
            const data = empSnap.data() as Record<string, unknown> & { onboardingCompleted?: boolean };
            if (data.onboardingCompleted === true) {
              router.replace("/employee");
              return;
            }
          }

          // Load onboarding field configuration
          try {
            const adminSettingsRef = doc(db, "organizations", foundOrgId, "settings", "administration");
            const adminSettingsSnap = await getDoc(adminSettingsRef);
            if (adminSettingsSnap.exists()) {
              const adminData = adminSettingsSnap.data();
              if (adminData.onboardingFieldConfig) {
                setFieldConfig(adminData.onboardingFieldConfig as OnboardingFieldConfig);
              } else {
                // If document exists but no config, use defaults
                setDefaultFieldConfig();
              }
            } else {
              // If no settings document exists, use defaults
              setDefaultFieldConfig();
            }
          } catch (configError) {
            console.warn("Failed to load field configuration, using defaults:", configError);
            // Use default configuration if loading fails
            setDefaultFieldConfig();
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load onboarding data");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const handleSubmit = async () => {
    if (!validateStep(steps.length - 1) || !orgId || !employeeId) {
      setError("Please complete all required fields and upload required documents.");
      return;
    }
    
    setSaving(true);
    setError("");
    
    try {
      const empRef = doc(db, "organizations", orgId, "employees", employeeId);
      await updateDoc(empRef, {
        ...formData,
        onboardingDataSaved: true,
        onboardingDataSavedAt: new Date().toISOString()
      });
      router.replace("/onboarding/review");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save information");
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    if (!fieldConfig) {
      return <div className="text-center py-8">Loading configuration...</div>;
    }

    const currentStepData = steps[currentStep];
    if (!currentStepData) {
      return <div className="text-center py-8">Step not found...</div>;
    }

    switch (currentStepData.id) {
      case 1:
        return (
          <div className="space-y-6">
            {fieldConfig.personalInformation.personalEmail.enabled && (
              <div>
                <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                  {fieldConfig.personalInformation.personalEmail.label}
                  {fieldConfig.personalInformation.personalEmail.required && <span className="text-[#ef4444]"> *</span>}
                </label>
                <input
                  type="email"
                  value={formData.personalEmail}
                  onChange={(e) => handleInputChange("personalEmail", e.target.value)}
                  className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  placeholder="your.email@example.com"
                />
              </div>
            )}
            {fieldConfig.personalInformation.personalPhone.enabled && (
              <div>
                <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                  {fieldConfig.personalInformation.personalPhone.label}
                  {fieldConfig.personalInformation.personalPhone.required && <span className="text-[#ef4444]"> *</span>}
                </label>
                <input
                  type="tel"
                  value={formData.personalPhone}
                  onChange={(e) => handleInputChange("personalPhone", e.target.value)}
                  className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            )}
            {fieldConfig.personalInformation.dateOfBirth.enabled && (
              <div>
                <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                  {fieldConfig.personalInformation.dateOfBirth.label}
                  {fieldConfig.personalInformation.dateOfBirth.required && <span className="text-[#ef4444]"> *</span>}
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => handleInputChange("dateOfBirth", e.target.value)}
                  className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {fieldConfig.personalInformation.gender.enabled && (
                <div>
                  <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                    {fieldConfig.personalInformation.gender.label}
                    {fieldConfig.personalInformation.gender.required && <span className="text-[#ef4444]"> *</span>}
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
              )}
              {fieldConfig.personalInformation.maritalStatus.enabled && (
                <div>
                  <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                    {fieldConfig.personalInformation.maritalStatus.label}
                    {fieldConfig.personalInformation.maritalStatus.required && <span className="text-[#ef4444]"> *</span>}
                  </label>
                  <select
                    value={formData.maritalStatus}
                    onChange={(e) => handleInputChange("maritalStatus", e.target.value)}
                    className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  >
                    <option value="">Select Status</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                  </select>
                </div>
              )}
            </div>
            {fieldConfig.personalInformation.nationality.enabled && (
              <div>
                <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                  {fieldConfig.personalInformation.nationality.label}
                  {fieldConfig.personalInformation.nationality.required && <span className="text-[#ef4444]"> *</span>}
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange("nationality", e.target.value)}
                  className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  placeholder="e.g., American, Canadian, British"
                />
              </div>
            )}
            {fieldConfig.personalInformation.profilePhoto.enabled && (
              <div>
                <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                  {fieldConfig.personalInformation.profilePhoto.label}
                  {fieldConfig.personalInformation.profilePhoto.required && <span className="text-[#ef4444]"> *</span>}
                </label>
              <div className="border-2 border-dashed border-[#d1d5db] rounded-lg p-6 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload("profilePhoto", file);
                  }}
                  className="hidden"
                  id="profile-photo"
                />
                <label htmlFor="profile-photo" className="cursor-pointer">
                  <div className="text-[14px] text-[#6b7280]">
                    {formData.profilePhoto ? (
                      <div className="flex items-center justify-center space-x-2">
                        <span>{getFileTypeIcon(formData.profilePhoto.type)}</span>
                        <span>✓ {formData.profilePhoto.name}</span>
                      </div>
                    ) : uploadProgress.profilePhoto > 0 ? (
                      <div className="text-[14px] text-[#f97316]">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-4 h-4 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
                          <span>Uploading... {Math.round(uploadProgress.profilePhoto)}%</span>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p>Click to upload profile photo</p>
                        <p className="text-[12px] mt-1">JPG, PNG up to 5MB</p>
                      </div>
                    )}
                  </div>
                </label>
              </div>
              </div>
            )}
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {fieldConfig.addressInformation.currentAddress.enabled && (
              <div>
                <h3 className="text-[16px] font-medium mb-4">
                  {fieldConfig.addressInformation.currentAddress.label}
                  {fieldConfig.addressInformation.currentAddress.required && <span className="text-[#ef4444]"> *</span>}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                      Street Address
                      {fieldConfig.addressInformation.currentAddress.required && <span className="text-[#ef4444]"> *</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.currentAddress.street}
                      onChange={(e) => handleInputChange("currentAddress.street", e.target.value)}
                      className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                      placeholder="123 Main Street"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                        City
                        {fieldConfig.addressInformation.currentAddress.required && <span className="text-[#ef4444]"> *</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.currentAddress.city}
                        onChange={(e) => handleInputChange("currentAddress.city", e.target.value)}
                        className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                        placeholder="New York"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                        State
                        {fieldConfig.addressInformation.currentAddress.required && <span className="text-[#ef4444]"> *</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.currentAddress.state}
                        onChange={(e) => handleInputChange("currentAddress.state", e.target.value)}
                        className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                        placeholder="NY"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                        ZIP/Postal Code
                        {fieldConfig.addressInformation.currentAddress.required && <span className="text-[#ef4444]"> *</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.currentAddress.zipCode}
                        onChange={(e) => handleInputChange("currentAddress.zipCode", e.target.value)}
                        className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                        placeholder="10001"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                        Country
                        {fieldConfig.addressInformation.currentAddress.required && <span className="text-[#ef4444]"> *</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.currentAddress.country}
                        onChange={(e) => handleInputChange("currentAddress.country", e.target.value)}
                        className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                        placeholder="United States"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {fieldConfig.addressInformation.permanentAddress.enabled && (
              <div>
                <h3 className="text-[16px] font-medium mb-4">
                  {fieldConfig.addressInformation.permanentAddress.label}
                  {fieldConfig.addressInformation.permanentAddress.required && <span className="text-[#ef4444]"> *</span>}
                </h3>
                {fieldConfig.addressInformation.sameAsCurrent.enabled && (
                  <div className="mb-4">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.sameAsCurrent}
                        onChange={(e) => {
                          handleInputChange("sameAsCurrent", e.target.checked);
                          if (e.target.checked) {
                            handleInputChange("permanentAddress", formData.currentAddress);
                          }
                        }}
                        className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                      />
                      <span className="text-[14px]">{fieldConfig.addressInformation.sameAsCurrent.label}</span>
                    </label>
                  </div>
                )}
                {!formData.sameAsCurrent && (
                  <div className="space-y-4">
                    <div>
                      <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                        Street Address
                        {fieldConfig.addressInformation.permanentAddress.required && <span className="text-[#ef4444]"> *</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.permanentAddress.street}
                        onChange={(e) => handleInputChange("permanentAddress.street", e.target.value)}
                        className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                        placeholder="123 Main Street"
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                          City
                          {fieldConfig.addressInformation.permanentAddress.required && <span className="text-[#ef4444]"> *</span>}
                        </label>
                        <input
                          type="text"
                          value={formData.permanentAddress.city}
                          onChange={(e) => handleInputChange("permanentAddress.city", e.target.value)}
                          className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                          placeholder="New York"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                          State
                          {fieldConfig.addressInformation.permanentAddress.required && <span className="text-[#ef4444]"> *</span>}
                        </label>
                        <input
                          type="text"
                          value={formData.permanentAddress.state}
                          onChange={(e) => handleInputChange("permanentAddress.state", e.target.value)}
                          className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                          placeholder="NY"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                          ZIP/Postal Code
                          {fieldConfig.addressInformation.permanentAddress.required && <span className="text-[#ef4444]"> *</span>}
                        </label>
                        <input
                          type="text"
                          value={formData.permanentAddress.zipCode}
                          onChange={(e) => handleInputChange("permanentAddress.zipCode", e.target.value)}
                          className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                          placeholder="10001"
                        />
                      </div>
                      <div>
                        <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                          Country
                          {fieldConfig.addressInformation.permanentAddress.required && <span className="text-[#ef4444]"> *</span>}
                        </label>
                        <input
                          type="text"
                          value={formData.permanentAddress.country}
                          onChange={(e) => handleInputChange("permanentAddress.country", e.target.value)}
                          className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                          placeholder="United States"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {fieldConfig.emergencyContacts.primaryEmergencyContact.enabled && (
              <div>
                <h3 className="text-[16px] font-medium mb-4">
                  {fieldConfig.emergencyContacts.primaryEmergencyContact.label}
                  {fieldConfig.emergencyContacts.primaryEmergencyContact.required && <span className="text-[#ef4444]"> *</span>}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                      Full Name
                      {fieldConfig.emergencyContacts.primaryEmergencyContact.required && <span className="text-[#ef4444]"> *</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.primaryEmergencyContact.name}
                      onChange={(e) => handleInputChange("primaryEmergencyContact.name", e.target.value)}
                      className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                        Relationship
                        {fieldConfig.emergencyContacts.primaryEmergencyContact.required && <span className="text-[#ef4444]"> *</span>}
                      </label>
                      <select
                        value={formData.primaryEmergencyContact.relationship}
                        onChange={(e) => handleInputChange("primaryEmergencyContact.relationship", e.target.value)}
                        className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                      >
                        <option value="">Select Relationship</option>
                        <option value="spouse">Spouse</option>
                        <option value="parent">Parent</option>
                        <option value="sibling">Sibling</option>
                        <option value="child">Child</option>
                        <option value="friend">Friend</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                        Phone Number
                        {fieldConfig.emergencyContacts.primaryEmergencyContact.required && <span className="text-[#ef4444]"> *</span>}
                      </label>
                      <input
                        type="tel"
                        value={formData.primaryEmergencyContact.phone}
                        onChange={(e) => handleInputChange("primaryEmergencyContact.phone", e.target.value)}
                        className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-[14px] font-medium text-[#374151]">Email (Optional)</label>
                    <input
                      type="email"
                      value={formData.primaryEmergencyContact.email}
                      onChange={(e) => handleInputChange("primaryEmergencyContact.email", e.target.value)}
                      className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                      placeholder="john.doe@example.com"
                    />
                  </div>
                </div>
              </div>
            )}

            {fieldConfig.emergencyContacts.secondaryEmergencyContact.enabled && (
              <div>
                <h3 className="text-[16px] font-medium mb-4">
                  {fieldConfig.emergencyContacts.secondaryEmergencyContact.label}
                  {fieldConfig.emergencyContacts.secondaryEmergencyContact.required && <span className="text-[#ef4444]"> *</span>}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                      Full Name
                      {fieldConfig.emergencyContacts.secondaryEmergencyContact.required && <span className="text-[#ef4444]"> *</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.secondaryEmergencyContact.name}
                      onChange={(e) => handleInputChange("secondaryEmergencyContact.name", e.target.value)}
                      className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                      placeholder="Jane Doe"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                        Relationship
                        {fieldConfig.emergencyContacts.secondaryEmergencyContact.required && <span className="text-[#ef4444]"> *</span>}
                      </label>
                      <select
                        value={formData.secondaryEmergencyContact.relationship}
                        onChange={(e) => handleInputChange("secondaryEmergencyContact.relationship", e.target.value)}
                        className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                      >
                        <option value="">Select Relationship</option>
                        <option value="spouse">Spouse</option>
                        <option value="parent">Parent</option>
                        <option value="sibling">Sibling</option>
                        <option value="child">Child</option>
                        <option value="friend">Friend</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                        Phone Number
                        {fieldConfig.emergencyContacts.secondaryEmergencyContact.required && <span className="text-[#ef4444]"> *</span>}
                      </label>
                      <input
                        type="tel"
                        value={formData.secondaryEmergencyContact.phone}
                        onChange={(e) => handleInputChange("secondaryEmergencyContact.phone", e.target.value)}
                        className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                        placeholder="+1 (555) 123-4567"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-[14px] font-medium text-[#374151]">Email (Optional)</label>
                    <input
                      type="email"
                      value={formData.secondaryEmergencyContact.email}
                      onChange={(e) => handleInputChange("secondaryEmergencyContact.email", e.target.value)}
                      className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                      placeholder="jane.doe@example.com"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            {fieldConfig.bankingTaxInfo.bankDetails.enabled && (
              <div>
                <h3 className="text-[16px] font-medium mb-4">
                  {fieldConfig.bankingTaxInfo.bankDetails.label}
                  {fieldConfig.bankingTaxInfo.bankDetails.required && <span className="text-[#ef4444]"> *</span>}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                      Bank Name
                      {fieldConfig.bankingTaxInfo.bankDetails.required && <span className="text-[#ef4444]"> *</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.bankDetails.bankName}
                      onChange={(e) => handleInputChange("bankDetails.bankName", e.target.value)}
                      className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                      placeholder="Chase Bank"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                        Account Number
                        {fieldConfig.bankingTaxInfo.bankDetails.required && <span className="text-[#ef4444]"> *</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.accountNumber}
                        onChange={(e) => handleInputChange("bankDetails.accountNumber", e.target.value)}
                        className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                        placeholder="1234567890"
                      />
                    </div>
                    <div>
                      <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                        Routing Number
                        {fieldConfig.bankingTaxInfo.bankDetails.required && <span className="text-[#ef4444]"> *</span>}
                      </label>
                      <input
                        type="text"
                        value={formData.bankDetails.routingNumber}
                        onChange={(e) => handleInputChange("bankDetails.routingNumber", e.target.value)}
                        className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                        placeholder="021000021"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                      Account Type
                      {fieldConfig.bankingTaxInfo.bankDetails.required && <span className="text-[#ef4444]"> *</span>}
                    </label>
                    <select
                      value={formData.bankDetails.accountType}
                      onChange={(e) => handleInputChange("bankDetails.accountType", e.target.value)}
                      className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                    >
                      <option value="">Select Account Type</option>
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {fieldConfig.bankingTaxInfo.taxInformation.enabled && (
              <div>
                <h3 className="text-[16px] font-medium mb-4">
                  {fieldConfig.bankingTaxInfo.taxInformation.label}
                  {fieldConfig.bankingTaxInfo.taxInformation.required && <span className="text-[#ef4444]"> *</span>}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                      Social Security Number / Tax ID
                      {fieldConfig.bankingTaxInfo.taxInformation.required && <span className="text-[#ef4444]"> *</span>}
                    </label>
                    <input
                      type="text"
                      value={formData.taxInformation.ssn}
                      onChange={(e) => handleInputChange("taxInformation.ssn", e.target.value)}
                      className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                      placeholder="XXX-XX-XXXX"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-2 text-[14px] font-medium text-[#374151]">Tax Filing Status</label>
                      <select
                        value={formData.taxInformation.taxFilingStatus}
                        onChange={(e) => handleInputChange("taxInformation.taxFilingStatus", e.target.value)}
                        className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                      >
                        <option value="">Select Status</option>
                        <option value="single">Single</option>
                        <option value="married-filing-jointly">Married Filing Jointly</option>
                        <option value="married-filing-separately">Married Filing Separately</option>
                        <option value="head-of-household">Head of Household</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-2 text-[14px] font-medium text-[#374151]">Number of Allowances</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.taxInformation.allowances}
                        onChange={(e) => handleInputChange("taxInformation.allowances", parseInt(e.target.value))}
                        className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-[16px] font-medium mb-4">Document Uploads</h3>
              <div className="space-y-4">
                {Object.entries(fieldConfig.documents)
                  .filter(([_, config]) => config.enabled && config.required)
                  .map(([key, config]) => (
                  <div key={key}>
                    <label className="block mb-2 text-[14px] font-medium text-[#374151]">
                      {config.label}{config.required && <span className="text-[#ef4444]"> *</span>}
                    </label>
                    <div className="border-2 border-dashed border-[#d1d5db] rounded-lg p-4">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(key as keyof OnboardingData['documents'], file);
                        }}
                        className="hidden"
                        id={`file-${key}`}
                      />
                      <label htmlFor={`file-${key}`} className="cursor-pointer block">
                        {formData.documents[key as keyof OnboardingData['documents']] ? (
                          <div className="text-[14px] text-green-600">
                            <div className="flex items-center space-x-2">
                              <span>{getFileTypeIcon((formData.documents[key as keyof OnboardingData['documents']] as FileMetadata)?.type || '')}</span>
                              <span>✓ {(formData.documents[key as keyof OnboardingData['documents']] as FileMetadata)?.name}</span>
                            </div>
                            <p className="text-[12px] text-[#6b7280] mt-1">
                              {formatFileSize((formData.documents[key as keyof OnboardingData['documents']] as FileMetadata)?.size || 0)}
                            </p>
                          </div>
                        ) : uploadProgress[key as keyof OnboardingData['documents']] > 0 ? (
                          <div className="text-[14px] text-[#f97316]">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
                              <span>Uploading... {Math.round(uploadProgress[key as keyof OnboardingData['documents']])}%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[14px] text-[#6b7280]">
                            <p>Click to upload {label.toLowerCase()}</p>
                            <p className="text-[12px] mt-1">PDF, JPG, PNG up to 10MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {Object.entries(fieldConfig.documents).some(([_, config]) => config.enabled && !config.required) && (
              <div>
                <h3 className="text-[16px] font-medium mb-4">Optional Documents</h3>
                <div className="space-y-4">
                  {Object.entries(fieldConfig.documents)
                    .filter(([_, config]) => config.enabled && !config.required)
                    .map(([key, config]) => (
                  <div key={key}>
                    <label className="block mb-2 text-[14px] font-medium text-[#374151]">{config.label}</label>
                    <div className="border-2 border-dashed border-[#d1d5db] rounded-lg p-4">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(key as keyof OnboardingData['documents'], file);
                        }}
                        className="hidden"
                        id={`file-${key}`}
                      />
                      <label htmlFor={`file-${key}`} className="cursor-pointer block">
                        {formData.documents[key as keyof OnboardingData['documents']] ? (
                          <div className="text-[14px] text-green-600">
                            <div className="flex items-center space-x-2">
                              <span>{getFileTypeIcon((formData.documents[key as keyof OnboardingData['documents']] as FileMetadata)?.type || '')}</span>
                              <span>✓ {(formData.documents[key as keyof OnboardingData['documents']] as FileMetadata)?.name}</span>
                            </div>
                            <p className="text-[12px] text-[#6b7280] mt-1">
                              {formatFileSize((formData.documents[key as keyof OnboardingData['documents']] as FileMetadata)?.size || 0)}
                            </p>
                          </div>
                        ) : uploadProgress[key as keyof OnboardingData['documents']] > 0 ? (
                          <div className="text-[14px] text-[#f97316]">
                            <div className="flex items-center space-x-2">
                              <div className="w-4 h-4 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
                              <span>Uploading... {Math.round(uploadProgress[key as keyof OnboardingData['documents']])}%</span>
                            </div>
                          </div>
                        ) : (
                          <div className="text-[14px] text-[#6b7280]">
                            <p>Click to upload {label.toLowerCase()}</p>
                            <p className="text-[12px] mt-1">PDF, JPG, PNG up to 10MB</p>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-16 bg-[#ffffff] text-[#1a1a1a]">
        <div className="max-w-[720px] mx-auto">
          <p className="text-[14px] text-[#6b7280]">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-lg text-gray-600">Please provide the following information to access your portal</p>
        </div>

        {/* Progress Steps */}
        <div className="mt-8 mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-[14px] font-semibold transition-all duration-200 ${
                    currentStep === index
                      ? 'bg-[#f97316] text-white shadow-lg' 
                      : currentStep > index
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {currentStep > index ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-12 h-1 mx-3 transition-all duration-200 ${
                      currentStep > index ? 'bg-green-500' : currentStep === index ? 'bg-[#f97316]' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 text-center">
            <h2 className="text-[20px] font-semibold text-gray-900">{steps[currentStep]?.title}</h2>
            <p className="text-[15px] text-gray-600 mt-1">{steps[currentStep]?.description}</p>
            <div className="mt-2 text-sm text-gray-500">
              Step {currentStep + 1} of {steps.length}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-8">
          {renderStep()}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between items-center">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="px-8 py-3 border border-gray-300 rounded-lg text-base font-medium text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Previous
          </button>
          
          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!validateStep(currentStep)}
              className="px-8 py-3 bg-[#f97316] text-white rounded-lg text-base font-medium hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Next
              <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving || !validateStep(steps.length - 1)}
              className="px-8 py-3 bg-green-600 text-white rounded-lg text-base font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              {saving ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  Complete Setup
                  <svg className="w-4 h-4 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


