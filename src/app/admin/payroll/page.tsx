"use client";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, collectionGroup, doc, getDocs, onSnapshot, query, serverTimestamp, where, setDoc, updateDoc, deleteDoc } from "firebase/firestore";

type PayrollRun = {
  id: string;
  period: string; // e.g., 2025-09
  createdAt?: string;
  status: "draft" | "processed" | "paid";
  notes?: string;
};

export default function PayrollPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [period, setPeriod] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewRun, setViewRun] = useState<PayrollRun | null>(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [itemsError, setItemsError] = useState("");
  const [items, setItems] = useState<Array<{ id: string; employeeId: string; name: string; department?: string; base: number; allowances: number; deductions: number; net: number }>>([]);
  const [savingRowId, setSavingRowId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { setLoading(false); return; }
      try {
        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (snap.empty) { setLoading(false); return; }
        const parentOrg = snap.docs[0].ref.parent.parent;
        const foundOrgId = parentOrg ? parentOrg.id : null;
        setOrgId(foundOrgId);
        if (!foundOrgId) { setLoading(false); return; }
        const runsCol = collection(db, "organizations", foundOrgId, "payrollRuns");
        const off = onSnapshot(runsCol, (snapshot) => {
          const list = snapshot.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            const ts = data["createdAt"] as { toDate?: () => Date } | undefined;
            return {
              id: d.id,
              period: (data["period"] as string) ?? "",
              createdAt: typeof ts?.toDate === "function" ? ts!.toDate()!.toLocaleString() : undefined,
              status: (data["status"] as PayrollRun["status"]) ?? "draft",
              notes: (data["notes"] as string) ?? undefined,
            } as PayrollRun;
          }).sort((a, b) => (b.period.localeCompare(a.period)));
          setRuns(list);
          setLoading(false);
        });
        return () => off();
      } catch {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  async function createRun(e: React.FormEvent) {
    e.preventDefault();
    if (!orgId || !period) return;
    setCreating(true);
    try {
      const runsCol = collection(db, "organizations", orgId, "payrollRuns");
      await addDoc(runsCol, {
        period,
        status: "draft",
        notes: notes || "",
        createdAt: serverTimestamp(),
      });
      setPeriod("");
      setNotes("");
    } finally {
      setCreating(false);
    }
  }

  async function openRun(run: PayrollRun) {
    if (!orgId) return;
    setViewRun(run);
    setViewOpen(true);
    setItemsLoading(true);
    setItemsError("");
    try {
      const itemsCol = collection(db, "organizations", orgId, "payrollRuns", run.id, "items");
      const off = onSnapshot(itemsCol, (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          const base = Number(data["base"]) || 0;
          const allowances = Number(data["allowances"]) || 0;
          const deductions = Number(data["deductions"]) || 0;
          return {
            id: d.id,
            employeeId: (data["employeeId"] as string) || d.id,
            name: (data["name"] as string) || d.id,
            department: (data["department"] as string) || "",
            base,
            allowances,
            deductions,
            net: base + allowances - deductions,
          };
        });
        setItems(list);
        setItemsLoading(false);
      });
      // Keep listener attached while modal is open
      return () => off();
    } catch (e) {
      setItemsError(e instanceof Error ? e.message : "Failed to load items");
      setItemsLoading(false);
    }
  }

  async function generateItemsForRun(run: PayrollRun) {
    if (!orgId) return;
    setItemsError("");
    setItemsLoading(true);
    try {
      // Load employees of the org
      const empCol = collection(db, "organizations", orgId, "employees");
      const empSnap = await getDocs(empCol);
      const writes: Array<Promise<unknown>> = [];
      for (const d of empSnap.docs) {
        const data = d.data() as Record<string, unknown>;
        const name = (data["name"] as string) || d.id;
        const department = (data["department"] as string) || "";
        const itemRef = doc(db, "organizations", orgId, "payrollRuns", run.id, "items", d.id);
        writes.push(setDoc(itemRef, {
          employeeId: d.id,
          name,
          department,
          base: 0,
          allowances: 0,
          deductions: 0,
          net: 0,
          createdAt: serverTimestamp(),
        }, { merge: true }));
      }
      await Promise.all(writes);
    } catch (e) {
      setItemsError(e instanceof Error ? e.message : "Failed to generate items");
    } finally {
      setItemsLoading(false);
    }
  }

  async function saveRow(runId: string, row: { id: string; base: number; allowances: number; deductions: number }) {
    if (!orgId) return;
    setSavingRowId(row.id);
    try {
      const itemRef = doc(db, "organizations", orgId, "payrollRuns", runId, "items", row.id);
      const net = Number(row.base || 0) + Number(row.allowances || 0) - Number(row.deductions || 0);
      await updateDoc(itemRef, { base: Number(row.base || 0), allowances: Number(row.allowances || 0), deductions: Number(row.deductions || 0), net });
    } finally {
      setSavingRowId(null);
    }
  }

  async function setRunStatus(run: PayrollRun, status: PayrollRun["status"]) {
    if (!orgId) return;
    const runRef = doc(db, "organizations", orgId, "payrollRuns", run.id);
    await updateDoc(runRef, { status });
  }

  async function deleteRun(run: PayrollRun) {
    if (!orgId) return;
    const confirmed = typeof window === "undefined" ? true : window.confirm("Delete this payroll run and all its items?");
    if (!confirmed) return;
    setDeletingId(run.id);
    try {
      const itemsCol = collection(db, "organizations", orgId, "payrollRuns", run.id, "items");
      const itemsSnap = await getDocs(itemsCol);
      await Promise.all(itemsSnap.docs.map((d) => deleteDoc(d.ref)));
      const runRef = doc(db, "organizations", orgId, "payrollRuns", run.id);
      await deleteDoc(runRef);
      if (viewOpen && viewRun?.id === run.id) setViewOpen(false);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="px-6 py-8">
      <h1 className="text-[20px] font-semibold">Payroll</h1>
      <p className="mt-2 text-[14px] text-[#6b7280]">Create and manage payroll runs, and review payslips.</p>

      {/* Create run */}
      <form onSubmit={createRun} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3 max-w-[820px]">
        <div>
          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Period</label>
          <input
            placeholder="YYYY-MM"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Notes (optional)</label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]"
          />
        </div>
        <div className="md:col-span-3">
          <button type="submit" disabled={creating || !orgId} className="rounded-md bg-[#1f2937] text-white px-5 py-2 text-[14px] hover:bg-[#111827] disabled:opacity-60">
            {creating ? "Creating…" : "Create Run"}
          </button>
        </div>
      </form>

      {/* Runs table */}
      <div className="mt-8 overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white">
        <table className="hidden md:table w-full text-left">
          <thead className="text-[12px] text-[#6b7280]">
            <tr>
              <th className="px-3 py-2">Period</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Notes</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[14px]">
            {loading ? (
              <tr><td className="px-3 py-3" colSpan={5}>Loading…</td></tr>
            ) : runs.length === 0 ? (
              <tr><td className="px-3 py-3" colSpan={5}>No payroll runs.</td></tr>
            ) : runs.map((r) => (
              <tr key={r.id} className="hover:bg-[#f9fafb]">
                <td className="px-3 py-3 align-middle">{r.period}</td>
                <td className="px-3 py-3 align-middle">{r.createdAt || "—"}</td>
                <td className="px-3 py-3 align-middle">
                  <span className={`text-[12px] px-2 py-1 rounded-full border ${r.status === "paid" ? "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]" : r.status === "processed" ? "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]" : "bg-[#fffbeb] text-[#b45309] border-[#fde68a]"}`}>{r.status}</span>
                </td>
                <td className="px-3 py-3 align-middle">{r.notes || ""}</td>
                <td className="px-3 py-3 align-middle">
                  <div className="flex items-center gap-2">
                    <button className="text-[#374151] hover:underline" onClick={() => openRun(r)}>View</button>
                    <button className="text-[#374151] hover:underline" onClick={() => setRunStatus(r, "processed")}>Process</button>
                    <button className="text-[#374151] hover:underline" onClick={() => setRunStatus(r, "paid")}>Mark Paid</button>
                    <button className="text-[#b91c1c] hover:underline" disabled={deletingId === r.id} onClick={() => deleteRun(r)}>{deletingId === r.id ? "Deleting…" : "Delete"}</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile */}
        <div className="md:hidden divide-y divide-[#e5e7eb]">
          {runs.map((r) => (
            <div key={r.id} className="p-4 bg-white">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-[14px]">{r.period}</div>
                  <div className="text-[12px] text-[#6b7280]">{r.createdAt || "—"}</div>
                </div>
                <span className={`text-[12px] px-2 py-1 rounded-full border ${r.status === "paid" ? "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]" : r.status === "processed" ? "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]" : "bg-[#fffbeb] text-[#b45309] border-[#fde68a]"}`}>{r.status}</span>
              </div>
              <div className="mt-2 text-[12px] text-[#374151]">{r.notes || ""}</div>
              <div className="mt-3 flex items-center gap-2">
                <button className="text-[#374151] hover:underline" onClick={() => openRun(r)}>View</button>
                <button className="text-[#374151] hover:underline" onClick={() => setRunStatus(r, "processed")}>Process</button>
                <button className="text-[#374151] hover:underline" onClick={() => setRunStatus(r, "paid")}>Mark Paid</button>
                <button className="text-[#b91c1c] hover:underline" disabled={deletingId === r.id} onClick={() => deleteRun(r)}>{deletingId === r.id ? "Deleting…" : "Delete"}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* View Run Modal */}
      {viewOpen && viewRun ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setViewOpen(false)} />
          <div className="relative bg-white rounded-lg shadow-lg w-[95vw] max-w-[1100px] border border-[#e5e7eb]">
            <div className="p-5 border-b border-[#e5e7eb] flex items-center justify-between">
              <div>
                <h2 className="text-[16px] font-semibold">Payroll Run • {viewRun.period}</h2>
                <p className="text-[12px] text-[#6b7280]">Status: {viewRun.status}</p>
              </div>
              <div className="flex items-center gap-2">
                <button className="rounded-md border border-[#d1d5db] px-3 py-2 text-[13px] hover:bg-[#f9fafb]" onClick={() => generateItemsForRun(viewRun)} disabled={itemsLoading}>Generate Items</button>
                <button className="rounded-md border border-[#d1d5db] px-3 py-2 text-[13px] hover:bg-[#f9fafb]" onClick={() => setRunStatus(viewRun, "processed")}>Process</button>
                <button className="rounded-md border border-[#d1d5db] px-3 py-2 text-[13px] hover:bg-[#f9fafb]" onClick={() => setRunStatus(viewRun, "paid")}>Mark Paid</button>
                <button className="text-[14px] text-[#374151]" onClick={() => setViewOpen(false)}>Close</button>
              </div>
            </div>

            <div className="p-5">
              {itemsError ? <p className="text-[13px] text-[#b91c1c]">{itemsError}</p> : null}
              <div className="overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white">
                <table className="w-full text-left">
                  <thead className="text-[12px] text-[#6b7280]">
                    <tr>
                      <th className="px-3 py-2">Employee</th>
                      <th className="px-3 py-2">Department</th>
                      <th className="px-3 py-2">Base</th>
                      <th className="px-3 py-2">Allowances</th>
                      <th className="px-3 py-2">Deductions</th>
                      <th className="px-3 py-2">Net</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-[14px]">
                    {itemsLoading ? (
                      <tr><td className="px-3 py-3" colSpan={7}>Loading…</td></tr>
                    ) : items.length === 0 ? (
                      <tr><td className="px-3 py-3" colSpan={7}>No items.</td></tr>
                    ) : items.map((it, idx) => (
                      <tr key={it.id} className="hover:bg-[#f9fafb]">
                        <td className="px-3 py-2 align-middle">{it.name}</td>
                        <td className="px-3 py-2 align-middle">{it.department || "—"}</td>
                        <td className="px-3 py-2 align-middle">
                          <input type="number" className="w-28 rounded-md border border-[#d1d5db] px-2 py-1 text-[13px]" value={it.base} onChange={(e) => {
                            const v = Number(e.target.value || 0); const next = [...items]; next[idx] = { ...it, base: v, net: v + it.allowances - it.deductions }; setItems(next);
                          }} />
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <input type="number" className="w-28 rounded-md border border-[#d1d5db] px-2 py-1 text-[13px]" value={it.allowances} onChange={(e) => {
                            const v = Number(e.target.value || 0); const next = [...items]; next[idx] = { ...it, allowances: v, net: it.base + v - it.deductions }; setItems(next);
                          }} />
                        </td>
                        <td className="px-3 py-2 align-middle">
                          <input type="number" className="w-28 rounded-md border border-[#d1d5db] px-2 py-1 text-[13px]" value={it.deductions} onChange={(e) => {
                            const v = Number(e.target.value || 0); const next = [...items]; next[idx] = { ...it, deductions: v, net: it.base + it.allowances - v }; setItems(next);
                          }} />
                        </td>
                        <td className="px-3 py-2 align-middle">{(it.net).toFixed(2)}</td>
                        <td className="px-3 py-2 align-middle">
                          <button className="rounded-md border border-[#d1d5db] px-2 py-1 text-[12px] hover:bg-[#f9fafb]" disabled={savingRowId === it.id} onClick={() => saveRow(viewRun.id, it)}>{savingRowId === it.id ? "Saving…" : "Save"}</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}



