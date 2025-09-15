"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, doc, getDocs, query, where, addDoc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { RoleTemplate, TemplateCategory } from "@/types/role";

export default function RoleTemplatesPage() {
  const router = useRouter();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [templates, setTemplates] = useState<RoleTemplate[]>([]);
  const [customTemplates, setCustomTemplates] = useState<RoleTemplate[]>([]);
  const [creatingFromTemplate, setCreatingFromTemplate] = useState<string | null>(null);

  // Pre-built template categories
  const templateCategories: TemplateCategory[] = [
    {
      name: "Executive",
      description: "C-level and senior executive positions",
      icon: "👔",
      templates: [
        {
          id: "ceo-template",
          name: "Chief Executive Officer",
          description: "Top executive responsible for overall company strategy and operations",
          category: "executive",
          subcategory: "C-Level",
          isPreBuilt: true,
          isCustom: false,
          usageCount: 0,
          tags: ["leadership", "strategy", "executive"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          roleData: {
            title: "Chief Executive Officer",
            code: "CEO",
            category: "executive",
            level: 10,
            seniority: "principal",
            description: "Lead the company's strategic direction, oversee all operations, and ensure organizational success.",
            responsibilities: [
              "Develop and implement company strategy",
              "Lead executive team and board relations",
              "Ensure financial performance and growth",
              "Represent company to stakeholders",
              "Drive organizational culture and values"
            ],
            requiredSkills: [
              { skill: "Strategic Planning", proficiency: "expert", type: "soft", isRequired: true },
              { skill: "Leadership", proficiency: "expert", type: "soft", isRequired: true },
              { skill: "Financial Management", proficiency: "advanced", type: "technical", isRequired: true }
            ],
            educationalRequirements: {
              minimumLevel: "master",
              preferredDegrees: ["MBA", "Business Administration"],
              certifications: ["Executive Leadership"]
            },
            experienceRequirements: {
              minimumYears: 15,
              industryExperience: ["Technology", "Business"],
              leadershipExperience: true,
              specificExperience: ["C-Level Experience", "Board Management"]
            },
            compensation: {
              salaryRange: { min: 200000, max: 500000, currency: "USD", frequency: "annually" },
              grade: "C-Level",
              benefits: ["Stock Options", "Executive Benefits", "Car Allowance"],
              stockOptions: true,
              equity: 5
            },
            reportingStructure: {
              reportsTo: ["Board of Directors"],
              directReports: ["CTO", "CFO", "COO"],
              teamSize: { min: 3, max: 8 },
              collaborationRequirements: ["Board Members", "Investors", "Key Clients"]
            },
            performanceMetrics: [
              { name: "Revenue Growth", description: "Year-over-year revenue increase", type: "quantitative", weight: 30 },
              { name: "Employee Satisfaction", description: "Overall employee engagement score", type: "qualitative", weight: 20 },
              { name: "Market Share", description: "Company's position in target markets", type: "quantitative", weight: 25 }
            ],
            careerProgression: {
              nextLevelRoles: ["Board Member", "Advisor"],
              skillDevelopmentRequirements: ["Advanced Leadership", "Global Strategy"],
              timelineExpectations: "5+ years in role"
            },
            trainingRequirements: [
              { program: "Executive Leadership Program", type: "mandatory", frequency: "annual", description: "Advanced leadership development" }
            ]
          }
        },
        {
          id: "cto-template",
          name: "Chief Technology Officer",
          description: "Lead technology strategy and innovation across the organization",
          category: "executive",
          subcategory: "C-Level",
          isPreBuilt: true,
          isCustom: false,
          usageCount: 0,
          tags: ["technology", "innovation", "executive"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          roleData: {
            title: "Chief Technology Officer",
            code: "CTO",
            category: "executive",
            level: 9,
            seniority: "principal",
            description: "Lead technology strategy, innovation, and digital transformation initiatives.",
            responsibilities: [
              "Develop technology roadmap and strategy",
              "Lead engineering and development teams",
              "Drive innovation and digital transformation",
              "Ensure technology security and compliance",
              "Manage technology partnerships and vendors"
            ],
            requiredSkills: [
              { skill: "Technology Strategy", proficiency: "expert", type: "technical", isRequired: true },
              { skill: "Software Architecture", proficiency: "expert", type: "technical", isRequired: true },
              { skill: "Team Leadership", proficiency: "advanced", type: "soft", isRequired: true }
            ],
            educationalRequirements: {
              minimumLevel: "bachelor",
              preferredDegrees: ["Computer Science", "Engineering", "Technology"],
              certifications: ["Cloud Architecture", "Security Management"]
            },
            experienceRequirements: {
              minimumYears: 12,
              industryExperience: ["Technology", "Software Development"],
              leadershipExperience: true,
              specificExperience: ["Engineering Management", "Technology Strategy"]
            },
            compensation: {
              salaryRange: { min: 180000, max: 350000, currency: "USD", frequency: "annually" },
              grade: "C-Level",
              benefits: ["Stock Options", "Technology Budget", "Conference Allowance"],
              stockOptions: true,
              equity: 3
            },
            reportingStructure: {
              reportsTo: ["CEO"],
              directReports: ["VP Engineering", "VP Product", "VP Data"],
              teamSize: { min: 5, max: 12 },
              collaborationRequirements: ["Product Team", "Engineering Teams", "External Partners"]
            },
            performanceMetrics: [
              { name: "Technology Delivery", description: "On-time delivery of technology initiatives", type: "quantitative", weight: 25 },
              { name: "Innovation Index", description: "New technology adoption and innovation", type: "qualitative", weight: 20 },
              { name: "Team Performance", description: "Engineering team productivity and satisfaction", type: "qualitative", weight: 20 }
            ],
            careerProgression: {
              nextLevelRoles: ["CEO", "Chief Innovation Officer"],
              skillDevelopmentRequirements: ["Business Strategy", "Advanced Technology"],
              timelineExpectations: "3-5 years in role"
            },
            trainingRequirements: [
              { program: "Technology Leadership", type: "mandatory", frequency: "annual", description: "Advanced technology management" }
            ]
          }
        }
      ]
    },
    {
      name: "Management",
      description: "Department heads, team leads, and project managers",
      icon: "👥",
      templates: [
        {
          id: "department-head-template",
          name: "Department Head",
          description: "Lead a department and manage cross-functional teams",
          category: "management",
          subcategory: "Department Leadership",
          isPreBuilt: true,
          isCustom: false,
          usageCount: 0,
          tags: ["management", "leadership", "department"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          roleData: {
            title: "Department Head",
            code: "DEPT_HEAD",
            category: "management",
            level: 7,
            seniority: "senior",
            description: "Lead department operations, strategy, and team development.",
            responsibilities: [
              "Develop department strategy and goals",
              "Manage department budget and resources",
              "Lead and develop team members",
              "Collaborate with other departments",
              "Ensure department performance and compliance"
            ],
            requiredSkills: [
              { skill: "Team Management", proficiency: "advanced", type: "soft", isRequired: true },
              { skill: "Strategic Planning", proficiency: "intermediate", type: "soft", isRequired: true },
              { skill: "Budget Management", proficiency: "intermediate", type: "technical", isRequired: true }
            ],
            educationalRequirements: {
              minimumLevel: "bachelor",
              preferredDegrees: ["Business Administration", "Management"],
              certifications: ["Project Management", "Leadership"]
            },
            experienceRequirements: {
              minimumYears: 8,
              industryExperience: ["Business", "Management"],
              leadershipExperience: true,
              specificExperience: ["Team Management", "Department Operations"]
            },
            compensation: {
              salaryRange: { min: 80000, max: 150000, currency: "USD", frequency: "annually" },
              grade: "Management",
              benefits: ["Management Bonus", "Professional Development", "Flexible Schedule"]
            },
            reportingStructure: {
              reportsTo: ["VP", "Director"],
              directReports: ["Team Leads", "Senior Staff"],
              teamSize: { min: 5, max: 20 },
              collaborationRequirements: ["Other Departments", "Executive Team", "External Partners"]
            },
            performanceMetrics: [
              { name: "Department Performance", description: "Achievement of department goals", type: "quantitative", weight: 30 },
              { name: "Team Satisfaction", description: "Employee engagement and retention", type: "qualitative", weight: 25 },
              { name: "Budget Management", description: "Effective resource utilization", type: "quantitative", weight: 20 }
            ],
            careerProgression: {
              nextLevelRoles: ["VP", "Director", "Senior Manager"],
              skillDevelopmentRequirements: ["Advanced Leadership", "Strategic Thinking"],
              timelineExpectations: "2-3 years in role"
            },
            trainingRequirements: [
              { program: "Management Development", type: "mandatory", frequency: "annual", description: "Leadership and management skills" }
            ]
          }
        }
      ]
    },
    {
      name: "Professional",
      description: "Individual contributors and specialists",
      icon: "💼",
      templates: [
        {
          id: "software-engineer-template",
          name: "Software Engineer",
          description: "Develop software applications and systems",
          category: "professional",
          subcategory: "Engineering",
          isPreBuilt: true,
          isCustom: false,
          usageCount: 0,
          tags: ["engineering", "development", "technology"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          roleData: {
            title: "Software Engineer",
            code: "SWE",
            category: "professional",
            level: 5,
            seniority: "mid",
            description: "Design, develop, and maintain software applications and systems.",
            responsibilities: [
              "Design and develop software applications",
              "Write clean, maintainable code",
              "Collaborate with cross-functional teams",
              "Participate in code reviews and testing",
              "Troubleshoot and debug applications"
            ],
            requiredSkills: [
              { skill: "Programming", proficiency: "advanced", type: "technical", isRequired: true },
              { skill: "Software Design", proficiency: "intermediate", type: "technical", isRequired: true },
              { skill: "Problem Solving", proficiency: "advanced", type: "soft", isRequired: true }
            ],
            educationalRequirements: {
              minimumLevel: "bachelor",
              preferredDegrees: ["Computer Science", "Software Engineering"],
              certifications: ["Cloud Development", "Agile Development"]
            },
            experienceRequirements: {
              minimumYears: 3,
              industryExperience: ["Software Development", "Technology"],
              leadershipExperience: false,
              specificExperience: ["Full-Stack Development", "API Development"]
            },
            compensation: {
              salaryRange: { min: 70000, max: 120000, currency: "USD", frequency: "annually" },
              grade: "Professional",
              benefits: ["Health Insurance", "401k", "Professional Development"]
            },
            reportingStructure: {
              reportsTo: ["Engineering Manager", "Tech Lead"],
              directReports: [],
              teamSize: { min: 0, max: 0 },
              collaborationRequirements: ["Product Team", "Design Team", "QA Team"]
            },
            performanceMetrics: [
              { name: "Code Quality", description: "Code review scores and bug rates", type: "quantitative", weight: 30 },
              { name: "Delivery", description: "On-time delivery of features", type: "quantitative", weight: 25 },
              { name: "Collaboration", description: "Team collaboration and communication", type: "qualitative", weight: 20 }
            ],
            careerProgression: {
              nextLevelRoles: ["Senior Software Engineer", "Tech Lead", "Engineering Manager"],
              skillDevelopmentRequirements: ["Advanced Programming", "System Design", "Leadership"],
              timelineExpectations: "2-3 years in role"
            },
            trainingRequirements: [
              { program: "Technical Skills Development", type: "recommended", frequency: "quarterly", description: "Stay updated with latest technologies" }
            ]
          }
        }
      ]
    },
    {
      name: "Support",
      description: "Administrative and customer service roles",
      icon: "🛠️",
      templates: [
        {
          id: "hr-specialist-template",
          name: "HR Specialist",
          description: "Support human resources operations and employee relations",
          category: "support",
          subcategory: "Human Resources",
          isPreBuilt: true,
          isCustom: false,
          usageCount: 0,
          tags: ["hr", "support", "administration"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          roleData: {
            title: "HR Specialist",
            code: "HR_SPEC",
            category: "support",
            level: 4,
            seniority: "mid",
            description: "Support HR operations, employee relations, and administrative functions.",
            responsibilities: [
              "Process employee onboarding and offboarding",
              "Maintain employee records and documentation",
              "Support recruitment and hiring processes",
              "Assist with benefits administration",
              "Handle employee inquiries and support"
            ],
            requiredSkills: [
              { skill: "HR Administration", proficiency: "intermediate", type: "technical", isRequired: true },
              { skill: "Communication", proficiency: "advanced", type: "soft", isRequired: true },
              { skill: "Attention to Detail", proficiency: "advanced", type: "soft", isRequired: true }
            ],
            educationalRequirements: {
              minimumLevel: "bachelor",
              preferredDegrees: ["Human Resources", "Business Administration"],
              certifications: ["HR Certification", "Payroll Administration"]
            },
            experienceRequirements: {
              minimumYears: 2,
              industryExperience: ["Human Resources", "Administration"],
              leadershipExperience: false,
              specificExperience: ["HR Systems", "Employee Relations"]
            },
            compensation: {
              salaryRange: { min: 45000, max: 70000, currency: "USD", frequency: "annually" },
              grade: "Support",
              benefits: ["Health Insurance", "401k", "Professional Development"]
            },
            reportingStructure: {
              reportsTo: ["HR Manager", "HR Director"],
              directReports: [],
              teamSize: { min: 0, max: 0 },
              collaborationRequirements: ["All Departments", "Payroll", "Benefits"]
            },
            performanceMetrics: [
              { name: "Process Efficiency", description: "Timeliness of HR processes", type: "quantitative", weight: 30 },
              { name: "Employee Satisfaction", description: "Employee feedback on HR support", type: "qualitative", weight: 25 },
              { name: "Compliance", description: "Adherence to HR policies and regulations", type: "quantitative", weight: 25 }
            ],
            careerProgression: {
              nextLevelRoles: ["HR Manager", "Senior HR Specialist", "HR Business Partner"],
              skillDevelopmentRequirements: ["Advanced HR", "Strategic HR", "Leadership"],
              timelineExpectations: "2-3 years in role"
            },
            trainingRequirements: [
              { program: "HR Professional Development", type: "mandatory", frequency: "annual", description: "Stay updated with HR best practices" }
            ]
          }
        }
      ]
    },
    {
      name: "Specialized",
      description: "Sales, legal, compliance, and other specialized roles",
      icon: "🎯",
      templates: [
        {
          id: "sales-manager-template",
          name: "Sales Manager",
          description: "Lead sales team and drive revenue growth",
          category: "specialized",
          subcategory: "Sales",
          isPreBuilt: true,
          isCustom: false,
          usageCount: 0,
          tags: ["sales", "management", "revenue"],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          roleData: {
            title: "Sales Manager",
            code: "SALES_MGR",
            category: "professional",
            level: 6,
            seniority: "senior",
            description: "Lead sales team, develop sales strategies, and drive revenue growth.",
            responsibilities: [
              "Develop and execute sales strategies",
              "Lead and motivate sales team",
              "Manage key client relationships",
              "Analyze sales performance and metrics",
              "Collaborate with marketing and product teams"
            ],
            requiredSkills: [
              { skill: "Sales Management", proficiency: "advanced", type: "technical", isRequired: true },
              { skill: "Relationship Building", proficiency: "expert", type: "soft", isRequired: true },
              { skill: "Data Analysis", proficiency: "intermediate", type: "technical", isRequired: true }
            ],
            educationalRequirements: {
              minimumLevel: "bachelor",
              preferredDegrees: ["Business", "Marketing", "Sales"],
              certifications: ["Sales Management", "CRM Certification"]
            },
            experienceRequirements: {
              minimumYears: 6,
              industryExperience: ["Sales", "Business Development"],
              leadershipExperience: true,
              specificExperience: ["Sales Team Management", "Revenue Growth"]
            },
            compensation: {
              salaryRange: { min: 80000, max: 150000, currency: "USD", frequency: "annually" },
              grade: "Management",
              benefits: ["Commission", "Sales Bonus", "Car Allowance", "Health Insurance"]
            },
            reportingStructure: {
              reportsTo: ["VP Sales", "Sales Director"],
              directReports: ["Sales Representatives", "Account Managers"],
              teamSize: { min: 3, max: 10 },
              collaborationRequirements: ["Marketing Team", "Product Team", "Customer Success"]
            },
            performanceMetrics: [
              { name: "Revenue Target", description: "Achievement of sales revenue goals", type: "quantitative", weight: 40 },
              { name: "Team Performance", description: "Sales team productivity and results", type: "quantitative", weight: 25 },
              { name: "Customer Satisfaction", description: "Client relationship quality", type: "qualitative", weight: 20 }
            ],
            careerProgression: {
              nextLevelRoles: ["VP Sales", "Sales Director", "Regional Manager"],
              skillDevelopmentRequirements: ["Advanced Sales", "Strategic Planning", "Leadership"],
              timelineExpectations: "3-4 years in role"
            },
            trainingRequirements: [
              { program: "Sales Leadership", type: "mandatory", frequency: "annual", description: "Advanced sales management skills" }
            ]
          }
        }
      ]
    }
  ];

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
        setOrgId(foundOrgId);
        
        if (foundOrgId) {
          await loadCustomTemplates(foundOrgId);
        }
      } catch (error) {
        console.error("Error loading organization:", error);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const loadCustomTemplates = async (organizationId: string) => {
    try {
      const templatesCol = collection(db, "organizations", organizationId, "roleTemplates");
      const templatesSnap = await getDocs(templatesCol);
      const customTemplatesList: RoleTemplate[] = templatesSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as RoleTemplate[];
      setCustomTemplates(customTemplatesList);
    } catch (error) {
      console.error("Error loading custom templates:", error);
    }
  };

  const createRoleFromTemplate = async (template: RoleTemplate) => {
    if (!orgId) return;
    
    setCreatingFromTemplate(template.id);
    try {
      const roleData = {
        ...template.roleData,
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid || "",
        employeeCount: 0
      };

      await addDoc(collection(db, "organizations", orgId, "roles"), roleData);
      
      // Update template usage count
      if (template.isPreBuilt) {
        // For pre-built templates, we could store usage in a separate collection
        console.log("Pre-built template used:", template.name);
      } else {
        // Update custom template usage count
        const templateRef = doc(db, "organizations", orgId, "roleTemplates", template.id);
        await updateDoc(templateRef, {
          usageCount: template.usageCount + 1,
          updatedAt: new Date().toISOString()
        });
      }

      router.push("/admin/roles");
    } catch (error) {
      console.error("Error creating role from template:", error);
      alert("Error creating role from template. Please try again.");
    } finally {
      setCreatingFromTemplate(null);
    }
  };

  const filteredTemplates = templateCategories.flatMap(category => category.templates)
    .concat(customTemplates)
    .filter(template => {
      const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesCategory && matchesSearch;
    });

  if (loading) {
    return (
      <div className="px-6 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-6 py-8">
      <div className="mb-8">
        <h1 className="text-[24px] font-semibold text-[#111827] mb-2">Role Templates</h1>
        <p className="text-[14px] text-[#6b7280]">
          Choose from pre-built role templates or create custom templates for your organization
        </p>
      </div>

      {/* Search and Filter */}
      <div className="mb-8 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] focus:ring-2 focus:ring-[#3b82f6] focus:border-transparent"
          />
        </div>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border border-[#d1d5db] rounded-md text-[14px] bg-white"
        >
          <option value="all">All Categories</option>
          {templateCategories.map((category) => (
            <option key={category.name} value={category.name.toLowerCase()}>
              {category.icon} {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Template Categories */}
      {templateCategories.map((category) => {
        const categoryTemplates = filteredTemplates.filter(t => t.category === category.name.toLowerCase());
        if (categoryTemplates.length === 0) return null;

        return (
          <div key={category.name} className="mb-12">
            <div className="mb-6">
              <h2 className="text-[20px] font-semibold text-[#111827] mb-2">
                {category.icon} {category.name}
              </h2>
              <p className="text-[14px] text-[#6b7280]">{category.description}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoryTemplates.map((template) => (
                <div key={template.id} className="bg-white border border-[#e5e7eb] rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="mb-4">
                    <h3 className="text-[16px] font-semibold text-[#111827] mb-2">{template.name}</h3>
                    <p className="text-[14px] text-[#6b7280] mb-3">{template.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-[#f3f4f6] text-[#374151] text-[12px] rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-[12px] text-[#6b7280]">
                      {template.isPreBuilt ? "Pre-built Template" : "Custom Template"}
                      {template.usageCount > 0 && (
                        <span className="ml-2">• Used {template.usageCount} times</span>
                      )}
                    </div>
                    <button
                      onClick={() => createRoleFromTemplate(template)}
                      disabled={creatingFromTemplate === template.id}
                      className="px-4 py-2 bg-[#3b82f6] text-white text-[14px] font-medium rounded-md hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {creatingFromTemplate === template.id ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Creating...
                        </>
                      ) : (
                        "Create Role"
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Custom Templates Section */}
      {customTemplates.length > 0 && (
        <div className="mb-12">
          <div className="mb-6">
            <h2 className="text-[20px] font-semibold text-[#111827] mb-2">
              🏢 Custom Templates
            </h2>
            <p className="text-[14px] text-[#6b7280]">Organization-specific role templates</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customTemplates.map((template) => (
              <div key={template.id} className="bg-white border border-[#e5e7eb] rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="mb-4">
                  <h3 className="text-[16px] font-semibold text-[#111827] mb-2">{template.name}</h3>
                  <p className="text-[14px] text-[#6b7280] mb-3">{template.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {template.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-[#f3f4f6] text-[#374151] text-[12px] rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="text-[12px] text-[#6b7280]">
                    Custom Template
                    {template.usageCount > 0 && (
                      <span className="ml-2">• Used {template.usageCount} times</span>
                    )}
                  </div>
                  <button
                    onClick={() => createRoleFromTemplate(template)}
                    disabled={creatingFromTemplate === template.id}
                    className="px-4 py-2 bg-[#3b82f6] text-white text-[14px] font-medium rounded-md hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {creatingFromTemplate === template.id ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating...
                      </>
                    ) : (
                      "Create Role"
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <div className="text-[48px] mb-4">🔍</div>
          <h3 className="text-[18px] font-semibold text-[#111827] mb-2">No templates found</h3>
          <p className="text-[14px] text-[#6b7280]">
            Try adjusting your search terms or category filter
          </p>
        </div>
      )}
    </div>
  );
}
