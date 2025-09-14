"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, getDocs, query, where, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { Role } from "@/types/role";

interface Department {
  id: string;
  name: string;
}

// interface Employee {
//   id: string;
//   name: string;
//   roleId?: string;
// } // Not used in this component

export default function RoleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  // const [employees] = useState<Employee[]>([]); // Not used in this component
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<Role>>({});

  const loadRole = useCallback(async (orgId: string, roleId: string) => {
    try {
      const roleDoc = doc(db, "organizations", orgId, "roles", roleId);
      const roleSnap = await getDoc(roleDoc);
      if (roleSnap.exists()) {
        const roleData = { id: roleSnap.id, ...roleSnap.data() } as Role;
        setRole(roleData);
        setFormData(roleData);
      } else {
        router.replace("/admin/roles");
      }
    } catch (error) {
      console.error("Error loading role:", error);
      router.replace("/admin/roles");
    }
  }, [router]);

  const loadDepartments = useCallback(async (orgId: string) => {
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
  }, []);

  const loadEmployees = useCallback(async (orgId: string) => {
    try {
      const empCol = collection(db, "organizations", orgId, "employees");
      await getDocs(empCol);
      // Not used in this component, but keeping for consistency with other pages
    } catch (error) {
      console.error("Error loading employees:", error);
    }
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
        
        if (foundOrgId) {
          await Promise.all([
            loadRole(foundOrgId, id),
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
  }, [router, id, loadRole, loadDepartments, loadEmployees]);


  const handleSave = async () => {
    if (!role) return;

    setSaving(true);
    try {
      const cg = collectionGroup(db, "users");
      const q = query(cg, where("uid", "==", auth.currentUser?.uid));
      const snap = await getDocs(q);
      const parentOrg = snap.docs[0].ref.parent.parent;
      const foundOrgId = parentOrg ? parentOrg.id : null;

      if (foundOrgId) {
        const roleDoc = doc(db, "organizations", foundOrgId, "roles", role.id);
        await updateDoc(roleDoc, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        
        setRole({ ...role, ...formData } as Role);
        setIsEditing(false);
      }
    } catch (error) {
      console.error("Error saving role:", error);
      alert("Error saving role. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!role || !confirm("Are you sure you want to delete this role? This action cannot be undone.")) {
      return;
    }

    setSaving(true);
    try {
      const cg = collectionGroup(db, "users");
      const q = query(cg, where("uid", "==", auth.currentUser?.uid));
      const snap = await getDocs(q);
      const parentOrg = snap.docs[0].ref.parent.parent;
      const foundOrgId = parentOrg ? parentOrg.id : null;

      if (foundOrgId) {
        const roleDoc = doc(db, "organizations", foundOrgId, "roles", role.id);
        await deleteDoc(roleDoc);
        router.push("/admin/roles");
      }
    } catch (error) {
      console.error("Error deleting role:", error);
      alert("Error deleting role. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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

  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffffff]">
        <div className="text-center">
          <h1 className="text-[28px] font-semibold">Role Not Found</h1>
          <p className="mt-2 text-[14px] text-[#6b7280]">The role you&apos;re looking for doesn&apos;t exist.</p>
          <Link 
            href="/admin/roles"
            className="mt-4 inline-block px-4 py-2 bg-[#1f2937] text-white rounded-md text-[14px] font-medium hover:bg-[#111827]"
          >
            Back to Roles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1a1a1a]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-[28px] font-semibold">{role.title}</h1>
              {getStatusBadge(role.status)}
              {getCategoryBadge(role.category)}
            </div>
            <p className="text-[14px] text-[#6b7280]">Role Code: {role.code}</p>
          </div>
          <div className="flex gap-3">
            <Link 
              href="/admin/roles"
              className="px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] hover:bg-[#f9fafb]"
            >
              Back to Roles
            </Link>
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] hover:bg-[#f9fafb]"
                >
                  Edit Role
                </button>
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 bg-[#dc2626] text-white rounded-md text-[14px] font-medium hover:bg-[#b91c1c] disabled:opacity-50"
                >
                  Delete Role
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(role);
                  }}
                  className="px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] hover:bg-[#f9fafb]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-[#059669] text-white rounded-md text-[14px] font-medium hover:bg-[#047857] disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Role Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Basic Information */}
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <h2 className="text-[20px] font-semibold mb-4">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Role Level</label>
                  <div className="text-[14px]">{role.level} ({role.seniority})</div>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Primary Department</label>
                  <div className="text-[14px]">{getDepartmentName(role.primaryDepartmentId)}</div>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Employee Count</label>
                  <div className="text-[14px]">{role.employeeCount}</div>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Created</label>
                  <div className="text-[14px]">{new Date(role.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            </div>

            {/* Job Description */}
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <h2 className="text-[20px] font-semibold mb-4">Job Description</h2>
              {isEditing ? (
                <textarea
                  value={formData.description || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={4}
                  className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                />
              ) : (
                <p className="text-[14px] text-[#374151]">{role.description}</p>
              )}
            </div>

            {/* Key Responsibilities */}
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <h2 className="text-[20px] font-semibold mb-4">Key Responsibilities</h2>
              {isEditing ? (
                <div className="space-y-2">
                  {formData.responsibilities?.map((resp, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={resp}
                        onChange={(e) => {
                          const newResponsibilities = [...(formData.responsibilities || [])];
                          newResponsibilities[index] = e.target.value;
                          setFormData(prev => ({ ...prev, responsibilities: newResponsibilities }));
                        }}
                        className="flex-1 rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                      />
                      <button
                        onClick={() => {
                          const newResponsibilities = formData.responsibilities?.filter((_, i) => i !== index) || [];
                          setFormData(prev => ({ ...prev, responsibilities: newResponsibilities }));
                        }}
                        className="text-[#dc2626] hover:text-[#b91c1c]"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      const newResponsibilities = [...(formData.responsibilities || []), ""];
                      setFormData(prev => ({ ...prev, responsibilities: newResponsibilities }));
                    }}
                    className="text-[#059669] hover:text-[#047857] text-[14px]"
                  >
                    + Add Responsibility
                  </button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {role.responsibilities.map((resp, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-[#f97316] mr-2">•</span>
                      <span className="text-[14px] text-[#374151]">{resp}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Required Skills */}
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <h2 className="text-[20px] font-semibold mb-4">Required Skills</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {role.requiredSkills.map((skill, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-[#f9fafb] rounded-md">
                    <div>
                      <div className="text-[14px] font-medium">{skill.skill}</div>
                      <div className="text-[12px] text-[#6b7280]">
                        {skill.proficiency} • {skill.type} • {skill.isRequired ? "Required" : "Preferred"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Compensation */}
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <h3 className="text-[16px] font-semibold mb-4">Compensation</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Salary Range</label>
                  <div className="text-[14px]">
                    {role.compensation.salaryRange.currency} {role.compensation.salaryRange.min.toLocaleString()} - {role.compensation.salaryRange.max.toLocaleString()}
                  </div>
                  <div className="text-[12px] text-[#6b7280]">{role.compensation.salaryRange.frequency}</div>
                </div>
                {role.compensation.grade && (
                  <div>
                    <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Grade</label>
                    <div className="text-[14px]">{role.compensation.grade}</div>
                  </div>
                )}
                {role.compensation.stockOptions && (
                  <div>
                    <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Equity</label>
                    <div className="text-[14px]">{role.compensation.equity}%</div>
                  </div>
                )}
              </div>
            </div>

            {/* Requirements */}
            <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
              <h3 className="text-[16px] font-semibold mb-4">Requirements</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Education</label>
                  <div className="text-[14px] capitalize">{role.educationalRequirements.minimumLevel.replace("_", " ")}</div>
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Experience</label>
                  <div className="text-[14px]">{role.experienceRequirements.minimumYears} years minimum</div>
                </div>
                {role.experienceRequirements.leadershipExperience && (
                  <div>
                    <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Leadership</label>
                    <div className="text-[14px]">Leadership experience required</div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Departments */}
            {role.departmentIds.length > 1 && (
              <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h3 className="text-[16px] font-semibold mb-4">Additional Departments</h3>
                <div className="space-y-2">
                  {role.departmentIds.filter(id => id !== role.primaryDepartmentId).map(deptId => (
                    <div key={deptId} className="text-[14px] text-[#374151]">
                      {getDepartmentName(deptId)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Career Progression */}
            {role.careerProgression.nextLevelRoles.length > 0 && (
              <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
                <h3 className="text-[16px] font-semibold mb-4">Career Progression</h3>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Next Level Roles</label>
                    <div className="text-[14px] text-[#374151]">
                      {role.careerProgression.nextLevelRoles.join(", ")}
                    </div>
                  </div>
                  {role.careerProgression.timelineExpectations && (
                    <div>
                      <label className="block text-[12px] font-medium text-[#6b7280] mb-1">Timeline</label>
                      <div className="text-[14px] text-[#374151]">
                        {role.careerProgression.timelineExpectations}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
