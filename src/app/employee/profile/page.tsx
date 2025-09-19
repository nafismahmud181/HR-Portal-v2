"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collectionGroup, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
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
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editData, setEditData] = useState<EmployeeProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);

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
        const foundOrgId = parentOrg ? parentOrg.id : null;
        if (!foundOrgId) {
          setError("Organization not found.");
          setLoading(false);
          return;
        }
        
        // Store userId and orgId for later use
        setUserId(user.uid);
        setOrgId(foundOrgId);
        const empRef = doc(db, "organizations", foundOrgId, "employees", user.uid);
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

  // Helper function to handle edit mode
  const handleEditClick = (section: string) => {
    if (editingSection === section) {
      setEditingSection(null);
      setEditData(null);
    } else {
      setEditingSection(section);
      // Initialize editData with properly split name fields
      const { firstName, middleName, lastName } = getNameParts();
      setEditData({
        ...profile,
        firstName,
        middleName,
        lastName
      });
    }
  };

  // Helper function to handle input changes
  const handleInputChange = (field: string, value: string) => {
    if (!editData) return;
    setEditData({
      ...editData,
      [field]: value
    });
  };

  // Helper function to handle nested object changes
  const handleNestedInputChange = (parentField: string, childField: string, value: string) => {
    if (!editData) return;
    const currentParentData = editData[parentField as keyof EmployeeProfile] as Record<string, unknown> || {};
    setEditData({
      ...editData,
      [parentField]: {
        ...currentParentData,
        [childField]: value
      }
    });
  };

  // Helper function to save changes
  const handleSave = async (section: string) => {
    if (!editData || !profile || !userId || !orgId) return;
    
    setSaving(true);
    setError("");
    
    try {
      // Create a copy of editData without undefined fields for cleaner Firebase update
      const updateData: Record<string, unknown> = {};
      
      // Only include fields that have been modified and are not undefined
      Object.keys(editData).forEach(key => {
        const value = editData[key as keyof EmployeeProfile];
        if (value !== undefined && value !== null) {
          updateData[key] = value;
        }
      });
      
      // Update the document in Firestore
      const empRef = doc(db, "organizations", orgId, "employees", userId);
      await updateDoc(empRef, updateData);
      
      // Update local state only after successful Firebase update
      setProfile(editData);
      setEditingSection(null);
      setEditData(null);
      
      console.log(`Changes saved successfully for ${section} section`);
      
    } catch (error) {
      console.error('Error saving changes:', error);
      setError(`Failed to save changes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-[1440px] mx-auto px-6 py-6">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-[8px]">
            <p className="text-red-600 text-[14px]">{error}</p>
          </div>
        )}
        {/* Personal Details Section */}
        <div className="bg-white rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)] mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-[20px] font-[600] text-[#202124]">Personal Details</h2>
            {editingSection === 'personal' ? (
              <div className="flex gap-3">
                <button
                  onClick={() => handleSave('personal')}
                  disabled={saving}
                  className="px-4 py-2 bg-[#34A853] hover:bg-[#2D8F47] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed text-white text-[14px] font-[500] rounded-[8px] transition-colors duration-200"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => handleEditClick('personal')}
                  disabled={saving}
                  className="px-4 py-2 bg-[#EA4335] hover:bg-[#D33B2C] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed text-white text-[14px] font-[500] rounded-[8px] transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleEditClick('personal')}
                className="px-4 py-2 bg-[#4A90E2] hover:bg-[#357ABD] text-white text-[14px] font-[500] rounded-[8px] transition-colors duration-200"
              >
                Edit
              </button>
            )}
          </div>
          
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
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] font-[500] text-[#5F6368]">First Name</p>
                    {editingSection === 'personal' ? (
                      <input
                        type="text"
                        value={editData?.firstName || firstName || ''}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        className="text-[16px] text-[#202124] px-2 py-1 border border-[#DADCE0] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      />
                    ) : (
                      <p className="text-[16px] text-[#202124]">{getDisplayValue(firstName)}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] font-[500] text-[#5F6368]">Middle Name</p>
                    {editingSection === 'personal' ? (
                      <input
                        type="text"
                        value={editData?.middleName || middleName || ''}
                        onChange={(e) => handleInputChange('middleName', e.target.value)}
                        className="text-[16px] text-[#202124] px-2 py-1 border border-[#DADCE0] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      />
                    ) : (
                      <p className="text-[16px] text-[#202124]">{getDisplayValue(middleName)}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] font-[500] text-[#5F6368]">Last Name</p>
                    {editingSection === 'personal' ? (
                      <input
                        type="text"
                        value={editData?.lastName || lastName || ''}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="text-[16px] text-[#202124] px-2 py-1 border border-[#DADCE0] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      />
                    ) : (
                      <p className="text-[16px] text-[#202124]">{getDisplayValue(lastName)}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] font-[500] text-[#5F6368]">Gender</p>
                    {editingSection === 'personal' ? (
                      <select
                        value={editData?.gender || profile?.gender || ''}
                        onChange={(e) => handleInputChange('gender', e.target.value)}
                        className="text-[16px] text-[#202124] px-2 py-1 border border-[#DADCE0] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      >
                        <option value="">Select Gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    ) : (
                      <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.gender)}</p>
                    )}
                  </div>
                </div>
                
                {/* Column 2 */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] font-[500] text-[#5F6368]">Date of Birth</p>
                    {editingSection === 'personal' ? (
                      <input
                        type="date"
                        value={editData?.dateOfBirth || editData?.dob || profile?.dateOfBirth || profile?.dob || ''}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className="text-[16px] text-[#202124] px-2 py-1 border border-[#DADCE0] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      />
                    ) : (
                      <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.dateOfBirth || profile?.dob)}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] font-[500] text-[#5F6368]">Nationality</p>
                    {editingSection === 'personal' ? (
                      <input
                        type="text"
                        value={editData?.nationality || profile?.nationality || ''}
                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                        className="text-[16px] text-[#202124] px-2 py-1 border border-[#DADCE0] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      />
                    ) : (
                      <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.nationality)}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] font-[500] text-[#5F6368]">Email Address</p>
                    {editingSection === 'personal' ? (
                      <input
                        type="email"
                        value={editData?.personalEmail || editData?.email || profile?.personalEmail || profile?.email || ''}
                        onChange={(e) => handleInputChange('personalEmail', e.target.value)}
                        className="text-[16px] text-[#202124] px-2 py-1 border border-[#DADCE0] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      />
                    ) : (
                      <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.personalEmail || profile?.email)}</p>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] font-[500] text-[#5F6368]">Phone Number</p>
                    {editingSection === 'personal' ? (
                      <input
                        type="tel"
                        value={editData?.personalPhone || editData?.phoneNumber || profile?.personalPhone || profile?.phoneNumber || ''}
                        onChange={(e) => handleInputChange('personalPhone', e.target.value)}
                        className="text-[16px] text-[#202124] px-2 py-1 border border-[#DADCE0] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                      />
                    ) : (
                      <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.personalPhone || profile?.phoneNumber)}</p>
                    )}
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
              {/* Column 1 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[14px] font-[500] text-[#5F6368]">Job Title</p>
                  <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.jobTitle)}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-[14px] font-[500] text-[#5F6368]">Employment Type</p>
                  <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.employeeType)}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-[14px] font-[500] text-[#5F6368]">Compensation</p>
                  <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.compensation)}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-[14px] font-[500] text-[#5F6368]">Line Manager</p>
                  <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.lineManager)}</p>
                </div>
              </div>
              
              {/* Column 2 */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-[14px] font-[500] text-[#5F6368]">Department</p>
                  <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.department)}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-[14px] font-[500] text-[#5F6368]">Position</p>
                  <p className="text-[16px] text-[#202124]">—</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-[14px] font-[500] text-[#5F6368]">Work Email</p>
                  <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.workEmail)}</p>
                </div>
                
                <div className="flex justify-between items-center">
                  <p className="text-[14px] font-[500] text-[#5F6368]">Work Location</p>
                  <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.workLocation)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Banking Details */}
          <div className="bg-white rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] font-[600] text-[#202124]">Payment Details</h2>
              {editingSection === 'payment' ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSave('payment')}
                    disabled={saving}
                    className="px-4 py-2 bg-[#34A853] hover:bg-[#2D8F47] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed text-white text-[14px] font-[500] rounded-[8px] transition-colors duration-200"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => handleEditClick('payment')}
                    disabled={saving}
                    className="px-4 py-2 bg-[#EA4335] hover:bg-[#D33B2C] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed text-white text-[14px] font-[500] rounded-[8px] transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleEditClick('payment')}
                  className="px-4 py-2 bg-[#4A90E2] hover:bg-[#357ABD] text-white text-[14px] font-[500] rounded-[8px] transition-colors duration-200"
                >
                  Edit
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[14px] font-[500] text-[#5F6368]">Bank Name</p>
                {editingSection === 'payment' ? (
                  <input
                    type="text"
                    value={editData?.bankDetails?.bankName || editData?.bankName || profile?.bankDetails?.bankName || profile?.bankName || ''}
                    onChange={(e) => handleNestedInputChange('bankDetails', 'bankName', e.target.value)}
                    className="text-[16px] text-[#202124] px-2 py-1 border border-[#DADCE0] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                  />
                ) : (
                  <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.bankDetails?.bankName || profile?.bankName)}</p>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-[14px] font-[500] text-[#5F6368]">Account Name</p>
                {editingSection === 'payment' ? (
                  <input
                    type="text"
                    value={editData?.accountName || profile?.accountName || ''}
                    onChange={(e) => handleInputChange('accountName', e.target.value)}
                    className="text-[16px] text-[#202124] px-2 py-1 border border-[#DADCE0] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                  />
                ) : (
                  <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.accountName)}</p>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-[14px] font-[500] text-[#5F6368]">Account Type</p>
                {editingSection === 'payment' ? (
                  <select
                    value={editData?.bankDetails?.accountType || profile?.bankDetails?.accountType || ''}
                    onChange={(e) => handleNestedInputChange('bankDetails', 'accountType', e.target.value)}
                    className="text-[16px] text-[#202124] px-2 py-1 border border-[#DADCE0] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                  >
                    <option value="">Select Account Type</option>
                    <option value="Checking">Checking</option>
                    <option value="Savings">Savings</option>
                    <option value="Business">Business</option>
                  </select>
                ) : (
                  <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.bankDetails?.accountType)}</p>
                )}
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-[14px] font-[500] text-[#5F6368]">Routing Number</p>
                {editingSection === 'payment' ? (
                  <input
                    type="text"
                    value={editData?.bankDetails?.routingNumber || profile?.bankDetails?.routingNumber || ''}
                    onChange={(e) => handleNestedInputChange('bankDetails', 'routingNumber', e.target.value)}
                    className="text-[16px] text-[#202124] px-2 py-1 border border-[#DADCE0] rounded-[4px] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                  />
                ) : (
                  <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.bankDetails?.routingNumber)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] font-[600] text-[#202124]">Address</h2>
              {editingSection === 'address' ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSave('address')}
                    disabled={saving}
                    className="px-4 py-2 bg-[#34A853] hover:bg-[#2D8F47] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed text-white text-[14px] font-[500] rounded-[8px] transition-colors duration-200"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => handleEditClick('address')}
                    disabled={saving}
                    className="px-4 py-2 bg-[#EA4335] hover:bg-[#D33B2C] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed text-white text-[14px] font-[500] rounded-[8px] transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleEditClick('address')}
                  className="px-4 py-2 bg-[#4A90E2] hover:bg-[#357ABD] text-white text-[14px] font-[500] rounded-[8px] transition-colors duration-200"
                >
                  Edit
                </button>
              )}
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[14px] font-[500] text-[#5F6368]">Current Address</p>
                <p className="text-[16px] text-[#202124]">{formatAddress(profile?.currentAddress)}</p>
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-[14px] font-[500] text-[#5F6368]">Permanent Address</p>
                <p className="text-[16px] text-[#202124]">{formatAddress(profile?.permanentAddress)}</p>
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-[14px] font-[500] text-[#5F6368]">Primary Address</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.primaryAddress || profile?.presentAddress)}</p>
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-[14px] font-[500] text-[#5F6368]">State</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.currentAddress?.state || profile?.permanentAddress?.state || profile?.state)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Onboarding Information */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Emergency Contacts */}
          <div className="bg-white rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-[20px] font-[600] text-[#202124]">Emergency Contacts</h2>
              {editingSection === 'emergency' ? (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleSave('emergency')}
                    disabled={saving}
                    className="px-4 py-2 bg-[#34A853] hover:bg-[#2D8F47] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed text-white text-[14px] font-[500] rounded-[8px] transition-colors duration-200"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => handleEditClick('emergency')}
                    disabled={saving}
                    className="px-4 py-2 bg-[#EA4335] hover:bg-[#D33B2C] disabled:bg-[#9CA3AF] disabled:cursor-not-allowed text-white text-[14px] font-[500] rounded-[8px] transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleEditClick('emergency')}
                  className="px-4 py-2 bg-[#4A90E2] hover:bg-[#357ABD] text-white text-[14px] font-[500] rounded-[8px] transition-colors duration-200"
                >
                  Edit
                </button>
              )}
            </div>
            
            <div className="space-y-6">
              {/* Primary Emergency Contact */}
              <div>
                <h3 className="text-[16px] font-[500] text-[#202124] mb-4">Primary Contact</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] font-[500] text-[#5F6368]">Name</p>
                    <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.primaryEmergencyContact?.name || profile?.emergencyContactName)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] font-[500] text-[#5F6368]">Relationship</p>
                    <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.primaryEmergencyContact?.relationship || profile?.emergencyContactRelation)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] font-[500] text-[#5F6368]">Phone</p>
                    <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.primaryEmergencyContact?.phone || profile?.emergencyContactPhone)}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] font-[500] text-[#5F6368]">Email</p>
                    <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.primaryEmergencyContact?.email)}</p>
                  </div>
                </div>
              </div>

              {/* Secondary Emergency Contact */}
              {profile?.secondaryEmergencyContact?.name && (
                <div>
                  <h3 className="text-[16px] font-[500] text-[#202124] mb-4">Secondary Contact</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[14px] font-[500] text-[#5F6368]">Name</p>
                      <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.secondaryEmergencyContact?.name)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[14px] font-[500] text-[#5F6368]">Relationship</p>
                      <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.secondaryEmergencyContact?.relationship)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[14px] font-[500] text-[#5F6368]">Phone</p>
                      <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.secondaryEmergencyContact?.phone)}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-[14px] font-[500] text-[#5F6368]">Email</p>
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
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-[14px] font-[500] text-[#5F6368]">SSN</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.taxInformation?.ssn)}</p>
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-[14px] font-[500] text-[#5F6368]">Tax Filing Status</p>
                <p className="text-[16px] text-[#202124]">{getDisplayValue(profile?.taxInformation?.taxFilingStatus)}</p>
              </div>
              
              <div className="flex justify-between items-center">
                <p className="text-[14px] font-[500] text-[#5F6368]">Allowances</p>
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
              
              <div className="space-y-4">
                {profile?.documents?.governmentId && (
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] font-[500] text-[#5F6368]">Government ID</p>
                    <p className="text-[16px] text-[#202124]">✓ Uploaded</p>
                  </div>
                )}
                
                {profile?.documents?.socialSecurityCard && (
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] font-[500] text-[#5F6368]">Social Security Card</p>
                    <p className="text-[16px] text-[#202124]">✓ Uploaded</p>
                  </div>
                )}
                
                {profile?.documents?.resume && (
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] font-[500] text-[#5F6368]">Resume/CV</p>
                    <p className="text-[16px] text-[#202124]">✓ Uploaded</p>
                  </div>
                )}
                
                {profile?.documents?.certifications && (
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] font-[500] text-[#5F6368]">Certifications</p>
                    <p className="text-[16px] text-[#202124]">✓ Uploaded</p>
                  </div>
                )}
                
                {profile?.documents?.transcripts && (
                  <div className="flex justify-between items-center">
                    <p className="text-[14px] font-[500] text-[#5F6368]">Transcripts</p>
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