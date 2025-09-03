"use client";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collectionGroup, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";

export default function InviteEmployeePage() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("employee");
  const [orgId, setOrgId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      // Find an org where current user is admin (first one)
      const cg = collectionGroup(db, "users");
      const q = query(cg, where("uid", "==", user.uid), where("role", "==", "admin"));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const ref = snap.docs[0].ref;
        const parentOrg = ref.parent.parent;
        setOrgId(parentOrg ? parentOrg.id : null);
      }
    });
    return () => unsub();
  }, []);

  const inviteUrl = useMemo(() => {
    if (!orgId || !email) return "";
    const url = new URL(typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
    url.pathname = "/invite";
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("email", email);
    return url.toString();
  }, [orgId, email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) {
      setStatus("error");
      setMessage("No organization context found.");
      return;
    }
    setStatus("sending");
    setMessage("");
    try {
      await setDoc(doc(db, "organizations", orgId, "invites", email), {
        email,
        role,
        createdAt: serverTimestamp(),
      });
      setStatus("sent");
      setMessage("Invite created. Copy the link below and share it.");
    } catch (err: unknown) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Unable to create invite");
    }
  }

  return (
    <div className="px-6 py-8">
      <h1 className="text-[20px] font-semibold">Invite Employee</h1>
      <p className="mt-2 text-[14px] text-[#6b7280]">Send an invite to allow someone to set a password and join.</p>

      <form onSubmit={onSubmit} className="mt-8 max-w-[520px] space-y-5">
        <div>
          <label htmlFor="email" className="block mb-1 text-[14px] font-medium text-[#374151]">Work email</label>
          <input id="email" type="email" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="user@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="role" className="block mb-1 text-[14px] font-medium text-[#374151]">Role</label>
          <select id="role" className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
          </select>
        </div>
        <button type="submit" className="rounded-md bg-[#1f2937] text-white px-5 py-3 text-[16px] font-medium hover:bg-[#111827]">Create invite</button>
        {message ? <p className={`text-[14px] ${status === 'error' ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>{message}</p> : null}
      </form>

      {status === "sent" && inviteUrl ? (
        <div className="mt-6 max-w-[520px]">
          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Invite link</label>
          <div className="flex items-center gap-2">
            <input readOnly className="flex-1 rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" value={inviteUrl} />
            <button
              type="button"
              className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] hover:bg-[#f9fafb]"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(inviteUrl);
                } catch {}
              }}
            >
              Copy
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}


