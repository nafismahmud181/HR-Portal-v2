"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collectionGroup, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { FileMetadata } from "@/lib/file-upload";

type EmployeeProfile = {
  employeeId?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  workEmail?: string;
  departmentId?: string;
  department?: string;
  roleId?: string;
  jobTitle?: string;
  employeeType?: string;
  status?: string;
  hireDate?: unknown;
  location?: string;
  phoneNumber?: string;
  dob?: string;
  gender?: string;
  nationality?: string;
  nidNumber?: string;
  passportNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  presentAddress?: string;
  primaryAddress?: string;
  state?: string;
  bankName?: string;
  accountName?: string;
  compensation?: string;
  lineManager?: string;
  workLocation?: string;
  onboardingCompleted?: boolean;
  
  // Onboarding data fields
  personalEmail?: string;
  personalPhone?: string;
  dateOfBirth?: string;
  maritalStatus?: string;
  profilePhoto?: FileMetadata | null;
  currentAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  permanentAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  sameAsCurrent?: boolean;
  primaryEmergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
  };
  secondaryEmergencyContact?: {
    name?: string;
    relationship?: string;
    phone?: string;
    email?: string;
  };
  bankDetails?: {
    bankName?: string;
    accountNumber?: string;
    routingNumber?: string;
    accountType?: string;
  };
  taxInformation?: {
    ssn?: string;
    taxFilingStatus?: string;
    allowances?: number;
  };
  documents?: {
    governmentId?: FileMetadata | null;
    socialSecurityCard?: FileMetadata | null;
    i9Documents?: FileMetadata | null;
    directDepositForm?: FileMetadata | null;
    resume?: FileMetadata | null;
    certifications?: FileMetadata | null;
    transcripts?: FileMetadata | null;
  };
};

