"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc, collection, collectionGroup, query, where, getDocs, addDoc, writeBatch } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import Link from "next/link";

interface CompanyInfo {
  legalName: string;
  displayName: string;
  industry: string;
  website: string;
  country: string;
}

interface CompanySize {
  employeeCount: number;
  growthExpectation: string;
  remoteWork: string;
  currentHrMethod: string;
}

interface UseCases {
  priorities: string[];
  goLiveTimeline: string;
}

interface AdminContact {
  firstName: string;
  lastName: string;
  jobTitle: string;
  phone: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  timezone: string;
}

const INDUSTRIES = [
  "Technology",
  "Healthcare", 
  "Finance",
  "Retail",
  "Manufacturing",
  "Education",
  "Non-profit",
  "Other"
];

const COUNTRIES = [
  "United States",
  "Canada",
  "United Kingdom",
  "Australia",
  "Germany",
  "France",
  "India",
  "Other"
];

const GROWTH_OPTIONS = [
  "Stay the same (0-10% growth)",
  "Moderate growth (11-50% growth)", 
  "Rapid growth (50%+ growth)"
];

const REMOTE_OPTIONS = [
  "No, all employees work in office",
  "Yes, some employees work remotely",
  "Yes, we're fully remote"
];

const HR_METHOD_OPTIONS = [
  "Spreadsheets and manual processes",
  "Basic HR software",
  "Multiple disconnected tools",
  "This is our first HR system"
];

const PRIORITY_OPTIONS = [
  "Employee information management",
  "Payroll processing and tax compliance",
  "Time tracking and attendance",
  "Performance reviews and goal setting",
  "Benefits administration",
  "Recruitment and onboarding",
  "Document management and e-signatures",
  "Compliance and reporting",
  "Employee self-service portal"
];


const JOB_TITLES = [
  "CEO",
  "HR Manager",
  "HR Director", 
  "Office Manager",
  "Operations Manager",
  "Owner",
  "Other"
];

const TIMEZONES = [
  "Eastern Time (UTC-5)",
  "Central Time (UTC-6)",
  "Mountain Time (UTC-7)",
  "Pacific Time (UTC-8)",
  "Alaska Time (UTC-9)",
  "Hawaii Time (UTC-10)"
];

// Technology Industry Templates
const TECH_DEPARTMENTS = [
  {
    name: "Executive Leadership",
    code: "EXEC",
    type: "core",
    description: "Executive team responsible for strategic direction and company vision",
    parentId: null
  },
  {
    name: "Product & Engineering",
    code: "PRODENG",
    type: "core", 
    description: "Product development, engineering, and technical innovation",
    parentId: null
  },
  {
    name: "Frontend Engineering",
    code: "FRONTEND",
    type: "core",
    description: "User interface and client-side application development",
    parentId: "PRODENG"
  },
  {
    name: "Backend Engineering", 
    code: "BACKEND",
    type: "core",
    description: "Server-side development and API management",
    parentId: "PRODENG"
  },
  {
    name: "Full-Stack Engineering",
    code: "FULLSTACK", 
    type: "core",
    description: "End-to-end application development",
    parentId: "PRODENG"
  },
  {
    name: "Mobile Engineering",
    code: "MOBILE",
    type: "core", 
    description: "iOS, Android, and cross-platform mobile development",
    parentId: "PRODENG"
  },
  {
    name: "DevOps & Infrastructure",
    code: "DEVOPS",
    type: "core",
    description: "Cloud infrastructure, deployment, and system reliability",
    parentId: "PRODENG"
  },
  {
    name: "UI/UX Design",
    code: "DESIGN",
    type: "core",
    description: "User experience and interface design",
    parentId: "PRODENG"
  },
  {
    name: "Quality Assurance",
    code: "QA",
    type: "support",
    description: "Software testing, quality control, and automation",
    parentId: null
  },
  {
    name: "Product Management", 
    code: "PRODMGMT",
    type: "core",
    description: "Product strategy, roadmap, and project coordination",
    parentId: null
  },
  {
    name: "Data & AI",
    code: "DATA",
    type: "core",
    description: "Data science, machine learning, and business intelligence", 
    parentId: null
  },
  {
    name: "IT & Internal Systems",
    code: "IT",
    type: "support",
    description: "Information technology infrastructure and internal systems support",
    parentId: null
  },
  {
    name: "Sales & Marketing",
    code: "SALESMKT",
    type: "core",
    description: "Revenue generation, customer acquisition, and brand management",
    parentId: null
  },
  {
    name: "Sales",
    code: "SALES",
    type: "core",
    description: "Direct sales, partnerships, and customer success",
    parentId: "SALESMKT"
  },
  {
    name: "Marketing",
    code: "MARKETING",
    type: "core", 
    description: "Brand management, digital marketing, and content strategy",
    parentId: "SALESMKT"
  },
  {
    name: "Finance & Legal",
    code: "FINLEGAL",
    type: "support",
    description: "Financial management, accounting, and legal compliance",
    parentId: null
  },
  {
    name: "Human Resources",
    code: "HR",
    type: "support",
    description: "Talent management, employee relations, and organizational development",
    parentId: null
  },
  {
    name: "Customer Support & Operations",
    code: "CUSTOPS",
    type: "support",
    description: "Customer experience, technical support, and operational excellence",
    parentId: null
  }
];

