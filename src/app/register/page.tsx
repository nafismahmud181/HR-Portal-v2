"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function RegisterPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      // Create organization doc
      const orgId = crypto.randomUUID();
      await setDoc(doc(db, "organizations", orgId), {
        name: company,
        createdBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create initial admin membership
      await setDoc(doc(db, "organizations", orgId, "users", uid), {
        uid,
        email,
        role: "admin",
        createdAt: serverTimestamp(),
      });

      router.push("/setup");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to register";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#ffffff] text-[#1a1a1a]">
      <div className="w-full max-w-[480px]">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="h-5 w-5 rounded bg-[#f97316]" aria-hidden />
          <span className="text-[16px] font-semibold">HRMSTech</span>
        </Link>
        <h1 className="mt-8 text-[24px] font-semibold">Create your company</h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">Start your 14‑day free trial. No credit card required.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="company" className="block mb-1 text-[14px] font-medium text-[#374151]">Company name</label>
            <input id="company" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="Acme Inc." value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div>
            <label htmlFor="email" className="block mb-1 text-[14px] font-medium text-[#374151]">Work email</label>
            <input id="email" type="email" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password" className="block mb-1 text-[14px] font-medium text-[#374151]">Password</label>
            <input id="password" type="password" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            <p className="mt-1 text-[12px] text-[#6b7280]">Use at least 8 characters.</p>
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-md bg-[#1f2937] text-white px-4 py-3 text-[16px] font-medium hover:bg-[#111827] disabled:opacity-60">{loading ? "Creating…" : "Create company"}</button>
          {error ? <p className="text-[14px] text-[#ef4444]">{error}</p> : null}
          <p className="text-[14px] text-[#6b7280] text-center">Already have an account? <Link href="/login" className="text-[#f97316]">Log in</Link></p>
        </form>
      </div>
    </div>
  );
}


