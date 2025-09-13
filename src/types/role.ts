export interface Role {
  id: string;
  title: string;
  code: string;
  category: "executive" | "management" | "professional" | "support" | "intern";
  departmentIds: string[];
  primaryDepartmentId: string;
  level: number;
  seniority: "junior" | "mid" | "senior" | "lead" | "principal";
  description: string;
  responsibilities: string[];
  requiredSkills: SkillRequirement[];
  educationalRequirements: EducationalRequirement;
  experienceRequirements: ExperienceRequirement;
  compensation: Compensation;
  reportingStructure: ReportingStructure;
  performanceMetrics: PerformanceMetric[];
  careerProgression: CareerProgression;
  trainingRequirements: TrainingRequirement[];
  status: "draft" | "active" | "deprecated";
  employeeCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface SkillRequirement {
  skill: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  type: "technical" | "soft" | "domain";
  isRequired: boolean;
}

export interface EducationalRequirement {
  minimumLevel: "high_school" | "associate" | "bachelor" | "master" | "phd";
  preferredDegrees: string[];
  certifications: string[];
}

export interface ExperienceRequirement {
  minimumYears: number;
  industryExperience: string[];
  leadershipExperience: boolean;
  specificExperience: string[];
}

export interface Compensation {
  salaryRange: {
    min: number;
    max: number;
    currency: string;
    frequency: "hourly" | "monthly" | "annually";
  };
  grade: string;
  benefits: string[];
  stockOptions?: boolean;
  equity?: number;
}

export interface ReportingStructure {
  reportsTo: string[];
  directReports: string[];
  teamSize: {
    min: number;
    max: number;
  };
  collaborationRequirements: string[];
}

export interface PerformanceMetric {
  name: string;
  description: string;
  type: "quantitative" | "qualitative";
  weight: number;
}

export interface CareerProgression {
  nextLevelRoles: string[];
  skillDevelopmentRequirements: string[];
  timelineExpectations: string;
}

export interface TrainingRequirement {
  program: string;
  type: "mandatory" | "recommended" | "ongoing";
  frequency: "one_time" | "annual" | "quarterly" | "monthly";
  description: string;
}

export interface RoleFilter {
  search: string;
  department: string;
  category: string;
  level: string;
  status: string;
}

export interface RoleAnalytics {
  totalRoles: number;
  activeRoles: number;
  draftRoles: number;
  deprecatedRoles: number;
  rolesByDepartment: { [departmentId: string]: number };
  rolesByCategory: { [category: string]: number };
  averageSalaryByLevel: { [level: string]: number };
}
