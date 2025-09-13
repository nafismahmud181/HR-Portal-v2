"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, collectionGroup, getDocs, onSnapshot, query, serverTimestamp, where } from "firebase/firestore";

export default function EmployeeLeavePage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [, setLoading] = useState(true);
  const [type, setType] = useState("Casual");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [myRequests, setMyRequests] = useState<Array<{ id: string; type: string; fromDate: string; toDate: string; reason?: string; status: string; createdAt?: string }>>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }
      try {
        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid));
        const snap = await getDocs(q);
        const parentOrg = snap.empty ? null : snap.docs[0].ref.parent.parent;
        setOrgId(parentOrg ? parentOrg.id : null);
      } finally { setLoading(false); }
    });
    return () => unsub();
  }, []);

  // Subscribe to my leave requests once orgId and user are available
  useEffect(() => {
    if (!orgId || !auth.currentUser) return;
    const col = collection(db, "organizations", orgId, "leaveRequests");
    const qLeaves = query(col);
    const off = onSnapshot(qLeaves, (snap) => {
      const list = snap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        const ts = data["createdAt"] as { toDate?: () => Date } | undefined;
        return {
          id: d.id,
          type: (data["type"] as string) || "",
          fromDate: (data["fromDate"] as string) || "",
          toDate: (data["toDate"] as string) || "",
          reason: (data["reason"] as string) || "",
          status: (data["status"] as string) || "pending",
          createdAt: typeof ts?.toDate === "function" ? ts!.toDate()!.toLocaleString() : undefined,
          userId: (data["userId"] as string) || "",
        };
      }).filter((r) => r.userId === auth.currentUser!.uid)
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      setMyRequests(list);
    });
    return () => off();
  }, [orgId]);

  async function submitLeave(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!orgId || !auth.currentUser) return;
    // Basic date validation
    if (!fromDate || !toDate) {
      setMessage("Please select both from and to dates.");
      return;
    }
    const from = new Date(fromDate);
    const to = new Date(toDate);
    if (to < from) {
      setMessage("'To' date cannot be before 'From' date.");
      return;
    }
    setSaving(true);
    try {
      const col = collection(db, "organizations", orgId, "leaveRequests");
      await addDoc(col, {
        userId: auth.currentUser.uid,
        type,
        fromDate,
        toDate,
        reason: reason || "",
        status: "pending",
        createdAt: serverTimestamp(),
      });
      setMessage("Leave request submitted.");
      setReason("");
      setFromDate("");
      setToDate("");
      setType("Casual");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Failed to submit");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="px-6 py-8">
      <h1 className="text-[22px] font-semibold">Leave Management</h1>
      <p className="mt-2 text-[14px] text-[#6b7280]">Apply for leave.</p>

      <form onSubmit={submitLeave} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-[720px]">
        <div>
          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white">
            <option>Casual</option>
            <option>Sick</option>
            <option>Annual</option>
            <option>Unpaid</option>
          </select>
        </div>
        <div>
          <label className="block mb-1 text-[14px] font-medium text-[#374151]">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              const v = e.target.value;
              setFromDate(v);
              if (toDate && v && toDate < v) setToDate(v);
            }}
            required
            min={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]"
          />
        </div>
        <div>
          <label className="block mb-1 text-[14px] font-medium text-[#374151]">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            required
            min={(fromDate || new Date().toISOString().slice(0, 10))}
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Reason (optional)</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] min-h-[90px]" />
        </div>
        {message ? <p className="md:col-span-2 text-[13px] text-[#6b7280]">{message}</p> : null}
        <div className="md:col-span-2">
          <button type="submit" disabled={saving || !orgId} className="rounded-md bg-[#1f2937] text-white px-5 py-2 text-[14px] hover:bg-[#111827] disabled:opacity-60">{saving ? "Submitting…" : "Submit"}</button>
        </div>
      </form>

      {/* My requests */}
      <div className="mt-8 overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white max-w-[960px]">
        <table className="hidden md:table w-full text-left">
          <thead className="text-[12px] text-[#6b7280]">
            <tr>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">From</th>
              <th className="px-3 py-2">To</th>
              <th className="px-3 py-2">Reason</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Submitted</th>
            </tr>
          </thead>
          <tbody className="text-[14px]">
            {myRequests.length === 0 ? (
              <tr><td className="px-3 py-3" colSpan={6}>No requests yet.</td></tr>
            ) : myRequests.map((r) => (
              <tr key={r.id} className="hover:bg-[#f9fafb]">
                <td className="px-3 py-3 align-middle">{r.type}</td>
                <td className="px-3 py-3 align-middle">{r.fromDate}</td>
                <td className="px-3 py-3 align-middle">{r.toDate}</td>
                <td className="px-3 py-3 align-middle">{r.reason || ""}</td>
                <td className="px-3 py-3 align-middle">
                  <span className={`text-[12px] px-2 py-1 rounded-full border ${r.status === 'approved' ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]' : r.status === 'rejected' ? 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]' : 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]'}`}>{r.status}</span>
                </td>
                <td className="px-3 py-3 align-middle">{r.createdAt || ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Mobile */}
        <div className="md:hidden divide-y divide-[#e5e7eb]">
          {myRequests.map((r) => (
            <div key={r.id} className="p-4 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[14px]">{r.type} ({r.fromDate} → {r.toDate})</div>
                  <div className="text-[12px] text-[#6b7280]">{r.reason || ""}</div>
                </div>
                <span className={`text-[12px] px-2 py-1 rounded-full border ${r.status === 'approved' ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]' : r.status === 'rejected' ? 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]' : 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]'}`}>{r.status}</span>
              </div>
              <div className="mt-2 text-[12px] text-[#6b7280]">Submitted: {r.createdAt || ""}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


