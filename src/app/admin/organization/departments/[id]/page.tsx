"use client";

import { useState, useEffect, useCallback } from "react";
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
  getDoc,
  writeBatch,
  serverTimestamp
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
  salary?: number;
  status?: string;
}


interface BudgetData {
  allocated: number;
  spent: number;
  remaining: number;
  categories: Array<{
    name: string;
    allocated: number;
    spent: number;
  }>;
}

interface PerformanceMetrics {
  attendanceRate: number;
  productivityScore: number;
  employeeSatisfaction: number;
  turnoverRate: number;
}

type TabType = "overview" | "employees" | "budget" | "reports";

export default function ViewDepartmentPage() {
  const router = useRouter();
  const params = useParams();
  const departmentId = params.id as string;
  
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [department, setDepartment] = useState<Department | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [parentDepartment, setParentDepartment] = useState<Department | null>(null);
  const [manager, setManager] = useState<Employee | null>(null);
  const [deputyManager, setDeputyManager] = useState<Employee | null>(null);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [transferTargetDept, setTransferTargetDept] = useState<string>("");
  const [departments, setDepartments] = useState<Department[]>([]);


  const loadDepartment = useCallback(async (orgId: string) => {
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
  }, [departmentId, router]);

  const loadEmployees = useCallback(async (orgId: string) => {
    try {
      const empCol = collection(db, "organizations", orgId, "employees");
      const snap = await getDocs(empCol);
      const empList = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      
      setEmployees(empList.filter(emp => emp.departmentId === departmentId));
      
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
  }, [departmentId, department]);

  const loadDepartments = useCallback(async (orgId: string) => {
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
  }, [departmentId]);


  const loadBudgetData = useCallback(async () => {
    // Mock budget data - in real implementation, this would come from your financial system
    const mockBudgetData: BudgetData = {
      allocated: department?.budget || 0,
      spent: Math.floor((department?.budget || 0) * 0.65), // 65% spent
      remaining: Math.floor((department?.budget || 0) * 0.35), // 35% remaining
      categories: [
        { name: "Salaries", allocated: Math.floor((department?.budget || 0) * 0.6), spent: Math.floor((department?.budget || 0) * 0.4) },
        { name: "Equipment", allocated: Math.floor((department?.budget || 0) * 0.2), spent: Math.floor((department?.budget || 0) * 0.15) },
        { name: "Training", allocated: Math.floor((department?.budget || 0) * 0.1), spent: Math.floor((department?.budget || 0) * 0.05) },
        { name: "Travel", allocated: Math.floor((department?.budget || 0) * 0.1), spent: Math.floor((department?.budget || 0) * 0.05) }
      ]
    };
    setBudgetData(mockBudgetData);
  }, [department]);

  const loadPerformanceMetrics = useCallback(async () => {
    // Mock performance data - in real implementation, this would come from your analytics system
    const mockMetrics: PerformanceMetrics = {
      attendanceRate: 94.5,
      productivityScore: 87.2,
      employeeSatisfaction: 4.3,
      turnoverRate: 8.2
    };
    setPerformanceMetrics(mockMetrics);
  }, []);

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
          await loadDepartments(foundOrgId);
          await loadBudgetData();
          await loadPerformanceMetrics();
        }
        setLoading(false);
      } catch {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router, departmentId, loadDepartment, loadEmployees, loadDepartments, loadBudgetData, loadPerformanceMetrics]);

  const handleEmployeeTransfer = async () => {
    if (!orgId || selectedEmployees.length === 0 || !transferTargetDept) return;

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
      
      setShowTransferModal(false);
      setSelectedEmployees([]);
      setTransferTargetDept("");
    } catch (error) {
      console.error("Error in bulk transfer:", error);
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

  const tabs = [
    { id: "overview", label: "Overview", icon: "📊" },
    { id: "employees", label: "Employees", icon: "👥" },
    { id: "budget", label: "Budget", icon: "💰" },
    { id: "reports", label: "Reports", icon: "📈" }
  ] as const;

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
          <p className="mt-2 text-[14px] text-[#6b7280]">The department you&apos;re looking for doesn&apos;t exist.</p>
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

        {/* Tabs */}
        <div className="border-b border-[#e5e7eb] mb-8">
          <nav className="-mb-px flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-[14px] ${
                  activeTab === tab.id
                    ? "border-[#f97316] text-[#f97316]"
                    : "border-transparent text-[#6b7280] hover:text-[#374151] hover:border-[#d1d5db]"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Basic Information */}
              <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h2 className="text-[18px] font-semibold mb-4">Basic Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  
                  <div>
                    <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Parent Department</label>
                    <p className="text-[14px]">{parentDepartment?.name || "Top-level department"}</p>
                  </div>
                  
                  <div>
                    <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Total Employees</label>
                    <p className="text-[14px] font-medium">{employees.length}</p>
                  </div>
                </div>
                
                {department.description && (
                  <div className="mt-6">
                    <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Description</label>
                    <p className="text-[14px]">{department.description}</p>
                  </div>
                )}
              </section>

              {/* Management */}
              <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h2 className="text-[18px] font-semibold mb-4">Management</h2>
                
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

              {/* Budget Overview */}
              {budgetData && (
                <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                  <h2 className="text-[18px] font-semibold mb-4">Budget Overview</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center">
                      <div className="text-[24px] font-semibold text-[#059669]">
                        {department.currency || 'USD'} {budgetData.allocated.toLocaleString()}
                      </div>
                      <div className="text-[12px] text-[#6b7280]">Total Allocated</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[24px] font-semibold text-[#dc2626]">
                        {department.currency || 'USD'} {budgetData.spent.toLocaleString()}
                      </div>
                      <div className="text-[12px] text-[#6b7280]">Amount Spent</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[24px] font-semibold text-[#1f2937]">
                        {department.currency || 'USD'} {budgetData.remaining.toLocaleString()}
                      </div>
                      <div className="text-[12px] text-[#6b7280]">Remaining</div>
                    </div>
                  </div>
                  
                  {/* Budget Utilization Chart */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px]">Budget Utilization</span>
                      <span className="text-[14px] font-medium">
                        {Math.round((budgetData.spent / budgetData.allocated) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-[#f3f4f6] rounded-full h-2">
                      <div 
                        className="bg-[#f97316] h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(budgetData.spent / budgetData.allocated) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Employees Tab */}
          {activeTab === "employees" && (
            <div className="space-y-6">
              {/* Employee Actions */}
              <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-[18px] font-semibold">Department Employees ({employees.length})</h2>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {/* TODO: Implement add employee functionality */}}
                      className="px-4 py-2 bg-[#1f2937] text-white rounded-md text-[14px] hover:bg-[#111827]"
                    >
                      Add Employee
                    </button>
                    <button
                      onClick={() => setShowTransferModal(true)}
                      disabled={selectedEmployees.length === 0}
                      className="px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] hover:bg-[#f9fafb] disabled:opacity-50"
                    >
                      Transfer Selected ({selectedEmployees.length})
                    </button>
                  </div>
                </div>
                
                {employees.length === 0 ? (
                  <p className="text-[14px] text-[#6b7280]">No employees assigned to this department.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="text-[12px] text-[#6b7280] bg-[#f9fafb]">
                        <tr>
                          <th className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedEmployees.length === employees.length && employees.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEmployees(employees.map(emp => emp.id));
                                } else {
                                  setSelectedEmployees([]);
                                }
                              }}
                              className="h-4 w-4 text-[#f97316] focus:ring-[#f97316] border-[#d1d5db] rounded"
                            />
                          </th>
                          <th className="px-3 py-2">Name</th>
                          <th className="px-3 py-2">Position</th>
                          <th className="px-3 py-2">Email</th>
                          <th className="px-3 py-2">Status</th>
                          <th className="px-3 py-2">Hire Date</th>
                          <th className="px-3 py-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-[14px] divide-y divide-[#e5e7eb]">
                        {employees.map((emp) => (
                          <tr key={emp.id} className="hover:bg-[#f9fafb]">
                            <td className="px-3 py-3">
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
                                className="h-4 w-4 text-[#f97316] focus:ring-[#f97316] border-[#d1d5db] rounded"
                              />
                            </td>
                            <td className="px-3 py-3 font-medium">{emp.name}</td>
                            <td className="px-3 py-3">{emp.position || emp.role}</td>
                            <td className="px-3 py-3">{emp.email}</td>
                            <td className="px-3 py-3">
                              <span className={`text-[12px] px-2 py-1 rounded-full ${
                                emp.status === 'active' ? 'bg-[#ecfdf5] text-[#059669]' : 'bg-[#f3f4f6] text-[#6b7280]'
                              }`}>
                                {emp.status || 'Active'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              {emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : "—"}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <Link 
                                  href={`/admin/employees/${emp.id}`}
                                  className="text-[12px] text-[#f97316] hover:underline"
                                >
                                  View
                                </Link>
                                <button className="text-[12px] text-[#dc2626] hover:underline">
                                  Remove
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          )}

          {/* Budget Tab */}
          {activeTab === "budget" && (
            <div className="space-y-6">
              {/* Budget Breakdown */}
              {budgetData && (
                <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                  <h2 className="text-[18px] font-semibold mb-4">Budget Breakdown</h2>
                  
                  <div className="space-y-4">
                    {budgetData.categories.map((category, index) => (
                      <div key={index} className="border border-[#e5e7eb] rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-[14px] font-medium">{category.name}</h3>
                          <span className="text-[12px] text-[#6b7280]">
                            {Math.round((category.spent / category.allocated) * 100)}% used
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-[12px] text-[#6b7280] mb-3">
                          <div>
                            <span>Allocated: </span>
                            <span className="font-medium">{department.currency || 'USD'} {category.allocated.toLocaleString()}</span>
                          </div>
                          <div>
                            <span>Spent: </span>
                            <span className="font-medium">{department.currency || 'USD'} {category.spent.toLocaleString()}</span>
                          </div>
                          <div>
                            <span>Remaining: </span>
                            <span className="font-medium">{department.currency || 'USD'} {(category.allocated - category.spent).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="w-full bg-[#f3f4f6] rounded-full h-2">
                          <div 
                            className="bg-[#f97316] h-2 rounded-full transition-all duration-300"
                            style={{ width: `${(category.spent / category.allocated) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Historical Budget Data */}
              <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h2 className="text-[18px] font-semibold mb-4">Historical Budget Data</h2>
                <div className="text-center py-8 text-[#6b7280]">
                  <p>Historical budget data will be displayed here</p>
                  <p className="text-[12px] mt-2">Integration with financial systems required</p>
                </div>
              </section>

              {/* Forecasting */}
              <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h2 className="text-[18px] font-semibold mb-4">Budget Forecasting</h2>
                <div className="text-center py-8 text-[#6b7280]">
                  <p>Budget forecasting tools will be available here</p>
                  <p className="text-[12px] mt-2">Advanced analytics and predictions</p>
                </div>
              </section>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === "reports" && (
            <div className="space-y-6">
              {/* Performance Metrics */}
              {performanceMetrics && (
                <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                  <h2 className="text-[18px] font-semibold mb-4">Performance Metrics</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-[24px] font-semibold text-[#059669]">
                        {performanceMetrics.attendanceRate}%
                      </div>
                      <div className="text-[12px] text-[#6b7280]">Attendance Rate</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[24px] font-semibold text-[#1f2937]">
                        {performanceMetrics.productivityScore}%
                      </div>
                      <div className="text-[12px] text-[#6b7280]">Productivity Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[24px] font-semibold text-[#f97316]">
                        {performanceMetrics.employeeSatisfaction}/5
                      </div>
                      <div className="text-[12px] text-[#6b7280]">Employee Satisfaction</div>
                    </div>
                    <div className="text-center">
                      <div className="text-[24px] font-semibold text-[#dc2626]">
                        {performanceMetrics.turnoverRate}%
                      </div>
                      <div className="text-[12px] text-[#6b7280]">Turnover Rate</div>
                    </div>
                  </div>
                </section>
              )}

              {/* Attendance Stats */}
              <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h2 className="text-[18px] font-semibold mb-4">Attendance Statistics</h2>
                <div className="text-center py-8 text-[#6b7280]">
                  <p>Detailed attendance statistics will be displayed here</p>
                  <p className="text-[12px] mt-2">Integration with time tracking systems required</p>
                </div>
              </section>

              {/* Productivity Stats */}
              <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h2 className="text-[18px] font-semibold mb-4">Productivity Statistics</h2>
                <div className="text-center py-8 text-[#6b7280]">
                  <p>Productivity metrics and analytics will be shown here</p>
                  <p className="text-[12px] mt-2">Performance tracking and goal monitoring</p>
                </div>
              </section>

              {/* Custom Reports */}
              <section className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h2 className="text-[18px] font-semibold mb-4">Custom Report Generation</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button className="p-4 border border-[#d1d5db] rounded-lg hover:bg-[#f9fafb] text-left">
                      <div className="text-[14px] font-medium">Employee Performance Report</div>
                      <div className="text-[12px] text-[#6b7280] mt-1">Generate detailed performance analysis</div>
                    </button>
                    <button className="p-4 border border-[#d1d5db] rounded-lg hover:bg-[#f9fafb] text-left">
                      <div className="text-[14px] font-medium">Budget Utilization Report</div>
                      <div className="text-[12px] text-[#6b7280] mt-1">Financial spending analysis</div>
                    </button>
                    <button className="p-4 border border-[#d1d5db] rounded-lg hover:bg-[#f9fafb] text-left">
                      <div className="text-[14px] font-medium">Attendance Summary</div>
                      <div className="text-[12px] text-[#6b7280] mt-1">Time tracking and attendance data</div>
                    </button>
                    <button className="p-4 border border-[#d1d5db] rounded-lg hover:bg-[#f9fafb] text-left">
                      <div className="text-[14px] font-medium">Department Overview</div>
                      <div className="text-[12px] text-[#6b7280] mt-1">Comprehensive department summary</div>
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-[18px] font-semibold mb-4">Transfer Employees</h3>
              
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
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] hover:bg-[#f9fafb]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmployeeTransfer}
                  disabled={selectedEmployees.length === 0 || !transferTargetDept}
                  className="px-4 py-2 bg-[#1f2937] text-white rounded-md text-[14px] hover:bg-[#111827] disabled:opacity-50"
                >
                  Transfer Employees
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}