const TECH_ROLES = [
  // Executive Leadership
  {
    title: "Chief Executive Officer (CEO)",
    code: "CEO001",
    category: "executive",
    level: 10,
    seniority: "executive",
    description: "Sets overall vision and strategy for the company",
    departmentCode: "EXEC",
    responsibilities: [
      "Define company vision and strategic direction",
      "Lead executive team and board communications", 
      "Drive business growth and market expansion",
      "Ensure organizational alignment with company goals"
    ]
  },
  {
    title: "Chief Operating Officer (COO)",
    code: "COO001", 
    category: "executive",
    level: 9,
    seniority: "executive",
    description: "Oversees daily operations and ensures smooth delivery",
    departmentCode: "EXEC",
    responsibilities: [
      "Oversee daily business operations",
      "Ensure operational efficiency and effectiveness",
      "Manage cross-functional collaboration",
      "Drive process improvements"
    ]
  },
  {
    title: "Chief Technology Officer (CTO)",
    code: "CTO001",
    category: "executive", 
    level: 9,
    seniority: "executive",
    description: "Leads product, engineering, QA, and technical strategy",
    departmentCode: "EXEC",
    responsibilities: [
      "Define technical strategy and architecture",
      "Lead engineering and product teams",
      "Drive innovation and technology adoption",
      "Ensure technical excellence and scalability"
    ]
  },
  {
    title: "Chief Financial Officer (CFO)",
    code: "CFO001",
    category: "executive",
    level: 9, 
    seniority: "executive",
    description: "Manages finances, accounting, and investments",
    departmentCode: "EXEC",
    responsibilities: [
      "Oversee financial planning and analysis",
      "Manage accounting and financial reporting",
      "Lead fundraising and investor relations",
      "Ensure financial compliance and controls"
    ]
  },
  {
    title: "Chief Human Resources Officer (CHRO)",
    code: "CHRO001",
    category: "executive",
    level: 9,
    seniority: "executive", 
    description: "Handles talent, policies, and employee well-being",
    departmentCode: "EXEC",
    responsibilities: [
      "Lead talent acquisition and retention strategies",
      "Develop organizational culture and policies",
      "Oversee employee development and performance",
      "Ensure compliance with employment laws"
    ]
  },
  {
    title: "Chief Marketing Officer (CMO)",
    code: "CMO001",
    category: "executive",
    level: 9,
    seniority: "executive",
    description: "Branding, campaigns, and lead generation",
    departmentCode: "EXEC",
    responsibilities: [
      "Define brand strategy and positioning",
      "Lead marketing campaigns and initiatives",
      "Drive lead generation and customer acquisition",
      "Manage marketing budget and ROI"
    ]
  },
  {
    title: "Chief Sales Officer (CSO)",
    code: "CSO001", 
    category: "executive",
    level: 9,
    seniority: "executive",
    description: "Revenue generation, partnerships, and sales strategy",
    departmentCode: "EXEC",
    responsibilities: [
      "Develop sales strategy and processes",
      "Lead revenue generation initiatives",
      "Manage key partnerships and relationships",
      "Drive sales team performance"
    ]
  },
  {
    title: "Chief Information Security Officer (CISO)",
    code: "CISO001",
    category: "executive",
    level: 9,
    seniority: "executive",
    description: "Oversees cybersecurity, compliance, and risk",
    departmentCode: "EXEC",
    responsibilities: [
      "Define cybersecurity strategy and policies",
      "Manage security risk and compliance",
      "Lead incident response and recovery",
      "Oversee security awareness and training"
    ]
  },
  // Frontend Engineering
  {
    title: "Frontend Engineering Manager",
    code: "FEM001",
    category: "management",
    level: 7,
    seniority: "senior",
    description: "Leads frontend development team and technical strategy",
    departmentCode: "FRONTEND",
    responsibilities: [
      "Lead and mentor frontend engineering team",
      "Define frontend architecture and standards",
      "Coordinate with design and backend teams", 
      "Drive frontend performance and user experience"
    ]
  },
  {
    title: "Senior Frontend Engineer", 
    code: "SFE001",
    category: "professional",
    level: 6,
    seniority: "senior",
    description: "Senior-level frontend development with leadership responsibilities",
    departmentCode: "FRONTEND",
    responsibilities: [
      "Develop complex frontend features and components",
      "Mentor junior developers",
      "Lead technical design discussions",
      "Ensure code quality and best practices"
    ]
  },
  {
    title: "Frontend Engineer",
    code: "FE001", 
    category: "professional",
    level: 4,
    seniority: "mid",
    description: "Frontend development using modern frameworks and technologies",
    departmentCode: "FRONTEND",
    responsibilities: [
      "Build responsive web applications",
      "Implement user interfaces from designs",
      "Collaborate with UX/UI designers",
      "Write maintainable and testable code"
    ]
  },
  {
    title: "Junior Frontend Engineer",
    code: "JFE001",
    category: "professional", 
    level: 2,
    seniority: "junior",
    description: "Entry-level frontend development role",
    departmentCode: "FRONTEND",
    responsibilities: [
      "Learn frontend technologies and frameworks",
      "Implement simple UI components",
      "Fix bugs and make minor enhancements",
      "Participate in code reviews"
    ]
  },
  // Backend Engineering
  {
    title: "Backend Engineering Manager",
    code: "BEM001",
    category: "management",
    level: 7,
    seniority: "senior", 
    description: "Leads backend development team and system architecture",
    departmentCode: "BACKEND",
    responsibilities: [
      "Lead backend engineering team",
      "Design system architecture and APIs",
      "Ensure scalability and performance",
      "Coordinate with frontend and DevOps teams"
    ]
  },
  {
    title: "Senior Backend Engineer",
    code: "SBE001",
    category: "professional",
    level: 6,
    seniority: "senior",
    description: "Senior backend development with system design expertise", 
    departmentCode: "BACKEND",
    responsibilities: [
      "Design and implement scalable backend systems",
      "Lead API design and database architecture",
      "Mentor junior engineers",
      "Optimize system performance"
    ]
  },
  {
    title: "Backend Engineer", 
    code: "BE001",
    category: "professional",
    level: 4,
    seniority: "mid",
    description: "Backend development focusing on APIs and data processing",
    departmentCode: "BACKEND",
    responsibilities: [
      "Develop REST APIs and microservices",
      "Design database schemas",
      "Implement business logic",
      "Ensure system reliability"
    ]
  },
  // Full-Stack Engineering
  {
    title: "Full-Stack Manager",
    code: "FSM001",
    category: "management",
    level: 7,
    seniority: "senior",
    description: "Leads full-stack development initiatives",
    departmentCode: "FULLSTACK",
    responsibilities: [
      "Manage full-stack development projects",
      "Coordinate frontend and backend integration",
      "Lead technical architecture decisions",
      "Mentor full-stack engineers"
    ]
  },
  {
    title: "Senior Full-Stack Engineer",
    code: "SFSE001", 
    category: "professional",
    level: 6,
    seniority: "senior",
    description: "Senior full-stack development across the entire application stack",
    departmentCode: "FULLSTACK",
    responsibilities: [
      "Develop end-to-end features",
      "Design system architecture",
      "Lead technical discussions",
      "Ensure application performance"
    ]
  },
  // Mobile Engineering
  {
    title: "Mobile Engineering Manager",
    code: "MEM001",
    category: "management", 
    level: 7,
    seniority: "senior",
    description: "Leads mobile development across platforms",
    departmentCode: "MOBILE",
    responsibilities: [
      "Lead mobile engineering team",
      "Define mobile strategy and architecture",
      "Coordinate iOS and Android development",
      "Ensure mobile app quality"
    ]
  },
  {
    title: "iOS Engineer",
    code: "IOS001",
    category: "professional",
    level: 4,
    seniority: "mid",
    description: "Native iOS application development",
    departmentCode: "MOBILE",
    responsibilities: [
      "Develop native iOS applications",
      "Implement iOS-specific features",
      "Optimize app performance",
      "Follow iOS design guidelines"
    ]
  },
  {
    title: "Android Engineer",
    code: "AND001",
    category: "professional",
    level: 4, 
    seniority: "mid",
    description: "Native Android application development",
    departmentCode: "MOBILE",
    responsibilities: [
      "Develop native Android applications",
      "Implement Android-specific features", 
      "Optimize app performance",
      "Follow Material Design principles"
    ]
  },
  // DevOps & Infrastructure
  {
    title: "DevOps Manager",
    code: "DOM001",
    category: "management",
    level: 7,
    seniority: "senior",
    description: "Leads DevOps practices and infrastructure management",
    departmentCode: "DEVOPS", 
    responsibilities: [
      "Lead DevOps and infrastructure team",
      "Define CI/CD pipelines and processes",
      "Manage cloud infrastructure strategy",
      "Ensure system reliability and security"
    ]
  },
  {
    title: "Site Reliability Engineer (SRE)",
    code: "SRE001",
    category: "professional",
    level: 5,
    seniority: "senior",
    description: "Ensures system reliability, performance, and scalability",
    departmentCode: "DEVOPS",
    responsibilities: [
      "Monitor system performance and reliability",
      "Implement automation and monitoring tools",
      "Respond to incidents and outages",
      "Optimize system performance"
    ]
  },
  {
    title: "Cloud Engineer",
    code: "CE001", 
    category: "professional",
    level: 4,
    seniority: "mid",
    description: "Cloud infrastructure design and management",
    departmentCode: "DEVOPS",
    responsibilities: [
      "Design and implement cloud architecture",
      "Manage AWS/Azure/GCP services",
      "Implement infrastructure as code",
      "Optimize cloud costs"
    ]
  },
  // UI/UX Design
  {
    title: "Design Director",
    code: "DD001",
    category: "management",
    level: 8, 
    seniority: "senior",
    description: "Leads design strategy and creative vision",
    departmentCode: "DESIGN",
    responsibilities: [
      "Define design strategy and vision",
      "Lead design team and processes",
      "Ensure design consistency across products",
      "Collaborate with product and engineering"
    ]
  },
  {
    title: "UI/UX Designer",
    code: "UXD001",
    category: "professional",
    level: 4,
    seniority: "mid", 
    description: "User experience and interface design",
    departmentCode: "DESIGN",
    responsibilities: [
      "Design user interfaces and experiences",
      "Conduct user research and testing",
      "Create wireframes and prototypes",
      "Collaborate with engineering teams"
    ]
  },
  // Quality Assurance
  {
    title: "Head of QA",
    code: "HQA001",
    category: "management",
    level: 8,
    seniority: "senior",
    description: "Leads quality assurance strategy and processes", 
    departmentCode: "QA",
    responsibilities: [
      "Define QA strategy and processes",
      "Lead QA team and initiatives",
      "Ensure product quality standards",
      "Implement test automation"
    ]
  },
  {
    title: "QA Manager",
    code: "QAM001",
    category: "management",
    level: 6,
    seniority: "senior",
    description: "Manages QA team and testing processes",
    departmentCode: "QA",
    responsibilities: [
      "Manage QA team and projects",
      "Plan and execute test strategies",
      "Coordinate with development teams",
      "Ensure testing coverage"
    ]
  },
  {
    title: "Manual QA Engineer", 
    code: "MQA001",
    category: "professional",
    level: 3,
    seniority: "mid",
    description: "Manual testing and quality assurance",
    departmentCode: "QA",
    responsibilities: [
      "Execute manual test cases",
      "Identify and report bugs",
      "Verify bug fixes",
      "Participate in test planning"
    ]
  },
  {
    title: "Test Automation Engineer",
    code: "TAE001",
    category: "professional",
    level: 4,
    seniority: "mid",
    description: "Automated testing using modern frameworks",
    departmentCode: "QA", 
    responsibilities: [
      "Develop automated test scripts",
      "Maintain test automation frameworks",
      "Execute automated test suites",
      "Integrate tests into CI/CD pipelines"
    ]
  },
  // Product Management
  {
    title: "VP of Product",
    code: "VPP001",
    category: "management",
    level: 8,
    seniority: "senior",
    description: "Leads product strategy and roadmap",
    departmentCode: "PRODMGMT",
    responsibilities: [
      "Define product vision and strategy",
      "Lead product management team",
      "Drive product roadmap decisions",
      "Coordinate with engineering and design"
    ]
  },
  {
    title: "Product Manager",
    code: "PM001",
    category: "professional", 
    level: 5,
    seniority: "mid",
    description: "Manages product development and strategy",
    departmentCode: "PRODMGMT",
    responsibilities: [
      "Define product requirements",
      "Manage product backlog",
      "Coordinate with development teams",
      "Analyze product metrics"
    ]
  },
  {
    title: "Scrum Master",
    code: "SM001",
    category: "professional",
    level: 4,
    seniority: "mid",
    description: "Facilitates agile development processes",
    departmentCode: "PRODMGMT",
    responsibilities: [
      "Facilitate scrum ceremonies",
      "Remove development blockers", 
      "Coach teams on agile practices",
      "Track project progress"
    ]
  },
  // Data & AI
  {
    title: "Head of Data",
    code: "HOD001",
    category: "management",
    level: 8,
    seniority: "senior",
    description: "Leads data strategy and analytics initiatives",
    departmentCode: "DATA",
    responsibilities: [
      "Define data strategy and governance",
      "Lead data science and analytics teams",
      "Drive data-driven decision making",
      "Ensure data quality and security"
    ]
  },
  {
    title: "Data Scientist",
    code: "DS001",
    category: "professional",
    level: 5, 
    seniority: "mid",
    description: "Advanced analytics and machine learning",
    departmentCode: "DATA",
    responsibilities: [
      "Develop predictive models",
      "Analyze complex datasets",
      "Build machine learning algorithms",
      "Present insights to stakeholders"
    ]
  },
  {
    title: "Machine Learning Engineer",
    code: "MLE001",
    category: "professional",
    level: 5,
    seniority: "mid",
    description: "ML model development and deployment",
    departmentCode: "DATA",
    responsibilities: [
      "Deploy ML models to production",
      "Build ML infrastructure and pipelines", 
      "Optimize model performance",
      "Collaborate with data scientists"
    ]
  },
  {
    title: "Data Engineer",
    code: "DE001",
    category: "professional",
    level: 4,
    seniority: "mid",
    description: "Data pipeline and infrastructure development",
    departmentCode: "DATA",
    responsibilities: [
      "Build data pipelines and ETL processes",
      "Design data warehouse architecture",
      "Ensure data quality and reliability",
      "Optimize data processing performance"
    ]
  },
  // IT & Internal Systems
  {
    title: "IT Director",
    code: "ITD001",
    category: "management",
    level: 8,
    seniority: "senior",
    description: "Leads IT strategy and infrastructure management",
    departmentCode: "IT",
    responsibilities: [
      "Define IT strategy and roadmap",
      "Manage IT budget and resources",
      "Ensure system security and compliance",
      "Lead digital transformation initiatives"
    ]
  },
  {
    title: "IT Manager",
    code: "ITM001",
    category: "management", 
    level: 6,
    seniority: "senior",
    description: "Manages IT operations and support teams",
    departmentCode: "IT",
    responsibilities: [
      "Manage IT support and operations",
      "Coordinate system maintenance and upgrades",
      "Oversee helpdesk and user support",
      "Ensure service level agreements"
    ]
  },
  {
    title: "Systems Administrator",
    code: "SA001",
    category: "professional",
    level: 4,
    seniority: "mid",
    description: "Maintains and administers IT systems and infrastructure",
    departmentCode: "IT",
    responsibilities: [
      "Manage servers and network infrastructure",
      "Perform system backups and recovery",
      "Monitor system performance",
      "Install and configure software"
    ]
  },
  {
    title: "Helpdesk / IT Support",
    code: "HD001",
    category: "support",
    level: 2,
    seniority: "junior",
    description: "Provides technical support to end users",
    departmentCode: "IT",
    responsibilities: [
      "Resolve technical issues and tickets",
      "Provide user training and support",
      "Maintain IT documentation",
      "Escalate complex issues"
    ]
  },
  {
    title: "Security Engineer", 
    code: "SE001",
    category: "professional",
    level: 5,
    seniority: "senior",
    description: "Implements and maintains security systems",
    departmentCode: "IT",
    responsibilities: [
      "Design and implement security solutions",
      "Monitor security threats and vulnerabilities",
      "Conduct security assessments",
      "Respond to security incidents"
    ]
  },
  {
    title: "Network Engineer",
    code: "NE001",
    category: "professional",
    level: 4,
    seniority: "mid",
    description: "Designs and maintains network infrastructure",
    departmentCode: "IT",
    responsibilities: [
      "Design and implement network architecture",
      "Monitor network performance",
      "Troubleshoot connectivity issues",
      "Manage network security"
    ]
  },
  // Sales Division
  {
    title: "VP of Sales",
    code: "VPS001",
    category: "management",
    level: 8,
    seniority: "senior",
    description: "Leads sales strategy and revenue generation",
    departmentCode: "SALES",
    responsibilities: [
      "Develop sales strategy and processes",
      "Lead sales team and performance",
      "Manage key client relationships",
      "Drive revenue growth"
    ]
  },
  {
    title: "Regional Sales Manager",
    code: "RSM001",
    category: "management",
    level: 6,
    seniority: "senior", 
    description: "Manages sales operations in specific regions",
    departmentCode: "SALES",
    responsibilities: [
      "Manage regional sales team",
      "Develop territory strategies",
      "Build customer relationships",
      "Achieve regional sales targets"
    ]
  },
  {
    title: "Sales Executive",
    code: "SX001",
    category: "professional",
    level: 4,
    seniority: "mid",
    description: "Direct sales and client relationship management",
    departmentCode: "SALES",
    responsibilities: [
      "Generate new business opportunities",
      "Manage sales pipeline",
      "Negotiate contracts and deals",
      "Maintain client relationships"
    ]
  },
  {
    title: "Customer Success Manager",
    code: "CSM001",
    category: "professional",
    level: 5,
    seniority: "mid",
    description: "Ensures customer satisfaction and retention",
    departmentCode: "SALES",
    responsibilities: [
      "Manage customer onboarding",
      "Drive customer adoption and success",
      "Handle customer renewals",
      "Identify upselling opportunities"
    ]
  },
  {
    title: "Partnerships Manager",
    code: "PM002",
    category: "professional", 
    level: 5,
    seniority: "mid",
    description: "Develops and manages strategic partnerships",
    departmentCode: "SALES",
    responsibilities: [
      "Identify partnership opportunities",
      "Negotiate partnership agreements",
      "Manage partner relationships",
      "Drive partner revenue"
    ]
  },
  // Marketing Division
  {
    title: "VP of Marketing",
    code: "VPM001",
    category: "management",
    level: 8,
    seniority: "senior",
    description: "Leads marketing strategy and brand management",
    departmentCode: "MARKETING",
    responsibilities: [
      "Define marketing strategy and vision",
      "Lead marketing team and campaigns",
      "Manage marketing budget and ROI",
      "Drive brand awareness and lead generation"
    ]
  },
  {
    title: "Marketing Manager",
    code: "MM001",
    category: "management",
    level: 6,
    seniority: "senior",
    description: "Manages marketing operations and campaigns",
    departmentCode: "MARKETING",
    responsibilities: [
      "Plan and execute marketing campaigns",
      "Manage marketing team and projects",
      "Analyze campaign performance",
      "Coordinate with sales and product teams"
    ]
  },
  {
    title: "Digital Marketing Specialist",
    code: "DMS001",
    category: "professional",
    level: 4,
    seniority: "mid",
    description: "Manages digital marketing channels and campaigns",
    departmentCode: "MARKETING",
    responsibilities: [
      "Manage digital advertising campaigns",
      "Optimize conversion rates",
      "Analyze digital marketing metrics",
      "Manage marketing automation"
    ]
  },
  {
    title: "SEO/Content Specialist",
    code: "SCS001",
    category: "professional",
    level: 3,
    seniority: "mid",
    description: "Creates content and optimizes for search engines",
    departmentCode: "MARKETING",
    responsibilities: [
      "Create and optimize content for SEO",
      "Conduct keyword research",
      "Manage content calendar",
      "Monitor search rankings"
    ]
  },
  {
    title: "Social Media Manager",
    code: "SMM001",
    category: "professional",
    level: 3,
    seniority: "mid",
    description: "Manages social media presence and engagement",
    departmentCode: "MARKETING", 
    responsibilities: [
      "Create social media content",
      "Manage social media accounts",
      "Engage with online community",
      "Analyze social media metrics"
    ]
  },
  {
    title: "Brand Manager",
    code: "BM001",
    category: "professional",
    level: 5,
    seniority: "mid",
    description: "Manages brand identity and positioning",
    departmentCode: "MARKETING",
    responsibilities: [
      "Develop brand strategy and guidelines",
      "Ensure brand consistency",
      "Manage brand partnerships",
      "Monitor brand perception"
    ]
  },
  // Finance & Legal Division
  {
    title: "Finance Director",
    code: "FD001",
    category: "management",
    level: 7,
    seniority: "senior",
    description: "Leads financial planning and analysis",
    departmentCode: "FINLEGAL",
    responsibilities: [
      "Lead financial planning and budgeting",
      "Oversee accounting operations",
      "Manage financial reporting",
      "Drive financial strategy"
    ]
  },
  {
    title: "Accountant",
    code: "ACC001",
    category: "professional",
    level: 3,
    seniority: "mid",
    description: "Manages accounting and financial records",
    departmentCode: "FINLEGAL",
    responsibilities: [
      "Maintain financial records",
      "Prepare financial statements",
      "Manage accounts payable/receivable",
      "Ensure compliance with accounting standards"
    ]
  },
  {
    title: "Payroll Specialist",
    code: "PS001",
    category: "professional",
    level: 3,
    seniority: "mid",
    description: "Manages employee payroll and benefits",
    departmentCode: "FINLEGAL",
    responsibilities: [
      "Process employee payroll",
      "Manage benefits administration",
      "Ensure payroll compliance",
      "Handle payroll inquiries"
    ]
  },
  {
    title: "Billing Specialist",
    code: "BS001",
    category: "professional",
    level: 3,
    seniority: "mid",
    description: "Manages customer billing and invoicing",
    departmentCode: "FINLEGAL",
    responsibilities: [
      "Generate customer invoices",
      "Manage billing processes",
      "Handle billing inquiries",
      "Monitor payment collections"
    ]
  },
  {
    title: "Legal & Compliance Officer",
    code: "LCO001",
    category: "professional",
    level: 6,
    seniority: "senior",
    description: "Manages legal affairs and compliance",
    departmentCode: "FINLEGAL",
    responsibilities: [
      "Review and draft legal contracts",
      "Ensure regulatory compliance",
      "Handle legal disputes",
      "Provide legal guidance"
    ]
  },
  // Human Resources Division
  {
    title: "HR Director",
    code: "HRD001",
    category: "management",
    level: 7,
    seniority: "senior",
    description: "Leads HR strategy and operations",
    departmentCode: "HR",
    responsibilities: [
      "Develop HR strategy and policies",
      "Lead HR team and initiatives",
      "Manage employee relations",
      "Drive organizational development"
    ]
  },
  {
    title: "HR Manager",
    code: "HRM001",
    category: "management",
    level: 5,
    seniority: "mid",
    description: "Manages HR operations and programs",
    departmentCode: "HR",
    responsibilities: [
      "Manage HR programs and processes",
      "Handle employee issues",
      "Coordinate with department managers",
      "Ensure HR compliance"
    ]
  },
  {
    title: "Talent Acquisition / Recruiter",
    code: "TA001",
    category: "professional",
    level: 4,
    seniority: "mid",
    description: "Manages recruitment and talent acquisition",
    departmentCode: "HR",
    responsibilities: [
      "Source and screen candidates",
      "Manage recruitment process",
      "Build talent pipeline",
      "Coordinate interviews"
    ]
  },
  {
    title: "HR Executive",
    code: "HRE001",
    category: "professional",
    level: 3,
    seniority: "mid",
    description: "Handles HR administrative tasks",
    departmentCode: "HR",
    responsibilities: [
      "Maintain employee records",
      "Handle HR documentation",
      "Support HR processes",
      "Assist with employee inquiries"
    ]
  },
  {
    title: "Training & Development Specialist",
    code: "TDS001",
    category: "professional",
    level: 4,
    seniority: "mid",
    description: "Manages employee training and development programs",
    departmentCode: "HR",
    responsibilities: [
      "Design training programs",
      "Conduct training sessions",
      "Assess training needs",
      "Measure training effectiveness"
    ]
  },
  {
    title: "Employee Relations Specialist",
    code: "ERS001",
    category: "professional",
    level: 4,
    seniority: "mid",
    description: "Manages employee relations and engagement",
    departmentCode: "HR",
    responsibilities: [
      "Handle employee grievances",
      "Facilitate conflict resolution",
      "Promote employee engagement",
      "Conduct exit interviews"
    ]
  },
  // Customer Support & Operations Division
  {
    title: "Director of Customer Experience",
    code: "DCE001",
    category: "management",
    level: 7,
    seniority: "senior",
    description: "Leads customer experience and support strategy",
    departmentCode: "CUSTOPS",
    responsibilities: [
      "Define customer experience strategy",
      "Lead support and operations teams",
      "Monitor customer satisfaction",
      "Drive service improvements"
    ]
  },
  {
    title: "Support Manager",
    code: "SPM001",
    category: "management",
    level: 5,
    seniority: "mid",
    description: "Manages customer support operations",
    departmentCode: "CUSTOPS",
    responsibilities: [
      "Manage support team and processes",
      "Monitor support metrics",
      "Handle escalated issues",
      "Improve support efficiency"
    ]
  },
  {
    title: "Technical Support Engineer",
    code: "TSE001",
    category: "professional",
    level: 4,
    seniority: "mid",
    description: "Provides technical support to customers",
    departmentCode: "CUSTOPS",
    responsibilities: [
      "Resolve technical customer issues",
      "Provide product guidance",
      "Document solutions",
      "Escalate complex problems"
    ]
  },
  {
    title: "Customer Support Agent",
    code: "CSA001",
    category: "support",
    level: 2,
    seniority: "junior",
    description: "Provides first-line customer support",
    departmentCode: "CUSTOPS",
    responsibilities: [
      "Handle customer inquiries",
      "Resolve basic issues",
      "Maintain customer records",
      "Follow support procedures"
    ]
  },
  {
    title: "Operations Manager",
    code: "OM001",
    category: "management",
    level: 6,
    seniority: "senior",
    description: "Manages operational processes and efficiency",
    departmentCode: "CUSTOPS",
    responsibilities: [
      "Optimize operational processes",
      "Manage operational metrics",
      "Coordinate cross-functional projects",
      "Drive operational excellence"
    ]
  },
  {
    title: "Operations Specialist",
    code: "OS001",
    category: "professional",
    level: 3,
    seniority: "mid",
    description: "Supports operational activities and processes",
    departmentCode: "CUSTOPS",
    responsibilities: [
      "Execute operational procedures",
      "Monitor process performance",
      "Support process improvements",
      "Handle operational tasks"
    ]
  }
];

