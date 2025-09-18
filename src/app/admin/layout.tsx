"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collectionGroup, getDocs, query, where } from "firebase/firestore";
import { checkSetupStatus } from "@/lib/setup-guard";
import Navbar from "@/components/Navbar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [notFound] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  
  // Dropdown states
  const [employeeManagementOpen, setEmployeeManagementOpen] = useState(false);
  const [timeAttendanceOpen, setTimeAttendanceOpen] = useState(false);
  const [compensationOpen, setCompensationOpen] = useState(false);
  const [performanceDevOpen, setPerformanceDevOpen] = useState(false);
  const [organizationOpen, setOrganizationOpen] = useState(false);
  const [reportsToolsOpen, setReportsToolsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      try {
        // Check if user has completed company setup
        const setupStatus = await checkSetupStatus(user);
        if (!setupStatus.isSetupComplete && setupStatus.redirectTo) {
          router.replace(setupStatus.redirectTo);
          return;
        }

        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (snap.empty) {
          await signOut(auth);
          router.replace("/login");
          return;
        }
        const role = (snap.docs[0].data() as { role?: string }).role;
        if (role !== "admin") {
          await signOut(auth);
          router.replace("/login");
          return;
        }
      } catch {
        await signOut(auth);
        router.replace("/login");
        return;
      }
      setCheckingAuth(false);
    });
    return () => unsub();
  }, [router]);

  async function handleLogout() {
    try {
      setSigningOut(true);
      await signOut(auth);
      router.replace("/login");
    } finally {
      setSigningOut(false);
    }
  }

  const navigationGroups = [
    {
      title: "Employee Management",
      isOpen: employeeManagementOpen,
      setOpen: setEmployeeManagementOpen,
      items: [
        { href: "/admin/employees", label: "Employees" },
        { href: "/admin/invites", label: "Invites" },
        { href: "/admin/recruitment", label: "Recruitment" },
      ]
    },
    {
      title: "Time & Attendance",
      isOpen: timeAttendanceOpen,
      setOpen: setTimeAttendanceOpen,
      items: [
        { href: "/admin/time", label: "Time & Attendance" },
        { href: "/admin/leave", label: "Leave" },
      ]
    },
    {
      title: "Compensation",
      isOpen: compensationOpen,
      setOpen: setCompensationOpen,
      items: [
        { href: "/admin/payroll", label: "Payroll" },
      ]
    },
    {
      title: "Performance & Development",
      isOpen: performanceDevOpen,
      setOpen: setPerformanceDevOpen,
      items: [
        { href: "/admin/performance", label: "Performance" },
        { href: "/admin/learning", label: "Learning & Development" },
      ]
    },
    {
      title: "Organization",
      isOpen: organizationOpen,
      setOpen: setOrganizationOpen,
      items: [
        { href: "/admin/organization/departments", label: "Departments" },
        { href: "/admin/roles", label: "Roles" },
      ]
    },
    {
      title: "Reports & Tools",
      isOpen: reportsToolsOpen,
      setOpen: setReportsToolsOpen,
      items: [
        { href: "/admin/reports", label: "Reports & Analytics" },
        { href: "/admin/templates", label: "Templates" },
      ]
    },
    {
      title: "Settings",
      isOpen: settingsOpen,
      setOpen: setSettingsOpen,
      items: [
        { href: "/admin/settings/company", label: "Company Settings" },
        { href: "/admin/settings/administration", label: "System Administration" },
        //http://localhost:3000/admin/settings
      ]
    },
  ];

  const ChevronIcon = ({ isOpen }: { isOpen: boolean }) => (
    <svg
      className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );

  const NavItems = ({ isMobile = false }: { isMobile?: boolean }) => (
    <>
      {/* Dashboard - standalone */}
      <Link 
        href="/admin" 
        className="px-2 py-2 rounded hover:bg-[#f9fafb] block font-medium"
        onClick={isMobile ? () => setMobileOpen(false) : undefined}
      >
        Dashboard
      </Link>
      
      {/* Dropdown Groups */}
      {navigationGroups.map((group, index) => (
        <div key={index} className="relative">
          <button
            onClick={() => group.setOpen(!group.isOpen)}
            className="w-full text-left px-2 py-2 rounded hover:bg-[#f9fafb] flex items-center justify-between"
          >
            <span>{group.title}</span>
            <ChevronIcon isOpen={group.isOpen} />
          </button>
          {group.isOpen && (
            <div className="ml-4 mt-1 space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-2 py-2 rounded hover:bg-[#f9fafb] block text-[#6b7280] text-[13px]"
                  onClick={isMobile ? () => setMobileOpen(false) : undefined}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#ffffff]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#f97316] border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-[14px] text-[#6b7280]">Loading...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#ffffff] text-[#1a1a1a]">
        <div className="text-center px-6">
          <h1 className="text-[28px] font-semibold">404</h1>
          <p className="mt-2 text-[14px] text-[#6b7280]">Page not found</p>
          <button
            className="mt-6 rounded-md border border-[#d1d5db] px-4 py-2 text-[14px] hover:bg-[#f9fafb]"
            onClick={() => router.replace("/employee")}
          >
            Go to employee dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1a1a1a]">
      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] print:grid-cols-1">
        <aside className="hidden md:block border-r border-[#e5e7eb] p-4 min-h-screen sticky top-0 overflow-y-auto print:hidden">
        <div className="px-2 py-3 flex items-center gap-2">
          <Image src="/images/logo/logo.png" alt="HRMSTech Logo" width={20} height={20} className="rounded" />
          <span className="text-[16px] font-semibold">HRMSTech</span>
        </div>
        <nav className="mt-4 flex flex-col text-[14px] space-y-1">
          <NavItems />
        </nav>
        <div className="mt-6 pt-4 border-t border-[#e5e7eb]">
          <button
            onClick={handleLogout}
            disabled={signingOut}
            className="w-full text-left px-2 py-2 rounded border border-[#d1d5db] hover:bg-[#f9fafb] text-[14px]"
          >
            {signingOut ? "Logging out…" : "Log out"}
          </button>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="md:hidden">
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-[#e5e7eb] p-4 overflow-y-auto">
            <div className="px-2 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image src="/images/logo/logo.png" alt="HRMSTech Logo" width={20} height={20} className="rounded" />
                <span className="text-[16px] font-semibold">HRMSTech</span>
              </div>
              <button className="text-[14px] border border-[#d1d5db] px-2 py-1 rounded" onClick={() => setMobileOpen(false)}>Close</button>
            </div>
            <nav className="mt-4 flex flex-col text-[14px] space-y-1">
              <NavItems isMobile={true} />
            </nav>
            <div className="mt-6 pt-4 border-t border-[#e5e7eb]">
              <button
                onClick={handleLogout}
                disabled={signingOut}
                className="w-full text-left px-2 py-2 rounded border border-[#d1d5db] hover:bg-[#f9fafb] text-[14px]"
              >
                {signingOut ? "Logging out…" : "Log out"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

        <main className="min-h-screen print:overflow-visible print:h-auto">
          <Navbar />
          <div className="md:hidden flex items-center justify-between p-4 border-b border-[#e5e7eb]">
            <button type="button" aria-label="Open menu" className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" onClick={() => setMobileOpen(true)}>Menu</button>
            <span className="text-[16px] font-semibold">Admin</span>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}