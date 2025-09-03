import Link from "next/link";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-[240px_1fr] bg-[#ffffff] text-[#1a1a1a]">
      <aside className="border-r border-[#e5e7eb] p-4">
        <div className="px-2 py-3 flex items-center gap-2">
          <span className="h-5 w-5 rounded bg-[#f97316]" aria-hidden />
          <span className="text-[16px] font-semibold">HRMSTech</span>
        </div>
        <nav className="mt-4 flex flex-col text-[14px]">
          {[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/employees", label: "Employees" },
            { href: "/admin/recruitment", label: "Recruitment" },
            { href: "/admin/time", label: "Time & Attendance" },
            { href: "/admin/payroll", label: "Payroll" },
            { href: "/admin/performance", label: "Performance" },
            { href: "/admin/learning", label: "Learning & Development" },
            { href: "/admin/reports", label: "Reports & Analytics" },
            { href: "/admin/settings", label: "Company Settings" },
            { href: "/admin/system", label: "System Administration" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="px-2 py-2 rounded hover:bg-[#f9fafb]">
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main>{children}</main>
    </div>
  );
}


