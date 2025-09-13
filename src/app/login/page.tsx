"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { collectionGroup, getDocs, query, where } from "firebase/firestore";
import { getAuthErrorMessage } from "@/lib/auth-errors";
import { checkSetupStatus } from "@/lib/setup-guard";
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Check if user has completed company setup first
          const setupStatus = await checkSetupStatus(user);
          if (!setupStatus.isSetupComplete && setupStatus.redirectTo) {
            console.log("Setup not complete, redirecting to:", setupStatus.redirectTo);
            router.replace(setupStatus.redirectTo);
            return;
          }

          // First try to find user in any organization
          const cg = collectionGroup(db, "users");
          const q = query(cg, where("uid", "==", user.uid));
          const snap = await getDocs(q);
          if (!snap.empty) {
            const userData = snap.docs[0].data() as { role?: string };
            const role = userData.role;
            console.log("Found user with role:", role);
            router.replace(role === "admin" ? "/admin" : role === "manager" ? "/manager" : "/employee");
          } else {
            console.log("No user document found, redirecting to company setup");
            router.replace("/onboarding/company-setup");
          }
        } catch (error) {
          console.error("Error checking user role:", error);
          router.replace("/onboarding/company-setup");
        }
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsub();
  }, [router]);
  if (checkingAuth) {
    return null;
  }

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#ffffff] text-[#1a1a1a]">
      <section className="p-8 md:p-12">
        <div className="max-w-[420px] mx-auto">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/images/logo/logo.png" alt="HRMSTech Logo" width={20} height={20} className="rounded" />
            <span className="text-[16px] font-semibold">HRMSTech</span>
          </Link>
          <h1 className="mt-10 text-[24px] font-semibold">Welcome back</h1>
          <p className="mt-2 text-[14px] text-[#6b7280]">Sign in to your account to continue.</p>

          <form
            className="mt-8 space-y-5"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setLoading(true);
              try {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                try {
                  console.log("Signed in user:", cred.user.uid);
                  
                  // Check if user has completed company setup first
                  const setupStatus = await checkSetupStatus(cred.user);
                  if (!setupStatus.isSetupComplete && setupStatus.redirectTo) {
                    console.log("Login: Setup not complete, redirecting to:", setupStatus.redirectTo);
                    router.push(setupStatus.redirectTo);
                    return;
                  }

                  const cg = collectionGroup(db, "users");
                  const q = query(cg, where("uid", "==", cred.user.uid));
                  const snap = await getDocs(q);
                  if (!snap.empty) {
                    const userData = snap.docs[0].data() as { role?: string };
                    const role = userData.role;
                    console.log("Login: Found user with role:", role);
                    router.push(role === "admin" ? "/admin" : role === "manager" ? "/manager" : "/employee");
                  } else {
                    console.log("Login: No user document found, redirecting to company setup");
                    router.push("/onboarding/company-setup");
                  }
                } catch (error) {
                  console.error("Login: Error checking user role:", error);
                  router.push("/onboarding/company-setup");
                }
              } catch (err: unknown) {
                setError(getAuthErrorMessage(err));
              } finally {
                setLoading(false);
              }
            }}
          >
            <div>
              <label htmlFor="email" className="block mb-1 text-[14px] font-medium text-[#374151]">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <p className="mt-1 text-[12px] text-[#6b7280]">Use your work email.</p>
            </div>

            <PasswordField value={password} onChange={setPassword} />

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-[14px] text-[#374151]">
                <input type="checkbox" className="h-4 w-4 rounded border-[#d1d5db]" />
                Remember me
              </label>
              <Link href="/login/forgot" className="text-[14px] text-[#f97316] hover:opacity-80">Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-[#1f2937] text-white px-4 py-3 text-[16px] font-medium hover:bg-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] disabled:opacity-60"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>

            {error ? <p className="text-[14px] text-[#ef4444]">{error}</p> : null}

            <p className="text-[14px] text-[#6b7280] text-center">
              Don’t have an account? <Link href="/register" className="text-[#f97316]">Sign up</Link>
            </p>
          </form>
        </div>
      </section>

      <aside className="hidden md:block relative">
        <Image
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop"
          alt="HR team collaborating in a modern office"
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </aside>
    </div>
  );
}

function PasswordField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor="password" className="block mb-1 text-[14px] font-medium text-[#374151]">Password</label>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] pr-12 focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          placeholder="••••••••"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          aria-label="Toggle password visibility"
          className="absolute inset-y-0 right-3 my-auto h-8 px-2 rounded text-[12px] text-[#374151] border border-[#d1d5db] bg-white hover:bg-[#f9fafb]"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      <p className="mt-1 text-[12px] text-[#6b7280]">Use at least 8 characters.</p>
    </div>
  );
}


