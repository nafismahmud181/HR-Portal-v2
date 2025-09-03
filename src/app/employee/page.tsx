"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collectionGroup, getDocs, query, where } from "firebase/firestore";

export default function EmployeeDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("You must be signed in.");
        setLoading(false);
        return;
      }
      try {
        // Find membership doc(s) via collection group query
        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (snap.empty) {
          setError("No organization membership found.");
          setLoading(false);
          return;
        }
        const docRef = snap.docs[0].ref;
        const parentOrg = docRef.parent.parent; // organizations/{orgId}
        setOrgId(parentOrg ? parentOrg.id : null);
        const data = snap.docs[0].data() as { role?: string };
        setRole(data.role ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load membership");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-16 bg-[#ffffff] text-[#1a1a1a]">
        <div className="max-w-[1200px] mx-auto">
          <p className="text-[14px] text-[#6b7280]">Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-6 py-16 bg-[#ffffff] text-[#1a1a1a]">
        <div className="max-w-[1200px] mx-auto">
          <h1 className="text-[20px] font-semibold">Access restricted</h1>
          <p className="mt-2 text-[14px] text-[#ef4444]">{error}</p>
        </div>
      </div>
    );
  }

  if (role !== "employee") {
    return (
      <div className="min-h-screen px-6 py-16 bg-[#ffffff] text-[#1a1a1a]">
        <div className="max-w-[1200px] mx-auto">
          <h1 className="text-[20px] font-semibold">Access restricted</h1>
          <p className="mt-2 text-[14px] text-[#6b7280]">This page is only available to employees.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-16 bg-[#ffffff] text-[#1a1a1a]">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-[24px] font-semibold">Employee Dashboard</h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">Welcome back{orgId ? ` • Org ${orgId}` : ""}.</p>

        {/* Personal Quick Stats */}
        <section aria-label="Personal Quick Stats" className="mt-8">
          <h2 className="text-[18px] font-semibold">Your Stats</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Attendance', value: '98%' },
              { label: 'Leaves Remaining', value: '12' },
              { label: 'Tasks Due', value: '3' },
              { label: 'Training Progress', value: '67%' },
            ].map((k) => (
              <div key={k.label} className="rounded-lg border border-[#e5e7eb] p-5 bg-white">
                <p className="text-[12px] text-[#6b7280]">{k.label}</p>
                <p className="mt-2 text-[22px] font-semibold">{k.value}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <section aria-label="Recent Activities" className="lg:col-span-2 rounded-lg border border-[#e5e7eb] bg-white">
            <div className="p-5 border-b border-[#e5e7eb]"><h2 className="text-[18px] font-semibold">Recent Activities</h2></div>
            <ul className="divide-y divide-[#e5e7eb]">
              {[
                { what: 'Submitted leave request', when: 'Today, 9:10 AM' },
                { what: 'Completed safety training', when: 'Yesterday' },
                { what: 'Received performance feedback', when: '2 days ago' },
              ].map((a, idx) => (
                <li key={idx} className="p-5 flex items-center justify-between">
                  <p className="text-[14px]">{a.what}</p>
                  <span className="text-[12px] text-[#6b7280]">{a.when}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Upcoming Events */}
          <section aria-label="Upcoming Events" className="rounded-lg border border-[#e5e7eb] bg-white">
            <div className="p-5 border-b border[#e5e7eb]"><h2 className="text-[18px] font-semibold">Upcoming Events</h2></div>
            <ul className="p-5 space-y-3">
              {[
                { title: 'Team Meeting', meta: 'Mon 10:00 AM' },
                { title: 'Compliance Training', meta: 'Thu 2:00 PM' },
                { title: 'Quarterly All-Hands', meta: 'May 5, 4:00 PM' },
              ].map((e, idx) => (
                <li key={idx} className="flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium">{e.title}</p>
                    <p className="text-[12px] text-[#6b7280]">{e.meta}</p>
                  </div>
                  <button className="rounded-md border border-[#d1d5db] px-3 py-1.5 text-[12px] hover:bg-[#f9fafb]">View</button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Notifications */}
        <section aria-label="Notifications" className="mt-10 rounded-lg border border-[#e5e7eb] bg-white">
          <div className="p-5 border-b border[#e5e7eb]"><h2 className="text-[18px] font-semibold">Notifications</h2></div>
          <ul className="p-5 space-y-3">
            {[
              { text: 'New payslip available for March', level: 'info' },
              { text: 'Your leave request is pending approval', level: 'warning' },
              { text: 'Performance review scheduled next week', level: 'info' },
            ].map((n, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className={`mt-1 h-2 w-2 rounded-full ${n.level === 'warning' ? 'bg-[#f59e0b]' : 'bg-[#3b82f6]'}`} />
                <p className="text-[14px]">{n.text}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Quick Actions */}
        <section aria-label="Quick Actions" className="mt-10">
          <h2 className="text-[18px] font-semibold">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              'Request Leave',
              'Clock In/Out',
              'View Payslip',
              'Start Training',
            ].map((label) => (
              <button key={label} className="text-left rounded-lg border border-[#e5e7eb] p-4 hover:shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                  <span className="text-[14px] font-medium">{label}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}


