"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collectionGroup, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { formatFileSize, getFileTypeIcon, FileMetadata } from "@/lib/file-upload";

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

export default function OnboardingReviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [formData, setFormData] = useState<OnboardingData | null>(null);
  const [confirmations, setConfirmations] = useState({
    dataAccuracy: false,
    documentAuthenticity: false,
    legalCompliance: false,
    electronicSignature: false
  });
  const [electronicSignature, setElectronicSignature] = useState("");

  const [orgId, setOrgId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

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
            // Load form data from the employee document
            setFormData(data as unknown as OnboardingData);
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

  const handleConfirmationChange = (field: keyof typeof confirmations, value: boolean) => {
    setConfirmations(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async () => {
    if (!Object.values(confirmations).every(Boolean) || !electronicSignature.trim()) {
      setError("Please complete all confirmations and provide your electronic signature.");
      return;
    }
    
    if (!orgId || !employeeId || !formData) {
      setError("Missing required data. Please try again.");
      return;
    }
    
    setSaving(true);
    setError("");
    
    try {
      const empRef = doc(db, "organizations", orgId, "employees", employeeId);
      await updateDoc(empRef, {
        ...formData,
        confirmations,
        electronicSignature,
        onboardingCompleted: true,
        onboardingCompletedAt: new Date().toISOString()
      });
      router.replace("/onboarding/complete");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete onboarding");
    } finally {
      setSaving(false);
    }
  };

  const formatSSN = (ssn: string) => {
    if (!ssn) return "";
    return ssn.replace(/(\d{3})(\d{2})(\d{4})/, "XXX-XX-$3");
  };

  const formatAccountNumber = (accountNumber: string) => {
    if (!accountNumber) return "";
    return "*".repeat(accountNumber.length - 4) + accountNumber.slice(-4);
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

  if (!formData) {
    return (
      <div className="min-h-screen px-6 py-16 bg-[#ffffff] text-[#1a1a1a]">
        <div className="max-w-[720px] mx-auto">
          <p className="text-[14px] text-[#6b7280]">No onboarding data found. Please complete the onboarding process first.</p>
          <button
            onClick={() => router.push("/employee/onboarding")}
            className="mt-4 px-6 py-3 bg-[#f97316] text-white rounded-md text-[16px] font-medium hover:bg-[#ea580c]"
          >
            Start Onboarding
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-16 bg-[#ffffff] text-[#1a1a1a]">
      <div className="max-w-[720px] mx-auto">
        <h1 className="text-[24px] font-semibold">Review & Confirmation</h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">Please review all your information before submitting.</p>

        {/* Personal Information */}
        <div className="mt-8 bg-white border border-[#e5e7eb] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-medium">Personal Information</h2>
            <button
              onClick={() => router.push("/employee/onboarding?step=1")}
              className="text-[#f97316] text-[14px] hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">Personal Email</label>
              <p className="text-[14px]">{formData.personalEmail}</p>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">Personal Phone</label>
              <p className="text-[14px]">{formData.personalPhone}</p>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">Date of Birth</label>
              <p className="text-[14px]">{formData.dateOfBirth}</p>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">Nationality</label>
              <p className="text-[14px]">{formData.nationality}</p>
            </div>
            {formData.gender && (
              <div>
                <label className="text-[12px] font-medium text-[#6b7280]">Gender</label>
                <p className="text-[14px]">{formData.gender}</p>
              </div>
            )}
            {formData.maritalStatus && (
              <div>
                <label className="text-[12px] font-medium text-[#6b7280]">Marital Status</label>
                <p className="text-[14px]">{formData.maritalStatus}</p>
              </div>
            )}
          </div>
        </div>

        {/* Address Information */}
        <div className="mt-6 bg-white border border-[#e5e7eb] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-medium">Address Information</h2>
            <button
              onClick={() => router.push("/employee/onboarding?step=2")}
              className="text-[#f97316] text-[14px] hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-medium mb-2">Current Address</h3>
              <p className="text-[14px]">
                {formData.currentAddress.street}<br />
                {formData.currentAddress.city}, {formData.currentAddress.state} {formData.currentAddress.zipCode}<br />
                {formData.currentAddress.country}
              </p>
            </div>
            {!formData.sameAsCurrent && (
              <div>
                <h3 className="text-[14px] font-medium mb-2">Permanent Address</h3>
                <p className="text-[14px]">
                  {formData.permanentAddress.street}<br />
                  {formData.permanentAddress.city}, {formData.permanentAddress.state} {formData.permanentAddress.zipCode}<br />
                  {formData.permanentAddress.country}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="mt-6 bg-white border border-[#e5e7eb] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-medium">Emergency Contacts</h2>
            <button
              onClick={() => router.push("/employee/onboarding?step=3")}
              className="text-[#f97316] text-[14px] hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-medium mb-2">Primary Emergency Contact</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-medium text-[#6b7280]">Name</label>
                  <p className="text-[14px]">{formData.primaryEmergencyContact.name}</p>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#6b7280]">Relationship</label>
                  <p className="text-[14px]">{formData.primaryEmergencyContact.relationship}</p>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#6b7280]">Phone</label>
                  <p className="text-[14px]">{formData.primaryEmergencyContact.phone}</p>
                </div>
                {formData.primaryEmergencyContact.email && (
                  <div>
                    <label className="text-[12px] font-medium text-[#6b7280]">Email</label>
                    <p className="text-[14px]">{formData.primaryEmergencyContact.email}</p>
                  </div>
                )}
              </div>
            </div>
            {formData.secondaryEmergencyContact.name && (
              <div>
                <h3 className="text-[14px] font-medium mb-2">Secondary Emergency Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[12px] font-medium text-[#6b7280]">Name</label>
                    <p className="text-[14px]">{formData.secondaryEmergencyContact.name}</p>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-[#6b7280]">Relationship</label>
                    <p className="text-[14px]">{formData.secondaryEmergencyContact.relationship}</p>
                  </div>
                  <div>
                    <label className="text-[12px] font-medium text-[#6b7280]">Phone</label>
                    <p className="text-[14px]">{formData.secondaryEmergencyContact.phone}</p>
                  </div>
                  {formData.secondaryEmergencyContact.email && (
                    <div>
                      <label className="text-[12px] font-medium text-[#6b7280]">Email</label>
                      <p className="text-[14px]">{formData.secondaryEmergencyContact.email}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Banking & Tax Information */}
        <div className="mt-6 bg-white border border-[#e5e7eb] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-medium">Banking & Tax Information</h2>
            <button
              onClick={() => router.push("/employee/onboarding?step=4")}
              className="text-[#f97316] text-[14px] hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-medium mb-2">Bank Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-medium text-[#6b7280]">Bank Name</label>
                  <p className="text-[14px]">{formData.bankDetails.bankName}</p>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#6b7280]">Account Type</label>
                  <p className="text-[14px]">{formData.bankDetails.accountType}</p>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#6b7280]">Account Number</label>
                  <p className="text-[14px]">{formatAccountNumber(formData.bankDetails.accountNumber)}</p>
                </div>
                <div>
                  <label className="text-[12px] font-medium text-[#6b7280]">Routing Number</label>
                  <p className="text-[14px]">{formData.bankDetails.routingNumber}</p>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-[14px] font-medium mb-2">Tax Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[12px] font-medium text-[#6b7280]">SSN/Tax ID</label>
                  <p className="text-[14px]">{formatSSN(formData.taxInformation.ssn)}</p>
                </div>
                {formData.taxInformation.taxFilingStatus && (
                  <div>
                    <label className="text-[12px] font-medium text-[#6b7280]">Tax Filing Status</label>
                    <p className="text-[14px]">{formData.taxInformation.taxFilingStatus}</p>
                  </div>
                )}
                <div>
                  <label className="text-[12px] font-medium text-[#6b7280]">Allowances</label>
                  <p className="text-[14px]">{formData.taxInformation.allowances}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents */}
        <div className="mt-6 bg-white border border-[#e5e7eb] rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[18px] font-medium">Documents</h2>
            <button
              onClick={() => router.push("/employee/onboarding?step=5")}
              className="text-[#f97316] text-[14px] hover:underline"
            >
              Edit
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <h3 className="text-[14px] font-medium mb-2">Required Documents</h3>
              <div className="space-y-3">
                {[
                  { key: 'governmentId', label: 'Government ID' },
                  { key: 'socialSecurityCard', label: 'Social Security Card' },
                  { key: 'i9Documents', label: 'I-9 Documents' },
                  { key: 'directDepositForm', label: 'Direct Deposit Form' }
                ].map(({ key, label }) => {
                  const fileMetadata = formData.documents[key as keyof OnboardingData['documents']];
                  return (
                    <div key={key} className="flex items-center justify-between p-3 bg-[#f9fafb] rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          fileMetadata ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {fileMetadata ? (
                            <span className="text-[14px]">{getFileTypeIcon(fileMetadata.type)}</span>
                          ) : (
                            <span className="text-[14px]">✗</span>
                          )}
                        </div>
                        <div>
                          <p className="text-[14px] font-medium">{label}</p>
                          {fileMetadata && (
                            <>
                              <p className="text-[12px] text-[#6b7280]">{fileMetadata.name}</p>
                              <p className="text-[11px] text-[#9ca3af]">{formatFileSize(fileMetadata.size)} • Uploaded {new Date(fileMetadata.uploadedAt).toLocaleDateString()}</p>
                            </>
                          )}
                        </div>
                      </div>
                      {fileMetadata && (
                        <a
                          href={fileMetadata.downloadURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] text-[#3b82f6] px-3 py-1 border border-[#3b82f6] rounded hover:bg-[#3b82f6] hover:text-white transition-colors"
                        >
                          View
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div>
              <h3 className="text-[14px] font-medium mb-2">Optional Documents</h3>
              <div className="space-y-3">
                {[
                  { key: 'resume', label: 'Resume/CV' },
                  { key: 'certifications', label: 'Certifications' },
                  { key: 'transcripts', label: 'Transcripts' }
                ].map(({ key, label }) => {
                  const fileMetadata = formData.documents[key as keyof OnboardingData['documents']];
                  return (
                    <div key={key} className="flex items-center justify-between p-3 bg-[#f9fafb] rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          fileMetadata ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
                        }`}>
                          {fileMetadata ? (
                            <span className="text-[14px]">{getFileTypeIcon(fileMetadata.type)}</span>
                          ) : (
                            <span className="text-[14px]">○</span>
                          )}
                        </div>
                        <div>
                          <p className="text-[14px] font-medium">{label}</p>
                          {fileMetadata && (
                            <>
                              <p className="text-[12px] text-[#6b7280]">{fileMetadata.name}</p>
                              <p className="text-[11px] text-[#9ca3af]">{formatFileSize(fileMetadata.size)} • Uploaded {new Date(fileMetadata.uploadedAt).toLocaleDateString()}</p>
                            </>
                          )}
                        </div>
                      </div>
                      {fileMetadata && (
                        <a
                          href={fileMetadata.downloadURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[12px] text-[#3b82f6] px-3 py-1 border border-[#3b82f6] rounded hover:bg-[#3b82f6] hover:text-white transition-colors"
                        >
                          View
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Legal Acknowledgments */}
        <div className="mt-6 bg-white border border-[#e5e7eb] rounded-lg p-6">
          <h2 className="text-[18px] font-medium mb-4">Legal Acknowledgments</h2>
          <div className="space-y-4">
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={confirmations.dataAccuracy}
                onChange={(e) => handleConfirmationChange("dataAccuracy", e.target.checked)}
                className="mt-1 rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">
                I confirm that all information provided is accurate and complete to the best of my knowledge.
              </span>
            </label>
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={confirmations.documentAuthenticity}
                onChange={(e) => handleConfirmationChange("documentAuthenticity", e.target.checked)}
                className="mt-1 rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">
                I certify that all uploaded documents are authentic and unaltered.
              </span>
            </label>
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={confirmations.legalCompliance}
                onChange={(e) => handleConfirmationChange("legalCompliance", e.target.checked)}
                className="mt-1 rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">
                I acknowledge that I have read and agree to comply with all company policies and legal requirements.
              </span>
            </label>
            <label className="flex items-start space-x-3">
              <input
                type="checkbox"
                checked={confirmations.electronicSignature}
                onChange={(e) => handleConfirmationChange("electronicSignature", e.target.checked)}
                className="mt-1 rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">
                I consent to the use of electronic signatures and understand they have the same legal effect as handwritten signatures.
              </span>
            </label>
          </div>
        </div>

        {/* Electronic Signature */}
        <div className="mt-6 bg-white border border-[#e5e7eb] rounded-lg p-6">
          <h2 className="text-[18px] font-medium mb-4">Electronic Signature</h2>
          <div>
            <label className="block mb-2 text-[14px] font-medium text-[#374151]">
              Please type your full name to sign electronically<span className="text-[#ef4444]"> *</span>
            </label>
            <input
              type="text"
              value={electronicSignature}
              onChange={(e) => setElectronicSignature(e.target.value)}
              className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              placeholder="Your full name"
            />
            <p className="mt-2 text-[12px] text-[#6b7280]">
              By typing your name above, you are providing your electronic signature and agreeing to all terms and conditions.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-[14px] text-red-600">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="mt-8 flex justify-between">
          <button
            onClick={() => router.push("/employee/onboarding")}
            className="px-6 py-3 border border-[#d1d5db] rounded-md text-[16px] font-medium hover:bg-[#f9fafb]"
          >
            Back to Edit
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !Object.values(confirmations).every(Boolean) || !electronicSignature.trim()}
            className="px-6 py-3 bg-[#1f2937] text-white rounded-md text-[16px] font-medium hover:bg-[#111827] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Submitting..." : "Complete Onboarding"}
          </button>
        </div>
      </div>
    </div>
  );
}
