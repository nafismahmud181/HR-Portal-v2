"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collectionGroup, getDocs, query, where, doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { checkSetupStatus } from "@/lib/setup-guard";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const pathname = usePathname();
  const [notFound] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        if (role !== "employee") {
          await signOut(auth);
          router.replace("/login");
          return;
        }

        // Find orgId from membership and check onboarding status
        const membershipRef = snap.docs[0].ref;
        const parentOrg = membershipRef.parent.parent; // organizations/{orgId}
        const orgId = parentOrg ? parentOrg.id : null;
        if (orgId) {
          const empRef = doc(db, "organizations", orgId, "employees", user.uid);
          const empSnap = await getDoc(empRef);
          const onboardingCompleted = empSnap.exists() ? (empSnap.data() as { onboardingCompleted?: boolean }).onboardingCompleted === true : false;
          const onOnboardingPage = pathname === "/employee/onboarding";
          if (!onboardingCompleted && !onOnboardingPage) {
            router.replace("/employee/onboarding");
            return;
          }
          if (onboardingCompleted && onOnboardingPage) {
            router.replace("/employee");
            return;
          }
        }
      } catch {
        await signOut(auth);
        router.replace("/login");
        return;
      }
      setCheckingAuth(false);
    });
    return () => unsub();
  }, [router, pathname]);

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
            onClick={() => router.replace("/admin")}
          >
            Go to admin dashboard
          </button>
        </div>
      </div>
    );
  }

  const nav = [
    { href: "/employee", label: "Dashboard (Home)" },
    { href: "/employee/profile", label: "My Profile" },
    { href: "/employee/time", label: "Time & Attendance" },
    { href: "/employee/leave", label: "Leave Management" },
    { href: "/employee/payroll", label: "Payroll & Benefits" },
    { href: "/employee/performance", label: "Performance" },
    { href: "/employee/learning", label: "Learning & Development" },
    { href: "/employee/help", label: "Help & Support" },
  ];

  // Check if we're on the onboarding page
  const isOnboardingPage = pathname === "/employee/onboarding";

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1a1a1a]">
      {!isOnboardingPage && (
        <>
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
          
          {/* Sidebar */}
          <aside className={`fixed left-0 top-0 h-full w-[260px] border-r border-[#e5e7eb] bg-white z-30 overflow-y-auto transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          } md:translate-x-0`}>
            <div className="p-4 md:p-6">
              {/* Mobile close button */}
              <div className="flex items-center justify-between mb-4 md:hidden">
                <Link href="/" className="inline-flex items-center gap-2">
                  <Image src="/images/logo/logo.png" alt="HRMSTech Logo" width={20} height={20} className="rounded" />
                  <span className="text-[16px] font-semibold">HRMSTech</span>
                </Link>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 rounded-md hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Desktop logo */}
              <div className="hidden md:block">
                <Link href="/" className="inline-flex items-center gap-2">
                  <Image src="/images/logo/logo.png" alt="HRMSTech Logo" width={20} height={20} className="rounded" />
                  <span className="text-[16px] font-semibold">HRMSTech</span>
                </Link>
              </div>
              
              <nav className="mt-6 space-y-1">
                {nav.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`block px-3 py-2 rounded-md text-[14px] transition-colors duration-200 ${active ? "bg-[#f97316]/10 text-[#1f2937] border border-[#f97316]/30" : "text-[#374151] hover:bg-[#f9fafb] border border-transparent"}`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
                <button
                  type="button"
                  className="w-full text-left px-3 py-2 rounded-md text-[14px] text-[#374151] border border-[#d1d5db] hover:bg-[#f9fafb] transition-colors duration-200"
                  onClick={async () => {
                    try {
                      await signOut(auth);
                    } finally {
                      router.replace("/login");
                    }
                  }}
                >
                  Log out
                </button>
              </div>
            </div>
          </aside>
          
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-40 p-2 rounded-md bg-white border border-gray-200 shadow-md md:hidden"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </>
      )}
      <main className={`${isOnboardingPage ? "w-full" : "ml-0 md:ml-[260px]"}`}>
        {children}
      </main>
    </div>
  );
}


