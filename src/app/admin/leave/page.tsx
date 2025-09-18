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
      {/* <h1 className="text-[22px] font-semibold">Leave Requests</h1>
      <p className="mt-2 text-[14px] text-[#6b7280]">Review and approve employee leave.</p> */}

      {/* Calendar view */}
      <CalendarView rows={rows} empById={empById} />

      <div className="mt-6 overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white shadow-sm">
        <table className="hidden md:table w-full text-left">
          <thead className="bg-[#f9fafb] text-[12px] text-[#6b7280] font-medium">
            <tr>
              <th className="px-4 py-3 border-b border-[#e5e7eb]">Employee</th>
              <th className="px-4 py-3 border-b border-[#e5e7eb]">Type</th>
              <th className="px-4 py-3 border-b border-[#e5e7eb]">From</th>
              <th className="px-4 py-3 border-b border-[#e5e7eb]">To</th>
              <th className="px-4 py-3 border-b border-[#e5e7eb]">Reason</th>
              <th className="px-4 py-3 border-b border-[#e5e7eb]">Status</th>
              <th className="px-4 py-3 border-b border-[#e5e7eb]">Created</th>
              <th className="px-4 py-3 border-b border-[#e5e7eb]">Actions</th>
            </tr>
          </thead>
          <tbody className="text-[14px] divide-y divide-[#e5e7eb]">
            {loading ? (
              <tr>
                <td className="px-4 py-6 text-center text-[#6b7280]" colSpan={8}>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
                    Loading…
                  </div>
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td className="px-4 py-6 text-center text-[#6b7280]" colSpan={8}>
                  No leave requests.
                </td>
              </tr>
            ) : rows.map((r) => (
              <tr key={r.id} className="hover:bg-[#f9fafb] transition-colors">
                <td className="px-4 py-3 align-middle font-medium">{empById[r.userId] || r.userId}</td>
                <td className="px-4 py-3 align-middle">{r.type}</td>
                <td className="px-4 py-3 align-middle">{r.fromDate}</td>
                <td className="px-4 py-3 align-middle">{r.toDate}</td>
                <td className="px-4 py-3 align-middle max-w-xs truncate" title={r.reason || ""}>{r.reason || ""}</td>
                <td className="px-4 py-3 align-middle">
                  <span className={`text-[12px] px-2 py-1 rounded-full border font-medium ${r.status === 'approved' ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]' : r.status === 'rejected' ? 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]' : 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]'}`}>{r.status}</span>
                </td>
                <td className="px-4 py-3 align-middle text-[#6b7280]">{r.createdAt || ""}</td>
                <td className="px-4 py-3 align-middle">
                  <div className="flex items-center gap-2">
                    <button 
                      className="rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] hover:bg-[#f0fdf4] hover:border-[#22c55e] hover:text-[#15803d] transition-colors" 
                      onClick={() => setStatus(r.id, 'approved')}
                    >
                      Approve
                    </button>
                    <button 
                      className="rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] hover:bg-[#fef2f2] hover:border-[#ef4444] hover:text-[#dc2626] transition-colors" 
                      onClick={() => setStatus(r.id, 'rejected')}
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {/* Mobile */}
        <div className="md:hidden divide-y divide-[#e5e7eb]">
          {loading ? (
            <div className="p-6 text-center text-[#6b7280]">
              <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-[#f97316] border-t-transparent rounded-full animate-spin"></div>
                Loading…
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="p-6 text-center text-[#6b7280]">
              No leave requests.
            </div>
          ) : rows.map((r) => (
            <div key={r.id} className="p-4 bg-white hover:bg-[#f9fafb] transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <div className="font-medium text-[14px] text-[#1a1a1a]">{empById[r.userId] || r.userId}</div>
                  <div className="text-[13px] text-[#6b7280] mt-1">{r.type} • {r.fromDate} → {r.toDate}</div>
                  {r.reason && (
                    <div className="text-[12px] text-[#6b7280] mt-1 line-clamp-2">{r.reason}</div>
                  )}
                </div>
                <span className={`text-[12px] px-2 py-1 rounded-full border font-medium ${r.status === 'approved' ? 'bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]' : r.status === 'rejected' ? 'bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]' : 'bg-[#fffbeb] text-[#b45309] border-[#fde68a]'}`}>{r.status}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[11px] text-[#6b7280]">{r.createdAt || ""}</div>
                <div className="flex items-center gap-2">
                  <button 
                    className="rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] hover:bg-[#f0fdf4] hover:border-[#22c55e] hover:text-[#15803d] transition-colors" 
                    onClick={() => setStatus(r.id, 'approved')}
                  >
                    Approve
                  </button>
                  <button 
                    className="rounded-md border border-[#d1d5db] px-3 py-1 text-[12px] hover:bg-[#fef2f2] hover:border-[#ef4444] hover:text-[#dc2626] transition-colors" 
                    onClick={() => setStatus(r.id, 'rejected')}
                  >
                    Reject
                  </button>
                </div>
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
  const [showFullCalendar, setShowFullCalendar] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);


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
        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setShowFullCalendar(true)}
            className="flex items-center gap-2 rounded-md border border-[#d1d5db] px-3 py-1.5 text-[14px] hover:bg-[#f9fafb] transition-colors"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
            View Full Calendar
          </button>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-[#d1d5db] px-3 py-1.5 text-[14px]"
          />
        </div>
      </div>
      {isExpanded ? (
        <div className="p-4 overflow-x-auto">
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="p-3 text-center text-[12px] font-semibold text-[#6b7280] bg-[#f9fafb] border border-[#e5e7eb]">
                {day}
              </div>
            ))}
            
            {/* Calendar Days - Expanded View */}
            {(() => {
              const [y, m] = month.split('-').map((n) => parseInt(n, 10));
              const firstDay = new Date(y, m - 1, 1);
              const startDate = new Date(firstDay);
              startDate.setDate(startDate.getDate() - firstDay.getDay());
              
              const days = [];
              for (let i = 0; i < 42; i++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + i);
                const iso = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                const isCurrentMonth = currentDate.getMonth() === m - 1;
                const isToday = currentDate.toDateString() === new Date().toDateString();
                const list = byDay[iso] || [];
                
                days.push(
                  <div 
                    key={iso} 
                    className={`min-h-[120px] border border-[#e5e7eb] p-2 ${isCurrentMonth ? 'bg-white' : 'bg-[#f9fafb]'} ${isToday ? 'ring-2 ring-[#f97316]' : ''}`}
                  >
                    <div className={`text-[12px] font-medium mb-2 ${isCurrentMonth ? 'text-[#374151]' : 'text-[#9ca3af]'} ${isToday ? 'text-[#f97316]' : ''}`}>
                      {currentDate.getDate()}
                    </div>
                    <div className="space-y-1">
                      {list.map((p, idx) => (
                        <div 
                          key={idx} 
                          className={`text-[10px] px-2 py-1 rounded cursor-pointer hover:opacity-80 ${p.status === 'approved' ? 'bg-[#ecfdf5] text-[#065f46]' : p.status === 'rejected' ? 'bg-[#fef2f2] text-[#991b1b]' : 'bg-[#fffbeb] text-[#92400e]'}`}
                          title={`${p.name} - ${p.type} (${p.status})`}
                        >
                          {p.name} • {p.type}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return days;
            })()}
          </div>
          <div className="mt-4 text-center">
            <button
              onClick={() => setIsExpanded(false)}
              className="text-[#6b7280] text-[14px] hover:underline"
            >
              ← Back to compact view
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4">
          {rows.length === 0 ? (
            <div className="text-center py-8 text-[#6b7280]">
              <div className="text-[14px]">No leave requests found for {new Date(month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
              <div className="text-[12px] mt-1">Leave requests will appear here when employees submit them.</div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-1">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-2 text-center text-[12px] font-semibold text-[#6b7280] bg-[#f9fafb] border border-[#e5e7eb]">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days - Compact View */}
                {(() => {
                  const [y, m] = month.split('-').map((n) => parseInt(n, 10));
                  const firstDay = new Date(y, m - 1, 1);
                  const startDate = new Date(firstDay);
                  startDate.setDate(startDate.getDate() - firstDay.getDay());
                  
                  const days = [];
                  for (let i = 0; i < 35; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + i);
                    const iso = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                    const isCurrentMonth = currentDate.getMonth() === m - 1;
                    const isToday = currentDate.toDateString() === new Date().toDateString();
                    const list = byDay[iso] || [];
                    
                    days.push(
                      <div 
                        key={iso} 
                        className={`min-h-[60px] border border-[#e5e7eb] p-1 ${isCurrentMonth ? 'bg-white' : 'bg-[#f9fafb]'} ${isToday ? 'ring-2 ring-[#f97316]' : ''}`}
                      >
                        <div className={`text-[12px] font-medium mb-1 ${isCurrentMonth ? 'text-[#374151]' : 'text-[#9ca3af]'} ${isToday ? 'text-[#f97316]' : ''}`}>
                          {currentDate.getDate()}
                        </div>
                        <div className="space-y-0.5">
                          {list.slice(0, 2).map((p, idx) => (
                            <div 
                              key={idx} 
                              className={`text-[9px] px-1 py-0.5 rounded ${p.status === 'approved' ? 'bg-[#ecfdf5] text-[#065f46]' : p.status === 'rejected' ? 'bg-[#fef2f2] text-[#991b1b]' : 'bg-[#fffbeb] text-[#92400e]'}`}
                              title={`${p.name} - ${p.type} (${p.status})`}
                            >
                              {p.name.split(' ')[0]}
                            </div>
                          ))}
                          {list.length > 2 && (
                            <div className="text-[9px] text-[#6b7280]">+{list.length - 2}</div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return days;
                })()}
              </div>
              <div className="mt-3 text-center">
                <button
                  onClick={() => setIsExpanded(true)}
                  className="text-[#f97316] text-[14px] hover:underline"
                >
                  Show detailed calendar view
                </button>
              </div>
            </>
          )}
        </div>
      )}
      
      {/* Full Page Calendar Modal */}
      {showFullCalendar && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-[#e5e7eb] flex items-center justify-between">
              <h2 className="text-[20px] font-semibold">Leave Calendar - Full View</h2>
              <div className="flex items-center gap-4">
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]"
                />
                <button
                  onClick={() => setShowFullCalendar(false)}
                  className="flex items-center gap-2 rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] hover:bg-[#f9fafb] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Close
                </button>
              </div>
            </div>
            
            {/* Full Calendar Content */}
            <div className="p-6 overflow-auto max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-7 gap-1">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center text-[12px] font-semibold text-[#6b7280] bg-[#f9fafb] border border-[#e5e7eb]">
                    {day}
                  </div>
                ))}
                
                {/* Calendar Days */}
                {(() => {
                  const [y, m] = month.split('-').map((n) => parseInt(n, 10));
                  const firstDay = new Date(y, m - 1, 1);
                  const startDate = new Date(firstDay);
                  startDate.setDate(startDate.getDate() - firstDay.getDay());
                  
                  const days = [];
                  for (let i = 0; i < 42; i++) {
                    const currentDate = new Date(startDate);
                    currentDate.setDate(startDate.getDate() + i);
                    const iso = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                    const isCurrentMonth = currentDate.getMonth() === m - 1;
                    const isToday = currentDate.toDateString() === new Date().toDateString();
                    const list = byDay[iso] || [];
                    
                    days.push(
                      <div 
                        key={iso} 
                        className={`min-h-[120px] border border-[#e5e7eb] p-2 ${isCurrentMonth ? 'bg-white' : 'bg-[#f9fafb]'} ${isToday ? 'ring-2 ring-[#f97316]' : ''}`}
                      >
                        <div className={`text-[12px] font-medium mb-2 ${isCurrentMonth ? 'text-[#374151]' : 'text-[#9ca3af]'} ${isToday ? 'text-[#f97316]' : ''}`}>
                          {currentDate.getDate()}
                        </div>
                        <div className="space-y-1">
                          {list.map((p, idx) => (
                            <div 
                              key={idx} 
                              className={`text-[10px] px-2 py-1 rounded cursor-pointer hover:opacity-80 ${p.status === 'approved' ? 'bg-[#ecfdf5] text-[#065f46]' : p.status === 'rejected' ? 'bg-[#fef2f2] text-[#991b1b]' : 'bg-[#fffbeb] text-[#92400e]'}`}
                              title={`${p.name} - ${p.type} (${p.status})`}
                            >
                              {p.name} • {p.type}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  }
                  return days;
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}


