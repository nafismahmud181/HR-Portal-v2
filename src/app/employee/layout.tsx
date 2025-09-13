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

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1a1a1a] grid grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="border-r border-[#e5e7eb] p-4 md:p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image src="/images/logo/logo.png" alt="HRMSTech Logo" width={20} height={20} className="rounded" />
          <span className="text-[16px] font-semibold">HRMSTech</span>
        </Link>
        <nav className="mt-6 space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2 rounded-md text-[14px] ${active ? "bg-[#f97316]/10 text-[#1f2937] border border-[#f97316]/30" : "text-[#374151] hover:bg-[#f9fafb] border border-transparent"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-6 pt-6 border-t border-[#e5e7eb]">
          <button
            type="button"
            className="w-full text-left px-3 py-2 rounded-md text-[14px] text-[#374151] border border-[#d1d5db] hover:bg-[#f9fafb]"
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
      </aside>
      <main>{children}</main>
    </div>
  );
}


