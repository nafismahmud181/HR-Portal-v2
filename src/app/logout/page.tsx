"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function LogoutPage() {
  const router = useRouter();
  useEffect(() => {
    (async () => {
      try {
        await signOut(auth);
      } catch {}
      router.replace("/login");
    })();
  }, [router]);
  return (
    <div className="min-h-screen grid place-items-center px-6">
      <p className="text-[14px] text-[#6b7280]">Signing you out…</p>
    </div>
  );
}