export default function EmployeeProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("You must be signed in.");
        setLoading(false);
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
        const parentOrg = membershipRef.parent.parent; // organizations/{orgId}
        const orgId = parentOrg ? parentOrg.id : null;
        if (!orgId) {
          setError("Organization not found.");
          setLoading(false);
          return;
        }
        const empRef = doc(db, "organizations", orgId, "employees", user.uid);
        const empSnap = await getDoc(empRef);
        if (!empSnap.exists()) {
          setError("Employee profile not found.");
          setLoading(false);
          return;
        }
        const data = empSnap.data() as EmployeeProfile;
        setProfile(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#4A90E2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#5F6368]">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-[#FF6B6B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#FF6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-[24px] font-[600] text-[#202124] mb-2">Error</h1>
          <p className="text-[#FF6B6B]">{error}</p>
        </div>
      </div>
    );
  }

  // Helper function to get full name
  const getFullName = () => {
    if (profile?.firstName || profile?.lastName) {
      return `${profile?.firstName || ''} ${profile?.middleName || ''} ${profile?.lastName || ''}`.trim();
    }
    
    // If we have a full name but no split parts, try to split it
    if (profile?.name) {
      const nameParts = profile.name.trim().split(' ');
      if (nameParts.length >= 2) {
        return nameParts.join(' ');
      }
    }
    
    return "Employee";
  };

  // Helper function to split full name into parts
  const splitFullName = (fullName: string) => {
    const parts = fullName.trim().split(' ');
    return {
      firstName: parts[0] || '',
      middleName: parts.length > 2 ? parts.slice(1, -1).join(' ') : '',
      lastName: parts.length > 1 ? parts[parts.length - 1] : ''
    };
  };

  // Helper function to get initials
  const getInitials = () => {
    const name = getFullName();
    return name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  // Helper function to get display value with fallback
  const getDisplayValue = (value: string | undefined | null, fallback: string = "—") => {
    return value && value.trim() !== "" ? value : fallback;
  };

  // Helper function to format address
  const formatAddress = (address: { street?: string; city?: string; state?: string; zipCode?: string; country?: string } | undefined) => {
    if (!address) return "—";
    const parts = [address.street, address.city, address.state, address.zipCode, address.country].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "—";
  };

  // Get name parts - use existing split parts or split from full name
  const getNameParts = () => {
    let firstName: string, middleName: string, lastName: string;
    
    if (profile?.firstName || profile?.lastName) {
      // Use existing split parts
      firstName = profile.firstName || '';
      middleName = profile.middleName || '';
      lastName = profile.lastName || '';
    } else if (profile?.name) {
      // Split from full name
      const splitName = splitFullName(profile.name);
      firstName = splitName.firstName;
      middleName = splitName.middleName;
      lastName = splitName.lastName;
    } else {
      firstName = middleName = lastName = '';
    }
    
    return { firstName, middleName, lastName };
  };

  const { firstName, middleName, lastName } = getNameParts();

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-[1440px] mx-auto px-6 py-6">
        {/* Personal Details Section */}
        <div className="bg-white rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-8">
          <h2 className="text-[20px] font-[600] text-[#202124] mb-6">Personal Details</h2>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left Side - Profile Picture and Name */}
            <div className="flex flex-col items-center md:items-start md:pr-28">
              {/* Profile Picture */}
              <div className="w-20 h-20 bg-gradient-to-r from-[#4A90E2] to-[#00D4AA] rounded-full flex items-center justify-center mb-4">
                <span className="text-white text-[24px] font-[700]">
                  {getInitials()}
                </span>
              </div>
              
              {/* Name and Job Title */}
              <div className="text-center md:text-left">
                <h1 className="text-[20px] font-[600] text-[#202124] mb-1">
                  {getFullName()}
                </h1>
                <p className="text-[16px] text-[#5F6368]">
                  {profile?.jobTitle || "Employee"}
                </p>
              </div>
            </div>
            
            {/* Right Side - Personal Information in 2 Columns */}
            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1 */}
                <div className="space-y-4">
                  <div>
                    <p className="text-[14px] font-[500] text-[#5F6368] mb-1">First Name</p>
                    <p className="text-[16px] text-[#202124]">{getDisplayValue(firstName)}</p>
                  </div>
                  
                  <div>
                    <p className="text-[14px] font-[500] text-[#5F6368] mb-1">Middle Name</p>
                    <p className="text-[16px] text-[#202124]">{getDisplayValue(middleName)}</p>
                  </div>
                  
                  <div>
                    <p className="text-[14px] font-[500] text-[#5F6368] mb-1">Last Name</p>
                    <p className="text-[16px] text-[#202124]">{getDisplayValue(lastName)}</p>
                  </div>
                  
                  <div>
                    <p className="text-[14px] font-[500] text-[#5F6368] mb-1">Gender</p>
                    <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.gender)}</p>
                  </div>
                </div>
                
                {/* Column 2 */}
                <div className="space-y-4">
                  <div>
                    <p className="text-[14px] font-[500] text-[#5F6368] mb-1">Date of Birth</p>
                    <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.dateOfBirth || profile?.dob)}</p>
                  </div>
                  
                  <div>
                    <p className="text-[14px] font-[500] text-[#5F6368] mb-1">Nationality</p>
                    <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.nationality)}</p>
                  </div>
                  
                  <div>
                    <p className="text-[14px] font-[500] text-[#5F6368] mb-1">Email Address</p>
                    <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.personalEmail || profile?.email)}</p>
                  </div>
                  
                  <div>
                    <p className="text-[14px] font-[500] text-[#5F6368] mb-1">Phone Number</p>
                    <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.personalPhone || profile?.phoneNumber)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Job Details */}
          <div className="bg-white rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <h2 className="text-[20px] font-[600] text-[#202124] mb-6">Job Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Job Title</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.jobTitle)}</p>
              </div>
              
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Employment Type</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.employeeType)}</p>
              </div>
              
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Compensation</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.compensation)}</p>
              </div>
              
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Line Manager</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.lineManager)}</p>
              </div>
              
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Department</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.department)}</p>
              </div>
              
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Position</p>
                <p className="text-[16px] text-[#202124]">—</p>
              </div>
              
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Work Email</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.workEmail)}</p>
              </div>
              
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Work Location</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.workLocation)}</p>
              </div>
            </div>
          </div>

          {/* Banking Details */}
          <div className="bg-white rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <h2 className="text-[20px] font-[600] text-[#202124] mb-6">Payment Details</h2>
            
            <div className="space-y-6">
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Bank Name</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.bankDetails?.bankName || profile?.bankName)}</p>
              </div>
              
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Account Name</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.accountName)}</p>
              </div>
              
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Account Type</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.bankDetails?.accountType)}</p>
              </div>
              
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Routing Number</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.bankDetails?.routingNumber)}</p>
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <h2 className="text-[20px] font-[600] text-[#202124] mb-6">Address</h2>
            
            <div className="space-y-6">
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Current Address</p>
                <p className="text-[16px] text-[#202124]">{formatAddress(profile?.currentAddress)}</p>
              </div>
              
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Permanent Address</p>
                <p className="text-[16px] text-[#202124]">{formatAddress(profile?.permanentAddress)}</p>
              </div>
              
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Primary Address</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.primaryAddress || profile?.presentAddress)}</p>
              </div>
              
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">State</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.currentAddress?.state || profile?.permanentAddress?.state || profile?.state)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Onboarding Information */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Emergency Contacts */}
          <div className="bg-white rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <h2 className="text-[20px] font-[600] text-[#202124] mb-6">Emergency Contacts</h2>
            
            <div className="space-y-8">
              {/* Primary Emergency Contact */}
              <div>
                <h3 className="text-[16px] font-[500] text-[#202124] mb-4">Primary Contact</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Name</p>
                    <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.primaryEmergencyContact?.name || profile?.emergencyContactName)}</p>
                  </div>
                  <div>
                    <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Relationship</p>
                    <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.primaryEmergencyContact?.relationship || profile?.emergencyContactRelation)}</p>
                  </div>
                  <div>
                    <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Phone</p>
                    <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.primaryEmergencyContact?.phone || profile?.emergencyContactPhone)}</p>
                  </div>
                  <div>
                    <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Email</p>
                    <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.primaryEmergencyContact?.email)}</p>
                  </div>
                </div>
              </div>

              {/* Secondary Emergency Contact */}
              {profile?.secondaryEmergencyContact?.name && (
                <div>
                  <h3 className="text-[16px] font-[500] text-[#202124] mb-4">Secondary Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Name</p>
                      <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.secondaryEmergencyContact?.name)}</p>
                    </div>
                    <div>
                      <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Relationship</p>
                      <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.secondaryEmergencyContact?.relationship)}</p>
                    </div>
                    <div>
                      <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Phone</p>
                      <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.secondaryEmergencyContact?.phone)}</p>
                    </div>
                    <div>
                      <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Email</p>
                      <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.secondaryEmergencyContact?.email)}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tax Information */}
          <div className="bg-white rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <h2 className="text-[20px] font-[600] text-[#202124] mb-6">Tax Information</h2>
            
            <div className="space-y-6">
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">SSN</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.taxInformation?.ssn)}</p>
              </div>
              
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Tax Filing Status</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.taxInformation?.taxFilingStatus)}</p>
              </div>
              
              <div>
                <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Allowances</p>
                <p className="text-[16px] text-[#202124]">{profile?.taxInformation?.allowances || "—"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Documents Section */}
        {(profile?.documents?.governmentId || profile?.documents?.resume || profile?.documents?.certifications) && (
          <div className="mt-8">
            <div className="bg-white rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <h2 className="text-[20px] font-[600] text-[#202124] mb-6">Documents</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profile?.documents?.governmentId && (
                  <div>
                    <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Government ID</p>
                    <p className="text-[16px] text-[#202124]">✓ Uploaded</p>
                  </div>
                )}
                
                {profile?.documents?.socialSecurityCard && (
                  <div>
                    <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Social Security Card</p>
                    <p className="text-[16px] text-[#202124]">✓ Uploaded</p>
                  </div>
                )}
                
                {profile?.documents?.resume && (
                  <div>
                    <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Resume/CV</p>
                    <p className="text-[16px] text-[#202124]">✓ Uploaded</p>
                  </div>
                )}
                
                {profile?.documents?.certifications && (
                  <div>
                    <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Certifications</p>
                    <p className="text-[16px] text-[#202124]">✓ Uploaded</p>
                  </div>
                )}
                
                {profile?.documents?.transcripts && (
                  <div>
                    <p className="text-[14px] font-[500] text-[#5F6368] mb-2">Transcripts</p>
                    <p className="text-[16px] text-[#202124]">✓ Uploaded</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}