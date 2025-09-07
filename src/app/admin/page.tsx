"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, doc, getDocs, onSnapshot, query, updateDoc, where, orderBy, limit } from "firebase/firestore";

type PendingItem = { id: string; userId: string; name: string; type: string; fromDate: string; toDate: string; createdAt?: string };

export default function AdminDashboardPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [empById, setEmpById] = useState<Record<string, string>>({});
  const [activities, setActivities] = useState<Array<{ what: string; whoId: string; when: string }>>([]);
  const [leaveToday, setLeaveToday] = useState<Array<{ userId: string; type: string; fromDate: string; toDate: string }>>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const cg = collectionGroup(db, "users");
      const q = query(cg, where("uid", "==", user.uid));
      const snap = await getDocs(q);
      const parentOrg = snap.empty ? null : snap.docs[0].ref.parent.parent;
      const foundOrgId = parentOrg ? parentOrg.id : null;
      setOrgId(foundOrgId);
      if (!foundOrgId) return;

      // Employee names map
      const empCol = collection(db, "organizations", foundOrgId, "employees");
      const offEmp = onSnapshot(empCol, (s) => {
        const map: Record<string, string> = {};
        s.forEach((d) => { const data = d.data() as Record<string, unknown>; map[d.id] = (data["name"] as string) || d.id; });
        setEmpById(map);
      });

      // Pending leave requests
      const leavesCol = collection(db, "organizations", foundOrgId, "leaveRequests");
      const qLeaves = query(leavesCol, where("status", "==", "pending"));
      const offLeaves = onSnapshot(qLeaves, (s) => {
        const list: PendingItem[] = [];
        s.forEach((d) => {
          const data = d.data() as Record<string, unknown>;
          const ts = data["createdAt"] as { toDate?: () => Date } | undefined;
          list.push({
            id: d.id,
            userId: (data["userId"] as string) || "",
            name: "",
            type: (data["type"] as string) || "",
            fromDate: (data["fromDate"] as string) || "",
            toDate: (data["toDate"] as string) || "",
            createdAt: typeof ts?.toDate === "function" ? ts!.toDate()!.toLocaleString() : undefined,
          });
        });
        setPending(list);
      });
      // Recent activities from latest leave submissions (and approvals)
      const qRecent = query(leavesCol, orderBy("createdAt", "desc"), limit(10));
      const offRecent = onSnapshot(qRecent, (s) => {
        const acts: Array<{ what: string; whoId: string; when: string }> = [];
        s.forEach((d) => {
          const data = d.data() as Record<string, unknown> & { status?: string; reviewedAt?: string; userId?: string; type?: string };
          const status = (data.status as string) || "pending";
          const userId = (data.userId as string) || "";
          const createdTs = data["createdAt"] as { toDate?: () => Date } | undefined;
          const createdAt = typeof createdTs?.toDate === "function" ? createdTs!.toDate()!.toLocaleString() : "";
          const when = status === "pending" ? createdAt : ((data.reviewedAt as string) || createdAt);
          const what = status === "approved" ? `Approved leave request` : status === "rejected" ? `Rejected leave request` : `Submitted leave request`;
          acts.push({ what, whoId: userId, when });
        });
        setActivities(acts);
      });

      // Who is on leave today (approved)
      const todayIso = new Date();
      const today = `${todayIso.getFullYear()}-${String(todayIso.getMonth() + 1).padStart(2, '0')}-${String(todayIso.getDate()).padStart(2, '0')}`;
      const offApproved = onSnapshot(leavesCol, (s) => {
        const todayList: Array<{ userId: string; type: string; fromDate: string; toDate: string }> = [];
        s.forEach((d) => {
          const data = d.data() as Record<string, unknown> & { status?: string; fromDate?: string; toDate?: string; userId?: string; type?: string };
          if ((data.status as string) !== 'approved') return;
          const from = (data.fromDate as string) || '';
          const to = (data.toDate as string) || '';
          if (!from || !to) return;
          if (from <= today && today <= to) {
            todayList.push({ userId: (data.userId as string) || '', type: (data.type as string) || '', fromDate: from, toDate: to });
          }
        });
        setLeaveToday(todayList);
      });
      return () => { offEmp(); offLeaves(); offRecent(); offApproved(); };
    });
    return () => unsub();
  }, []);

  async function setStatus(id: string, status: "approved" | "rejected") {
    if (!orgId) return;
    const ref = doc(db, "organizations", orgId, "leaveRequests", id);
    await updateDoc(ref, { status, reviewedAt: new Date().toISOString(), reviewedBy: auth.currentUser?.uid || null });
  }

  return (
    <div className="min-h-screen px-6 py-16 bg-[#ffffff] text-[#1a1a1a]">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-[24px] font-semibold">Admin Dashboard</h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">Overview of your organization at a glance.</p>

        {/* Quick Actions Panel */}
        <section aria-label="Quick Actions" className="mt-10">
          <h2 className="text-[18px] font-semibold">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="/admin/employees/invite" className="rounded-lg border border-[#e5e7eb] p-4 hover:shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                <span className="text-[14px] font-medium">Invite Employee</span>
              </div>
            </a>
            <a href="#" className="rounded-lg border border-[#e5e7eb] p-4 hover:shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                <span className="text-[14px] font-medium">Create Department</span>
              </div>
            </a>
            <a href="#" className="rounded-lg border border-[#e5e7eb] p-4 hover:shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                <span className="text-[14px] font-medium">Run Payroll</span>
              </div>
            </a>
            <a href="#" className="rounded-lg border border-[#e5e7eb] p-4 hover:shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                <span className="text-[14px] font-medium">New Announcement</span>
              </div>
            </a>
          </div>
        </section>

        {/* Analytics Overview */}
        <section aria-label="Analytics Overview" className="mt-10">
          <h2 className="text-[18px] font-semibold">Analytics Overview</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Employees', value: '128', delta: '+4 this month' },
              { label: 'Attendance', value: '96%', delta: '+2% vs last wk' },
              { label: 'Payroll Due', value: '$84,200', delta: 'in 3 days' },
              { label: 'Open Roles', value: '5', delta: '2 interviews today' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-[#e5e7eb] p-5 bg-white">
                <p className="text-[12px] text-[#6b7280]">{kpi.label}</p>
                <p className="mt-2 text-[22px] font-semibold">{kpi.value}</p>
                <p className="mt-1 text-[12px] text-[#10b981]">{kpi.delta}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <section aria-label="Recent Activities" className="lg:col-span-2 rounded-lg border border-[#e5e7eb] bg-white">
            <div className="p-5 border-b border-[#e5e7eb]"><h2 className="text-[18px] font-semibold">Recent Activities</h2></div>
            <ul className="divide-y divide-[#e5e7eb]">
              {activities.length === 0 ? (
                <li className="p-5 text-[14px] text-[#6b7280]">No recent activity.</li>
              ) : activities.map((a, idx) => (
                <li key={idx} className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium">{a.what}</p>
                    <p className="text-[12px] text-[#6b7280]">{empById[a.whoId] || a.whoId}</p>
                  </div>
                  <span className="text-[12px] text-[#6b7280]">{a.when}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Pending Approvals */}
          <section aria-label="Pending Approvals" className="rounded-lg border border-[#e5e7eb] bg-white">
            <div className="p-5 border-b border[#e5e7eb]"><h2 className="text-[18px] font-semibold">Pending Approvals</h2></div>
            <ul className="p-5 space-y-4">
              {pending.length === 0 ? (
                <li className="text-[14px] text-[#6b7280]">No pending items.</li>
              ) : pending.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-medium">Leave request – {empById[p.userId] || p.userId}</p>
                    <p className="text-[12px] text-[#6b7280]">{p.type} • {p.fromDate} → {p.toDate}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href="/admin/leave" className="rounded-md border border-[#d1d5db] px-3 py-1.5 text-[12px] hover:bg-[#f9fafb]">View</Link>
                    <button className="rounded-md bg-[#1f2937] text-white px-3 py-1.5 text-[12px] hover:bg-[#111827]" onClick={() => setStatus(p.id, 'approved')}>Approve</button>
                    <button className="rounded-md border border-[#d1d5db] px-3 py-1.5 text-[12px] hover:bg-[#f9fafb]" onClick={() => setStatus(p.id, 'rejected')}>Reject</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Who's on leave today */}
        <section aria-label="On Leave Today" className="mt-10 rounded-lg border border-[#e5e7eb] bg-white">
          <div className="p-5 border-b border-[#e5e7eb]"><h2 className="text-[18px] font-semibold">On Leave Today</h2></div>
          <ul className="p-5 space-y-2">
            {leaveToday.length === 0 ? (
              <li className="text-[14px] text-[#6b7280]">No approved leaves today.</li>
            ) : leaveToday.map((l, idx) => (
              <li key={`${l.userId}-${idx}`} className="flex items-center justify-between">
                <div className="text-[14px]">{empById[l.userId] || l.userId}</div>
                <div className="text-[12px] text-[#6b7280]">{l.type} • {l.fromDate} → {l.toDate}</div>
              </li>
            ))}
          </ul>
        </section>

        {/* System Notifications */}
        <section aria-label="System Notifications" className="mt-10 rounded-lg border border-[#e5e7eb] bg-white">
          <div className="p-5 border-b border[#e5e7eb]"><h2 className="text-[18px] font-semibold">System Notifications</h2></div>
          <ul className="p-5 space-y-3">
            {[
              { text: 'Policy reminder: Upload signed handbook by April 30.', level: 'info' },
              { text: 'Payroll cutoff approaching in 2 days.', level: 'warning' },
              { text: 'New version deployed. See what’s new.', level: 'info' },
            ].map((n, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className={`mt-1 h-2 w-2 rounded-full ${n.level === 'warning' ? 'bg-[#f59e0b]' : 'bg-[#3b82f6]'}`} />
                <p className="text-[14px]">{n.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}


