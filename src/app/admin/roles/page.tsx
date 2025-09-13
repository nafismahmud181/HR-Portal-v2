"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, getDocs, query, where } from "firebase/firestore";
import { Role, RoleFilter, RoleAnalytics } from "@/types/role";

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  roleId?: string;
}

export default function RolesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [analytics, setAnalytics] = useState<RoleAnalytics | null>(null);
  const [filters, setFilters] = useState<RoleFilter>({
    search: "",
    department: "All",
    category: "All",
    level: "All",
    status: "All"
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
        
        if (foundOrgId) {
          await Promise.all([
            loadRoles(foundOrgId),
            loadDepartments(foundOrgId),
            loadEmployees(foundOrgId)
          ]);
        }
        setLoading(false);
      } catch {
        router.replace("/login");
      }
    });
    return () => unsub();
  }, [router]);

  const loadRoles = async (orgId: string) => {
    try {
      const rolesCol = collection(db, "organizations", orgId, "roles");
      const snap = await getDocs(rolesCol);
      const rolesList = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Role[];
      setRoles(rolesList);
      calculateAnalytics(rolesList);
    } catch (error) {
      console.error("Error loading roles:", error);
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

  const calculateAnalytics = (rolesList: Role[]) => {
    const analytics: RoleAnalytics = {
      totalRoles: rolesList.length,
      activeRoles: rolesList.filter(r => r.status === "active").length,
      draftRoles: rolesList.filter(r => r.status === "draft").length,
      deprecatedRoles: rolesList.filter(r => r.status === "deprecated").length,
      rolesByDepartment: {},
      rolesByCategory: {},
      averageSalaryByLevel: {}
    };

    rolesList.forEach(role => {
      // Count by department
      role.departmentIds.forEach(deptId => {
        analytics.rolesByDepartment[deptId] = (analytics.rolesByDepartment[deptId] || 0) + 1;
      });

      // Count by category
      analytics.rolesByCategory[role.category] = (analytics.rolesByCategory[role.category] || 0) + 1;

      // Calculate average salary by level
      const avgSalary = (role.compensation.salaryRange.min + role.compensation.salaryRange.max) / 2;
      analytics.averageSalaryByLevel[role.level.toString()] = 
        (analytics.averageSalaryByLevel[role.level.toString()] || 0) + avgSalary;
    });

    // Calculate final averages
    Object.keys(analytics.averageSalaryByLevel).forEach(level => {
      const count = rolesList.filter(r => r.level.toString() === level).length;
      analytics.averageSalaryByLevel[level] = analytics.averageSalaryByLevel[level] / count;
    });

    setAnalytics(analytics);
  };

  const filteredRoles = roles.filter(role => {
    const matchesSearch = filters.search === "" || 
      role.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      role.code.toLowerCase().includes(filters.search.toLowerCase()) ||
      role.description.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesDepartment = filters.department === "All" || 
      role.departmentIds.includes(filters.department);
    
    const matchesCategory = filters.category === "All" || role.category === filters.category;
    const matchesLevel = filters.level === "All" || role.level.toString() === filters.level;
    const matchesStatus = filters.status === "All" || role.status === filters.status;
    
    return matchesSearch && matchesDepartment && matchesCategory && matchesLevel && matchesStatus;
  });

  const getDepartmentName = (departmentId: string) => {
    const dept = departments.find(d => d.id === departmentId);
    return dept?.name || "Unknown";
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      active: "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]",
      draft: "bg-[#fffbeb] text-[#b45309] border-[#fde68a]",
      deprecated: "bg-[#f3f4f6] text-[#6b7280] border-[#d1d5db]"
    };
    
    return (
      <span className={`text-[12px] px-2 py-1 rounded-full border ${styles[status as keyof typeof styles] || styles.deprecated}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getCategoryBadge = (category: string) => {
    const styles = {
      executive: "bg-[#fef3c7] text-[#92400e] border-[#fde68a]",
      management: "bg-[#dbeafe] text-[#1e40af] border-[#93c5fd]",
      professional: "bg-[#e0e7ff] text-[#3730a3] border-[#a5b4fc]",
      support: "bg-[#f3e8ff] text-[#7c3aed] border-[#c4b5fd]",
      intern: "bg-[#f0fdf4] text-[#166534] border-[#86efac]"
    };
    
    return (
      <span className={`text-[12px] px-2 py-1 rounded-full border ${styles[category as keyof typeof styles] || styles.professional}`}>
        {category.charAt(0).toUpperCase() + category.slice(1)}
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-semibold">Roles Management</h1>
            <p className="mt-2 text-[14px] text-[#6b7280]">Manage job roles, responsibilities, and organizational structure.</p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/admin/roles/new" 
              className="px-4 py-2 bg-[#1f2937] text-white rounded-md text-[14px] font-medium hover:bg-[#111827]"
            >
              Create Role
            </Link>
          </div>
        </div>

        {/* Analytics Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-4">
              <div className="text-[12px] text-[#6b7280] mb-1">Total Roles</div>
              <div className="text-[24px] font-semibold">{analytics.totalRoles}</div>
            </div>
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-4">
              <div className="text-[12px] text-[#6b7280] mb-1">Active Roles</div>
              <div className="text-[24px] font-semibold text-[#059669]">{analytics.activeRoles}</div>
            </div>
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-4">
              <div className="text-[12px] text-[#6b7280] mb-1">Draft Roles</div>
              <div className="text-[24px] font-semibold text-[#b45309]">{analytics.draftRoles}</div>
            </div>
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-4">
              <div className="text-[12px] text-[#6b7280] mb-1">Deprecated Roles</div>
              <div className="text-[24px] font-semibold text-[#6b7280]">{analytics.deprecatedRoles}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
          <input 
            value={filters.search} 
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))} 
            placeholder="Search roles..." 
            className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
          <select 
            value={filters.department} 
            onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))} 
            className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          >
            <option value="All">All Departments</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
          <select 
            value={filters.category} 
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))} 
            className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          >
            <option value="All">All Categories</option>
            <option value="executive">Executive</option>
            <option value="management">Management</option>
            <option value="professional">Professional</option>
            <option value="support">Support</option>
            <option value="intern">Intern</option>
          </select>
          <select 
            value={filters.level} 
            onChange={(e) => setFilters(prev => ({ ...prev, level: e.target.value }))} 
            className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          >
            <option value="All">All Levels</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
              <option key={level} value={level.toString()}>Level {level}</option>
            ))}
          </select>
          <select 
            value={filters.status} 
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} 
            className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="deprecated">Deprecated</option>
          </select>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRoles.map((role) => (
            <div key={role.id} className="bg-white border border-[#e5e7eb] rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-[16px] font-semibold mb-1">{role.title}</h3>
                  <p className="text-[12px] text-[#6b7280] mb-2">{role.code}</p>
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(role.status)}
                    {getCategoryBadge(role.category)}
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-[12px] text-[#6b7280]">
                  <span className="font-medium">Level:</span> {role.level} ({role.seniority})
                </div>
                <div className="text-[12px] text-[#6b7280]">
                  <span className="font-medium">Primary Department:</span> {getDepartmentName(role.primaryDepartmentId)}
                </div>
                <div className="text-[12px] text-[#6b7280]">
                  <span className="font-medium">Employees:</span> {role.employeeCount}
                </div>
                <div className="text-[12px] text-[#6b7280]">
                  <span className="font-medium">Salary Range:</span> {role.compensation.salaryRange.currency} {role.compensation.salaryRange.min.toLocaleString()} - {role.compensation.salaryRange.max.toLocaleString()}
                </div>
              </div>

              {role.description && (
                <p className="text-[12px] text-[#6b7280] mb-4 line-clamp-3">
                  {role.description.length > 120 
                    ? `${role.description.substring(0, 120)}...` 
                    : role.description}
                </p>
              )}

              <div className="flex items-center justify-between">
                <div className="text-[12px] text-[#6b7280]">
                  Created {new Date(role.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2">
                  <Link 
                    href={`/admin/roles/${role.id}`}
                    className="rounded-md border border-[#d1d5db] px-2 py-1 text-[12px] hover:bg-[#f9fafb]"
                  >
                    View
                  </Link>
                  <Link 
                    href={`/admin/roles/${role.id}/edit`}
                    className="rounded-md border border-[#d1d5db] px-2 py-1 text-[12px] hover:bg-[#f9fafb]"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredRoles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-[#6b7280] mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
              </svg>
            </div>
            <h3 className="text-[16px] font-medium text-[#1a1a1a] mb-2">No roles found</h3>
            <p className="text-[14px] text-[#6b7280] mb-4">
              {filters.search || filters.department !== "All" || filters.category !== "All" || filters.level !== "All" || filters.status !== "All"
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating your first role."
              }
            </p>
            {!filters.search && filters.department === "All" && filters.category === "All" && filters.level === "All" && filters.status === "All" && (
              <Link 
                href="/admin/roles/new"
                className="inline-flex items-center px-4 py-2 bg-[#1f2937] text-white rounded-md text-[14px] font-medium hover:bg-[#111827]"
              >
                Create Role
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
