"use client";
import { useEffect, useState, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, getDocs, query, where } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { RoleAssignment, RoleVacancy, RolePerformanceAnalytics } from "@/types/role";

export default function RoleAssignmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"assignments" | "vacancies" | "analytics">("assignments");
  const [assignments, setAssignments] = useState<RoleAssignment[]>([]);
  const [vacancies, setVacancies] = useState<RoleVacancy[]>([]);
  const [analytics, setAnalytics] = useState<RolePerformanceAnalytics[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      try {
        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid));
        const snap = await getDocs(q);
        const parentOrg = snap.docs[0].ref.parent.parent;
        const foundOrgId = parentOrg ? parentOrg.id : null;
        
        if (foundOrgId) {
          await Promise.all([
            loadDepartments(foundOrgId),
            loadAssignments(foundOrgId),
            loadVacancies(foundOrgId),
            loadAnalytics(foundOrgId)
          ]);
        }
      } catch (error) {
        console.error("Error loading organization:", error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDepartments = useCallback(async (organizationId: string) => {
    try {
      const depCol = collection(db, "organizations", organizationId, "departments");
      const depSnap = await getDocs(depCol);
      const deptList: Array<{ id: string; name: string }> = depSnap.docs.map((d) => {
        const data = d.data() as { name?: string };
        return { id: d.id, name: data?.name ?? d.id };
      });
      setDepartments(deptList);
    } catch (error) {
      console.error("Error loading departments:", error);
    }
  }, []);

  const loadAssignments = useCallback(async (organizationId: string) => {
    try {
      const assignmentsCol = collection(db, "organizations", organizationId, "roleAssignments");
      const assignmentsSnap = await getDocs(assignmentsCol);
      const assignmentsList: RoleAssignment[] = assignmentsSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as RoleAssignment[];
      setAssignments(assignmentsList);
    } catch (error) {
      console.error("Error loading assignments:", error);
    }
  }, []);

  const loadVacancies = useCallback(async (organizationId: string) => {
    try {
      const vacanciesCol = collection(db, "organizations", organizationId, "roleVacancies");
      const vacanciesSnap = await getDocs(vacanciesCol);
      const vacanciesList: RoleVacancy[] = vacanciesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as RoleVacancy[];
      setVacancies(vacanciesList);
    } catch (error) {
      console.error("Error loading vacancies:", error);
    }
  }, []);

  const loadAnalytics = useCallback(async (_organizationId: string) => { // eslint-disable-line @typescript-eslint/no-unused-vars
    try {
      // Mock analytics data - in a real app, this would come from aggregated data
      const mockAnalytics: RolePerformanceAnalytics[] = [
        {
          roleId: "role1",
          roleTitle: "Software Engineer",
          employeeSatisfaction: 4.2,
          turnoverRate: 0.15,
          averageTenure: 2.8,
          performanceScore: 4.1,
          promotionRate: 0.25,
          trainingCompletionRate: 0.85,
          metrics: [
            { period: "Q1 2024", satisfaction: 4.0, turnover: 0.20, tenure: 2.5, performance: 3.9 },
            { period: "Q2 2024", satisfaction: 4.2, turnover: 0.15, tenure: 2.8, performance: 4.1 },
            { period: "Q3 2024", satisfaction: 4.3, turnover: 0.12, tenure: 3.0, performance: 4.2 }
          ]
        },
        {
          roleId: "role2",
          roleTitle: "Sales Manager",
          employeeSatisfaction: 4.5,
          turnoverRate: 0.08,
          averageTenure: 4.2,
          performanceScore: 4.4,
          promotionRate: 0.30,
          trainingCompletionRate: 0.92,
          metrics: [
            { period: "Q1 2024", satisfaction: 4.3, turnover: 0.10, tenure: 3.8, performance: 4.2 },
            { period: "Q2 2024", satisfaction: 4.4, turnover: 0.08, tenure: 4.0, performance: 4.3 },
            { period: "Q3 2024", satisfaction: 4.5, turnover: 0.08, tenure: 4.2, performance: 4.4 }
          ]
        }
      ];
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error("Error loading analytics:", error);
    }
  }, []);

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.roleTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.departmentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || assignment.departmentId === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const filteredVacancies = vacancies.filter(vacancy => {
    const matchesSearch = vacancy.roleTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         vacancy.departmentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || vacancy.departmentId === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-gray-100 text-gray-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "open": return "bg-blue-100 text-blue-800";
      case "filled": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      case "on_hold": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "bg-red-100 text-red-800";
      case "high": return "bg-orange-100 text-orange-800";
      case "medium": return "bg-yellow-100 text-yellow-800";
      case "low": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold text-[#111827] mb-2">Role Assignments & Analytics</h1>
        <p className="text-[14px] text-[#6b7280]">
          Manage employee-role assignments, track vacancies, and analyze role performance
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-8">
        <div className="border-b border-[#e5e7eb]">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab("assignments")}
              className={`py-2 px-1 border-b-2 font-medium text-[14px] ${
                activeTab === "assignments"
                  ? "border-[#3b82f6] text-[#3b82f6]"
                  : "border-transparent text-[#6b7280] hover:text-[#374151] hover:border-[#d1d5db]"
              }`}
            >
              Employee Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab("vacancies")}
              className={`py-2 px-1 border-b-2 font-medium text-[14px] ${
                activeTab === "vacancies"
                  ? "border-[#3b82f6] text-[#3b82f6]"
                  : "border-transparent text-[#6b7280] hover:text-[#374151] hover:border-[#d1d5db]"
              }`}
            >
              Open Vacancies ({vacancies.filter(v => v.status === "open").length})
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`py-2 px-1 border-b-2 font-medium text-[14px] ${
                activeTab === "analytics"
                  ? "border-[#3b82f6] text-[#3b82f6]"
                  : "border-transparent text-[#6b7280] hover:text-[#374151] hover:border-[#d1d5db]"
              }`}
            >
              Performance Analytics
            </button>
          </nav>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
          />
        </div>
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] bg-white"
        >
          <option value="all">All Departments</option>
          {departments.map((dept) => (
            <option key={dept.id} value={dept.id}>{dept.name}</option>
          ))}
        </select>
      </div>

      {/* Assignments Tab */}
      {activeTab === "assignments" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-[18px] font-semibold text-[#111827]">Employee-Role Assignments</h2>
            <button
              onClick={() => router.push("/admin/employees/invite")}
              className="px-4 py-2 bg-[#3b82f6] text-white text-[14px] font-medium rounded-md hover:bg-[#2563eb]"
            >
              Assign New Role
            </button>
          </div>
          
          {filteredAssignments.length === 0 ? (
            <div className="text-center py-12 bg-white border border-[#e5e7eb] rounded-lg">
              <div className="text-[48px] mb-4">👥</div>
              <h3 className="text-[18px] font-semibold text-[#111827] mb-2">No assignments found</h3>
              <p className="text-[14px] text-[#6b7280] mb-4">
                Start by inviting employees and assigning them roles
              </p>
              <button
                onClick={() => router.push("/admin/employees/invite")}
                className="px-4 py-2 bg-[#3b82f6] text-white text-[14px] font-medium rounded-md hover:bg-[#2563eb]"
              >
                Invite Employee
              </button>
            </div>
          ) : (
            <div className="bg-white border border-[#e5e7eb] rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#e5e7eb]">
                  <thead className="bg-[#f9fafb]">
                    <tr>
                      <th className="px-6 py-3 text-left text-[12px] font-medium text-[#374151] uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-[12px] font-medium text-[#374151] uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-[12px] font-medium text-[#374151] uppercase tracking-wider">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-[12px] font-medium text-[#374151] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-[12px] font-medium text-[#374151] uppercase tracking-wider">
                        Assigned Date
                      </th>
                      <th className="px-6 py-3 text-left text-[12px] font-medium text-[#374151] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-[#e5e7eb]">
                    {filteredAssignments.map((assignment) => (
                      <tr key={assignment.id} className="hover:bg-[#f9fafb]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-[14px] font-medium text-[#111827]">{assignment.employeeName}</div>
                            <div className="text-[12px] text-[#6b7280]">{assignment.employeeEmail}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-[14px] text-[#111827]">{assignment.roleTitle}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-[14px] text-[#111827]">{assignment.departmentName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-[12px] font-medium rounded-full ${getStatusColor(assignment.status)}`}>
                            {assignment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[14px] text-[#111827]">
                          {new Date(assignment.assignedDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-[14px] font-medium">
                          <button className="text-[#3b82f6] hover:text-[#2563eb] mr-4">Edit</button>
                          <button className="text-[#ef4444] hover:text-[#dc2626]">Remove</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Vacancies Tab */}
      {activeTab === "vacancies" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-[18px] font-semibold text-[#111827]">Open Vacancies</h2>
            <button
              onClick={() => router.push("/admin/roles/new")}
              className="px-4 py-2 bg-[#3b82f6] text-white text-[14px] font-medium rounded-md hover:bg-[#2563eb]"
            >
              Create New Role
            </button>
          </div>
          
          {filteredVacancies.length === 0 ? (
            <div className="text-center py-12 bg-white border border-[#e5e7eb] rounded-lg">
              <div className="text-[48px] mb-4">📋</div>
              <h3 className="text-[18px] font-semibold text-[#111827] mb-2">No vacancies found</h3>
              <p className="text-[14px] text-[#6b7280] mb-4">
                Create new roles to track open positions
              </p>
              <button
                onClick={() => router.push("/admin/roles/new")}
                className="px-4 py-2 bg-[#3b82f6] text-white text-[14px] font-medium rounded-md hover:bg-[#2563eb]"
              >
                Create Role
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVacancies.map((vacancy) => (
                <div key={vacancy.id} className="bg-white border border-[#e5e7eb] rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-[16px] font-semibold text-[#111827]">{vacancy.roleTitle}</h3>
                      <span className={`inline-flex px-2 py-1 text-[12px] font-medium rounded-full ${getStatusColor(vacancy.status)}`}>
                        {vacancy.status}
                      </span>
                    </div>
                    <p className="text-[14px] text-[#6b7280] mb-3">{vacancy.departmentName}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`inline-flex px-2 py-1 text-[12px] font-medium rounded-full ${getPriorityColor(vacancy.priority)}`}>
                        {vacancy.priority} priority
                      </span>
                      <span className="text-[12px] text-[#6b7280]">
                        Target: {new Date(vacancy.targetStartDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#6b7280]">Applications:</span>
                      <span className="text-[#111827]">{vacancy.applicationsCount}</span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#6b7280]">Interviews:</span>
                      <span className="text-[#111827]">{vacancy.interviewsScheduled}</span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-[#6b7280]">Offers:</span>
                      <span className="text-[#111827]">{vacancy.offersMade}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-2 bg-[#3b82f6] text-white text-[12px] font-medium rounded-md hover:bg-[#2563eb]">
                      View Details
                    </button>
                    <button className="px-3 py-2 border border-[#d1d5db] text-[#374151] text-[12px] font-medium rounded-md hover:bg-[#f9fafb]">
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <h2 className="text-[18px] font-semibold text-[#111827]">Role Performance Analytics</h2>
          
          {analytics.length === 0 ? (
            <div className="text-center py-12 bg-white border border-[#e5e7eb] rounded-lg">
              <div className="text-[48px] mb-4">📊</div>
              <h3 className="text-[18px] font-semibold text-[#111827] mb-2">No analytics data available</h3>
              <p className="text-[14px] text-[#6b7280]">
                Analytics will appear once you have role assignments and performance data
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {analytics.map((roleAnalytics) => (
                <div key={roleAnalytics.roleId} className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                  <div className="mb-6">
                    <h3 className="text-[18px] font-semibold text-[#111827] mb-2">{roleAnalytics.roleTitle}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-[24px] font-semibold text-[#111827]">{roleAnalytics.employeeSatisfaction.toFixed(1)}</div>
                        <div className="text-[12px] text-[#6b7280]">Satisfaction</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[24px] font-semibold text-[#111827]">{(roleAnalytics.turnoverRate * 100).toFixed(1)}%</div>
                        <div className="text-[12px] text-[#6b7280]">Turnover Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[24px] font-semibold text-[#111827]">{roleAnalytics.averageTenure.toFixed(1)}y</div>
                        <div className="text-[12px] text-[#6b7280]">Avg Tenure</div>
                      </div>
                      <div className="text-center">
                        <div className="text-[24px] font-semibold text-[#111827]">{roleAnalytics.performanceScore.toFixed(1)}</div>
                        <div className="text-[12px] text-[#6b7280]">Performance</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="border-t border-[#e5e7eb] pt-4">
                    <h4 className="text-[14px] font-medium text-[#111827] mb-3">Trend Analysis</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-[12px]">
                        <thead>
                          <tr className="border-b border-[#e5e7eb]">
                            <th className="text-left py-2">Period</th>
                            <th className="text-right py-2">Satisfaction</th>
                            <th className="text-right py-2">Turnover</th>
                            <th className="text-right py-2">Tenure</th>
                            <th className="text-right py-2">Performance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {roleAnalytics.metrics.map((metric, index) => (
                            <tr key={index} className="border-b border-[#e5e7eb]">
                              <td className="py-2">{metric.period}</td>
                              <td className="text-right py-2">{metric.satisfaction.toFixed(1)}</td>
                              <td className="text-right py-2">{(metric.turnover * 100).toFixed(1)}%</td>
                              <td className="text-right py-2">{metric.tenure.toFixed(1)}y</td>
                              <td className="text-right py-2">{metric.performance.toFixed(1)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
