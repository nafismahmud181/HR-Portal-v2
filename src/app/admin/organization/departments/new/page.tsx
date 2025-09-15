"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, getDocs, query, where, addDoc } from "firebase/firestore";
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
  status: "draft" | "active" | "inactive";
}

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
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

export default function CreateDepartmentPage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [draftSaved, setDraftSaved] = useState(false);

  const [formData, setFormData] = useState<Partial<Department>>({
    name: "",
    code: "",
    description: "",
    type: "core",
    parentId: "",
    costCenterCode: "",
    location: [],
    managerId: "",
    deputyManagerId: "",
    budget: 0,
    currency: "USD",
    approvalLimits: 0,
    workingHours: "9:00 AM - 5:00 PM",
    flexibleHours: false,
    leaveApprovalChain: [],
    expenseApprovalProcess: [],
    reportingSchedule: "monthly",
    kpiTracking: [],
    status: "draft"
  });

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
          await loadDepartments(foundOrgId);
          await loadEmployees(foundOrgId);
        }
        setLoading(false);
      } catch {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

  const loadDepartments = async (orgId: string) => {
    try {
      const deptCol = collection(db, "organizations", orgId, "departments");
      const snap = await getDocs(deptCol);
      const deptList = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Department[];
      setDepartments(deptList);
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
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  const handleInputChange = (field: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }

    // Auto-generate department code from name
    if (field === "name" && !formData.code && typeof value === "string") {
      const code = value.toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .replace(/\s+/g, "-")
        .substring(0, 10);
      setFormData(prev => ({ ...prev, code }));
    }

    // Show suggestions for department name
    if (field === "name" && typeof value === "string") {
      const filtered = COMMON_DEPARTMENTS.filter(dept =>
        dept.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(value.length > 0 && filtered.length > 0);
    }
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

  const saveDraft = async () => {
    if (!orgId) return;
    
    setSaving(true);
    try {
      const deptData = {
        ...formData,
        createdAt: new Date().toISOString(),
        status: "draft"
      };
      
      await addDoc(collection(db, "organizations", orgId, "departments"), deptData);
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 3000);
    } catch (error) {
      console.error("Error saving draft:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      const deptData = {
        ...formData,
        createdAt: new Date().toISOString(),
        status: "active"
      };
      
      await addDoc(collection(db, "organizations", orgId!, "departments"), deptData);
      router.push("/admin/organization/departments");
    } catch (error) {
      console.error("Error creating department:", error);
    } finally {
      setSaving(false);
    }
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
            <h1 className="text-[28px] font-semibold">Create Department</h1>
            <p className="mt-2 text-[14px] text-[#6b7280]">Set up a new department with all necessary configurations.</p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/admin/organization/departments" 
              className="px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] hover:bg-[#f9fafb]"
            >
              Cancel
            </Link>
            <button
              onClick={saveDraft}
              disabled={saving}
              className="px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] hover:bg-[#f9fafb] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Draft"}
            </button>
            {draftSaved && (
              <span className="px-4 py-2 text-[12px] text-[#059669] bg-[#ecfdf5] rounded-md">
                Draft saved!
              </span>
            )}
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

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 bg-[#1f2937] text-white rounded-md text-[14px] font-medium hover:bg-[#111827] disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Department"}
                </button>
              </div>
            </form>
          </div>

          {/* Preview Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h3 className="text-[16px] font-semibold mb-4">Department Preview</h3>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[14px] font-medium text-[#6b7280]">Name</h4>
                    <p className="text-[14px]">{formData.name || "Untitled Department"}</p>
                  </div>
                  
                  {formData.code && (
                    <div>
                      <h4 className="text-[14px] font-medium text-[#6b7280]">Code</h4>
                      <p className="text-[14px]">{formData.code}</p>
                    </div>
                  )}
                  
                  <div>
                    <h4 className="text-[14px] font-medium text-[#6b7280]">Type</h4>
                    <p className="text-[14px] capitalize">{formData.type || "Core"}</p>
                  </div>
                  
                  {formData.parentId && (
                    <div>
                      <h4 className="text-[14px] font-medium text-[#6b7280]">Parent Department</h4>
                      <p className="text-[14px]">
                        {departments.find(d => d.id === formData.parentId)?.name || "Unknown"}
                      </p>
                    </div>
                  )}
                  
                  {formData.managerId && (
                    <div>
                      <h4 className="text-[14px] font-medium text-[#6b7280]">Manager</h4>
                      <p className="text-[14px]">
                        {employees.find(e => e.id === formData.managerId)?.name || "Unknown"}
                      </p>
                    </div>
                  )}
                  
                  {formData.budget && formData.budget > 0 && (
                    <div>
                      <h4 className="text-[14px] font-medium text-[#6b7280]">Budget</h4>
                      <p className="text-[14px]">
                        {formData.currency} {formData.budget.toLocaleString()}
                      </p>
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
