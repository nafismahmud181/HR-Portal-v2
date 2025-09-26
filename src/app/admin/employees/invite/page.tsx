"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, doc, getDoc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { generateEmployeeId, getNextSequenceNumber, EmployeeIdContext } from "@/lib/employee-id-generator";
import { syncEmployeeIds } from "@/lib/employee-id-sync";

type UserType = "employee" | "manager" | "admin";

interface FormData {
  email: string;
  fullName: string;
  employeeId: string;
  departmentId: string;
  roleId: string;
  employeeType: "Full-time" | "Part-time" | "Contract" | "Intern" | "Temporary";
  workLocation: "Office" | "Remote" | "Hybrid" | "Field Work";
  managerId: string;
  startDate: string;
  salary: string;
  orgRole: UserType;
  // Admin-specific fields
  firstName: string;
  lastName: string;
  adminLevel: "Super Admin" | "HR Admin" | "IT Admin" | "Finance Admin" | "Department Admin" | "Read-Only Admin";
  departmentScope: string;
  permissionLevel: "Full Access" | "Edit Access" | "View Only";
  justification: string;
  confirmAdminAccess: boolean;
  notifyAdmins: boolean;
  sendSetupInstructions: boolean;
}

interface Employee {
  id: string;
  name: string;
  department: string;
  title: string;
}

interface InviteData {
  email: string;
  name: string;
  departmentId: string;
  departmentName: string | null;
  roleId: string;
  roleName: string | null;
  orgRole: UserType;
  createdAt: ReturnType<typeof serverTimestamp>;
  employeeId?: string;
  employeeType?: FormData["employeeType"];
  workLocation?: FormData["workLocation"];
  managerId?: string | null;
  managerName?: string | null;
  startDate?: string;
  salary?: string;
}

