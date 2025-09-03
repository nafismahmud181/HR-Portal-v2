"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/login");
      } else {
        setCheckingAuth(false);
      }
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
      <main>{children}</main>
    </div>
  );
}


