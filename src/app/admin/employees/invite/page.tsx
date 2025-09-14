"use client";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, doc, getDocs, query, serverTimestamp, setDoc, where } from "firebase/firestore";

export default function InviteEmployeePage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [employmentStatus, setEmploymentStatus] = useState<"Probationary" | "Part-time" | "Full-time">("Full-time");
  const [orgRole, setOrgRole] = useState<"employee" | "manager" | "admin">("employee");
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [emailSendStatus, setEmailSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [emailSendMessage, setEmailSendMessage] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      try {
        // Find an org where current user is admin (first one)
        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const ref = snap.docs[0].ref;
          const parentOrg = ref.parent.parent;
          setOrgId(parentOrg ? parentOrg.id : null);
        } else {
          // Fallback: find org where current user is the creator
          const orgsCol = collection(db, "organizations");
          const orgsQ = query(orgsCol, where("createdBy", "==", user.uid));
          const orgsSnap = await getDocs(orgsQ);
          if (!orgsSnap.empty) {
            setOrgId(orgsSnap.docs[0].id);
          } else {
            setOrgId(null);
          }
        }
      } catch (err: unknown) {
        console.error("Failed to lookup admin membership via collectionGroup:", err);
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Permission error loading organization.");
      }
    });
    return () => unsub();
  }, []);

  // Load departments for the organization
  useEffect(() => {
    async function loadDepartments() {
      if (!orgId) return;
      try {
        const depCol = collection(db, "organizations", orgId, "departments");
        const depSnap = await getDocs(depCol);
        const list: Array<{ id: string; name: string }> = depSnap.docs.map((d) => {
          const data = d.data() as { name?: string };
          return { id: d.id, name: data?.name ?? d.id };
        });
        setDepartments(list);
      } catch (e) {
        console.error("Failed to load departments", e);
      }
    }
    loadDepartments();
  }, [orgId]);

  // Load roles when department changes
  useEffect(() => {
    async function loadRoles() {
      if (!orgId || !departmentId) {
        setRoles([]);
        setRoleId("");
        return;
      }
      try {
        const rolesCol = collection(db, "organizations", orgId, "roles");
        const rolesSnap = await getDocs(rolesCol);
        const list: Array<{ id: string; name: string }> = rolesSnap.docs
          .map((d) => {
            const data = d.data() as { title?: string; departmentIds?: string[]; primaryDepartmentId?: string; status?: string };
            return { 
              id: d.id, 
              name: data?.title ?? d.id,
              departmentIds: data?.departmentIds ?? [],
              primaryDepartmentId: data?.primaryDepartmentId,
              status: data?.status ?? "draft"
            };
          })
          .filter((role) => 
            (role.departmentIds.includes(departmentId) || 
            role.primaryDepartmentId === departmentId) &&
            role.status === "active"
          )
          .map((role) => ({ id: role.id, name: role.name }));
        setRoles(list);
      } catch (e) {
        console.error("Failed to load roles", e);
      }
    }
    loadRoles();
  }, [orgId, departmentId]);

  const inviteUrl = useMemo(() => {
    if (!orgId || !email) return "";
    const url = new URL(typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
    url.pathname = "/invite";
    url.searchParams.set("orgId", orgId);
    url.searchParams.set("email", email.trim().toLowerCase());
    return url.toString();
  }, [orgId, email]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId) {
      setStatus("error");
      setMessage("No organization context found.");
      return;
    }
    if (!fullName || !email || !departmentId || !roleId || !employmentStatus) {
      setStatus("error");
      setMessage("Please fill all required fields.");
      return;
    }
    setStatus("sending");
    setMessage("");
    setEmailSendStatus("idle");
    setEmailSendMessage("");
    try {
      const inviteEmail = email.trim().toLowerCase();
      const selectedDepartment = departments.find((d) => d.id === departmentId);
      const selectedRole = roles.find((r) => r.id === roleId);
      await setDoc(doc(db, "organizations", orgId, "invites", inviteEmail), {
        email: inviteEmail,
        name: fullName,
        departmentId,
        departmentName: selectedDepartment?.name ?? null,
        roleId,
        roleName: selectedRole?.name ?? null,
        employmentStatus,
        orgRole,
        createdAt: serverTimestamp(),
      });
      // Send email and show status
      try {
        setEmailSendStatus("sending");
        const resp = await fetch("/api/send-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ to: email, inviteUrl, orgName: undefined }),
        });
        if (!resp.ok) {
          const data = await resp.json().catch(() => ({}));
          const errMsg = (data && data.error) ? data.error : `HTTP ${resp.status}`;
          setEmailSendStatus("error");
          setEmailSendMessage(`Email not sent: ${errMsg}`);
        } else {
          setEmailSendStatus("sent");
          setEmailSendMessage(`Email sent to ${email}`);
        }
      } catch (e: unknown) {
        setEmailSendStatus("error");
        setEmailSendMessage(e instanceof Error ? e.message : "Failed to send email");
      }
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

      <form onSubmit={onSubmit} className="mt-8 max-w-[620px] space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="fullName" className="block mb-1 text-[14px] font-medium text-[#374151]">Full name</label>
            <input id="fullName" type="text" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="Ben Macklemoore" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="email" className="block mb-1 text-[14px] font-medium text-[#374151]">Work email</label>
            <input id="email" type="email" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="user@company.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="orgrole" className="block mb-1 text-[14px] font-medium text-[#374151]">Org Role</label>
            <select id="orgrole" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] bg-white" value={orgRole} onChange={(e) => setOrgRole(e.target.value as typeof orgRole)}>
              <option value="employee">Employee</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label htmlFor="department" className="block mb-1 text-[14px] font-medium text-[#374151]">Department</label>
            <select id="department" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] bg-white" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="" disabled>Select department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="role" className="block mb-1 text-[14px] font-medium text-[#374151]">Role</label>
            <select id="role" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] bg-white" value={roleId} onChange={(e) => setRoleId(e.target.value)} disabled={!departmentId || roles.length === 0}>
              <option value="" disabled>{departmentId ? (roles.length ? 'Select role' : 'No roles') : 'Select department first'}</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="employment" className="block mb-1 text-[14px] font-medium text-[#374151]">Status</label>
            <select id="employment" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] bg-white" value={employmentStatus} onChange={(e) => setEmploymentStatus(e.target.value as typeof employmentStatus)}>
              <option>Probationary</option>
              <option>Part-time</option>
              <option>Full-time</option>
            </select>
          </div>
        </div>
        <button 
          type="submit" 
          disabled={status === 'sending'}
          className="rounded-md bg-[#1f2937] text-white px-5 py-3 text-[16px] font-medium hover:bg-[#111827] disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {status === 'sending' && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
          {status === 'sending' ? 'Creating invite...' : 'Create invite'}
        </button>
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
          {emailSendStatus !== "idle" ? (
            <p className={`mt-2 text-[13px] ${emailSendStatus === 'error' ? 'text-[#ef4444]' : 'text-[#10b981]'}`}>
              {emailSendMessage || (emailSendStatus === 'sending' ? 'Sending email…' : '')}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}


