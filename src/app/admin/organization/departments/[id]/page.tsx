"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  collection, 
  collectionGroup, 
  getDocs, 
  query, 
  where, 
  doc, 
  getDoc 
} from "firebase/firestore";

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
  position?: string;
  departmentId?: string;
  hireDate?: string;
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

export default function ViewDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const departmentId = params.id as string;
  
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState<Department | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [changeLogs, setChangeLogs] = useState<ChangeLog[]>([]);
  const [parentDepartment, setParentDepartment] = useState<Department | null>(null);
  const [manager, setManager] = useState<Employee | null>(null);
  const [deputyManager, setDeputyManager] = useState<Employee | null>(null);

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
        setDepartment(deptData);
        
        // Load parent department if exists
        if (deptData.parentId) {
          const parentRef = doc(db, "organizations", orgId, "departments", deptData.parentId);
          const parentSnap = await getDoc(parentRef);
          if (parentSnap.exists()) {
            setParentDepartment({ id: parentSnap.id, ...parentSnap.data() } as Department);
          }
        }
      } else {
        router.replace("/admin/organization/departments");
      }
    } catch (error) {
      console.error("Error loading department:", error);
      router.replace("/admin/organization/departments");
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
      
      // Set manager and deputy manager
      if (department?.managerId) {
        const managerEmp = empList.find(emp => emp.id === department.managerId);
        setManager(managerEmp || null);
      }
      
      if (department?.deputyManagerId) {
        const deputyEmp = empList.find(emp => emp.id === department.deputyManagerId);
        setDeputyManager(deputyEmp || null);
      }
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

  const departmentEmployees = employees.filter(emp => emp.departmentId === departmentId);

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

  if (!department) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffffff]">
        <div className="text-center">
          <h1 className="text-[24px] font-semibold text-[#1a1a1a]">Department Not Found</h1>
          <p className="mt-2 text-[14px] text-[#6b7280]">The department you're looking for doesn't exist.</p>
          <Link 
            href="/admin/organization/departments"
            className="mt-4 inline-block px-4 py-2 bg-[#1f2937] text-white rounded-md text-[14px] hover:bg-[#111827]"
          >
            Back to Departments
          </Link>
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
            <h1 className="text-[28px] font-semibold">{department.name}</h1>
            <p className="mt-2 text-[14px] text-[#6b7280]">
              Department details and management information.
            </p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/admin/organization/departments" 
              className="px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] hover:bg-[#f9fafb]"
            >
              Back to Departments
            </Link>
            <Link 
              href={`/admin/organization/departments/${departmentId}/edit`}
              className="px-4 py-2 bg-[#1f2937] text-white rounded-md text-[14px] hover:bg-[#111827]"
            >
              Edit Department
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <h2 className="text-[18px] font-semibold mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Department Name</label>
                  <p className="text-[14px]">{department.name}</p>
                </div>
                
                {department.code && (
                  <div>
                    <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Department Code</label>
                    <p className="text-[14px]">{department.code}</p>
                  </div>
                )}
                
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Department Type</label>
                  <p className="text-[14px] capitalize">{department.type}</p>
                </div>
                
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Status</label>
                  <div className="mt-1">{getStatusBadge(department.status)}</div>
                </div>
                
                {department.description && (
                  <div className="md:col-span-2">
                    <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Description</label>
                    <p className="text-[14px]">{department.description}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Hierarchy & Structure */}
            <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <h2 className="text-[18px] font-semibold mb-4">Hierarchy & Structure</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Parent Department</label>
                  <p className="text-[14px]">{parentDepartment?.name || "Top-level department"}</p>
                </div>
                
                {department.costCenterCode && (
                  <div>
                    <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Cost Center Code</label>
                    <p className="text-[14px]">{department.costCenterCode}</p>
                  </div>
                )}
                
                {department.location && department.location.length > 0 && (
                  <div className="md:col-span-2">
                    <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Locations</label>
                    <p className="text-[14px]">{department.location.join(", ")}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Leadership & Management */}
            <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <h2 className="text-[18px] font-semibold mb-4">Leadership & Management</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Department Manager</label>
                  <p className="text-[14px]">{manager?.name || "Not assigned"}</p>
                  {manager?.email && (
                    <p className="text-[12px] text-[#6b7280]">{manager.email}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Deputy Manager</label>
                  <p className="text-[14px]">{deputyManager?.name || "Not assigned"}</p>
                  {deputyManager?.email && (
                    <p className="text-[12px] text-[#6b7280]">{deputyManager.email}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Financial Information */}
            <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <h2 className="text-[18px] font-semibold mb-4">Financial Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Budget Allocation</label>
                  <p className="text-[14px]">
                    {department.budget && department.budget > 0 
                      ? `${department.currency || 'USD'} ${department.budget.toLocaleString()}`
                      : "Not set"
                    }
                  </p>
                </div>
                
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Approval Limits</label>
                  <p className="text-[14px]">
                    {department.approvalLimits && department.approvalLimits > 0 
                      ? `${department.currency || 'USD'} ${department.approvalLimits.toLocaleString()}`
                      : "Not set"
                    }
                  </p>
                </div>
                
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Currency</label>
                  <p className="text-[14px]">{department.currency || "USD"}</p>
                </div>
              </div>
            </section>

            {/* Operational Settings */}
            <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <h2 className="text-[18px] font-semibold mb-4">Operational Settings</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Working Hours</label>
                  <p className="text-[14px]">{department.workingHours || "Not set"}</p>
                </div>
                
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Flexible Hours</label>
                  <p className="text-[14px]">{department.flexibleHours ? "Enabled" : "Disabled"}</p>
                </div>
                
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Reporting Schedule</label>
                  <p className="text-[14px] capitalize">{department.reportingSchedule || "Monthly"}</p>
                </div>
              </div>
            </section>

            {/* Department Employees */}
            <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <h2 className="text-[18px] font-semibold mb-4">Department Employees ({departmentEmployees.length})</h2>
              
              {departmentEmployees.length === 0 ? (
                <p className="text-[14px] text-[#6b7280]">No employees assigned to this department.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="text-[12px] text-[#6b7280] bg-[#f9fafb]">
                      <tr>
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Position</th>
                        <th className="px-3 py-2">Email</th>
                        <th className="px-3 py-2">Hire Date</th>
                      </tr>
                    </thead>
                    <tbody className="text-[14px] divide-y divide-[#e5e7eb]">
                      {departmentEmployees.map((emp) => (
                        <tr key={emp.id} className="hover:bg-[#f9fafb]">
                          <td className="px-3 py-3 font-medium">{emp.name}</td>
                          <td className="px-3 py-3">{emp.position || emp.role}</td>
                          <td className="px-3 py-3">{emp.email}</td>
                          <td className="px-3 py-3">
                            {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Quick Stats */}
              <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h3 className="text-[16px] font-semibold mb-4">Quick Stats</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#6b7280]">Total Employees</span>
                    <span className="text-[14px] font-medium">{departmentEmployees.length}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#6b7280]">Status</span>
                    {getStatusBadge(department.status)}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] text-[#6b7280]">Created</span>
                    <span className="text-[14px]">{new Date(department.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {department.updatedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] text-[#6b7280]">Last Updated</span>
                      <span className="text-[14px]">{new Date(department.updatedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Change History */}
              <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h3 className="text-[16px] font-semibold mb-4">Recent Changes</h3>
                
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {changeLogs.length === 0 ? (
                    <p className="text-[12px] text-[#6b7280]">No changes recorded yet.</p>
                  ) : (
                    changeLogs.slice(0, 5).map((log, index) => (
                      <div key={index} className="border-l-2 border-[#e5e7eb] pl-3">
                        <div className="text-[12px] font-medium">
                          {log.field.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
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
                
                {changeLogs.length > 5 && (
                  <button className="mt-3 text-[12px] text-[#f97316] hover:underline">
                    View all changes
                  </button>
                )}
              </div>

              {/* Actions */}
              <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h3 className="text-[16px] font-semibold mb-4">Actions</h3>
                
                <div className="space-y-3">
                  <Link 
                    href={`/admin/organization/departments/${departmentId}/edit`}
                    className="block w-full px-4 py-2 bg-[#1f2937] text-white rounded-md text-[14px] text-center hover:bg-[#111827]"
                  >
                    Edit Department
                  </Link>
                  
                  <Link 
                    href={`/admin/employees?department=${departmentId}`}
                    className="block w-full px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] text-center hover:bg-[#f9fafb]"
                  >
                    Manage Employees
                  </Link>
                  
                  <button className="block w-full px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] text-center hover:bg-[#f9fafb]">
                    Generate Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
