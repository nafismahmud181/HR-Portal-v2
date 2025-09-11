"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collectionGroup, getDocs, query, where } from "firebase/firestore";
import { checkSetupStatus } from "@/lib/setup-guard";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [notFound, setNotFound] = useState(false);

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
          setNotFound(true);
          setCheckingAuth(false);
          return;
        }
        const role = (snap.docs[0].data() as { role?: string }).role;
        if (role !== "manager") {
          setNotFound(true);
          setCheckingAuth(false);
          return;
        }
      } catch {
        setNotFound(true);
        setCheckingAuth(false);
        return;
      }
      setCheckingAuth(false);
    });
    return () => unsub();
  }, [router]);

  if (checkingAuth) return null;

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
            Go to employee portal
          </button>
        </div>
      </div>
    );
  }

  const nav = [
    { href: "/manager", label: "Manager Dashboard" },
    { href: "/manager/leave", label: "Team Leave" },
    { href: "/manager/profile", label: "My Profile" },
  ];

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1a1a1a] grid grid-cols-1 md:grid-cols-[260px_1fr]">
      <aside className="border-r border-[#e5e7eb] p-4 md:p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="h-5 w-5 rounded bg-[#f97316]" aria-hidden />
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
              try { await signOut(auth); } finally { router.replace("/login"); }
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