// Function to create technology departments and roles
const createTechnologyTemplates = async (orgId: string) => {
  console.log("Creating technology templates for organization:", orgId);
  
  try {
    const batch = writeBatch(db);
    const departmentIdMap: Record<string, string> = {};
    const timestamp = new Date().toISOString();
    
    // Step 1: Create departments first (parents before children)
    console.log("Creating departments...");
    
    // First pass: Create all departments and collect their IDs
    for (const deptTemplate of TECH_DEPARTMENTS) {
      const deptRef = doc(collection(db, "organizations", orgId, "departments"));
      departmentIdMap[deptTemplate.code] = deptRef.id;
    }
    
    // Second pass: Create department documents with proper parent references
    for (const deptTemplate of TECH_DEPARTMENTS) {
      const deptRef = doc(db, "organizations", orgId, "departments", departmentIdMap[deptTemplate.code]);
      
      const departmentData = {
        name: deptTemplate.name,
        code: deptTemplate.code,
        type: deptTemplate.type,
        description: deptTemplate.description,
        parentId: deptTemplate.parentId ? departmentIdMap[deptTemplate.parentId] : null,
        status: "active" as const,
        createdAt: timestamp,
        updatedAt: timestamp,
        budget: 0,
        currency: "USD",
        workingHours: "9:00 AM - 5:00 PM",
        flexibleHours: true,
        reportingSchedule: "monthly"
      };
      
      batch.set(deptRef, departmentData);
    }
    
    // Step 2: Create roles and assign to departments
    console.log("Creating roles...");
    for (const roleTemplate of TECH_ROLES) {
      const roleRef = doc(collection(db, "organizations", orgId, "roles"));
      const departmentId = departmentIdMap[roleTemplate.departmentCode];
      
      if (!departmentId) {
        console.warn(`Department not found for role ${roleTemplate.title}, skipping...`);
        continue;
      }
      
      const roleData = {
        title: roleTemplate.title,
        code: roleTemplate.code,
        category: roleTemplate.category,
        level: roleTemplate.level,
        seniority: roleTemplate.seniority,
        description: roleTemplate.description,
        responsibilities: roleTemplate.responsibilities,
        primaryDepartmentId: departmentId,
        departmentIds: [departmentId],
        requiredSkills: [],
        educationalRequirements: {
          minimumLevel: "bachelor",
          preferredDegrees: [],
          certifications: []
        },
        experienceRequirements: {
          minimumYears: roleTemplate.level <= 2 ? 0 : roleTemplate.level <= 4 ? 2 : roleTemplate.level <= 6 ? 5 : 8,
          industryExperience: ["Technology"],
          leadershipExperience: roleTemplate.category === "management" || roleTemplate.category === "executive",
          specificExperience: []
        },
        compensation: {
          salaryRange: {
            min: Math.max(40000, roleTemplate.level * 15000),
            max: Math.max(60000, roleTemplate.level * 25000),
            currency: "USD",
            frequency: "annually"
          },
          grade: `L${roleTemplate.level}`,
          benefits: ["Health Insurance", "Dental Insurance", "401k", "PTO"],
          stockOptions: roleTemplate.level >= 5,
          equity: roleTemplate.level >= 7 ? 0.1 : 0
        },
        reportingStructure: {
          reportsTo: [],
          directReports: [],
          teamSize: { min: 0, max: roleTemplate.category === "management" ? 10 : 0 },
          collaborationRequirements: []
        },
        performanceMetrics: [],
        careerProgression: {
          nextLevelRoles: [],
          skillDevelopmentRequirements: [],
          timelineExpectations: "12-24 months for next level progression"
        },
        trainingRequirements: [],
        status: "active" as const,
        employeeCount: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
        createdBy: auth.currentUser?.uid || ""
      };
      
      batch.set(roleRef, roleData);
    }
    
    // Commit all changes
    console.log("Committing batch write...");
    await batch.commit();
    console.log(`Successfully created ${TECH_DEPARTMENTS.length} departments and ${TECH_ROLES.length} roles`);
    
  } catch (error) {
    console.error("Error creating technology templates:", error);
    throw error;
  }
};

