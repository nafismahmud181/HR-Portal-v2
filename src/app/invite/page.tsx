"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { getAuthErrorMessage } from "@/lib/auth-errors";

function InviteSetPasswordPageInner() {
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
      
      console.log("Creating user account...");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const uid = cred.user.uid;
      console.log("User created with UID:", uid);
      
      // Wait a moment for auth token to propagate
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Verify invite now that the user is signed in (rules allow invitee to read)
      const normalized = email.trim().toLowerCase();
      const inviteRef = doc(db, "organizations", presetOrg, "invites", normalized);
      console.log("Reading invite document for email:", normalized);
      console.log("Auth token email:", cred.user.email);
      const inviteSnap = await getDoc(inviteRef);
      if (!inviteSnap.exists()) {
        console.error("Invite document not found. Expected path:", `organizations/${presetOrg}/invites/${normalized}`);
        throw new Error("Invite not found or expired");
      }

      const inviteData = inviteSnap.data() as { orgRole?: "employee" | "manager" | "admin" } | undefined;
      console.log("Invite data:", inviteData);
      
      // Create user membership in organization
      console.log("Creating user membership...");
      try {
        await setDoc(doc(db, "organizations", presetOrg, "users", uid), {
          uid,
          email: normalized,
          role: inviteData?.orgRole || "employee",
          createdAt: serverTimestamp(),
        });
        console.log("User membership created successfully");
      } catch (userErr) {
        console.error("Error creating user membership:", userErr);
        throw new Error(`Failed to create user membership: ${userErr instanceof Error ? userErr.message : 'Unknown error'}`);
      }

      // Create employee profile in org directory
      const invite = inviteSnap.data() as {
        name?: string;
        departmentId?: string;
        departmentName?: string;
        roleId?: string;
        roleName?: string;
        employmentStatus?: string;
      };
      console.log("Creating employee profile...");
      try {
        await setDoc(doc(db, "organizations", presetOrg, "employees", uid), {
          employeeId: uid,
          name: invite?.name || normalized.split("@")[0],
          email: normalized,
          departmentId: invite?.departmentId || "",
          department: invite?.departmentName || "",
          roleId: invite?.roleId || "",
          jobTitle: invite?.roleName || "",
          manager: "",
          hireDate: serverTimestamp(),
          status: "Active",
          location: "",
          employeeType: invite?.employmentStatus || "Full-time",
          createdAt: serverTimestamp(),
        });
        console.log("Employee profile created successfully");
      } catch (empErr) {
        console.error("Error creating employee profile:", empErr);
        throw new Error(`Failed to create employee profile: ${empErr instanceof Error ? empErr.message : 'Unknown error'}`);
      }

      // Mark invite accepted
      console.log("Marking invite as accepted...");
      try {
        await setDoc(inviteRef, { acceptedAt: serverTimestamp(), acceptedByUid: uid, status: "accepted" }, { merge: true });
        console.log("Invite marked as accepted");
      } catch (inviteErr) {
        console.warn("Failed to mark invite as accepted:", inviteErr);
      }
      
      // Redirect based on role
      const userRole = inviteData?.orgRole || "employee";
      console.log("Redirecting user with role:", userRole);
      
      if (userRole === "admin") {
        console.log("Redirecting to /admin");
        router.push("/admin");
      } else if (userRole === "manager") {
        console.log("Redirecting to /manager");
        router.push("/manager");
      } else {
        console.log("Redirecting to /employee/onboarding");
        router.push("/employee/onboarding");
      }
    } catch (err: unknown) {
      console.error("Invite flow error:", err);
      setError(getAuthErrorMessage(err));
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
            <input id="email" type="email" required readOnly disabled className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] bg-[#f9fafb] text-[#6b7280]" value={email} />
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

export default function InviteSetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center px-6" aria-busy="true" />}> 
      <InviteSetPasswordPageInner />
    </Suspense>
  );
}


