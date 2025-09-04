"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

export default function InviteSetPasswordPage() {
  const params = useSearchParams();
  const router = useRouter();
  const presetEmail = params.get("email") ?? "";
  const presetOrg = params.get("orgId");
  const [email, setEmail] = useState(presetEmail.toLowerCase());
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (presetEmail) setEmail(presetEmail);
  }, [presetEmail]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (!presetOrg) throw new Error("Missing orgId in invite link");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      // Verify invite now that the user is signed in (rules allow invitee to read)
      const normalized = email.trim().toLowerCase();
      const inviteRef = doc(db, "organizations", presetOrg, "invites", normalized);
      const inviteSnap = await getDoc(inviteRef);
      if (!inviteSnap.exists()) throw new Error("Invite not found or expired");

      await setDoc(doc(db, "organizations", presetOrg, "users", uid), {
        uid,
        email: normalized,
        role: "employee",
        createdAt: serverTimestamp(),
      });

      // Create employee profile in org directory
      await setDoc(doc(db, "organizations", presetOrg, "employees", uid), {
        employeeId: uid,
        name: normalized.split("@")[0],
        email: normalized,
        department: "",
        jobTitle: "",
        manager: "",
        hireDate: serverTimestamp(),
        status: "Active",
        location: "",
        employeeType: "Full-time",
        createdAt: serverTimestamp(),
      });

      router.push("/employee");
    } catch (err: any) {
      setError(err?.message ?? "Unable to set password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#ffffff] text-[#1a1a1a]">
      <div className="w-full max-w-[480px]">
        <Link href="/login" className="text-[14px] text-[#f97316]">← Back to login</Link>
        <h1 className="mt-4 text-[24px] font-semibold">Set your password</h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">Finish setting up your account to access your dashboard.</p>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block mb-1 text-[14px] font-medium text-[#374151]">Work email</label>
            <input id="email" type="email" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password" className="block mb-1 text-[14px] font-medium text-[#374151]">Password</label>
            <input id="password" type="password" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-md bg-[#1f2937] text-white px-4 py-3 text-[16px] font-medium hover:bg-[#111827] disabled:opacity-60">{loading ? "Saving…" : "Save and continue"}</button>
          {error ? <p className="text-[14px] text-[#ef4444]">{error}</p> : null}
        </form>
      </div>
    </div>
  );
}


