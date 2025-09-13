"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, getDocs, query, where } from "firebase/firestore";

interface Department {
  id: string;
  name: string;
  code?: string;
  description?: string;
  type: string;
  parentId?: string;
  managerId?: string;
  budget?: number;
  currency?: string;
  status: "draft" | "active" | "inactive";
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
  email: string;
}

export default function DepartmentsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "active" | "draft" | "inactive">("All");

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

  const filteredDepartments = departments.filter(dept => {
    const matchesSearch = search === "" || 
      dept.name.toLowerCase().includes(search.toLowerCase()) ||
      dept.code?.toLowerCase().includes(search.toLowerCase()) ||
      dept.description?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === "All" || dept.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-semibold">Departments</h1>
            <p className="mt-2 text-[14px] text-[#6b7280]">Manage your organization&apos;s departments and structure.</p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/admin/organization/departments/new" 
              className="px-4 py-2 bg-[#1f2937] text-white rounded-md text-[14px] font-medium hover:bg-[#111827]"
            >
              Create Department
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <input 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search departments..." 
            className="flex-1 rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
          <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} 
            className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          >
            <option value="All">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        {/* Departments Table */}
        <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white">
          <table className="hidden md:table w-full text-left">
            <thead className="text-[12px] text-[#6b7280] bg-[#f9fafb]">
              <tr>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Manager</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Created</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[14px] divide-y divide-[#e5e7eb]">
              {filteredDepartments.map((dept) => (
                <tr key={dept.id} className="hover:bg-[#f9fafb]">
                  <td className="px-4 py-3">
                    <div>
                      <div className="font-medium">{dept.name}</div>
                      {dept.description && (
                        <div className="text-[12px] text-[#6b7280] mt-1">
                          {dept.description.length > 50 
                            ? `${dept.description.substring(0, 50)}...` 
                            : dept.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{dept.code || "—"}</td>
                  <td className="px-4 py-3 capitalize">{dept.type}</td>
                  <td className="px-4 py-3">{getManagerName(dept.managerId)}</td>
                  <td className="px-4 py-3">
                    {dept.budget && dept.budget > 0 
                      ? `${dept.currency || 'USD'} ${dept.budget.toLocaleString()}`
                      : "—"
                    }
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(dept.status)}</td>
                  <td className="px-4 py-3">
                    {new Date(dept.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/admin/organization/departments/${dept.id}`}
                        className="rounded-md border border-[#d1d5db] px-2 py-1 text-[12px] hover:bg-[#f9fafb]"
                      >
                        View
                      </Link>
                      <Link 
                        href={`/admin/organization/departments/${dept.id}/edit`}
                        className="rounded-md border border-[#d1d5db] px-2 py-1 text-[12px] hover:bg-[#f9fafb]"
                      >
                        Edit
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-[#e5e7eb]">
            {filteredDepartments.map((dept) => (
              <div key={dept.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-[14px]">{dept.name}</div>
                    {dept.code && (
                      <div className="text-[12px] text-[#6b7280]">{dept.code}</div>
                    )}
                  </div>
                  {getStatusBadge(dept.status)}
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-[12px] text-[#374151] mb-3">
                  <div><span className="text-[#6b7280]">Type:</span> {dept.type}</div>
                  <div><span className="text-[#6b7280]">Manager:</span> {getManagerName(dept.managerId)}</div>
                  <div><span className="text-[#6b7280]">Budget:</span> 
                    {dept.budget && dept.budget > 0 
                      ? ` ${dept.currency || 'USD'} ${dept.budget.toLocaleString()}`
                      : " —"
                    }
                  </div>
                  <div><span className="text-[#6b7280]">Created:</span> {new Date(dept.createdAt).toLocaleDateString()}</div>
                </div>
                
                {dept.description && (
                  <div className="text-[12px] text-[#6b7280] mb-3">
                    {dept.description.length > 100 
                      ? `${dept.description.substring(0, 100)}...` 
                      : dept.description}
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <Link 
                    href={`/admin/organization/departments/${dept.id}`}
                    className="rounded-md border border-[#d1d5db] px-2 py-1 text-[12px] hover:bg-[#f9fafb]"
                  >
                    View
                  </Link>
                  <Link 
                    href={`/admin/organization/departments/${dept.id}/edit`}
                    className="rounded-md border border-[#d1d5db] px-2 py-1 text-[12px] hover:bg-[#f9fafb]"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredDepartments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-[#6b7280] mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-[16px] font-medium text-[#1a1a1a] mb-2">No departments found</h3>
            <p className="text-[14px] text-[#6b7280] mb-4">
              {search || statusFilter !== "All" 
                ? "Try adjusting your search or filter criteria."
                : "Get started by creating your first department."
              }
            </p>
            {!search && statusFilter === "All" && (
              <Link 
                href="/admin/organization/departments/new"
                className="inline-flex items-center px-4 py-2 bg-[#1f2937] text-white rounded-md text-[14px] font-medium hover:bg-[#111827]"
              >
                Create Department
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
