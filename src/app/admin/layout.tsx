"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collectionGroup, getDocs, query, where } from "firebase/firestore";
import { checkSetupStatus } from "@/lib/setup-guard";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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
  if (checkingAuth) {
    return null;
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
    <div className="h-screen grid grid-cols-1 md:grid-cols-[240px_1fr] print:grid-cols-1 bg-[#ffffff] text-[#1a1a1a] overflow-hidden">
      <aside className="hidden md:block border-r border-[#e5e7eb] p-4 h-screen sticky top-0 overflow-y-auto print:hidden">
        <div className="px-2 py-3 flex items-center gap-2">
          <span className="h-5 w-5 rounded bg-[#f97316]" aria-hidden />
          <span className="text-[16px] font-semibold">HRMSTech</span>
        </div>
        <nav className="mt-4 flex flex-col text-[14px]">
          {[
            { href: "/admin", label: "Dashboard" },
            { href: "/admin/employees", label: "Employees" },
            { href: "/admin/invites", label: "Invites" },
            { href: "/admin/recruitment", label: "Recruitment" },
            { href: "/admin/time", label: "Time & Attendance" },
            { href: "/admin/leave", label: "Leave" },
            { href: "/admin/payroll", label: "Payroll" },
            { href: "/admin/performance", label: "Performance" },
            { href: "/admin/learning", label: "Learning & Development" },
            { href: "/admin/reports", label: "Reports & Analytics" },
            { href: "/admin/templates", label: "Templates" },
            { href: "/admin/settings", label: "Company Settings" },
            { href: "/admin/system", label: "System Administration" },
          ].map((item) => (
            <Link key={item.href} href={item.href} className="px-2 py-2 rounded hover:bg-[#f9fafb]">
              {item.label}
            </Link>
          ))}
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
                <span className="h-5 w-5 rounded bg-[#f97316]" aria-hidden />
                <span className="text-[16px] font-semibold">HRMSTech</span>
              </div>
              <button className="text-[14px] border border-[#d1d5db] px-2 py-1 rounded" onClick={() => setMobileOpen(false)}>Close</button>
            </div>
            <nav className="mt-4 flex flex-col text-[14px]">
              {[
                { href: "/admin", label: "Dashboard" },
                { href: "/admin/employees", label: "Employees" },
                { href: "/admin/invites", label: "Invites" },
                { href: "/admin/recruitment", label: "Recruitment" },
                { href: "/admin/time", label: "Time & Attendance" },
                { href: "/admin/leave", label: "Leave" },
                { href: "/admin/payroll", label: "Payroll" },
                { href: "/admin/performance", label: "Performance" },
                { href: "/admin/learning", label: "Learning & Development" },
                { href: "/admin/reports", label: "Reports & Analytics" },
                { href: "/admin/templates", label: "Templates" },
                { href: "/admin/settings", label: "Company Settings" },
                { href: "/admin/system", label: "System Administration" },
              ].map((item) => (
                <Link key={item.href} href={item.href} className="px-2 py-2 rounded hover:bg-[#f9fafb]" onClick={() => setMobileOpen(false)}>
                  {item.label}
                </Link>
              ))}
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

      <main className="min-h-0 overflow-y-auto print:overflow-visible print:h-auto">
        <div className="md:hidden flex items-center justify-between p-4 border-b border-[#e5e7eb]">
          <button type="button" aria-label="Open menu" className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" onClick={() => setMobileOpen(true)}>Menu</button>
          <span className="text-[16px] font-semibold">Admin</span>
        </div>
        {children}
      </main>
    </div>
  );
}


