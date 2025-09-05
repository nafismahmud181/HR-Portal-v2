"use client";

import { useMemo, useState } from "react";

type Template = {
  id: string;
  name: string;
  category:
    | "Recruitment & Hiring"
    | "Onboarding & Joining"
    | "Employee Records & HR Operations"
    | "Payroll & Benefits"
    | "Leave & Attendance"
    | "Compliance & Policy"
    | "Exit / Separation";
  description: string;
  iconBg: string;
};

const ALL_TEMPLATES: Template[] = [
  // 1. Recruitment & Hiring
  {
    id: "job-requisition-form",
    name: "Job Requisition Form",
    category: "Recruitment & Hiring",
    description:
      "Request approval for a new hire from department managers.",
    iconBg: "bg-[#eef2ff]",
  },
  {
    id: "job-description-template",
    name: "Job Description (JD) Template",
    category: "Recruitment & Hiring",
    description: "Standardize role responsibilities and requirements.",
    iconBg: "bg-[#fef7ed]",
  },
  {
    id: "interview-evaluation-form",
    name: "Interview Evaluation Form",
    category: "Recruitment & Hiring",
    description: "Capture interviewer feedback consistently.",
    iconBg: "bg-[#f0fdf4]",
  },
  {
    id: "reference-check-form",
    name: "Reference Check Form",
    category: "Recruitment & Hiring",
    description: "Record reference verification details.",
    iconBg: "bg-[#ecfeff]",
  },
  {
    id: "offer-letter",
    name: "Offer Letter",
    category: "Recruitment & Hiring",
    description: "Issue an offer with compensation and terms.",
    iconBg: "bg-[#fdf4ff]",
  },
  {
    id: "employment-contract",
    name: "Appointment / Employment Contract",
    category: "Recruitment & Hiring",
    description: "Formal employment agreement between employer and employee.",
    iconBg: "bg-[#fafafa]",
  },

  // 2. Onboarding & Joining
  {
    id: "employee-personal-info-form",
    name: "Employee Personal Information Form",
    category: "Onboarding & Joining",
    description: "Collect personal details for new hires.",
    iconBg: "bg-[#eef2ff]",
  },
  {
    id: "emergency-contact-form",
    name: "Emergency Contact Form",
    category: "Onboarding & Joining",
    description: "Capture emergency contact information.",
    iconBg: "bg-[#fef7ed]",
  },
  {
    id: "bank-details-form",
    name: "Bank Details Form",
    category: "Onboarding & Joining",
    description: "Record salary disbursement bank details.",
    iconBg: "bg-[#f0fdf4]",
  },
  {
    id: "id-card-request-form",
    name: "ID Card Request Form",
    category: "Onboarding & Joining",
    description: "Request creation of employee ID card.",
    iconBg: "bg-[#ecfeff]",
  },
  {
    id: "joining-report",
    name: "Joining Report / Acknowledgement",
    category: "Onboarding & Joining",
    description: "Confirm employee joining and onboarding.",
    iconBg: "bg-[#fdf4ff]",
  },
  {
    id: "probation-confirmation-letter",
    name: "Probation Confirmation Letter",
    category: "Onboarding & Joining",
    description: "Confirm successful completion of probation period.",
    iconBg: "bg-[#fafafa]",
  },

  // 3. Employee Records & HR Operations
  {
    id: "employment-verification-letter",
    name: "Letter of Employment (LOE) / Employment Verification Letter",
    category: "Employee Records & HR Operations",
    description: "Verify current employment details for third parties.",
    iconBg: "bg-[#eef2ff]",
  },
  {
    id: "salary-certificate",
    name: "Salary Certificate",
    category: "Employee Records & HR Operations",
    description: "Official statement of employee salary details.",
    iconBg: "bg-[#fef7ed]",
  },
  {
    id: "promotion-increment-letter",
    name: "Promotion / Increment Letter",
    category: "Employee Records & HR Operations",
    description: "Communicate promotion or salary increment.",
    iconBg: "bg-[#f0fdf4]",
  },
  {
    id: "transfer-letter",
    name: "Transfer Letter",
    category: "Employee Records & HR Operations",
    description: "Notify department or location transfer.",
    iconBg: "bg-[#ecfeff]",
  },
  {
    id: "warning-letter",
    name: "Warning Letter / Disciplinary Action Notice",
    category: "Employee Records & HR Operations",
    description: "Document misconduct and corrective action.",
    iconBg: "bg-[#fdf4ff]",
  },
  {
    id: "show-cause-notice",
    name: "Show Cause Notice",
    category: "Employee Records & HR Operations",
    description: "Seek written explanation for policy breach.",
    iconBg: "bg-[#fafafa]",
  },
  {
    id: "appreciation-letter",
    name: "Appreciation / Recognition Letter",
    category: "Employee Records & HR Operations",
    description: "Acknowledge outstanding performance or contribution.",
    iconBg: "bg-[#eef2ff]",
  },
  {
    id: "experience-letter",
    name: "Experience Letter",
    category: "Employee Records & HR Operations",
    description: "Summarize tenure and responsibilities for departing employees.",
    iconBg: "bg-[#fef7ed]",
  },
  {
    id: "relieving-letter",
    name: "Relieving Letter",
    category: "Employee Records & HR Operations",
    description: "Confirm separation date and clearance from duties.",
    iconBg: "bg-[#f0fdf4]",
  },

  // 4. Payroll & Benefits
  {
    id: "salary-structure-template",
    name: "Salary Structure Template",
    category: "Payroll & Benefits",
    description: "Define components of compensation for a role or employee.",
    iconBg: "bg-[#ecfeff]",
  },
  {
    id: "pay-slip-template",
    name: "Pay Slip Template",
    category: "Payroll & Benefits",
    description: "Provide monthly pay details and deductions.",
    iconBg: "bg-[#fdf4ff]",
  },
  {
    id: "bonus-incentive-letter",
    name: "Bonus / Incentive Letter",
    category: "Payroll & Benefits",
    description: "Communicate bonus or incentive award details.",
    iconBg: "bg-[#fafafa]",
  },
  {
    id: "reimbursement-form",
    name: "Reimbursement Form (travel, medical, etc.)",
    category: "Payroll & Benefits",
    description: "Submit and track expense reimbursements.",
    iconBg: "bg-[#eef2ff]",
  },
  {
    id: "loan-advance-salary-form",
    name: "Loan / Advance Salary Application & Approval Form",
    category: "Payroll & Benefits",
    description: "Request and approve salary advance or loan.",
    iconBg: "bg-[#fef7ed]",
  },

  // 5. Leave & Attendance
  {
    id: "leave-application-form",
    name: "Leave Application Form",
    category: "Leave & Attendance",
    description: "Apply for leave with dates and reason.",
    iconBg: "bg-[#f0fdf4]",
  },
  {
    id: "leave-approval-letter",
    name: "Leave Approval / Rejection Letter",
    category: "Leave & Attendance",
    description: "Notify approval or rejection of leave.",
    iconBg: "bg-[#ecfeff]",
  },
  {
    id: "attendance-policy",
    name: "Attendance Policy Document",
    category: "Leave & Attendance",
    description: "Define attendance expectations and rules.",
    iconBg: "bg-[#fdf4ff]",
  },
  {
    id: "overtime-request-form",
    name: "Overtime Request Form",
    category: "Leave & Attendance",
    description: "Request approval for overtime hours.",
    iconBg: "bg-[#fafafa]",
  },

  // 6. Compliance & Policy
  {
    id: "employee-handbook",
    name: "Employee Handbook / HR Policy Manual",
    category: "Compliance & Policy",
    description:
      "Company policies: leave, working hours, dress code, conduct, etc.",
    iconBg: "bg-[#eef2ff]",
  },
  {
    id: "code-of-conduct",
    name: "Code of Conduct & Ethics Policy",
    category: "Compliance & Policy",
    description: "Standards of behavior and ethics at work.",
    iconBg: "bg-[#fef7ed]",
  },
  {
    id: "nda",
    name: "Confidentiality / Non-Disclosure Agreement (NDA)",
    category: "Compliance & Policy",
    description: "Protect confidential company information.",
    iconBg: "bg-[#f0fdf4]",
  },
  {
    id: "posh-policy",
    name: "Policy on Prevention of Sexual Harassment (POSH)",
    category: "Compliance & Policy",
    description: "Prevention and redressal of sexual harassment.",
    iconBg: "bg-[#ecfeff]",
  },
  {
    id: "workplace-safety-policy",
    name: "Workplace Safety Policy",
    category: "Compliance & Policy",
    description: "Safety standards and incident reporting.",
    iconBg: "bg-[#fdf4ff]",
  },
  {
    id: "data-protection-policy",
    name: "Data Protection & IT Usage Policy",
    category: "Compliance & Policy",
    description: "Data privacy, security and acceptable IT use.",
    iconBg: "bg-[#fafafa]",
  },

  // 7. Exit / Separation
  {
    id: "resignation-acceptance-letter",
    name: "Resignation Acceptance Letter",
    category: "Exit / Separation",
    description: "Acknowledge receipt and acceptance of resignation.",
    iconBg: "bg-[#eef2ff]",
  },
  {
    id: "exit-interview-form",
    name: "Exit Interview Form",
    category: "Exit / Separation",
    description: "Collect feedback during employee separation.",
    iconBg: "bg-[#fef7ed]",
  },
  {
    id: "clearance-form",
    name: "Clearance Form (department-wise sign-off)",
    category: "Exit / Separation",
    description: "Ensure asset and knowledge handover and approvals.",
    iconBg: "bg-[#f0fdf4]",
  },
  {
    id: "final-settlement-letter",
    name: "Final Settlement Letter",
    category: "Exit / Separation",
    description: "Confirm final dues, deductions and settlement.",
    iconBg: "bg-[#ecfeff]",
  },
  {
    id: "experience-relieving-certificate",
    name: "Experience & Relieving Certificate",
    category: "Exit / Separation",
    description: "Provide experience and relieving confirmation.",
    iconBg: "bg-[#fdf4ff]",
  },
];

