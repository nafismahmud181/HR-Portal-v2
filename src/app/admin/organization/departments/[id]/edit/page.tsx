"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  collectionGroup, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
import Link from "next/link";

interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  type: string;
  parentId?: string;
  costCenterCode?: string;
  location?: string[];
  managerId?: string;
  deputyManagerId?: string;
  budget?: number;
  currency?: string;
  approvalLimits?: number;
  workingHours?: string;
  flexibleHours?: boolean;
  leaveApprovalChain?: string[];
  expenseApprovalProcess?: string[];
  reportingSchedule?: string;
  kpiTracking?: string[];
  createdAt: string;
  updatedAt?: string;
  status: "draft" | "active" | "inactive";
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  departmentId?: string;
  position?: string;
}

interface ChangeLog {
  id: string;
  field: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedAt: string;
  reason?: string;
}

interface ImpactAnalysis {
  affectedEmployees: number;
  budgetImpact: number;
  workflowChanges: string[];
  riskLevel: "low" | "medium" | "high";
}

const COMMON_DEPARTMENTS = [
  "Human Resources", "Finance", "Marketing", "Sales", "Engineering", 
  "Operations", "Customer Support", "Legal", "IT", "Administration",
  "Research & Development", "Quality Assurance", "Procurement", 
  "Facilities", "Security", "Training", "Compliance"
];

const DEPARTMENT_TYPES = [
  { value: "core", label: "Core" },
  { value: "support", label: "Support" },
  { value: "project-based", label: "Project-based" },
  { value: "temporary", label: "Temporary" }
];

const CURRENCIES = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "INR", label: "Indian Rupee (₹)" },
  { value: "CAD", label: "Canadian Dollar (C$)" }
];

