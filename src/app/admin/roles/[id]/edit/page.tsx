"use client";

import { useState, useEffect, use, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { Role, SkillRequirement } from "@/types/role";

interface Department {
  id: string;
  name: string;
}

interface Employee {
  id: string;
  name: string;
  roleId?: string;
}

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
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
      const snap = await getDocs(empCol);
      const empList = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Employee[];
      setEmployees(empList);
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  }, []);

  const steps = [
    { id: 1, title: "Basic Information", description: "Role title, category, and department" },
    { id: 2, title: "Description & Requirements", description: "Job summary, responsibilities, and skills" },
    { id: 3, title: "Compensation & Benefits", description: "Salary range and benefits package" },
    { id: 4, title: "Reporting Structure", description: "Hierarchy and collaboration requirements" },
    { id: 5, title: "Performance & Development", description: "KPIs, career path, and training" }
  ];

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

  const handleInputChange = (field: keyof Role, value: string | number | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = (parentField: keyof Role, childField: string, value: string | number | boolean | string[]) => {
    setFormData(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] as unknown as Record<string, unknown>),
        [childField]: value
      }
    }));
  };

  const addResponsibility = () => {
    setFormData(prev => ({
      ...prev,
      responsibilities: [...(prev.responsibilities || []), ""]
    }));
  };

  const updateResponsibility = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: prev.responsibilities?.map((resp, i) => i === index ? value : resp) || []
    }));
  };

  const removeResponsibility = (index: number) => {
    setFormData(prev => ({
      ...prev,
      responsibilities: prev.responsibilities?.filter((_, i) => i !== index) || []
    }));
  };

  const addSkill = () => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: [...(prev.requiredSkills || []), {
        skill: "",
        proficiency: "intermediate",
        type: "technical",
        isRequired: true
      }]
    }));
  };

  const updateSkill = (index: number, field: keyof SkillRequirement, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills?.map((skill, i) => 
        i === index ? { ...skill, [field]: value } : skill
      ) || []
    }));
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      requiredSkills: prev.requiredSkills?.filter((_, i) => i !== index) || []
    }));
  };

  const updateCompensationSalaryRange = (field: 'min' | 'max' | 'currency' | 'frequency', value: string | number) => {
    setFormData(prev => ({
      ...prev,
      compensation: {
        ...prev.compensation,
        salaryRange: {
          ...prev.compensation?.salaryRange,
          [field]: value
        }
      }
    } as Partial<Role>));
  };

  const updateCompensationField = (field: 'grade' | 'stockOptions' | 'equity', value: string | boolean | number) => {
    setFormData(prev => ({
      ...prev,
      compensation: {
        ...prev.compensation,
        [field]: value
      }
    } as Partial<Role>));
  };

  const updateReportingTeamSize = (field: 'min' | 'max', value: number) => {
    setFormData(prev => ({
      ...prev,
      reportingStructure: {
        ...prev.reportingStructure,
        teamSize: {
          ...prev.reportingStructure?.teamSize,
          [field]: value
        }
      }
    } as Partial<Role>));
  };

  const handleSave = async () => {
    if (!role || !formData.title || !formData.primaryDepartmentId) {
      alert("Please fill in all required fields");
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
        await updateDoc(roleDoc, {
          ...formData,
          updatedAt: new Date().toISOString()
        });
        
        router.push(`/admin/roles/${role.id}`);
      }
    } catch (error) {
      console.error("Error saving role:", error);
      alert("Error saving role. Please try again.");
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
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-semibold">Edit Role: {role.title}</h1>
            <p className="mt-2 text-[14px] text-[#6b7280]">Update role details and requirements.</p>
          </div>
          <Link 
            href={`/admin/roles/${role.id}`}
            className="px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] hover:bg-[#f9fafb]"
          >
            Back to Role
          </Link>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-[12px] font-medium ${
                  currentStep >= step.id 
                    ? "bg-[#1f2937] text-white" 
                    : "bg-[#f3f4f6] text-[#6b7280]"
                }`}>
                  {step.id}
                </div>
                <div className="ml-3 hidden sm:block">
                  <div className={`text-[14px] font-medium ${
                    currentStep >= step.id ? "text-[#1a1a1a]" : "text-[#6b7280]"
                  }`}>
                    {step.title}
                  </div>
                  <div className="text-[12px] text-[#6b7280]">{step.description}</div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? "bg-[#1f2937]" : "bg-[#e5e7eb]"
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
          {currentStep === 1 && (
            <BasicInformationStep 
              formData={formData}
              departments={departments}
              onInputChange={handleInputChange}
              onNestedInputChange={handleNestedInputChange}
            />
          )}
          
          {currentStep === 2 && (
            <DescriptionRequirementsStep 
              formData={formData}
              onInputChange={handleInputChange}
              onNestedInputChange={handleNestedInputChange}
              addResponsibility={addResponsibility}
              updateResponsibility={updateResponsibility}
              removeResponsibility={removeResponsibility}
              addSkill={addSkill}
              updateSkill={updateSkill}
              removeSkill={removeSkill}
            />
          )}
          
          {currentStep === 3 && (
            <CompensationBenefitsStep 
              formData={formData}
              updateCompensationSalaryRange={updateCompensationSalaryRange}
              updateCompensationField={updateCompensationField}
            />
          )}
          
          {currentStep === 4 && (
            <ReportingStructureStep 
              formData={formData}
              employees={employees}
              onNestedInputChange={handleNestedInputChange}
              updateReportingTeamSize={updateReportingTeamSize}
            />
          )}
          
          {currentStep === 5 && (
            <PerformanceDevelopmentStep 
              formData={formData}
              onInputChange={handleInputChange}
              onNestedInputChange={handleNestedInputChange}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
            disabled={currentStep === 1}
            className="px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] hover:bg-[#f9fafb] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-[#059669] text-white rounded-md text-[14px] font-medium hover:bg-[#047857] disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            
            {currentStep < steps.length && (
              <button
                onClick={() => setCurrentStep(prev => Math.min(steps.length, prev + 1))}
                className="px-4 py-2 bg-[#f97316] text-white rounded-md text-[14px] font-medium hover:bg-[#ea580c]"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Component Interfaces
interface BasicInformationStepProps {
  formData: Partial<Role>;
  departments: Department[];
  onInputChange: (field: keyof Role, value: string | number | boolean | string[]) => void;
  onNestedInputChange: (parentField: keyof Role, childField: string, value: string | number | boolean | string[]) => void;
}

interface DescriptionRequirementsStepProps {
  formData: Partial<Role>;
  onInputChange: (field: keyof Role, value: string | number | boolean | string[]) => void;
  onNestedInputChange: (parentField: keyof Role, childField: string, value: string | number | boolean | string[]) => void;
  addResponsibility: () => void;
  updateResponsibility: (index: number, value: string) => void;
  removeResponsibility: (index: number) => void;
  addSkill: () => void;
  updateSkill: (index: number, field: keyof SkillRequirement, value: string | boolean) => void;
  removeSkill: (index: number) => void;
}

interface CompensationBenefitsStepProps {
  formData: Partial<Role>;
  updateCompensationSalaryRange: (field: 'min' | 'max' | 'currency' | 'frequency', value: string | number) => void;
  updateCompensationField: (field: 'grade' | 'stockOptions' | 'equity', value: string | boolean | number) => void;
}

interface ReportingStructureStepProps {
  formData: Partial<Role>;
  employees: Employee[];
  onNestedInputChange: (parentField: keyof Role, childField: string, value: string | number | boolean | string[]) => void;
  updateReportingTeamSize: (field: 'min' | 'max', value: number) => void;
}

interface PerformanceDevelopmentStepProps {
  formData: Partial<Role>;
  onInputChange: (field: keyof Role, value: string | number | boolean | string[]) => void;
  onNestedInputChange: (parentField: keyof Role, childField: string, value: string | number | boolean | string[]) => void;
}

// Step Components
function BasicInformationStep({ formData, departments, onInputChange }: BasicInformationStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-[20px] font-semibold">Basic Role Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[14px] font-medium mb-2">Role Title *</label>
          <input
            type="text"
            value={formData.title || ""}
            onChange={(e) => onInputChange("title", e.target.value)}
            placeholder="e.g., Senior Software Engineer"
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
        </div>
        
        <div>
          <label className="block text-[14px] font-medium mb-2">Role Code</label>
          <input
            type="text"
            value={formData.code || ""}
            onChange={(e) => onInputChange("code", e.target.value)}
            placeholder="Auto-generated"
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
        </div>
        
        <div>
          <label className="block text-[14px] font-medium mb-2">Role Category *</label>
          <select
            value={formData.category || "professional"}
            onChange={(e) => onInputChange("category", e.target.value)}
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          >
            <option value="executive">Executive</option>
            <option value="management">Management</option>
            <option value="professional">Professional</option>
            <option value="support">Support</option>
            <option value="intern">Intern</option>
          </select>
        </div>
        
        <div>
          <label className="block text-[14px] font-medium mb-2">Primary Department *</label>
          <select
            value={formData.primaryDepartmentId || ""}
            onChange={(e) => onInputChange("primaryDepartmentId", e.target.value)}
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          >
            <option value="">Select Department</option>
            {departments.map((dept: Department) => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-[14px] font-medium mb-2">Role Level</label>
          <select
            value={formData.level || 1}
            onChange={(e) => onInputChange("level", parseInt(e.target.value, 10))}
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(level => (
              <option key={level} value={level}>Level {level}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-[14px] font-medium mb-2">Seniority Level</label>
          <select
            value={formData.seniority || "junior"}
            onChange={(e) => onInputChange("seniority", e.target.value)}
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          >
            <option value="junior">Junior</option>
            <option value="mid">Mid-level</option>
            <option value="senior">Senior</option>
            <option value="lead">Lead</option>
            <option value="principal">Principal</option>
          </select>
        </div>
      </div>
      
      <div>
        <label className="block text-[14px] font-medium mb-2">Additional Departments</label>
        <div className="space-y-2">
          {departments.map((dept: Department) => (
            <label key={dept.id} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.departmentIds?.includes(dept.id) || false}
                onChange={(e) => {
                  const currentIds = formData.departmentIds || [];
                  const newIds = e.target.checked
                    ? [...currentIds, dept.id]
                    : currentIds.filter(id => id !== dept.id);
                  onInputChange("departmentIds", newIds);
                }}
                className="mr-2"
              />
              <span className="text-[14px]">{dept.name}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function DescriptionRequirementsStep({ formData, onInputChange, onNestedInputChange, addResponsibility, updateResponsibility, removeResponsibility, addSkill, updateSkill, removeSkill }: DescriptionRequirementsStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-[20px] font-semibold">Role Description & Requirements</h2>
      
      <div>
        <label className="block text-[14px] font-medium mb-2">Job Summary</label>
        <textarea
          value={formData.description || ""}
          onChange={(e) => onInputChange("description", e.target.value)}
          placeholder="Brief overview of the role..."
          rows={4}
          className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
        />
      </div>
      
      <div>
        <label className="block text-[14px] font-medium mb-2">Key Responsibilities</label>
        <div className="space-y-2">
          {formData.responsibilities?.map((resp: string, index: number) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={resp}
                onChange={(e) => updateResponsibility(index, e.target.value)}
                placeholder="Enter responsibility..."
                className="flex-1 rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
              <button
                onClick={() => removeResponsibility(index)}
                className="text-[#dc2626] hover:text-[#b91c1c]"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            onClick={addResponsibility}
            className="text-[#059669] hover:text-[#047857] text-[14px]"
          >
            + Add Responsibility
          </button>
        </div>
      </div>
      
      <div>
        <label className="block text-[14px] font-medium mb-2">Required Skills</label>
        <div className="space-y-3">
          {formData.requiredSkills?.map((skill: SkillRequirement, index: number) => (
            <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center">
              <input
                type="text"
                value={skill.skill}
                onChange={(e) => updateSkill(index, "skill", e.target.value)}
                placeholder="Skill name..."
                className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
              <select
                value={skill.proficiency}
                onChange={(e) => updateSkill(index, "proficiency", e.target.value)}
                className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
                <option value="expert">Expert</option>
              </select>
              <select
                value={skill.type}
                onChange={(e) => updateSkill(index, "type", e.target.value)}
                className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              >
                <option value="technical">Technical</option>
                <option value="soft">Soft</option>
                <option value="domain">Domain</option>
              </select>
              <div className="flex items-center gap-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={skill.isRequired}
                    onChange={(e) => updateSkill(index, "isRequired", e.target.checked)}
                    className="mr-1"
                  />
                  <span className="text-[12px]">Required</span>
                </label>
                <button
                  onClick={() => removeSkill(index)}
                  className="text-[#dc2626] hover:text-[#b91c1c]"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={addSkill}
            className="text-[#059669] hover:text-[#047857] text-[14px]"
          >
            + Add Skill
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[14px] font-medium mb-2">Minimum Education Level</label>
          <select
            value={formData.educationalRequirements?.minimumLevel || "bachelor"}
            onChange={(e) => onNestedInputChange("educationalRequirements", "minimumLevel", e.target.value)}
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          >
            <option value="high_school">High School</option>
            <option value="associate">Associate Degree</option>
            <option value="bachelor">Bachelor&apos;s Degree</option>
            <option value="master">Master&apos;s Degree</option>
            <option value="phd">PhD</option>
          </select>
        </div>
        
        <div>
          <label className="block text-[14px] font-medium mb-2">Minimum Years of Experience</label>
          <input
            type="number"
            value={formData.experienceRequirements?.minimumYears || 0}
            onChange={(e) => onNestedInputChange("experienceRequirements", "minimumYears", parseInt(e.target.value))}
            min="0"
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
        </div>
      </div>
    </div>
  );
}

function CompensationBenefitsStep({ formData, updateCompensationSalaryRange, updateCompensationField }: CompensationBenefitsStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-[20px] font-semibold">Compensation & Benefits</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[14px] font-medium mb-2">Minimum Salary</label>
          <input
            type="number"
            value={formData.compensation?.salaryRange?.min || 0}
            onChange={(e) => updateCompensationSalaryRange("min", parseInt(e.target.value, 10))}
            min="0"
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
        </div>
        
        <div>
          <label className="block text-[14px] font-medium mb-2">Maximum Salary</label>
          <input
            type="number"
            value={formData.compensation?.salaryRange?.max || 0}
            onChange={(e) => updateCompensationSalaryRange("max", parseInt(e.target.value, 10))}
            min="0"
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
        </div>
        
        <div>
          <label className="block text-[14px] font-medium mb-2">Currency</label>
          <select
            value={formData.compensation?.salaryRange?.currency || "USD"}
            onChange={(e) => updateCompensationSalaryRange("currency", e.target.value)}
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          >
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
            <option value="CAD">CAD</option>
            <option value="AUD">AUD</option>
          </select>
        </div>
        
        <div>
          <label className="block text-[14px] font-medium mb-2">Pay Frequency</label>
          <select
            value={formData.compensation?.salaryRange?.frequency || "annually"}
            onChange={(e) => updateCompensationSalaryRange("frequency", e.target.value)}
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          >
            <option value="hourly">Hourly</option>
            <option value="monthly">Monthly</option>
            <option value="annually">Annually</option>
          </select>
        </div>
        
        <div>
          <label className="block text-[14px] font-medium mb-2">Salary Grade</label>
          <input
            type="text"
            value={formData.compensation?.grade || ""}
            onChange={(e) => updateCompensationField("grade", e.target.value)}
            placeholder="e.g., G7, Band 3"
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.compensation?.stockOptions || false}
              onChange={(e) => updateCompensationField("stockOptions", e.target.checked)}
              className="mr-2"
            />
            <span className="text-[14px]">Stock Options</span>
          </label>
          
          {formData.compensation?.stockOptions && (
            <div>
              <label className="block text-[12px] font-medium mb-1">Equity %</label>
              <input
                type="number"
                value={formData.compensation?.equity || 0}
                onChange={(e) => updateCompensationField("equity", parseFloat(e.target.value))}
                min="0"
                max="100"
                step="0.1"
                className="w-20 rounded-md border border-[#d1d5db] px-2 py-1 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReportingStructureStep({ formData, employees, onNestedInputChange, updateReportingTeamSize }: ReportingStructureStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-[20px] font-semibold">Reporting Structure</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[14px] font-medium mb-2">Reports To</label>
          <select
            multiple
            value={formData.reportingStructure?.reportsTo || []}
            onChange={(e) => {
              const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
              onNestedInputChange("reportingStructure", "reportsTo", selectedValues);
            }}
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          >
            {employees.map((emp: Employee) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-[14px] font-medium mb-2">Direct Reports</label>
          <select
            multiple
            value={formData.reportingStructure?.directReports || []}
            onChange={(e) => {
              const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
              onNestedInputChange("reportingStructure", "directReports", selectedValues);
            }}
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          >
            {employees.map((emp: Employee) => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-[14px] font-medium mb-2">Minimum Team Size</label>
          <input
            type="number"
            value={formData.reportingStructure?.teamSize?.min || 0}
            onChange={(e) => updateReportingTeamSize("min", parseInt(e.target.value, 10))}
            min="0"
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
        </div>
        
        <div>
          <label className="block text-[14px] font-medium mb-2">Maximum Team Size</label>
          <input
            type="number"
            value={formData.reportingStructure?.teamSize?.max || 0}
            onChange={(e) => updateReportingTeamSize("max", parseInt(e.target.value, 10))}
            min="0"
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
        </div>
      </div>
    </div>
  );
}

function PerformanceDevelopmentStep({ formData, onNestedInputChange }: PerformanceDevelopmentStepProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-[20px] font-semibold">Performance & Development</h2>
      
      <div>
        <label className="block text-[14px] font-medium mb-2">Career Progression Timeline</label>
        <textarea
          value={formData.careerProgression?.timelineExpectations || ""}
          onChange={(e) => onNestedInputChange("careerProgression", "timelineExpectations", e.target.value)}
          placeholder="Expected timeline for career progression..."
          rows={3}
          className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-[14px] font-medium mb-2">Next Level Roles</label>
          <textarea
            value={formData.careerProgression?.nextLevelRoles?.join(", ") || ""}
            onChange={(e) => onNestedInputChange("careerProgression", "nextLevelRoles", e.target.value.split(", ").filter(role => role.trim()))}
            placeholder="Comma-separated list of next level roles..."
            rows={3}
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
        </div>
        
        <div>
          <label className="block text-[14px] font-medium mb-2">Skill Development Requirements</label>
          <textarea
            value={formData.careerProgression?.skillDevelopmentRequirements?.join(", ") || ""}
            onChange={(e) => onNestedInputChange("careerProgression", "skillDevelopmentRequirements", e.target.value.split(", ").filter(skill => skill.trim()))}
            placeholder="Comma-separated list of skills to develop..."
            rows={3}
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
        </div>
      </div>
    </div>
  );
}
