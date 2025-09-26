"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collectionGroup, getDocs, query, where } from "firebase/firestore";
import { checkSetupStatus } from "@/lib/setup-guard";
import { useStableAuth } from "@/lib/auth-guard";
import { AdminSidebarLayout } from "@/components/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [notFound] = useState(false);

  const authCallback = useStableAuth(async (user) => {
      if (!user) {
        if (typeof window !== 'undefined') {
        router.replace("/login");
        }
        return;
      }
      try {
        // Check if user has completed company setup
        const setupStatus = await checkSetupStatus(user);
        if (!setupStatus.isSetupComplete && setupStatus.redirectTo) {
          if (typeof window !== 'undefined') {
            router.replace(setupStatus.redirectTo);
          }
          return;
        }

        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (snap.empty) {
          if (typeof window !== 'undefined') {
            router.replace("/login");
          }
          return;
        }
        const role = (snap.docs[0].data() as { role?: string }).role;
        if (role !== "admin") {
          if (typeof window !== 'undefined') {
            router.replace("/login");
          }
          return;
        }
      } catch {
        if (typeof window !== 'undefined') {
          router.replace("/login");
        }
        return;
      }
      setCheckingAuth(false);
    });

  useEffect(() => {
    return authCallback;
  }, [authCallback, router]);


  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-foreground">
        <div className="text-center px-6">
          <h1 className="text-3xl font-semibold">404</h1>
          <p className="mt-2 text-sm text-muted-foreground">Page not found</p>
          <button
            className="mt-6 rounded-md border border-border px-4 py-2 text-sm hover:bg-accent"
            onClick={() => {
              if (typeof window !== 'undefined') {
                router.replace("/employee");
              }
            }}
          >
            Go to employee dashboard
          </button>
        </div>
      </div>
    );
  }

  return <AdminSidebarLayout>{children}</AdminSidebarLayout>;
}