export default function EditDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const departmentId = params.id as string;
  
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departmentEmployees, setDepartmentEmployees] = useState<Employee[]>([]);
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showImpactAnalysis, setShowImpactAnalysis] = useState(false);
  const [impactAnalysis, setImpactAnalysis] = useState<ImpactAnalysis | null>(null);
  const [showBulkTransfer, setShowBulkTransfer] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [transferTargetDept, setTransferTargetDept] = useState<string>("");
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);

  const [originalData, setOriginalData] = useState<Department | null>(null);
  const [formData, setFormData] = useState<Partial<Department>>({});

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
          router.replace("/login");
          return;
        }
        const role = (snap.docs[0].data() as { role?: string }).role;
        if (role !== "admin") {
          router.replace("/login");
          return;
        }
        
        const parentOrg = snap.docs[0].ref.parent.parent;
        const foundOrgId = parentOrg ? parentOrg.id : null;
        setOrgId(foundOrgId);
        
        if (foundOrgId) {
          await loadDepartment(foundOrgId);
          await loadDepartments(foundOrgId);
          await loadEmployees(foundOrgId);
          await loadChangeLogs(foundOrgId);
        }
        setLoading(false);
      } catch {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router, departmentId]);

  const loadDepartment = async (orgId: string) => {
    try {
      const deptRef = doc(db, "organizations", orgId, "departments", departmentId);
      const deptSnap = await getDoc(deptRef);
      
      if (deptSnap.exists()) {
        const deptData = { id: deptSnap.id, ...deptSnap.data() } as Department;
        setOriginalData(deptData);
        setFormData(deptData);
      } else {
        router.replace("/admin/organization/departments");
      }
    } catch (error) {
      console.error("Error loading department:", error);
      router.replace("/admin/organization/departments");
    }
  };

  const loadDepartments = async (orgId: string) => {
    try {
      const deptCol = collection(db, "organizations", orgId, "departments");
      const snap = await getDocs(deptCol);
      const deptList = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Department[];
      setDepartments(deptList.filter(dept => dept.id !== departmentId));
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  };

  const loadEmployees = async (orgId: string) => {
    try {
      const empCol = collection(db, "organizations", orgId, "employees");
      const snap = await getDocs(empCol);
      const empList = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      setEmployees(empList);
      setDepartmentEmployees(empList.filter(emp => emp.departmentId === departmentId));
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  const loadChangeLogs = async (orgId: string) => {
    try {
      const logsCol = collection(db, "organizations", orgId, "changeLogs");
      const q = query(logsCol, where("entityId", "==", departmentId), where("entityType", "==", "department"));
      const snap = await getDocs(q);
      const logs = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChangeLog[];
      setChangeLogs(logs.sort((a, b) => new Date(b.changedAt).getTime() - new Date(a.changedAt).getTime()));
    } catch (error) {
      console.error("Error loading change logs:", error);
      // Set empty array instead of leaving undefined
      setChangeLogs([]);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }

    // Show suggestions for department name
    if (field === "name") {
      const filtered = COMMON_DEPARTMENTS.filter(dept =>
        dept.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(value.length > 0 && filtered.length > 0);
    }

    // Trigger impact analysis for major changes
    if (["name", "managerId", "parentId", "status"].includes(field)) {
      analyzeImpact();
    }
  };

  const analyzeImpact = () => {
    if (!originalData) return;

    const changes: string[] = [];
    let affectedEmployees = departmentEmployees.length;
    let budgetImpact = 0;
    let riskLevel: "low" | "medium" | "high" = "low";

    // Analyze name change
    if (formData.name !== originalData.name) {
      changes.push("Department name change");
      riskLevel = "medium";
    }

    // Analyze manager change
    if (formData.managerId !== originalData.managerId) {
      changes.push("Manager reassignment");
      riskLevel = "high";
    }

    // Analyze parent department change
    if (formData.parentId !== originalData.parentId) {
      changes.push("Organizational structure change");
      riskLevel = "high";
    }

    // Analyze status change
    if (formData.status !== originalData.status) {
      changes.push("Department status change");
      if (formData.status === "inactive") {
        riskLevel = "high";
        budgetImpact = originalData.budget || 0;
      }
    }

    // Analyze budget change
    if (formData.budget !== originalData.budget) {
      changes.push("Budget allocation change");
      budgetImpact = (formData.budget || 0) - (originalData.budget || 0);
      if (Math.abs(budgetImpact) > 10000) {
        riskLevel = "medium";
      }
    }

    setImpactAnalysis({
      affectedEmployees,
      budgetImpact,
      workflowChanges: changes,
      riskLevel
    });
    setShowImpactAnalysis(changes.length > 0);
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      newErrors.name = "Department name is required";
    } else if (departments.some(dept => dept.name.toLowerCase() === formData.name?.toLowerCase())) {
      newErrors.name = "Department name already exists";
    }

    if (formData.code && departments.some(dept => dept.code === formData.code)) {
      newErrors.code = "Department code already exists";
    }

    if (formData.budget && formData.budget < 0) {
      newErrors.budget = "Budget cannot be negative";
    }

    if (formData.approvalLimits && formData.approvalLimits < 0) {
      newErrors.approvalLimits = "Approval limits cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const logChanges = async (changes: Array<{field: string, oldValue: any, newValue: any}>) => {
    if (!orgId || !auth.currentUser) return;

    const batch = writeBatch(db);
    
    for (const change of changes) {
      const logRef = doc(collection(db, "organizations", orgId, "changeLogs"));
      batch.set(logRef, {
        entityType: "department",
        entityId: departmentId,
        field: change.field,
        oldValue: change.oldValue,
        newValue: change.newValue,
        changedBy: auth.currentUser.uid,
        changedAt: serverTimestamp(),
        reason: notificationMessage || "Department update"
      });
    }

    await batch.commit();
    await loadChangeLogs(orgId);
  };

  const sendNotifications = async (changes: Array<{field: string, oldValue: any, newValue: any}>) => {
    if (!orgId || !notificationMessage) return;

    const notifications = departmentEmployees.map(emp => ({
      employeeId: emp.id,
      type: "department_change",
      title: "Department Update Notification",
      message: notificationMessage,
      departmentId: departmentId,
      changes: changes,
      createdAt: new Date().toISOString(),
      read: false
    }));

    const batch = writeBatch(db);
    notifications.forEach(notification => {
      const notifRef = doc(collection(db, "organizations", orgId, "notifications"));
      batch.set(notifRef, notification);
    });

    await batch.commit();
  };

  const handleBulkTransfer = async () => {
    if (!orgId || selectedEmployees.length === 0 || !transferTargetDept) return;

    setSaving(true);
    try {
      const batch = writeBatch(db);
      
      // Update employee department assignments
      selectedEmployees.forEach(empId => {
        const empRef = doc(db, "organizations", orgId, "employees", empId);
        batch.update(empRef, { 
          departmentId: transferTargetDept,
          updatedAt: serverTimestamp()
        });
      });

      // Log the bulk transfer
      const logRef = doc(collection(db, "organizations", orgId, "changeLogs"));
      batch.set(logRef, {
        entityType: "department",
        entityId: departmentId,
        field: "bulk_employee_transfer",
        oldValue: selectedEmployees,
        newValue: transferTargetDept,
        changedBy: auth.currentUser?.uid,
        changedAt: serverTimestamp(),
        reason: `Bulk transfer of ${selectedEmployees.length} employees`
      });

      await batch.commit();
      
      // Reload data
      await loadEmployees(orgId);
      await loadChangeLogs(orgId);
      
      setShowBulkTransfer(false);
      setSelectedEmployees([]);
      setTransferTargetDept("");
    } catch (error) {
      console.error("Error in bulk transfer:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !originalData) return;
    
    setSaving(true);
    try {
      // Identify changes
      const changes: Array<{field: string, oldValue: any, newValue: any}> = [];
      
      Object.keys(formData).forEach(key => {
        if (formData[key as keyof Department] !== originalData[key as keyof Department]) {
          changes.push({
            field: key,
            oldValue: originalData[key as keyof Department],
            newValue: formData[key as keyof Department]
          });
        }
      });

      if (changes.length === 0) {
        setSaving(false);
        return;
      }

      // Update department
      const deptRef = doc(db, "organizations", orgId!, "departments", departmentId);
      await updateDoc(deptRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });

      // Log changes
      await logChanges(changes);

      // Send notifications if enabled
      if (showNotifications && notificationMessage) {
        await sendNotifications(changes);
      }

      router.push("/admin/organization/departments");
    } catch (error) {
      console.error("Error updating department:", error);
    } finally {
      setSaving(false);
    }
  };

  const getManagerName = (managerId?: string) => {
    if (!managerId) return "—";
    const manager = employees.find(emp => emp.id === managerId);
    return manager?.name || "Unknown";
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]",
      draft: "bg-[#fffbeb] text-[#b45309] border-[#fde68a]",
      inactive: "bg-[#f3f4f6] text-[#6b7280] border-[#d1d5db]"
    };
    
    return (
      <span className={`text-[12px] px-2 py-1 rounded-full border ${styles[status as keyof typeof styles] || styles.inactive}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffffff]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#f97316] border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-[14px] text-[#6b7280]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-semibold">Edit Department</h1>
            <p className="mt-2 text-[14px] text-[#6b7280]">
              Update department information and manage organizational changes.
            </p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/admin/organization/departments" 
              className="px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] hover:bg-[#f9fafb]"
            >
              Cancel
            </Link>
            <button
              onClick={() => setShowBulkTransfer(true)}
              className="px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] hover:bg-[#f9fafb]"
            >
              Bulk Transfer
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Basic Information */}
              <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h2 className="text-[18px] font-semibold mb-4">Basic Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-[14px] font-medium mb-2">
                      Department Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.name || ""}
                        onChange={(e) => handleInputChange("name", e.target.value)}
                        className={`w-full px-3 py-2 border rounded-md text-[14px] ${
                          errors.name ? "border-red-500" : "border-[#d1d5db]"
                        } focus:outline-none focus:ring-2 focus:ring-[#f97316]`}
                        placeholder="Enter department name"
                      />
                      {showSuggestions && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-[#d1d5db] rounded-md shadow-lg">
                          {suggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              type="button"
                              className="w-full px-3 py-2 text-left text-[14px] hover:bg-[#f9fafb]"
                              onClick={() => {
                                handleInputChange("name", suggestion);
                                setShowSuggestions(false);
                              }}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    {errors.name && <p className="mt-1 text-[12px] text-red-500">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium mb-2">Department Code</label>
                    <input
                      type="text"
                      value={formData.code || ""}
                      onChange={(e) => handleInputChange("code", e.target.value)}
                      className={`w-full px-3 py-2 border rounded-md text-[14px] ${
                        errors.code ? "border-red-500" : "border-[#d1d5db]"
                      } focus:outline-none focus:ring-2 focus:ring-[#f97316]`}
                      placeholder="Auto-generated or manual"
                    />
                    {errors.code && <p className="mt-1 text-[12px] text-red-500">{errors.code}</p>}
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium mb-2">Department Type</label>
                    <select
                      value={formData.type || "core"}
                      onChange={(e) => handleInputChange("type", e.target.value)}
                      className="w-full px-3 py-2 border border-[#d1d5db] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                    >
                      {DEPARTMENT_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[14px] font-medium mb-2">Description/Purpose</label>
                    <textarea
                      value={formData.description || ""}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-[#d1d5db] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                      placeholder="Describe the department's purpose and responsibilities..."
                    />
                  </div>
                </div>
              </section>

              {/* Hierarchy & Structure */}
              <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h2 className="text-[18px] font-semibold mb-4">Hierarchy & Structure</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[14px] font-medium mb-2">Parent Department</label>
                    <select
                      value={formData.parentId || ""}
                      onChange={(e) => handleInputChange("parentId", e.target.value)}
                      className="w-full px-3 py-2 border border-[#d1d5db] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                    >
                      <option value="">Top-level department</option>
                      {departments.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium mb-2">Cost Center Code</label>
                    <input
                      type="text"
                      value={formData.costCenterCode || ""}
                      onChange={(e) => handleInputChange("costCenterCode", e.target.value)}
                      className="w-full px-3 py-2 border border-[#d1d5db] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                      placeholder="e.g., CC001"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[14px] font-medium mb-2">Location/Office</label>
                    <input
                      type="text"
                      value={formData.location?.join(", ") || ""}
                      onChange={(e) => handleInputChange("location", e.target.value.split(",").map(s => s.trim()).filter(s => s))}
                      className="w-full px-3 py-2 border border-[#d1d5db] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                      placeholder="Enter locations separated by commas"
                    />
                  </div>
                </div>
              </section>

              {/* Leadership & Management */}
              <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h2 className="text-[18px] font-semibold mb-4">Leadership & Management</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[14px] font-medium mb-2">Department Head/Manager</label>
                    <select
                      value={formData.managerId || ""}
                      onChange={(e) => handleInputChange("managerId", e.target.value)}
                      className="w-full px-3 py-2 border border-[#d1d5db] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                    >
                      <option value="">Assign Later</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium mb-2">Deputy/Assistant Manager</label>
                    <select
                      value={formData.deputyManagerId || ""}
                      onChange={(e) => handleInputChange("deputyManagerId", e.target.value)}
                      className="w-full px-3 py-2 border border-[#d1d5db] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                    >
                      <option value="">None</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.email})</option>
                      ))}
                    </select>
                  </div>
                </div>
              </section>

              {/* Financial Information */}
              <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h2 className="text-[18px] font-semibold mb-4">Financial Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[14px] font-medium mb-2">Budget Allocation</label>
                    <input
                      type="number"
                      value={formData.budget || ""}
                      onChange={(e) => handleInputChange("budget", parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md text-[14px] ${
                        errors.budget ? "border-red-500" : "border-[#d1d5db]"
                      } focus:outline-none focus:ring-2 focus:ring-[#f97316]`}
                      placeholder="0"
                    />
                    {errors.budget && <p className="mt-1 text-[12px] text-red-500">{errors.budget}</p>}
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium mb-2">Currency</label>
                    <select
                      value={formData.currency || "USD"}
                      onChange={(e) => handleInputChange("currency", e.target.value)}
                      className="w-full px-3 py-2 border border-[#d1d5db] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                    >
                      {CURRENCIES.map(currency => (
                        <option key={currency.value} value={currency.value}>{currency.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[14px] font-medium mb-2">Approval Limits</label>
                    <input
                      type="number"
                      value={formData.approvalLimits || ""}
                      onChange={(e) => handleInputChange("approvalLimits", parseFloat(e.target.value) || 0)}
                      className={`w-full px-3 py-2 border rounded-md text-[14px] ${
                        errors.approvalLimits ? "border-red-500" : "border-[#d1d5db]"
                      } focus:outline-none focus:ring-2 focus:ring-[#f97316]`}
                      placeholder="0"
                    />
                    {errors.approvalLimits && <p className="mt-1 text-[12px] text-red-500">{errors.approvalLimits}</p>}
                  </div>
                </div>
              </section>

              {/* Operational Settings */}
              <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h2 className="text-[18px] font-semibold mb-4">Operational Settings</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[14px] font-medium mb-2">Working Hours</label>
                    <input
                      type="text"
                      value={formData.workingHours || ""}
                      onChange={(e) => handleInputChange("workingHours", e.target.value)}
                      className="w-full px-3 py-2 border border-[#d1d5db] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                      placeholder="9:00 AM - 5:00 PM"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="flexibleHours"
                      checked={formData.flexibleHours || false}
                      onChange={(e) => handleInputChange("flexibleHours", e.target.checked)}
                      className="h-4 w-4 text-[#f97316] focus:ring-[#f97316] border-[#d1d5db] rounded"
                    />
                    <label htmlFor="flexibleHours" className="ml-2 text-[14px]">
                      Allow flexible hours
                    </label>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[14px] font-medium mb-2">Reporting Schedule</label>
                    <select
                      value={formData.reportingSchedule || "monthly"}
                      onChange={(e) => handleInputChange("reportingSchedule", e.target.value)}
                      className="w-full px-3 py-2 border border-[#d1d5db] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                    >
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="annually">Annually</option>
                    </select>
                  </div>
                </div>
              </section>

              {/* Notification Settings */}
              <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h2 className="text-[18px] font-semibold mb-4">Employee Notifications</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="sendNotifications"
                      checked={showNotifications}
                      onChange={(e) => setShowNotifications(e.target.checked)}
                      className="h-4 w-4 text-[#f97316] focus:ring-[#f97316] border-[#d1d5db] rounded"
                    />
                    <label htmlFor="sendNotifications" className="ml-2 text-[14px]">
                      Send notifications to department employees about changes
                    </label>
                  </div>
                  
                  {showNotifications && (
                    <div>
                      <label className="block text-[14px] font-medium mb-2">Notification Message</label>
                      <textarea
                        value={notificationMessage}
                        onChange={(e) => setNotificationMessage(e.target.value)}
                        rows={3}
                        className="w-full px-3 py-2 border border-[#d1d5db] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                        placeholder="Explain the changes and their impact to employees..."
                      />
                    </div>
                  )}
                </div>
              </section>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-[#1f2937] text-white rounded-md text-[14px] font-medium hover:bg-[#111827] disabled:opacity-50"
                >
                  {saving ? "Updating..." : "Update Department"}
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Impact Analysis */}
              {showImpactAnalysis && impactAnalysis && (
                <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                  <h3 className="text-[16px] font-semibold mb-4">Impact Analysis</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] text-[#6b7280]">Risk Level</span>
                      <span className={`text-[12px] px-2 py-1 rounded-full ${
                        impactAnalysis.riskLevel === "high" ? "bg-red-100 text-red-800" :
                        impactAnalysis.riskLevel === "medium" ? "bg-yellow-100 text-yellow-800" :
                        "bg-green-100 text-green-800"
                      }`}>
                        {impactAnalysis.riskLevel.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] text-[#6b7280]">Affected Employees</span>
                      <span className="text-[14px] font-medium">{impactAnalysis.affectedEmployees}</span>
                    </div>
                    
                    {impactAnalysis.budgetImpact !== 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-[14px] text-[#6b7280]">Budget Impact</span>
                        <span className={`text-[14px] font-medium ${
                          impactAnalysis.budgetImpact > 0 ? "text-green-600" : "text-red-600"
                        }`}>
                          {impactAnalysis.budgetImpact > 0 ? "+" : ""}
                          {formData.currency || "USD"} {Math.abs(impactAnalysis.budgetImpact).toLocaleString()}
                        </span>
                      </div>
                    )}
                    
                    {impactAnalysis.workflowChanges.length > 0 && (
                      <div>
                        <span className="text-[14px] text-[#6b7280] block mb-2">Workflow Changes</span>
                        <ul className="text-[12px] space-y-1">
                          {impactAnalysis.workflowChanges.map((change, index) => (
                            <li key={index} className="flex items-center">
                              <span className="w-1 h-1 bg-[#f97316] rounded-full mr-2"></span>
                              {change}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Department Employees */}
              <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h3 className="text-[16px] font-semibold mb-4">Department Employees</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#6b7280]">Total Employees</span>
                    <span className="text-[14px] font-medium">{departmentEmployees.length}</span>
                  </div>
                  
                  {departmentEmployees.length > 0 && (
                    <div className="max-h-48 overflow-y-auto">
                      {departmentEmployees.map(emp => (
                        <div key={emp.id} className="flex items-center justify-between py-2 border-b border-[#f3f4f6] last:border-b-0">
                          <div>
                            <div className="text-[12px] font-medium">{emp.name}</div>
                            <div className="text-[11px] text-[#6b7280]">{emp.position || emp.role}</div>
                          </div>
                          <input
                            type="checkbox"
                            checked={selectedEmployees.includes(emp.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEmployees(prev => [...prev, emp.id]);
                              } else {
                                setSelectedEmployees(prev => prev.filter(id => id !== emp.id));
                              }
                            }}
                            className="h-3 w-3 text-[#f97316] focus:ring-[#f97316] border-[#d1d5db] rounded"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Change History */}
              <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h3 className="text-[16px] font-semibold mb-4">Change History</h3>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {changeLogs.length === 0 ? (
                    <p className="text-[12px] text-[#6b7280]">No changes recorded yet.</p>
                  ) : (
                    changeLogs.map((log, index) => (
                      <div key={index} className="border-l-2 border-[#e5e7eb] pl-3">
                        <div className="text-[12px] font-medium">{log.field.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className="text-[11px] text-[#6b7280]">
                          {new Date(log.changedAt).toLocaleString()}
                        </div>
                        {log.reason && (
                          <div className="text-[11px] text-[#6b7280] mt-1">{log.reason}</div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bulk Transfer Modal */}
        {showBulkTransfer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-[18px] font-semibold mb-4">Bulk Employee Transfer</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[14px] font-medium mb-2">Transfer to Department</label>
                  <select
                    value={transferTargetDept}
                    onChange={(e) => setTransferTargetDept(e.target.value)}
                    className="w-full px-3 py-2 border border-[#d1d5db] rounded-md text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                  >
                    <option value="">Select department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-[14px] font-medium mb-2">
                    Selected Employees ({selectedEmployees.length})
                  </label>
                  <div className="text-[12px] text-[#6b7280]">
                    {selectedEmployees.length === 0 
                      ? "No employees selected" 
                      : `${selectedEmployees.length} employees selected for transfer`
                    }
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowBulkTransfer(false)}
                  className="px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] hover:bg-[#f9fafb]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkTransfer}
                  disabled={selectedEmployees.length === 0 || !transferTargetDept || saving}
                  className="px-4 py-2 bg-[#1f2937] text-white rounded-md text-[14px] hover:bg-[#111827] disabled:opacity-50"
                >
                  {saving ? "Transferring..." : "Transfer Employees"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
