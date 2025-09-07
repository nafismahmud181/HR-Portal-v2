"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, getDocs, onSnapshot, query, updateDoc, where, doc } from "firebase/firestore";

type AdminLeaveRow = {
  id: string;
  userId: string;
  type: string;
  fromDate: string;
  toDate: string;
  reason?: string;
  status: "pending" | "approved" | "rejected";
  createdAt?: string;
};

export default function AdminLeavePage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [rows, setRows] = useState<AdminLeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [empById, setEmpById] = useState<Record<string, string>>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }
      try {
        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid));
        const snap = await getDocs(q);
        const parentOrg = snap.empty ? null : snap.docs[0].ref.parent.parent;
        const foundOrgId = parentOrg ? parentOrg.id : null;
        setOrgId(foundOrgId);
        if (!foundOrgId) { setLoading(false); return; }
        // Live map of employees for name lookup
        const empCol = collection(db, "organizations", foundOrgId, "employees");
        const offEmp = onSnapshot(empCol, (s) => {
          const map: Record<string, string> = {};
          s.forEach((d) => {
            const data = d.data() as Record<string, unknown>;
            map[d.id] = (data["name"] as string) || d.id;
          });
          setEmpById(map);
        });

        const col = collection(db, "organizations", foundOrgId, "leaveRequests");
        const qLeaves = query(col);
        const offLeaves = onSnapshot(qLeaves, async (s) => {
          const list: AdminLeaveRow[] = [];
          s.forEach((d) => {
            const data = d.data() as Record<string, unknown> & { organizationId?: string };
            const ts = data["createdAt"] as { toDate?: () => Date } | undefined;
            list.push({
              id: d.id,
              userId: (data["userId"] as string) || "",
              type: (data["type"] as string) || "",
              fromDate: (data["fromDate"] as string) || "",
              toDate: (data["toDate"] as string) || "",
              reason: (data["reason"] as string) || "",
              status: (data["status"] as AdminLeaveRow["status"]) || "pending",
              createdAt: typeof ts?.toDate === "function" ? ts!.toDate()!.toLocaleString() : undefined,
            });
          });
          setRows(list.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || "")));
          setLoading(false);
        });
        return () => { offLeaves(); offEmp(); };
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Failed to load leave requests");
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  async function setStatus(id: string, status: AdminLeaveRow["status"]) {
    if (!orgId) return;
    const ref = doc(db, "organizations", orgId, "leaveRequests", id);
    await updateDoc(ref, { status, reviewedAt: new Date().toISOString(), reviewedBy: auth.currentUser?.uid || null });
  }

  return (
    <div className="px-6 py-8">
      <h1 className="text-[22px] font-semibold">Leave Requests</h1>
      <p className="mt-2 text-[14px] text-[#6b7280]">Review and approve employee leave.</p>

      <div className="mt-6 overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white">
        <table className="hidden md:table w-full text-left">
          <thead className="text-[12px] text-[#6b7280]">
            <tr>
              <th className="px-3 py-2">Employee</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">From</th>
              <th className="px-3 py-2">To</th>
              <th className="px-3 py-2">Reason</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[14px]">
            {loading ? (
              <tr><td className="px-3 py-3" colSpan={8}>Loading…</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="px-3 py-3" colSpan={8}>No leave requests.</td></tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="hover:bg-[#f9fafb]">
                <td className="px-3 py-3 align-middle">{empById[r.userId] || r.userId}</td>
                <td className="px-3 py-3 align-middle">{r.type}</td>
                <td className="px-3 py-3 align-middle">{r.fromDate}</td>
                <td className="px-3 py-3 align-middle">{r.toDate}</td>
                <td className="px-3 py-3 align-middle">{r.reason || ""}</td>
                <td className="px-3 py-3 align-middle">
                  <span className={`text-[12px] px-2 py-1 rounded-full border ${r.status === 'approved' ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]' : r.status === 'rejected' ? 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]' : 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]'}`}>{r.status}</span>
                </td>
                <td className="px-3 py-3 align-middle">{r.createdAt || ""}</td>
                <td className="px-3 py-3 align-middle">
                  <div className="flex items-center gap-2">
                    <button className="rounded-md border border-[#d1d5db] px-2 py-1 text-[12px] hover:bg-[#f9fafb]" onClick={() => setStatus(r.id, 'approved')}>Approve</button>
                    <button className="rounded-md border border-[#d1d5db] px-2 py-1 text-[12px] hover:bg-[#f9fafb]" onClick={() => setStatus(r.id, 'rejected')}>Reject</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Mobile */}
        <div className="md:hidden divide-y divide-[#e5e7eb]">
          {rows.map((r) => (
            <div key={r.id} className="p-4 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[14px]">{r.type} ({r.fromDate} → {r.toDate})</div>
                  <div className="text-[12px] text-[#6b7280]">{r.reason || ""}</div>
                </div>
                <span className={`text-[12px] px-2 py-1 rounded-full border ${r.status === 'approved' ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]' : r.status === 'rejected' ? 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]' : 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]'}`}>{r.status}</span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button className="rounded-md border border-[#d1d5db] px-2 py-1 text-[12px] hover:bg-[#f9fafb]" onClick={() => setStatus(r.id, 'approved')}>Approve</button>
                <button className="rounded-md border border-[#d1d5db] px-2 py-1 text-[12px] hover:bg-[#f9fafb]" onClick={() => setStatus(r.id, 'rejected')}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {err ? <p className="mt-3 text-[13px] text-[#b91c1c]">{err}</p> : null}
    </div>
  );
}


