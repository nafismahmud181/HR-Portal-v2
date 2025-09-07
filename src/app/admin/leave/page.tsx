"use client";
import { useEffect, useMemo, useState } from "react";
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

      {/* Calendar view */}
      <CalendarView rows={rows} empById={empById} />

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

function CalendarView({ rows, empById }: { rows: AdminLeaveRow[]; empById: Record<string, string> }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  const days = useMemo(() => {
    const [y, m] = month.split('-').map((n) => parseInt(n, 10));
    const end = new Date(y, m, 0);
    const list: Array<{ date: string; label: string }> = [];
    for (let d = 1; d <= end.getDate(); d++) {
      const dt = new Date(y, m - 1, d);
      const label = dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      const iso = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      list.push({ date: iso, label });
    }
    return list;
  }, [month]);

  const byDay = useMemo(() => {
    const map: Record<string, Array<{ name: string; type: string; status: string }>> = {};
    rows.forEach((r) => {
      const start = new Date(r.fromDate);
      const end = new Date(r.toDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        (map[iso] ||= []).push({ name: empById[r.userId] || r.userId, type: r.type, status: r.status });
      }
    });
    return map;
  }, [rows, empById]);

  return (
    <section className="mt-6 rounded-lg border border-[#e5e7eb] bg-white">
      <div className="p-5 border-b border-[#e5e7eb] flex items-center gap-3">
        <h2 className="text-[16px] font-semibold">Leave Calendar</h2>
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="ml-auto rounded-md border border-[#d1d5db] px-3 py-1.5 text-[14px]"
        />
      </div>
      <div className="p-4 overflow-x-auto">
        <div className="grid" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(80px, 1fr))` }}>
          {days.map((d) => {
            const list = byDay[d.date] || [];
            return (
              <div key={d.date} className="border border-[#e5e7eb] min-h-[90px]">
                <div className="px-2 py-1 text-[12px] text-[#6b7280] border-b border-[#e5e7eb]">{d.label}</div>
                <div className="p-2 space-y-1">
                  {list.slice(0, 3).map((p, idx) => (
                    <div key={idx} className={`text-[11px] px-2 py-1 rounded ${p.status === 'approved' ? 'bg-[#ecfdf5] text-[#065f46]' : p.status === 'rejected' ? 'bg-[#fef2f2] text-[#991b1b]' : 'bg-[#fffbeb] text-[#92400e]'}`}>{p.name} • {p.type}</div>
                  ))}
                  {list.length > 3 ? (
                    <div className="text-[11px] text-[#6b7280]">+{list.length - 3} more</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}


