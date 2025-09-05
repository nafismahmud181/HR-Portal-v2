"use client";

import { useMemo, useState } from "react";

type Template = {
  id: string;
  name: string;
  category: "Boss Mode" | "Ecommerce" | "Marketing" | "Frameworks" | "Social Media" | "General";
  description: string;
  badge?: "Boss Mode" | "Beta";
  iconBg: string;
};

const ALL_TEMPLATES: Template[] = [
  { id: "amazon-product-description", name: "Amazon Product Description", category: "Ecommerce", description: "Create compelling product descriptions Amazon listing: create key feature and about.", iconBg: "bg-[#fef7ed]" },
  { id: "aida-framework", name: "AIDA Framework", category: "Frameworks", description: "Use the oldest marketing framework in the world. Attention, interest, Desire, Action.", iconBg: "bg-[#eef2ff]" },
  { id: "content-summariser", name: "Content Summariser", category: "Marketing", description: "Get the key bullet points from a piece of content.", iconBg: "bg-[#fff7ed]" },
  { id: "bab-framework", name: "Before-After-Bridge Framework", category: "Frameworks", description: "Create marketing copy using the BAB framework. Before, After, Bridge.", badge: "Beta", iconBg: "bg-[#eff6ff]" },
  { id: "company-bio", name: "Company Bio", category: "General", description: "Tell your company's story with a captivating bio.", iconBg: "bg-[#f0fdf4]" },
  { id: "blog-topic-ideas", name: "Blog Post Topic Ideas", category: "Marketing", description: "Brainstorm blog post topics that will engage readers and rank well on Google.", iconBg: "bg-[#f5f3ff]" },
  { id: "creative-story", name: "Creative Story", category: "General", description: "Write wildly creative stories to engage your readers.", iconBg: "bg-[#fef2f2]" },
  { id: "content-improver", name: "Content Improver", category: "Marketing", description: "Rewrite content to make it more interesting, creative, and engaging.", iconBg: "bg-[#ecfeff]" },
  { id: "facebook-ad-headline", name: "Facebook Ad Headline", category: "Social Media", description: "Generate scroll-stopping headlines for your Facebook Ads.", iconBg: "bg-[#fdf4ff]" },
  { id: "explain-to-child", name: "Explain It To a Child", category: "General", description: "Write clearly to explain complex stories to younger readers.", iconBg: "bg-[#fafafa]" },

  // HR Documents examples
  { id: "loe", name: "Letter of Employment (LOE)", category: "General", description: "Generate a formal employment verification letter.", iconBg: "bg-[#fef7ed]" },
  { id: "salary-certificate", name: "Salary Certificate", category: "General", description: "Provide an official statement of employee salary details.", iconBg: "bg-[#fff7ed]" },
  { id: "experience-letter", name: "Experience Letter", category: "General", description: "Summarize tenure and responsibilities for departing employees.", iconBg: "bg-[#eff6ff]" },
];

const CATEGORIES: Array<Template["category"] | "All"> = [
  "All",
  "Boss Mode",
  "Ecommerce",
  "Marketing",
  "Frameworks",
  "Social Media",
  "General",
];

export default function TemplatesPage() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<(typeof CATEGORIES)[number]>("All");
  const [view, setView] = useState<"grid" | "list">("grid");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ALL_TEMPLATES.filter((t) => {
      const matchesCategory = activeCategory === "All" ? true : t.category === activeCategory;
      const matchesQuery = q.length === 0 ? true : (t.name + " " + t.description).toLowerCase().includes(q);
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
            <button aria-label="Grid view" onClick={() => setView("grid")} className={`px-3 py-2 rounded-md border ${view === "grid" ? "border-[#f97316] text-[#f97316]" : "border-[#e5e7eb] text-[#374151]"}`}>Grid</button>
            <button aria-label="List view" onClick={() => setView("list")} className={`px-3 py-2 rounded-md border ${view === "list" ? "border-[#f97316] text-[#f97316]" : "border-[#e5e7eb] text-[#374151]"}`}>List</button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <h1 className="text-[24px] font-semibold">Templates</h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">Search data, information and resource</p>

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
                  activeCategory === cat ? "border-[#f97316] text-[#f97316] bg-[#fef7ed]" : "border-[#e5e7eb] text-[#374151] bg-white"
                }`}
              >
                {cat}
                {cat === "Boss Mode" && <span className="ml-2 text-[12px] text-[#6b7280]">({ALL_TEMPLATES.filter(t => t.badge === "Boss Mode").length})</span>}
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
              <TemplateRow key={t.id} template={t} />)
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TemplateCard({ template }: { template: Template }) {
  return (
    <a href={`/admin/templates/${template.id}`} className="block rounded-lg border border-[#e5e7eb] bg-white p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${template.iconBg}`}>
          <div className="h-4 w-4 rounded-sm bg-[#f97316]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-[16px] font-medium truncate">{template.name}</h3>
            {template.badge && (
              <span className={`px-2 py-0.5 text-[12px] rounded-full border ${template.badge === "Boss Mode" ? "border-[#f97316] text-[#f97316]" : "border-[#d1d5db] text-[#374151]"}`}>{template.badge}</span>
            )}
          </div>
          <p className="mt-1 text-[13px] text-[#6b7280] line-clamp-2">{template.description}</p>
        </div>
      </div>
    </a>
  );
}

function TemplateRow({ template }: { template: Template }) {
  return (
    <a href={`/admin/templates/${template.id}`} className="flex items-center gap-4 p-4 hover:bg-[#f9fafb]">
      <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${template.iconBg}`}>
        <div className="h-4 w-4 rounded-sm bg-[#f97316]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-[16px] font-medium truncate">{template.name}</h3>
          {template.badge && (
            <span className={`px-2 py-0.5 text-[12px] rounded-full border ${template.badge === "Boss Mode" ? "border-[#f97316] text-[#f97316]" : "border-[#d1d5db] text-[#374151]"}`}>{template.badge}</span>
          )}
        </div>
        <p className="mt-1 text-[13px] text-[#6b7280] truncate">{template.description}</p>
      </div>
      <div className="hidden sm:block text-[12px] text-[#6b7280]">{template.category}</div>
    </a>
  );
}