export default function InviteEmployeePage() {
  const [activeTab, setActiveTab] = useState<UserType>("employee");
  const [formData, setFormData] = useState<FormData>({
    email: "",
    fullName: "",
    employeeId: "",
    departmentId: "",
    roleId: "",
    employeeType: "Full-time",
    workLocation: "Office",
    managerId: "",
    startDate: "",
    salary: "",
    orgRole: "employee",
    // Admin-specific fields
    firstName: "",
    lastName: "",
    adminLevel: "HR Admin",
    departmentScope: "",
    permissionLevel: "Edit Access",
    justification: "",
    confirmAdminAccess: false,
    notifyAdmins: true,
    sendSetupInstructions: true
  });
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [employeeIdFormat, setEmployeeIdFormat] = useState<string>("EMP{YYYY}-{###}");
  const [existingEmployeeIds, setExistingEmployeeIds] = useState<string[]>([]);
  const [employeeIdConflict, setEmployeeIdConflict] = useState<{ hasConflict: boolean; originalId: string; resolvedId: string } | null>(null);
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [emailSendStatus, setEmailSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailSendMessage, setEmailSendMessage] = useState("");
  const [currentStep, setCurrentStep] = useState<"invite" | "email" | "link">("invite");
  const [autoSyncStatus, setAutoSyncStatus] = useState<"idle" | "syncing" | "completed" | "error">("idle");
  const [autoSyncMessage, setAutoSyncMessage] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        // Find an org where current user is admin (first one)
        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const ref = snap.docs[0].ref;
          const parentOrg = ref.parent.parent;
          const foundOrgId = parentOrg ? parentOrg.id : null;
          setOrgId(foundOrgId);
          if (foundOrgId) {
            await loadCompanySettingsAndEmployeeIds(foundOrgId);
          }
        } else {
          // Fallback: find org where current user is the creator
          const orgsCol = collection(db, "organizations");
          const orgsQ = query(orgsCol, where("createdBy", "==", user.uid));
          const orgsSnap = await getDocs(orgsQ);
          if (!orgsSnap.empty) {
            const foundOrgId = orgsSnap.docs[0].id;
            setOrgId(foundOrgId);
            await loadCompanySettingsAndEmployeeIds(foundOrgId);
          } else {
            setOrgId(null);
          }
        }
      } catch (err: unknown) {
        console.error("Failed to lookup admin membership via collectionGroup:", err);
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Permission error loading organization.");
      }
    });
    return () => unsub();
  }, []);
  
  // Smart employee ID generation with conflict detection and auto-increment
  const generateSmartEmployeeId = useCallback(async (name: string, context: Partial<EmployeeIdContext> = {}) => {
    setIsGeneratingId(true);
    setEmployeeIdConflict(null);
    
    try {
      const formatToUse = employeeIdFormat || "EMP{YYYY}-{###}";
      
      // Get the next sequence number based on existing IDs
      const nextSequence = getNextSequenceNumber(formatToUse, existingEmployeeIds);
      
      // Create full context for employee ID generation
      const fullContext: EmployeeIdContext = {
        sequence: nextSequence,
        department: formData.departmentId ? departments.find(d => d.id === formData.departmentId)?.name : undefined,
        employeeType: formData.employeeType,
        location: formData.workLocation,
        ...context
      };
      
      // Generate the initial employee ID
      const initialId = generateEmployeeId(formatToUse, fullContext);
      console.log("Generated initial employee ID:", initialId);
      
      // Check if this ID already exists
      if (existingEmployeeIds.includes(initialId)) {
        console.log("Employee ID conflict detected:", initialId);
        
        // Find the next available ID by incrementing sequence
        let resolvedId = initialId;
        let currentSequence = nextSequence;
        let attempts = 0;
        const maxAttempts = 100; // Prevent infinite loop
        
        while (existingEmployeeIds.includes(resolvedId) && attempts < maxAttempts) {
          currentSequence++;
          const newContext = { ...fullContext, sequence: currentSequence };
          resolvedId = generateEmployeeId(formatToUse, newContext);
          attempts++;
        }
        
        if (attempts >= maxAttempts) {
          throw new Error("Unable to generate unique employee ID after 100 attempts");
        }
        
        console.log("Resolved conflict with ID:", resolvedId);
        
        // Set conflict information for UI feedback
        setEmployeeIdConflict({
          hasConflict: true,
          originalId: initialId,
          resolvedId: resolvedId
        });
        
        return resolvedId;
      } else {
        console.log("No conflict detected, using initial ID:", initialId);
        return initialId;
      }
    } catch (error) {
      console.error("Error in smart employee ID generation:", error);
      // Fallback to simple generation
      const nameParts = name.trim().split(" ");
      if (nameParts.length >= 2) {
        const firstName = nameParts[0].toUpperCase();
        const lastName = nameParts[nameParts.length - 1].toUpperCase();
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
        return `${firstName}${lastName}${randomNum}`;
      }
      return `EMP${Date.now().toString().slice(-6)}`; // Fallback with timestamp
    } finally {
      setIsGeneratingId(false);
    }
  }, [employeeIdFormat, existingEmployeeIds, formData.departmentId, formData.employeeType, formData.workLocation, departments]);

  // Refresh existing employee IDs (useful after creating new employees)
  const refreshExistingEmployeeIds = async () => {
    if (!orgId) return;
    
    try {
      const employeesRef = collection(db, "organizations", orgId, "employees");
      const employeesSnapshot = await getDocs(employeesRef);
      const employeeIds = employeesSnapshot.docs
        .map(doc => doc.data().employeeId || doc.id)
        .filter(id => id);
      setExistingEmployeeIds(employeeIds);
      console.log("Refreshed existing employee IDs:", employeeIds.length);
    } catch (error) {
      console.error("Error refreshing existing employee IDs:", error);
    }
  };

  // Automatic employee ID sync after invite creation
  const performAutoSync = async () => {
    if (!orgId) return;
    
    setAutoSyncStatus("syncing");
    setAutoSyncMessage("Synchronizing employee IDs...");
    
    try {
      console.log("Performing automatic employee ID sync after invite creation");
      
      // Perform the sync
      const result = await syncEmployeeIds(orgId);
      
      if (result.errors.length > 0) {
        setAutoSyncStatus("error");
        setAutoSyncMessage(`Sync completed with warnings: ${result.errors.join(', ')}`);
        console.warn("Auto-sync completed with errors:", result.errors);
      } else if (result.fixed > 0) {
        setAutoSyncStatus("completed");
        setAutoSyncMessage(`Successfully synchronized ${result.fixed} employee ID(s)`);
        console.log(`Auto-sync completed: Fixed ${result.fixed} employee IDs`);
      } else {
        setAutoSyncStatus("completed");
        setAutoSyncMessage("Employee IDs are already synchronized");
        console.log("Auto-sync completed: No mismatches found");
      }
      
      // Refresh the existing employee IDs list
      await refreshExistingEmployeeIds();
      
    } catch (error) {
      setAutoSyncStatus("error");
      setAutoSyncMessage(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error("Error during automatic sync:", error);
    }
  };

  const loadCompanySettingsAndEmployeeIds = async (organizationId: string) => {
    try {
      // Load company settings to get employee ID format
      try {
        const orgDoc = doc(db, "organizations", organizationId);
        const orgSnapshot = await getDoc(orgDoc);
        if (orgSnapshot.exists()) {
          const orgData = orgSnapshot.data();
          const format = orgData?.documentConfig?.employeeIdFormat || "EMP{YYYY}-{###}";
          setEmployeeIdFormat(format);
          console.log("Loaded employee ID format:", format);
        } else {
          console.log("Organization document not found, using default format");
          setEmployeeIdFormat("EMP{YYYY}-{###}");
        }
      } catch (orgError) {
        console.warn("Could not load organization settings, using default format:", orgError);
        setEmployeeIdFormat("EMP{YYYY}-{###}");
      }
      
      // Load existing employee IDs
      try {
        const employeesRef = collection(db, "organizations", organizationId, "employees");
        const employeesSnapshot = await getDocs(employeesRef);
        const employeeIds = employeesSnapshot.docs
          .map(doc => doc.data().employeeId || doc.id)
          .filter(id => id); // Filter out empty/undefined IDs
        setExistingEmployeeIds(employeeIds);
        console.log("Loaded existing employee IDs:", employeeIds.length);
      } catch (employeeError) {
        console.warn("Could not load existing employee IDs:", employeeError);
        setExistingEmployeeIds([]);
      }
    } catch (error) {
      console.error("Error loading company settings:", error);
      // Set defaults on error
      setEmployeeIdFormat("EMP{YYYY}-{###}");
      setExistingEmployeeIds([]);
    }
  };

  // Load departments for the organization
  useEffect(() => {
    async function loadDepartments() {
      if (!orgId) return;
      try {
        const depCol = collection(db, "organizations", orgId, "departments");
        const depSnap = await getDocs(depCol);
        const list: Array<{ id: string; name: string }> = depSnap.docs.map((d) => {
          const data = d.data() as { name?: string };
          return { id: d.id, name: data?.name ?? d.id };
        });
        setDepartments(list);
      } catch (e) {
        console.error("Failed to load departments", e);
      }
    }
    loadDepartments();
  }, [orgId]);

  // Load existing employees for manager selection
  useEffect(() => {
    async function loadEmployees() {
      if (!orgId) return;
      try {
        const usersCol = collection(db, "organizations", orgId, "users");
        const usersSnap = await getDocs(usersCol);
        const employeeList: Employee[] = usersSnap.docs
          .map((d) => {
            const data = d.data() as { 
              name?: string; 
              departmentName?: string; 
              roleName?: string;
              orgRole?: string;
            };
            return {
              id: d.id,
              name: data?.name ?? "Unknown",
              department: data?.departmentName ?? "Unknown",
              title: data?.roleName ?? "Unknown"
            };
          })
          .filter(emp => emp.name !== "Unknown"); // Filter out invalid entries
        setEmployees(employeeList);
      } catch (e) {
        console.error("Failed to load employees", e);
      }
    }
    loadEmployees();
  }, [orgId]);

  // Generate employee ID when full name changes
  useEffect(() => {
    if (formData.fullName && activeTab === "employee" && orgId && !isGeneratingId) {
      generateSmartEmployeeId(formData.fullName).then(generatedId => {
        setFormData(prev => ({ ...prev, employeeId: generatedId }));
      }).catch(error => {
        console.error("Error generating smart employee ID:", error);
      });
    }
  }, [formData.fullName, activeTab, orgId, generateSmartEmployeeId, isGeneratingId]);

  // Load roles when department changes
  useEffect(() => {
    async function loadRoles() {
      if (!orgId || !formData.departmentId) {
        setRoles([]);
        setFormData(prev => ({ ...prev, roleId: "" }));
        return;
      }
      try {
        const rolesCol = collection(db, "organizations", orgId, "roles");
        const rolesSnap = await getDocs(rolesCol);
        const list: Array<{ id: string; name: string }> = rolesSnap.docs
          .map((d) => {
            const data = d.data() as { title?: string; departmentIds?: string[]; primaryDepartmentId?: string; status?: string };
            return { 
              id: d.id, 
              name: data?.title ?? d.id,
              departmentIds: data?.departmentIds ?? [],
              primaryDepartmentId: data?.primaryDepartmentId,
              status: data?.status ?? "draft"
            };
          })
          .filter((role) => 
            (role.departmentIds.includes(formData.departmentId) || 
            role.primaryDepartmentId === formData.departmentId) &&
            role.status === "active"
          )
          .map((role) => ({ id: role.id, name: role.name }));
        setRoles(list);
      } catch (e) {
        console.error("Failed to load roles", e);
      }
    }
    loadRoles();
  }, [orgId, formData.departmentId]);

  const inviteUrl = useMemo(() => {
    if (!orgId || !formData.email) return "";
    const url = new URL(typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
    url.pathname = "/invite";
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("email", formData.email.trim().toLowerCase());
    return url.toString();
  }, [orgId, formData.email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    console.log("Form submitted!", { activeTab, formData, orgId });
    
    if (!orgId) {
      console.log("No orgId found");
      setStatus("error");
      setMessage("No organization context found.");
      return;
    }
    // Validate based on active tab
    if (activeTab === "employee") {
      if (!formData.fullName || !formData.email || !formData.employeeId || !formData.departmentId || !formData.roleId || !formData.employeeType || !formData.workLocation || !formData.startDate || !formData.salary) {
        console.log("Employee validation failed:", { 
          fullName: !!formData.fullName, 
          email: !!formData.email, 
          employeeId: !!formData.employeeId, 
          departmentId: !!formData.departmentId, 
          roleId: !!formData.roleId, 
          employeeType: !!formData.employeeType, 
          workLocation: !!formData.workLocation, 
          startDate: !!formData.startDate,
          salary: !!formData.salary
        });
        setStatus("error");
        setMessage("Please fill all required fields.");
        return;
      }
    } else if (activeTab === "admin") {
      // Admin tab requires admin-specific fields
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.adminLevel || !formData.permissionLevel || !formData.justification || !formData.confirmAdminAccess) {
        console.log("Admin validation failed:", { 
          firstName: !!formData.firstName, 
          lastName: !!formData.lastName, 
          email: !!formData.email, 
          adminLevel: !!formData.adminLevel, 
          permissionLevel: !!formData.permissionLevel,
          justification: !!formData.justification,
          confirmAdminAccess: !!formData.confirmAdminAccess
        });
        setStatus("error");
        setMessage("Please fill all required admin fields and confirm admin access.");
        return;
      }
      
      // Department Admin requires department scope
      if (formData.adminLevel === "Department Admin" && !formData.departmentScope) {
        setStatus("error");
        setMessage("Department Admin requires selecting a department scope.");
        return;
      }
      
      // Justification must be at least 20 characters
      if (formData.justification.length < 20) {
        setStatus("error");
        setMessage("Justification must be at least 20 characters long.");
        return;
      }
    } else {
      // Manager tab only requires basic fields
      if (!formData.fullName || !formData.email || !formData.departmentId || !formData.roleId) {
        console.log("Manager validation failed:", { 
          fullName: !!formData.fullName, 
          email: !!formData.email, 
          departmentId: !!formData.departmentId, 
          roleId: !!formData.roleId 
        });
        setStatus("error");
        setMessage("Please fill all required fields.");
        return;
      }
    }
    
    console.log("Validation passed, starting invite creation...");
    setStatus("sending");
    setMessage("");
    setEmailSendStatus("idle");
    setEmailSendMessage("");
    setCurrentStep("invite");
    
    try {
      const inviteEmail = formData.email.trim().toLowerCase();
      const selectedDepartment = departments.find((d) => d.id === formData.departmentId);
      const selectedRole = roles.find((r) => r.id === formData.roleId);
      const selectedManager = employees.find((e) => e.id === formData.managerId);
      
      // Step 1: Create invite record
      const inviteData: InviteData = {
        email: inviteEmail,
        name: formData.fullName,
        departmentId: formData.departmentId,
        departmentName: selectedDepartment?.name ?? null,
        roleId: formData.roleId,
        roleName: selectedRole?.name ?? null,
        orgRole: formData.orgRole,
        createdAt: serverTimestamp(),
      };

      // Add employee-specific fields only for employee tab
      if (activeTab === "employee") {
        inviteData.employeeId = formData.employeeId;
        inviteData.employeeType = formData.employeeType;
        inviteData.workLocation = formData.workLocation;
        inviteData.managerId = formData.managerId || null;
        inviteData.managerName = selectedManager?.name ?? null;
        inviteData.startDate = formData.startDate;
        inviteData.salary = formData.salary;
      }

      await setDoc(doc(db, "organizations", orgId, "invites", inviteEmail), inviteData);
      
      // Step 2: Send email notification
      setCurrentStep("email");
      setEmailSendStatus("sending");
      try {
        const resp = await fetch("/api/send-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: formData.email, inviteUrl, orgName: undefined }),
        });
        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          const errMsg = (data && data.error) ? data.error : `HTTP ${resp.status}`;
          setEmailSendStatus("error");
          setEmailSendMessage(`Email not sent: ${errMsg}`);
        } else {
          setEmailSendStatus("sent");
          setEmailSendMessage(`Email sent to ${formData.email}`);
        }
      } catch (e: unknown) {
        setEmailSendStatus("error");
        setEmailSendMessage(e instanceof Error ? e.message : "Failed to send email");
      }
      
      // Step 3: Generate invite link
      setCurrentStep("link");
      
      setStatus("sent");
      setMessage("Invite created successfully! Copy the link below and share it.");
      
      // Perform automatic employee ID sync after successful invite creation
      // Add a small delay to ensure the invite is fully processed
      setTimeout(async () => {
        await performAutoSync();
      }, 1000);
      
      // Reset form for next invite after a short delay
      setTimeout(() => {
        setFormData({
          email: "",
          fullName: "",
          employeeId: "",
          departmentId: "",
          roleId: "",
          employeeType: "Full-time",
          workLocation: "Office",
          managerId: "",
          startDate: "",
          salary: "",
          orgRole: activeTab,
          // Admin-specific fields
          firstName: "",
          lastName: "",
          adminLevel: "HR Admin",
          departmentScope: "",
          permissionLevel: "Edit Access",
          justification: "",
          confirmAdminAccess: false,
          notifyAdmins: true,
          sendSetupInstructions: true
        });
        setStatus("idle");
        setMessage("");
        setEmailSendStatus("idle");
        setEmailSendMessage("");
        setCurrentStep("invite");
        setEmployeeIdConflict(null);
        setAutoSyncStatus("idle");
        setAutoSyncMessage("");
      }, 3000); // Reset after 3 seconds
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Unable to create invite");
    }
  }

  const handleTabChange = (tab: UserType) => {
    setActiveTab(tab);
    setFormData(prev => ({ ...prev, orgRole: tab }));
  };

  const updateFormData = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getTabTitle = (tab: UserType) => {
    switch (tab) {
      case "employee": return "Employee";
      case "manager": return "Manager";
      case "admin": return "Admin";
    }
  };

  const getTabDescription = (tab: UserType) => {
    switch (tab) {
      case "employee": return "Invite a regular employee to join your organization";
      case "manager": return "Invite a manager with team management capabilities";
      case "admin": return "Invite an administrator with full system access";
    }
  };

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">Invite User</h1>
        <p className="mt-2 text-sm text-gray-600">Send an invite to allow someone to set a password and join your organization.</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {(["employee", "manager", "admin"] as UserType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => handleTabChange(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              {getTabTitle(tab)}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900">{getTabTitle(activeTab)} Invitation</h2>
            <p className="mt-1 text-sm text-gray-600">{getTabDescription(activeTab)}</p>
          </div>

        <form onSubmit={onSubmit} className="space-y-6 relative">
          {/* Loading Overlay */}
          {status === 'sending' && (
            <div className="absolute inset-0 bg-white bg-opacity-75 z-10 flex items-center justify-center rounded-lg">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-600">Creating invite...</p>
              </div>
            </div>
          )}
          {activeTab === "employee" ? (
            <>
              {/* Basic Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => updateFormData("fullName", e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="john.doe@company.com"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700">
                      Employee ID *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (formData.fullName && !isGeneratingId) {
                          generateSmartEmployeeId(formData.fullName).then(generatedId => {
                            setFormData(prev => ({ ...prev, employeeId: generatedId }));
                            console.log("Regenerated employee ID:", generatedId);
                          }).catch(error => {
                            console.error("Error regenerating employee ID:", error);
                          });
                        }
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800 hover:underline disabled:text-gray-400 disabled:cursor-not-allowed"
                      disabled={!formData.fullName || isGeneratingId}
                    >
                      {isGeneratingId ? "Generating..." : "Regenerate"}
                    </button>
                  </div>
                  <input
                    id="employeeId"
                    type="text"
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Auto-generated"
                    value={formData.employeeId}
                    onChange={(e) => updateFormData("employeeId", e.target.value)}
                  />
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-gray-500">
                      Auto-generated using format: <code className="bg-gray-100 px-1 rounded">{employeeIdFormat}</code>
                    </p>
                    
                    {/* Conflict Resolution Feedback */}
                    {employeeIdConflict && employeeIdConflict.hasConflict && (
                      <div className="p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                        <div className="flex items-start gap-2">
                          <div className="text-yellow-600 text-xs">⚠️</div>
                          <div className="text-xs">
                            <p className="text-yellow-800 font-medium">ID Conflict Resolved</p>
                            <p className="text-yellow-700">
                              Original: <code className="bg-yellow-100 px-1 rounded">{employeeIdConflict.originalId}</code> (already exists)
                            </p>
                            <p className="text-yellow-700">
                              Auto-assigned: <code className="bg-yellow-100 px-1 rounded">{employeeIdConflict.resolvedId}</code>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Generated ID Display */}
                    {formData.employeeId && (
                      <div className={`text-xs ${employeeIdConflict ? 'text-green-600' : 'text-blue-600'}`}>
                        {employeeIdConflict ? 'Resolved ID:' : 'Generated ID:'} 
                        <code className={`px-1 rounded ${employeeIdConflict ? 'bg-green-100' : 'bg-blue-100'}`}>
                          {formData.employeeId}
                        </code>
                      </div>
                    )}
                    
                    {/* Loading State */}
                    {isGeneratingId && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400"></div>
                        Checking for conflicts and generating unique ID...
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Role & Department Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Role & Department</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <select
                      id="department"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={formData.departmentId}
                      onChange={(e) => updateFormData("departmentId", e.target.value)}
                    >
                      <option value="" disabled>Select department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      id="role"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={formData.roleId}
                      onChange={(e) => updateFormData("roleId", e.target.value)}
                      disabled={!formData.departmentId || roles.length === 0}
                    >
                      <option value="" disabled>
                        {formData.departmentId ? (roles.length ? 'Select role' : 'No roles available') : 'Select department first'}
                      </option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Employment Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Employment Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="employeeType" className="block text-sm font-medium text-gray-700 mb-1">
                      Employee Type *
                    </label>
                    <select
                      id="employeeType"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={formData.employeeType}
                      onChange={(e) => updateFormData("employeeType", e.target.value as FormData["employeeType"])}
                    >
                      <option value="Full-time">Full-time</option>
                      <option value="Part-time">Part-time</option>
                      <option value="Contract">Contract</option>
                      <option value="Intern">Intern</option>
                      <option value="Temporary">Temporary</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="workLocation" className="block text-sm font-medium text-gray-700 mb-1">
                      Work Location *
                    </label>
                    <select
                      id="workLocation"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={formData.workLocation}
                      onChange={(e) => updateFormData("workLocation", e.target.value as FormData["workLocation"])}
                    >
                      <option value="Office">Office</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="Field Work">Field Work</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="salary" className="block text-sm font-medium text-gray-700 mb-1">
                    Salary *
                  </label>
                  <input
                    id="salary"
                    type="text"
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="e.g., $50,000 or 50000"
                    value={formData.salary}
                    onChange={(e) => updateFormData("salary", e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Enter annual salary (can include currency symbol)</p>
                </div>
              </div>

              {/* Manager/Supervisor */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Manager/Supervisor</h3>
                <div>
                  <label htmlFor="manager" className="block text-sm font-medium text-gray-700 mb-1">
                    Manager/Supervisor (Optional but Recommended)
                  </label>
                  <select
                    id="manager"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.managerId}
                    onChange={(e) => updateFormData("managerId", e.target.value)}
                  >
                    <option value="">No direct manager</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} - {emp.department} - {emp.title}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Search by name functionality. Shows: &quot;Name - Department - Title&quot;</p>
                </div>
              </div>

              {/* Start Date */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Start Date</h3>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    id="startDate"
                    type="date"
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.startDate}
                    onChange={(e) => updateFormData("startDate", e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : activeTab === "admin" ? (
            <>
              {/* Admin Basic Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Admin Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => updateFormData("firstName", e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Doe"
                      value={formData.lastName}
                      onChange={(e) => updateFormData("lastName", e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="john.doe@company.com"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Admin Level */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Admin Level</h3>
                <div>
                  <label htmlFor="adminLevel" className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Level *
                  </label>
                  <select
                    id="adminLevel"
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.adminLevel}
                    onChange={(e) => updateFormData("adminLevel", e.target.value as FormData["adminLevel"])}
                  >
                    <option value="Super Admin">Super Admin</option>
                    <option value="HR Admin">HR Admin</option>
                    <option value="IT Admin">IT Admin</option>
                    <option value="Finance Admin">Finance Admin</option>
                    <option value="Department Admin">Department Admin</option>
                    <option value="Read-Only Admin">Read-Only Admin</option>
                  </select>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-xs text-gray-600">
                      {formData.adminLevel === "Super Admin" && "Full system access including billing, settings, user management"}
                      {formData.adminLevel === "HR Admin" && "Employee management, reports, leave approvals, hiring"}
                      {formData.adminLevel === "IT Admin" && "System settings, security, integrations, technical support"}
                      {formData.adminLevel === "Finance Admin" && "Payroll, benefits, financial reports, billing"}
                      {formData.adminLevel === "Department Admin" && "Limited to specific department management"}
                      {formData.adminLevel === "Read-Only Admin" && "View access to reports and analytics only"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Department Scope - Conditional */}
              {formData.adminLevel === "Department Admin" && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-base font-medium text-gray-900 mb-4">Department Scope</h3>
                  <div>
                    <label htmlFor="departmentScope" className="block text-sm font-medium text-gray-700 mb-1">
                      Department Scope *
                    </label>
                    <select
                      id="departmentScope"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={formData.departmentScope}
                      onChange={(e) => updateFormData("departmentScope", e.target.value)}
                    >
                      <option value="" disabled>Select department scope</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Sales & Marketing">Sales & Marketing</option>
                      <option value="Finance & Accounting">Finance & Accounting</option>
                      <option value="Operations">Operations</option>
                      <option value="Customer Support">Customer Support</option>
                      <option value="IT/Technology">IT/Technology</option>
                      <option value="All Departments">All Departments</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Permission Level */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Permission Level</h3>
                <div>
                  <label htmlFor="permissionLevel" className="block text-sm font-medium text-gray-700 mb-1">
                    Permission Level *
                  </label>
                  <select
                    id="permissionLevel"
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    value={formData.permissionLevel}
                    onChange={(e) => updateFormData("permissionLevel", e.target.value as FormData["permissionLevel"])}
                  >
                    <option value="Full Access">Full Access</option>
                    <option value="Edit Access">Edit Access</option>
                    <option value="View Only">View Only</option>
                  </select>
                  <div className="mt-2 p-3 bg-gray-50 rounded-md">
                    <p className="text-xs text-gray-600">
                      {formData.permissionLevel === "Full Access" && "Create, edit, delete within assigned scope"}
                      {formData.permissionLevel === "Edit Access" && "View and modify existing data only"}
                      {formData.permissionLevel === "View Only" && "Read access and report generation only"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Justification */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Justification</h3>
                <div>
                  <label htmlFor="justification" className="block text-sm font-medium text-gray-700 mb-1">
                    Justification/Reason *
                  </label>
                  <textarea
                    id="justification"
                    required
                    rows={4}
                    minLength={20}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Explain why this admin access is needed..."
                    value={formData.justification}
                    onChange={(e) => updateFormData("justification", e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 20 characters required for audit trail. ({formData.justification.length}/20)
                  </p>
                </div>
              </div>

              {/* Permission Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-base font-medium text-blue-900 mb-4">Permission Preview</h3>
                <div className="space-y-3">
                  <div className="p-3 bg-white rounded-md border border-blue-100">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">Access Summary</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span><strong>Admin Level:</strong> {formData.adminLevel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span><strong>Permission Level:</strong> {formData.permissionLevel}</span>
                      </div>
                      {formData.adminLevel === "Department Admin" && formData.departmentScope && (
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span><strong>Scope:</strong> {formData.departmentScope}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-3 bg-white rounded-md border border-blue-100">
                    <h4 className="text-sm font-medium text-blue-900 mb-2">What they can do:</h4>
                    <div className="space-y-1 text-sm text-blue-800">
                      {formData.adminLevel === "Super Admin" && (
                        <>
                          <div>• Full system configuration and settings</div>
                          <div>• User management and role assignments</div>
                          <div>• Billing and subscription management</div>
                          <div>• System integrations and API access</div>
                          <div>• Audit logs and security settings</div>
                        </>
                      )}
                      {formData.adminLevel === "HR Admin" && (
                        <>
                          <div>• Employee onboarding and offboarding</div>
                          <div>• Leave request approvals</div>
                          <div>• Performance review management</div>
                          <div>• Recruitment and hiring workflows</div>
                          <div>• HR reports and analytics</div>
                        </>
                      )}
                      {formData.adminLevel === "IT Admin" && (
                        <>
                          <div>• System settings and configurations</div>
                          <div>• Security settings and access controls</div>
                          <div>• Third-party integrations</div>
                          <div>• Technical support and troubleshooting</div>
                          <div>• System maintenance and updates</div>
                        </>
                      )}
                      {formData.adminLevel === "Finance Admin" && (
                        <>
                          <div>• Payroll processing and management</div>
                          <div>• Benefits administration</div>
                          <div>• Financial reports and analytics</div>
                          <div>• Budget and expense management</div>
                          <div>• Billing and invoice management</div>
                        </>
                      )}
                      {formData.adminLevel === "Department Admin" && (
                        <>
                          <div>• Manage {formData.departmentScope || "selected department"} employees</div>
                          <div>• Approve department-specific requests</div>
                          <div>• View department reports and analytics</div>
                          <div>• Manage department roles and permissions</div>
                          <div>• Department-specific settings</div>
                        </>
                      )}
                      {formData.adminLevel === "Read-Only Admin" && (
                        <>
                          <div>• View all system reports and analytics</div>
                          <div>• Access audit logs and activity history</div>
                          <div>• Export data and generate reports</div>
                          <div>• View user profiles and organizational structure</div>
                          <div>• Monitor system usage and performance</div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Notice */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-medium text-amber-900 mb-2">Security Notice</h3>
                    <div className="text-sm text-amber-800 space-y-2">
                      <p><strong>Admin Responsibilities:</strong></p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Admins have significant access to sensitive organizational data</li>
                        <li>They can modify user permissions and system settings</li>
                        <li>All admin actions are logged for security and compliance</li>
                        <li>Admins must follow organizational security policies</li>
                        <li>Regular access reviews are recommended</li>
                      </ul>
                      <p className="mt-2 text-xs text-amber-700">
                        <strong>Note:</strong> Only grant admin access to trusted individuals who require it for their role responsibilities.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Current Admins List */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-medium text-gray-900">Current System Admins</h3>
                  <button
                    type="button"
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                    onClick={() => {
                      // This would typically open a modal or navigate to an admin management page
                      alert("This would show a list of current system administrators with their roles and access levels.");
                    }}
                  >
                    View Details →
                  </button>
                </div>
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                  </div>
                  <p className="text-sm text-gray-500">Admin list will be loaded from your organization</p>
                  <p className="text-xs text-gray-400 mt-1">Click &quot;View Details&quot; to see all administrators</p>
                </div>
              </div>

              {/* Required Acknowledgments */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Required Acknowledgments</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <input
                      id="confirmAdminAccess"
                      type="checkbox"
                      required
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.confirmAdminAccess}
                      onChange={(e) => updateFormData("confirmAdminAccess", e.target.checked)}
                    />
                    <label htmlFor="confirmAdminAccess" className="ml-2 text-sm text-gray-700">
                      <span className="font-medium text-red-600">*</span> I confirm this person requires admin access for their role
                    </label>
                  </div>
                  
                  <div className="flex items-start">
                    <input
                      id="notifyAdmins"
                      type="checkbox"
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.notifyAdmins}
                      onChange={(e) => updateFormData("notifyAdmins", e.target.checked)}
                    />
                    <label htmlFor="notifyAdmins" className="ml-2 text-sm text-gray-700">
                      Notify other system admins about this change
                    </label>
                  </div>
                  
                  <div className="flex items-start">
                    <input
                      id="sendSetupInstructions"
                      type="checkbox"
                      className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.sendSetupInstructions}
                      onChange={(e) => updateFormData("sendSetupInstructions", e.target.checked)}
                    />
                    <label htmlFor="sendSetupInstructions" className="ml-2 text-sm text-gray-700">
                      Send setup instructions to the new admin
                    </label>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Basic Information for Manager */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      id="fullName"
                      type="text"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="John Doe"
                      value={formData.fullName}
                      onChange={(e) => updateFormData("fullName", e.target.value)}
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Work Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="john.doe@company.com"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Role & Department Information */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">Role & Department</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                      Department *
                    </label>
                    <select
                      id="department"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={formData.departmentId}
                      onChange={(e) => updateFormData("departmentId", e.target.value)}
                    >
                      <option value="" disabled>Select department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                      Role *
                    </label>
                    <select
                      id="role"
                      required
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      value={formData.roleId}
                      onChange={(e) => updateFormData("roleId", e.target.value)}
                      disabled={!formData.departmentId || roles.length === 0}
                    >
                      <option value="" disabled>
                        {formData.departmentId ? (roles.length ? 'Select role' : 'No roles available') : 'Select department first'}
                      </option>
                      {roles.map((r) => (
                        <option key={r.id} value={r.id}>{r.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* User Type Display */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-base font-medium text-gray-900 mb-4">User Type</h3>
                <div className="p-3 bg-gray-50 rounded-md">
                  <span className="text-sm font-medium text-gray-900">{getTabTitle(activeTab)}</span>
                  <p className="text-xs text-gray-500 mt-1">{getTabDescription(activeTab)}</p>
                </div>
              </div>
            </>
          )}

          {/* Status Message */}
          {message && (
            <div className={`p-4 rounded-md ${
              status === 'error' ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'
            }`}>
              <p className={`text-sm ${
                status === 'error' ? 'text-red-800' : 'text-green-800'
              }`}>
                {message}
              </p>
            </div>
          )}

          {/* Submit Button in Form */}
          <div className="justify-end hidden">
            <button
              type="submit"
              disabled={status === 'sending' || (activeTab === "employee" ? 
                !formData.fullName || !formData.email || !formData.employeeId || 
                !formData.departmentId || !formData.roleId || !formData.employeeType || 
                !formData.workLocation || !formData.startDate || !formData.salary :
                activeTab === "admin" ?
                !formData.firstName || !formData.lastName || !formData.email || 
                !formData.adminLevel || !formData.permissionLevel || !formData.justification || 
                !formData.confirmAdminAccess || formData.justification.length < 20 ||
                (formData.adminLevel === "Department Admin" && !formData.departmentScope) :
                !formData.fullName || !formData.email || !formData.departmentId || !formData.roleId
              )}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {status === 'sending' && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {status === 'sending' ? 'Creating Invite...' : `Invite ${getTabTitle(activeTab)}`}
            </button>
          </div>
        </form>

        {/* Auto-Sync Status */}
        {autoSyncStatus !== "idle" && (
          <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              {autoSyncStatus === "syncing" && (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              )}
              {autoSyncStatus === "completed" && (
                <div className="text-green-600 text-lg">✅</div>
              )}
              {autoSyncStatus === "error" && (
                <div className="text-red-600 text-lg">⚠️</div>
              )}
              <div>
                <h4 className="text-sm font-medium text-gray-900">
                  {autoSyncStatus === "syncing" && "Synchronizing Employee IDs..."}
                  {autoSyncStatus === "completed" && "Employee ID Sync Complete"}
                  {autoSyncStatus === "error" && "Employee ID Sync Warning"}
                </h4>
                <p className="text-sm text-gray-600 mt-1">{autoSyncMessage}</p>
              </div>
            </div>
          </div>
        )}

        {/* Invite Link */}
        {status === "sent" && inviteUrl && (
          <div className="mt-8 bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-base font-medium text-gray-900 mb-4">Invite Link</h3>
            <div className="flex items-center gap-2">
              <input
                readOnly
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50"
                value={inviteUrl}
              />
              <button
                type="button"
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(inviteUrl);
                  } catch {}
                }}
              >
                Copy
              </button>
            </div>
            {emailSendStatus !== "idle" && (
              <p className={`mt-2 text-sm ${
                emailSendStatus === 'error' ? 'text-red-600' : 'text-green-600'
              }`}>
                {emailSendMessage || (emailSendStatus === 'sending' ? 'Sending email...' : '')}
              </p>
            )}
            
            {/* Create Another Invite Button */}
            <div className="mt-4 pt-4 border-t border-gray-200 hidden">
              <button
                type="button"
                className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => {
                  setFormData({
                    email: "",
                    fullName: "",
                    employeeId: "",
                    departmentId: "",
                    roleId: "",
                    employeeType: "Full-time",
                    workLocation: "Office",
                    managerId: "",
                    startDate: "",
                    salary: "",
                    orgRole: activeTab,
                    // Admin-specific fields
                    firstName: "",
                    lastName: "",
                    adminLevel: "HR Admin",
                    departmentScope: "",
                    permissionLevel: "Edit Access",
                    justification: "",
                    confirmAdminAccess: false,
                    notifyAdmins: true,
                    sendSetupInstructions: true
                  });
                  setStatus("idle");
                  setMessage("");
                  setEmailSendStatus("idle");
                  setEmailSendMessage("");
                  setCurrentStep("invite");
                }}
              >
                Create Another Invite
              </button>
            </div>
          </div>
        )}
        </div>

        {/* Preview Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Invitation Preview</h3>
              
              <div className="space-y-4">
                {/* User Type */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">User Type</h4>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${
                      activeTab === "employee" ? "bg-blue-500" : 
                      activeTab === "manager" ? "bg-green-500" : "bg-purple-500"
                    }`}></div>
                    <span className="text-sm text-gray-900">{getTabTitle(activeTab)}</span>
                  </div>
                </div>

                {/* Basic Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Basic Information</h4>
                  <div className="space-y-1 text-sm text-gray-600">
                    {activeTab === "admin" ? (
                      <>
                        <div>
                          <span className="font-medium">First Name:</span> {formData.firstName || "Not specified"}
                        </div>
                        <div>
                          <span className="font-medium">Last Name:</span> {formData.lastName || "Not specified"}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {formData.email || "Not specified"}
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <span className="font-medium">Name:</span> {formData.fullName || "Not specified"}
                        </div>
                        <div>
                          <span className="font-medium">Email:</span> {formData.email || "Not specified"}
                        </div>
                        {activeTab === "employee" && (
                          <div>
                            <span className="font-medium">Employee ID:</span> {formData.employeeId || "Not generated"}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Admin-specific or Role & Department */}
                {activeTab === "admin" ? (
                  <>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Admin Level</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Level:</span> {formData.adminLevel || "Not selected"}
                        </div>
                        {formData.adminLevel === "Department Admin" && (
                          <div>
                            <span className="font-medium">Department Scope:</span> {formData.departmentScope || "Not selected"}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Permission Level</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Access:</span> {formData.permissionLevel || "Not selected"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Permission Preview</h4>
                      <div className="p-2 bg-blue-50 rounded text-xs border border-blue-100">
                        <div className="text-blue-800 font-medium mb-1">{formData.adminLevel} - {formData.permissionLevel}</div>
                        <div className="text-blue-700 text-xs">
                          {formData.adminLevel === "Super Admin" && "Full system access including billing, settings, user management"}
                          {formData.adminLevel === "HR Admin" && "Employee management, reports, leave approvals, hiring"}
                          {formData.adminLevel === "IT Admin" && "System settings, security, integrations, technical support"}
                          {formData.adminLevel === "Finance Admin" && "Payroll, benefits, financial reports, billing"}
                          {formData.adminLevel === "Department Admin" && `Limited to ${formData.departmentScope || "selected department"} management`}
                          {formData.adminLevel === "Read-Only Admin" && "View access to reports and analytics only"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Justification</h4>
                      <div className="text-sm text-gray-600">
                        <div className="p-2 bg-gray-50 rounded text-xs">
                          {formData.justification || "Not provided"}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {formData.justification.length}/20 characters
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Acknowledgments</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${formData.confirmAdminAccess ? "bg-green-500" : "bg-red-500"}`}></div>
                          <span>Admin access confirmed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${formData.notifyAdmins ? "bg-green-500" : "bg-gray-300"}`}></div>
                          <span>Notify other admins</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${formData.sendSetupInstructions ? "bg-green-500" : "bg-gray-300"}`}></div>
                          <span>Send setup instructions</span>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Role & Department</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Department:</span> {
                          departments.find(d => d.id === formData.departmentId)?.name || "Not selected"
                        }
                      </div>
                      <div>
                        <span className="font-medium">Role:</span> {
                          roles.find(r => r.id === formData.roleId)?.name || "Not selected"
                        }
                      </div>
                    </div>
                  </div>
                )}

                {/* Employee-specific fields */}
                {activeTab === "employee" && (
                  <>
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Employment Details</h4>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Type:</span> {formData.employeeType}
                        </div>
                        <div>
                          <span className="font-medium">Location:</span> {formData.workLocation}
                        </div>
                        <div>
                          <span className="font-medium">Start Date:</span> {
                            formData.startDate ? new Date(formData.startDate).toLocaleDateString() : "Not selected"
                          }
                        </div>
                        <div>
                          <span className="font-medium">Salary:</span> {formData.salary || "Not specified"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Manager/Supervisor</h4>
                      <div className="text-sm text-gray-600">
                        {formData.managerId ? (
                          employees.find(e => e.id === formData.managerId)?.name || "Unknown manager"
                        ) : (
                          "No manager assigned"
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Status Indicators */}
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Status</h4>
                  <div className="space-y-2">
                    {activeTab === "employee" ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            formData.fullName && formData.email && formData.employeeId ? "bg-green-500" : "bg-gray-300"
                          }`}></div>
                          <span className="text-xs text-gray-600">Basic Info</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            formData.departmentId && formData.roleId ? "bg-green-500" : "bg-gray-300"
                          }`}></div>
                          <span className="text-xs text-gray-600">Role & Department</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            formData.employeeType && formData.workLocation && formData.startDate && formData.salary ? "bg-green-500" : "bg-gray-300"
                          }`}></div>
                          <span className="text-xs text-gray-600">Employment Details</span>
                        </div>
                      </>
                    ) : activeTab === "admin" ? (
                      <>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            formData.firstName && formData.lastName && formData.email ? "bg-green-500" : "bg-gray-300"
                          }`}></div>
                          <span className="text-xs text-gray-600">Basic Info</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            formData.adminLevel && formData.permissionLevel ? "bg-green-500" : "bg-gray-300"
                          }`}></div>
                          <span className="text-xs text-gray-600">Admin Level & Permissions</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            formData.justification.length >= 20 && formData.confirmAdminAccess ? "bg-green-500" : "bg-gray-300"
                          }`}></div>
                          <span className="text-xs text-gray-600">Justification & Confirmation</span>
                        </div>
                        {formData.adminLevel === "Department Admin" && (
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              formData.departmentScope ? "bg-green-500" : "bg-gray-300"
                            }`}></div>
                            <span className="text-xs text-gray-600">Department Scope</span>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            formData.fullName && formData.email ? "bg-green-500" : "bg-gray-300"
                          }`}></div>
                          <span className="text-xs text-gray-600">Basic Info</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            formData.departmentId && formData.roleId ? "bg-green-500" : "bg-gray-300"
                          }`}></div>
                          <span className="text-xs text-gray-600">Role & Department</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Button */}
                <div className="pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    disabled={status === 'sending' || (activeTab === "employee" ? 
                      !formData.fullName || !formData.email || !formData.employeeId || 
                      !formData.departmentId || !formData.roleId || !formData.employeeType || 
                      !formData.workLocation || !formData.startDate || !formData.salary :
                      activeTab === "admin" ?
                      !formData.firstName || !formData.lastName || !formData.email || 
                      !formData.adminLevel || !formData.permissionLevel || !formData.justification || 
                      !formData.confirmAdminAccess || formData.justification.length < 20 ||
                      (formData.adminLevel === "Department Admin" && !formData.departmentScope) :
                      !formData.fullName || !formData.email || !formData.departmentId || !formData.roleId
                    )}
                    onClick={() => {
                      // Trigger form submission
                      const form = document.querySelector('form');
                      if (form) {
                        form.requestSubmit();
                      }
                    }}
                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    {status === 'sending' && (
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    )}
                    {status === 'sending' ? 'Creating Invite...' : `Invite ${getTabTitle(activeTab)}`}
                  </button>
                  
                  {/* Loading Progress Steps */}
                  {status === 'sending' && (
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${
                          currentStep === "invite" ? "bg-blue-500 animate-pulse" : 
                          currentStep === "email" || currentStep === "link" ? "bg-green-500" : "bg-gray-300"
                        }`}></div>
                        <span className={currentStep === "invite" ? "text-blue-600 font-medium" : "text-gray-600"}>
                          Creating invite record...
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${
                          currentStep === "email" ? "bg-blue-500 animate-pulse" : 
                          currentStep === "link" ? "bg-green-500" : "bg-gray-300"
                        }`}></div>
                        <span className={currentStep === "email" ? "text-blue-600 font-medium" : "text-gray-600"}>
                          Sending email notification...
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className={`w-2 h-2 rounded-full ${
                          currentStep === "link" ? "bg-blue-500 animate-pulse" : "bg-gray-300"
                        }`}></div>
                        <span className={currentStep === "link" ? "text-blue-600 font-medium" : "text-gray-600"}>
                          Generating invite link...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


