"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { getAuthErrorMessage } from "@/lib/auth-errors";

export default function RegisterPage() {
  const router = useRouter();
  const [company, setCompany] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone] = useState("");
  const [source] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [adminRole, setAdminRole] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, () => {
      // Avoid redirecting away from /register to prevent race with signup flow
      setCheckingAuth(false);
    });
    return () => unsub();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Simple password strength: at least 8 chars with letters and numbers
      const strong = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d!@#$%^&*()_+\-={}\[\]:;"'`~<>,.?/\\]{8,}$/;
      if (!strong.test(password)) {
        throw new Error("Password must be at least 8 characters and include letters and numbers.");
      }
      if (!companySize) {
        throw new Error("Please select your company size.");
      }
      if (!adminRole) {
        throw new Error("Please select your role.");
      }
      if (!fullName.trim()) {
        throw new Error("Full name is required.");
      }
      if (!company.trim()) {
        throw new Error("Company name is required.");
      }
      if (!agreeTerms) {
        throw new Error("You must agree to the Terms of Service and Privacy Policy.");
      }
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;

      // Create organization doc
      const orgId = crypto.randomUUID();
      await setDoc(doc(db, "organizations", orgId), {
        name: company,
        size: companySize,
        createdBy: uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create initial admin membership and include profile fields directly on membership
      await setDoc(doc(db, "organizations", orgId, "users", uid), {
        uid,
        email,
        role: "admin",
        name: fullName,
        phone: phone || null,
        source: source || null,
        adminRole,
        companySize,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Cleanup: remove any legacy top-level user doc if it exists
      try {
        await deleteDoc(doc(db, "users", uid));
      } catch {
        // ignore if not exists/permission denied
      }

      router.replace("/onboarding/company-setup");
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#ffffff] text-[#1a1a1a]">
      <div className="w-full max-w-[560px]">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="h-5 w-5 rounded bg-[#f97316]" aria-hidden />
          <span className="text-[16px] font-semibold">HRMSTech</span>
        </Link>
        <h1 className="mt-8 text-[24px] font-semibold">Create your company</h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">Admin signup to set up your organization.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block mb-1 text-[14px] font-medium text-[#374151]">Work Email Address</label>
              <input id="email" type="email" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label htmlFor="company" className="block mb-1 text-[14px] font-medium text-[#374151]">Company Name</label>
              <input id="company" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="Acme Inc." value={company} onChange={(e) => setCompany(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block mb-1 text-[14px] font-medium text-[#374151]">Full Name</label>
              <input id="fullName" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="password" className="block mb-1 text-[14px] font-medium text-[#374151]">Create Password</label>
              <input id="password" type="password" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <p className="mt-1 text-[12px] text-[#6b7280]">At least 8 characters, include letters and numbers.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="size" className="block mb-1 text-[14px] font-medium text-[#374151]">Company Size</label>
              <select id="size" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] bg-white" value={companySize} onChange={(e) => setCompanySize(e.target.value)}>
                <option value="">Select size</option>
                <option value="1-10">1-10 employees</option>
                <option value="11-50">11-50 employees</option>
                <option value="51-200">51-200 employees</option>
                <option value="201-500">201-500 employees</option>
                <option value="500+">500+ employees</option>
              </select>
            </div>
            <div>
              <label htmlFor="role" className="block mb-1 text-[14px] font-medium text-[#374151]">Your Role</label>
              <select id="role" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] bg-white" value={adminRole} onChange={(e) => setAdminRole(e.target.value)}>
                <option value="">Select role</option>
                <option value="HR Manager">HR Manager</option>
                <option value="CEO/Founder">CEO/Founder</option>
                <option value="Operations Manager">Operations Manager</option>
                <option value="People Operations">People Operations</option>
              </select>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
            />
            <label htmlFor="agreeTerms" className="text-[14px] text-[#374151]">
              I agree to the{" "}
              <Link href="/terms" className="text-[#f97316] hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-[#f97316] hover:underline">
                Privacy Policy
              </Link>
            </label>
          </div>

          <button type="submit" disabled={loading} className="w-full rounded-md bg-[#1f2937] text-white px-4 py-3 text-[16px] font-medium hover:bg-[#111827] disabled:opacity-60">{loading ? "Creating…" : "Signup as admin"}</button>
          {error ? <p className="text-[14px] text-[#ef4444]">{error}</p> : null}
          <p className="text-[14px] text-[#6b7280] text-center">Already have an account? <Link href="/login" className="text-[#f97316]">Log in</Link></p>
        </form>
      </div>
    </div>
  );
}