const CATEGORIES: Array<Template["category"] | "All"> = [
  "All",
  "Recruitment & Hiring",
  "Onboarding & Joining",
  "Employee Records & HR Operations",
  "Payroll & Benefits",
  "Leave & Attendance",
  "Compliance & Policy",
  "Exit / Separation",
];

export default function TemplatesPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] =
    useState<(typeof CATEGORIES)[number]>("All");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_TEMPLATES.filter((t) => {
      const matchesCategory =
        activeCategory === "All" ? true : t.category === activeCategory;
      const matchesQuery =
        q.length === 0
          ? true
          : (t.name + " " + t.description).toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, activeCategory]);

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1a1a1a]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#e5e7eb]">
        <div className="max-w-[1200px] mx-auto h-[60px] flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[#f97316]" />
            <span className="text-[16px] font-semibold">Templates</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              aria-label="Grid view"
              onClick={() => setView("grid")}
              className={`px-3 py-2 rounded-md border ${
                view === "grid"
                  ? "border-[#f97316] text-[#f97316]"
                  : "border-[#e5e7eb] text-[#374151]"
              }`}
            >
              Grid
            </button>
            <button
              aria-label="List view"
              onClick={() => setView("list")}
              className={`px-3 py-2 rounded-md border ${
                view === "list"
                  ? "border-[#f97316] text-[#f97316]"
                  : "border-[#e5e7eb] text-[#374151]"
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <h1 className="text-[24px] font-semibold">Templates</h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">
          Search data, information and resource
        </p>

        {/* Search and categories */}
        <div className="mt-6 flex flex-col gap-4">
          <div className="relative">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates..."
              className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:outline-none focus:ring-0 focus:border-[#f97316]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-2 rounded-full text-[14px] border transition-colors ${
                  activeCategory === cat
                    ? "border-[#f97316] text-[#f97316] bg-[#fef7ed]"
                    : "border-[#e5e7eb] text-[#374151] bg-white"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {view === "grid" ? (
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <TemplateCard key={t.id} template={t} />
            ))}
          </div>
        ) : (
          <div className="mt-6 divide-y divide-[#e5e7eb] rounded-md border border-[#e5e7eb] bg-white">
            {filtered.map((t) => (
              <TemplateRow key={t.id} template={t} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  return (
    <a
      href={`/admin/templates/${template.id}`}
      className="block rounded-lg border border-[#e5e7eb] bg-white p-4 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start gap-3">
        <div
          className={`h-10 w-10 rounded-lg flex items-center justify-center ${template.iconBg}`}
        >
          <div className="h-4 w-4 rounded-sm bg-[#f97316]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-medium truncate">
              {template.name}
            </h3>
          </div>
          <p className="mt-1 text-[13px] text-[#6b7280] line-clamp-2">
            {template.description}
          </p>
        </div>
      </div>
    </a>
  );
}

function TemplateRow({ template }: { template: Template }) {
  return (
    <a
      href={`/admin/templates/${template.id}`}
      className="flex items-center gap-4 p-4 hover:bg-[#f9fafb]"
    >
      <div
        className={`h-10 w-10 rounded-lg flex items-center justify-center ${template.iconBg}`}
      >
        <div className="h-4 w-4 rounded-sm bg-[#f97316]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-medium truncate">{template.name}</h3>
        </div>
        <p className="mt-1 text-[13px] text-[#6b7280] truncate">
          {template.description}
        </p>
      </div>
      <div className="hidden sm:block text-[12px] text-[#6b7280]">
        {template.category}
      </div>
    </a>
  );
}