export default function CompanySetupPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      // If user is logged in, try to fetch existing company name from organization
      if (user) {
        try {
          // Query for organization where user is the creator
          const orgsRef = collection(db, "organizations");
          const q = query(orgsRef, where("createdBy", "==", user.uid));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const orgDoc = querySnapshot.docs[0];
            const orgData = orgDoc.data() as { name?: string; legalName?: string };
            const existingName = orgData?.name || orgData?.legalName || "";
            
            if (existingName) {
              setCompanyInfo(prev => ({
                ...prev,
                legalName: existingName,
                displayName: existingName
              }));
              setSameAsLegalName(true); // Auto-check the checkbox since we're pre-filling both fields
            }
          }
        } catch (error) {
          console.error("Error fetching organization data:", error);
        }
      }
    });
    return () => unsub();
  }, []);

  const totalSteps = 4;
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  // Live preview component
  const renderLivePreview = () => (
    <div className="bg-[#f8f9fa] p-8 h-full">
      <div className="bg-white rounded-lg shadow-sm p-10 max-w-lg mx-auto">
        <div className="text-center mb-8">
          <h3 className="text-xl font-semibold text-[#1a1a1a] uppercase tracking-wide">
            Company Profile Preview
          </h3>
          <p className="text-sm text-[#6b7280] mt-2">This is how your company will appear</p>
        </div>

        <div className="space-y-6">
          {/* Company Header */}
          <div className="border-b border-[#e5e7eb] pb-4">
            <h4 className="text-lg font-semibold text-[#1a1a1a]">
              {companyInfo.displayName || companyInfo.legalName || "Your Company Name"}
            </h4>
            {companyInfo.legalName && companyInfo.displayName && companyInfo.legalName !== companyInfo.displayName && (
              <p className="text-sm text-[#6b7280] mt-1">
                Legal: {companyInfo.legalName}
              </p>
            )}
            {companyInfo.industry && (
              <p className="text-sm text-[#f97316] font-medium mt-1">
                {companyInfo.industry}
              </p>
            )}
          </div>

          {/* Company Details */}
          <div className="space-y-3">
            {companyInfo.website && (
              <div>
                <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Website</span>
                <p className="text-sm text-[#1a1a1a]">{companyInfo.website}</p>
              </div>
            )}
            
            {companyInfo.country && (
              <div>
                <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Location</span>
                <p className="text-sm text-[#1a1a1a]">{companyInfo.country}</p>
              </div>
            )}

            {companySize.employeeCount && (
              <div>
                <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Team Size</span>
                <p className="text-sm text-[#1a1a1a]">{companySize.employeeCount} employees</p>
              </div>
            )}

            {companySize.remoteWork && (
              <div>
                <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Work Model</span>
                <p className="text-sm text-[#1a1a1a]">
                  {companySize.remoteWork === "No, all employees work in office" ? "Office-based" :
                   companySize.remoteWork === "Yes, some employees work remotely" ? "Hybrid" :
                   companySize.remoteWork === "Yes, we're fully remote" ? "Fully Remote" : companySize.remoteWork}
                </p>
              </div>
            )}

            {useCases.priorities.length > 0 && (
              <div>
                <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Priorities</span>
                <div className="mt-1 space-y-1">
                  {useCases.priorities.map((priority, index) => (
                    <p key={index} className="text-sm text-[#1a1a1a]">• {priority}</p>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Admin Contact Preview */}
          {(adminContact.firstName || adminContact.lastName) && (
            <div className="border-t border-[#e5e7eb] pt-4">
              <span className="text-xs font-medium text-[#6b7280] uppercase tracking-wide">Primary Contact</span>
              <p className="text-sm text-[#1a1a1a] mt-1">
                {adminContact.firstName} {adminContact.lastName}
                {adminContact.jobTitle && ` • ${adminContact.jobTitle}`}
              </p>
              {adminContact.phone && (
                <p className="text-sm text-[#6b7280] mt-1">{adminContact.phone}</p>
              )}
            </div>
          )}
        </div>

        <div className="text-right mt-8">
          <p className="text-sm text-[#6b7280] font-cursive">
            {adminContact.firstName && adminContact.lastName 
              ? `${adminContact.firstName} ${adminContact.lastName}` 
              : "Your Signature"}
          </p>
        </div>
      </div>
    </div>
  );

  // Form data state
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    legalName: "",
    displayName: "",
    industry: "",
    website: "",
    country: ""
  });

  const [sameAsLegalName, setSameAsLegalName] = useState(false);

  const [companySize, setCompanySize] = useState<CompanySize>({
    employeeCount: 10,
    growthExpectation: "Moderate growth (11-50% growth)",
    remoteWork: "Yes, some employees work remotely",
    currentHrMethod: "Spreadsheets and manual processes"
  });

  const [useCases, setUseCases] = useState<UseCases>({
    priorities: [],
    goLiveTimeline: ""
  });

  const [adminContact, setAdminContact] = useState<AdminContact>({
    firstName: "",
    lastName: "",
    jobTitle: "HR Manager",
    phone: "",
    streetAddress: "",
    city: "",
    state: "",
    zip: "",
    timezone: "Eastern Time (UTC-5)"
  });

  const handleCompanyInfoChange = (field: keyof CompanyInfo, value: string) => {
    setCompanyInfo(prev => {
      const updated = { ...prev, [field]: value };
      // If legal name changes and checkbox is checked, update display name too
      if (field === 'legalName' && sameAsLegalName) {
        updated.displayName = value;
      }
      return updated;
    });
  };

  const handleSameAsLegalNameChange = (checked: boolean) => {
    setSameAsLegalName(checked);
    if (checked) {
      setCompanyInfo(prev => ({ ...prev, displayName: prev.legalName }));
    }
  };

  const handleCompanySizeChange = (field: keyof CompanySize, value: string | number) => {
    setCompanySize(prev => ({ ...prev, [field]: value }));
  };

  const handlePriorityToggle = (priority: string) => {
    setUseCases(prev => {
      const newPriorities = prev.priorities.includes(priority)
        ? prev.priorities.filter(p => p !== priority)
        : [...prev.priorities, priority];
      
      // Limit to 3 selections
      if (newPriorities.length > 3) {
        return prev;
      }
      
      return { ...prev, priorities: newPriorities };
    });
  };

  const handleAdminContactChange = (field: keyof AdminContact, value: string) => {
    setAdminContact(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!companyInfo.legalName.trim()) {
      setError("Legal company name is required");
      return false;
    }
    if (!companyInfo.industry) {
      setError("Industry is required");
      return false;
    }
    if (!companyInfo.country) {
      setError("Country is required");
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!adminContact.firstName.trim()) {
      setError("First name is required");
      return false;
    }
    if (!adminContact.lastName.trim()) {
      setError("Last name is required");
      return false;
    }
    if (!adminContact.jobTitle) {
      setError("Job title is required");
      return false;
    }
    if (!adminContact.phone.trim()) {
      setError("Phone number is required");
      return false;
    }
    if (!adminContact.streetAddress.trim()) {
      setError("Street address is required");
      return false;
    }
    if (!adminContact.city.trim()) {
      setError("City is required");
      return false;
    }
    if (!adminContact.state.trim()) {
      setError("State is required");
      return false;
    }
    if (!adminContact.zip.trim()) {
      setError("ZIP code is required");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError("");
    
    if (currentStep === 1 && !validateStep1()) {
      return;
    }
    
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = async () => {
    if (!validateStep4()) {
      return;
    }

    if (!user) {
      setError("You must be logged in to complete setup");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Find the organization document for this user
      // Query for organization where user is the creator (no composite index needed)
      console.log("Looking for organization for user:", user.uid);
      const orgsRef = collection(db, "organizations");
      const q = query(orgsRef, where("createdBy", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      console.log("Query results:", querySnapshot.docs.length);
      
      if (querySnapshot.empty) {
        console.error("No organization found for user:", user.uid);
        throw new Error("No organization found for this user. Please contact support.");
      }
      
      const orgDoc = querySnapshot.docs[0];
      const orgId = orgDoc.id;
      console.log("Found organization ID:", orgId);
      
      const orgRef = doc(db, "organizations", orgId);
      console.log("Organization reference:", orgRef.path);
      
      // Update organization document with all collected data
      await updateDoc(orgRef, {
        // Company info
        legalName: companyInfo.legalName,
        displayName: companyInfo.displayName || companyInfo.legalName,
        industry: companyInfo.industry,
        website: companyInfo.website,
        country: companyInfo.country,
        
        // Company size & structure
        employeeCount: companySize.employeeCount,
        growthExpectation: companySize.growthExpectation,
        remoteWork: companySize.remoteWork,
        currentHrMethod: companySize.currentHrMethod,
        
        // Use cases
        priorities: useCases.priorities,
        
        // Admin contact
        adminFirstName: adminContact.firstName,
        adminLastName: adminContact.lastName,
        adminJobTitle: adminContact.jobTitle,
        adminPhone: adminContact.phone,
        adminAddress: {
          street: adminContact.streetAddress,
          city: adminContact.city,
          state: adminContact.state,
          zip: adminContact.zip
        },
        timezone: adminContact.timezone,
        
        // Mark setup as completed
        setupCompleted: true,
        setupCompletedAt: new Date()
      });

      // Create technology templates if industry is Technology
      if (companyInfo.industry === "Technology") {
        console.log("Industry is Technology, creating predefined departments and roles...");
        await createTechnologyTemplates(orgId);
        console.log("Technology templates created successfully");
      }

      console.log("Organization updated successfully, redirecting to /admin...");
      // Redirect to admin dashboard
      router.push("/admin");
    } catch (err) {
      console.error("Error completing company setup:", err);
      setError("Failed to save company information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">Tell us about your company</h2>
        <p className="text-sm text-[#6b7280]">Step 1 of 4 • Company Information</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Legal Company Name *
          </label>
          <input
            type="text"
            value={companyInfo.legalName}
            onChange={(e) => handleCompanyInfoChange("legalName", e.target.value)}
            placeholder="Acme Corporation Inc."
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
          />
          <p className="text-xs text-[#6b7280] mt-1">This appears on official documents</p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="sameAsLegalName"
            checked={sameAsLegalName}
            onChange={(e) => handleSameAsLegalNameChange(e.target.checked)}
            className="h-4 w-4 text-[#f97316] focus:ring-[#f97316] border-[#d1d5db] rounded"
          />
          <label htmlFor="sameAsLegalName" className="ml-2 text-sm text-[#374151]">
            Same as Legal Company Name
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Display Name
          </label>
          <input
            type="text"
            value={companyInfo.displayName}
            onChange={(e) => handleCompanyInfoChange("displayName", e.target.value)}
            placeholder="Acme Corp"
            disabled={sameAsLegalName}
            className={`w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151] ${sameAsLegalName ? 'bg-[#f9fafb] text-[#6b7280]' : ''}`}
          />
          <p className="text-xs text-[#6b7280] mt-1">How employees see your company - defaults to legal</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Industry *
          </label>
          <select
            value={companyInfo.industry}
            onChange={(e) => handleCompanyInfoChange("industry", e.target.value)}
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 appearance-none bg-white text-[#374151]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              paddingRight: '40px',
              backgroundSize: '26px 26px' 
            }}
          >
            <option value="" className="text-[#6b7280]">Select Industry</option>
            {INDUSTRIES.map(industry => (
              <option key={industry} value={industry}>{industry}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Company Website
          </label>
          <input
            type="url"
            value={companyInfo.website}
            onChange={(e) => handleCompanyInfoChange("website", e.target.value)}
            placeholder="https://www.acmecorp.com"
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
          />
          <p className="text-xs text-[#6b7280] mt-1">Optional</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Primary Location (Country) *
          </label>
          <select
            value={companyInfo.country}
            onChange={(e) => handleCompanyInfoChange("country", e.target.value)}
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 appearance-none bg-white text-[#374151]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              paddingRight: '40px',
              backgroundSize: '26px 26px' 
            }}
          >
            <option value="" className="text-[#6b7280]">Select Country</option>
            {COUNTRIES.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-[#fef7ed] border border-[#f97316] p-4 rounded-lg">
        <p className="text-sm text-[#c2410c]">
          <strong>Why we need this:</strong> Helps us configure compliance settings and suggest relevant features
        </p>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-[#1f2937] text-white rounded-md hover:bg-[#111827] focus:outline-none focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">Company size and structure</h2>
        <p className="text-sm text-[#6b7280]">Step 2 of 4 • Company Size</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Current number of employees *
          </label>
          <input
            type="number"
            min="1"
            value={companySize.employeeCount}
            onChange={(e) => handleCompanySizeChange("employeeCount", parseInt(e.target.value) || 1)}
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
          />
          <p className="text-xs text-[#6b7280] mt-1">Include full-time, part-time, contractors</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-3">
            Expected growth in next 12 months
          </label>
          <div className="space-y-3">
            {GROWTH_OPTIONS.map(option => (
              <label key={option} className="flex items-start cursor-pointer group">
                <input
                  type="radio"
                  name="growth"
                  value={option}
                  checked={companySize.growthExpectation === option}
                  onChange={(e) => handleCompanySizeChange("growthExpectation", e.target.value)}
                  className="mt-1 mr-3 text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-sm text-[#374151] group-hover:text-[#1a1a1a]">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-3">
            Do you have remote employees?
          </label>
          <div className="space-y-3">
            {REMOTE_OPTIONS.map(option => (
              <label key={option} className="flex items-start cursor-pointer group">
                <input
                  type="radio"
                  name="remote"
                  value={option}
                  checked={companySize.remoteWork === option}
                  onChange={(e) => handleCompanySizeChange("remoteWork", e.target.value)}
                  className="mt-1 mr-3 text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-sm text-[#374151] group-hover:text-[#1a1a1a]">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-3">
            Current HR management method
          </label>
          <div className="space-y-3">
            {HR_METHOD_OPTIONS.map(option => (
              <label key={option} className="flex items-start cursor-pointer group">
                <input
                  type="radio"
                  name="hrMethod"
                  value={option}
                  checked={companySize.currentHrMethod === option}
                  onChange={(e) => handleCompanySizeChange("currentHrMethod", e.target.value)}
                  className="mt-1 mr-3 text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-sm text-[#374151] group-hover:text-[#1a1a1a]">{option}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleBack}
          className="px-6 py-3 border border-[#d1d5db] text-[#374151] rounded-md hover:bg-[#f9fafb] focus:outline-none focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 font-medium"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-[#1f2937] text-white rounded-md hover:bg-[#111827] focus:outline-none focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">What&apos;s most important for your company?</h2>
        <p className="text-sm text-[#6b7280]">Step 3 of 4 • Company Priorities</p>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-[#374151] mb-3">
            Select your top 3 priorities: (Check up to 3)
          </label>
          <div className="space-y-3">
            {PRIORITY_OPTIONS.map(option => (
              <label key={option} className="flex items-start cursor-pointer group">
                <input
                  type="checkbox"
                  checked={useCases.priorities.includes(option)}
                  onChange={() => handlePriorityToggle(option)}
                  disabled={!useCases.priorities.includes(option) && useCases.priorities.length >= 3}
                  className="mt-1 mr-3 text-[#f97316] focus:ring-[#f97316] disabled:opacity-50"
                />
                <span className={`text-sm ${useCases.priorities.includes(option) ? 'text-[#1a1a1a]' : 'text-[#374151]'} group-hover:text-[#1a1a1a] ${!useCases.priorities.includes(option) && useCases.priorities.length >= 3 ? 'opacity-50' : ''}`}>
                  {option}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-[#6b7280] mt-2">
            Selected: {useCases.priorities.length}/3
          </p>
        </div>

      </div>

      <div className="flex justify-between">
        <button
          onClick={handleBack}
          className="px-6 py-3 border border-[#d1d5db] text-[#374151] rounded-md hover:bg-[#f9fafb] focus:outline-none focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 font-medium"
        >
          Back
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-[#1f2937] text-white rounded-md hover:bg-[#111827] focus:outline-none focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 font-medium"
        >
          Continue
        </button>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-[#1a1a1a] mb-2">Your contact information</h2>
        <p className="text-sm text-[#6b7280]">Step 4 of 4 • Contact Details</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              First Name *
            </label>
            <input
              type="text"
              value={adminContact.firstName}
              onChange={(e) => handleAdminContactChange("firstName", e.target.value)}
              className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#374151] mb-2">
              Last Name *
            </label>
            <input
              type="text"
              value={adminContact.lastName}
              onChange={(e) => handleAdminContactChange("lastName", e.target.value)}
              className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Job Title *
          </label>
          <select
            value={adminContact.jobTitle}
            onChange={(e) => handleAdminContactChange("jobTitle", e.target.value)}
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 appearance-none bg-white text-[#374151]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              paddingRight: '40px',
              backgroundSize: '26px 26px' 
            }}
          >
            {JOB_TITLES.map(title => (
              <option key={title} value={title}>{title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            value={adminContact.phone}
            onChange={(e) => handleAdminContactChange("phone", e.target.value)}
            placeholder="+1 (555) 123-4567"
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
          />
          <p className="text-xs text-[#6b7280] mt-1">For account security and support</p>
        </div>

        <div className="border-t border-[#e5e7eb] pt-6">
          <h3 className="text-lg font-semibold text-[#1a1a1a] mb-4">Company Address</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#374151] mb-2">
                Street Address *
              </label>
              <input
                type="text"
                value={adminContact.streetAddress}
                onChange={(e) => handleAdminContactChange("streetAddress", e.target.value)}
                className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  City *
                </label>
                <input
                  type="text"
                  value={adminContact.city}
                  onChange={(e) => handleAdminContactChange("city", e.target.value)}
                  className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  State *
                </label>
                <input
                  type="text"
                  value={adminContact.state}
                  onChange={(e) => handleAdminContactChange("state", e.target.value)}
                  className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  ZIP *
                </label>
                <input
                  type="text"
                  value={adminContact.zip}
                  onChange={(e) => handleAdminContactChange("zip", e.target.value)}
                  className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 placeholder:text-[#9ca3af] text-[#374151]"
                />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-[#374151] mb-2">
            Time Zone *
          </label>
          <select
            value={adminContact.timezone}
            onChange={(e) => handleAdminContactChange("timezone", e.target.value)}
            className="w-full px-4 py-3 border border-[#d1d5db] rounded-md text-base focus:outline-none focus:border-[#f97316] focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 appearance-none bg-white text-[#374151]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
              backgroundPosition: 'right 12px center',
              backgroundRepeat: 'no-repeat',
              paddingRight: '40px',
              backgroundSize: '26px 26px' 
            }}
          >
            {TIMEZONES.map(timezone => (
              <option key={timezone} value={timezone}>{timezone}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-between">
        <button
          onClick={handleBack}
          className="px-6 py-3 border border-[#d1d5db] text-[#374151] rounded-md hover:bg-[#f9fafb] focus:outline-none focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 font-medium"
        >
          Back
        </button>
        <button
          onClick={handleComplete}
          disabled={loading}
          className="px-6 py-3 bg-[#1f2937] text-white rounded-md hover:bg-[#111827] focus:outline-none focus:ring-4 focus:ring-[#fef7ed] transition-all duration-150 font-medium disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Completing..." : "Complete Setup"}
        </button>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-[#1a1a1a]">Access Denied</h1>
          <p className="text-[#6b7280] mt-2">You must be logged in to access this page.</p>
          <Link href="/login" className="inline-block mt-4 text-[#f97316] hover:text-[#ea580c]">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff]">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#e5e7eb] px-6 flex items-center h-15">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#f97316] rounded"></div>
          <span className="text-lg font-semibold text-[#1a1a1a]">HRMS Tech</span>
        </div>
      </div>

      {/* Fixed Progress Indicator */}
      <div className="fixed top-15 left-0 right-0 z-40 bg-white border-b border-[#e5e7eb] px-6 py-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[#6b7280]">
            Section {currentStep} of {totalSteps}
          </span>
          <span className="text-sm font-medium text-[#6b7280]">
            {progressPercentage}% Complete
          </span>
        </div>
        <div className="w-full bg-[#e5e7eb] rounded-full h-1">
          <div 
            className="bg-[#f97316] h-1 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Split Panel Layout */}
      <div className="flex pt-32 h-screen">
        {/* Left Panel - Form */}
        <div className="w-2/5 bg-white p-6 pl-12 overflow-y-auto">
          {error && (
            <div className="mb-6 p-4 bg-[#fef2f2] border border-[#ef4444] rounded-md">
              <p className="text-sm text-[#ef4444]">{error}</p>
            </div>
          )}

          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
        </div>

        {/* Right Panel - Live Preview */}
        <div className="w-3/5 overflow-y-auto">
          {renderLivePreview()}
        </div>
      </div>
    </div>
  );
}
