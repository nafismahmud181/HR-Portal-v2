"use client";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";

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
    orgRole: "employee"
  });
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [emailSendStatus, setEmailSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailSendMessage, setEmailSendMessage] = useState("");
  const [currentStep, setCurrentStep] = useState<"invite" | "email" | "link">("invite");

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
          setOrgId(parentOrg ? parentOrg.id : null);
        } else {
          // Fallback: find org where current user is the creator
          const orgsCol = collection(db, "organizations");
          const orgsQ = query(orgsCol, where("createdBy", "==", user.uid));
          const orgsSnap = await getDocs(orgsQ);
          if (!orgsSnap.empty) {
            setOrgId(orgsSnap.docs[0].id);
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
    if (formData.fullName && activeTab === "employee") {
      const nameParts = formData.fullName.trim().split(" ");
      if (nameParts.length >= 2) {
        const firstName = nameParts[0].toUpperCase();
        const lastName = nameParts[nameParts.length - 1].toUpperCase();
        const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
        const generatedId = `${firstName}${lastName}${randomNum}`;
        setFormData(prev => ({ ...prev, employeeId: generatedId }));
      }
    }
  }, [formData.fullName, activeTab]);

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
    } else {
      // Manager and Admin tabs only require basic fields
      if (!formData.fullName || !formData.email || !formData.departmentId || !formData.roleId) {
        console.log("Manager/Admin validation failed:", { 
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
          orgRole: activeTab
        });
        setStatus("idle");
        setMessage("");
        setEmailSendStatus("idle");
        setEmailSendMessage("");
        setCurrentStep("invite");
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

  const updateFormData = (field: keyof FormData, value: string) => {
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
                  <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1">
                    Employee ID *
                  </label>
                  <input
                    id="employeeId"
                    type="text"
                    required
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Auto-generated"
                    value={formData.employeeId}
                    onChange={(e) => updateFormData("employeeId", e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">Auto-generated based on name, but can be edited</p>
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
          ) : (
            <>
              {/* Basic Information for Manager/Admin */}
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
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={status === 'sending' || (activeTab === "employee" ? 
                !formData.fullName || !formData.email || !formData.employeeId || 
                !formData.departmentId || !formData.roleId || !formData.employeeType || 
                !formData.workLocation || !formData.startDate || !formData.salary :
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
            <div className="mt-4 pt-4 border-t border-gray-200">
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
                    orgRole: activeTab
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
                  </div>
                </div>

                {/* Role & Department */}
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


