"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, doc, getDocs, onSnapshot, query, updateDoc, where, orderBy, limit } from "firebase/firestore";

type PendingItem = { id: string; userId: string; name: string; type: string; fromDate: string; toDate: string; createdAt?: string };

type TodoItem = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date;
};

export default function AdminDashboardPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [empById, setEmpById] = useState<Record<string, string>>({});
  const [activities, setActivities] = useState<Array<{ what: string; whoId: string; when: string }>>([]);
  const [leaveToday, setLeaveToday] = useState<Array<{ userId: string; type: string; fromDate: string; toDate: string }>>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [showAddTodo, setShowAddTodo] = useState(false);

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

      // Employee names map and total count
      const empCol = collection(db, "organizations", foundOrgId, "employees");
      const offEmp = onSnapshot(empCol, (s) => {
        const map: Record<string, string> = {};
        s.forEach((d) => { const data = d.data() as Record<string, unknown>; map[d.id] = (data["name"] as string) || d.id; });
        setEmpById(map);
        setTotalEmployees(s.size);
      });

      // Get current user info
      const userCol = collection(db, "organizations", foundOrgId, "users");
      const userQuery = query(userCol, where("uid", "==", user.uid));
      const userSnap = await getDocs(userQuery);
      if (!userSnap.empty) {
        const userData = userSnap.docs[0].data() as Record<string, unknown>;
        setCurrentUser({
          name: (userData["name"] as string) || user.displayName || "Admin",
          email: user.email || ""
        });
      }

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

  // Todo functions
  function addTodo() {
    if (!newTodoText.trim()) return;
    
    const newTodo: TodoItem = {
      id: Date.now().toString(),
      text: newTodoText.trim(),
      completed: false,
      createdAt: new Date()
    };
    
    setTodos(prev => [newTodo, ...prev]);
    setNewTodoText('');
    setShowAddTodo(false);
  }

  function toggleTodo(id: string) {
    setTodos(prev => prev.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  }

  function deleteTodo(id: string) {
    setTodos(prev => prev.filter(todo => todo.id !== id));
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      addTodo();
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#f97316] rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                </span>
              </div>
              <div>
                <h1 className="text-[24px] font-semibold">
                  Welcome Back, {currentUser?.name || 'Admin'}
                </h1>
                <p className="text-[14px] text-[#6b7280] mt-1">
                  You have <span className="text-[#f97316] font-semibold">{pending.length}</span> Pending Approvals & <span className="text-[#f97316] font-semibold">{leaveToday.length}</span> Employees on Leave Today
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 bg-[#14b8a6] text-white px-4 py-2 rounded-lg hover:bg-[#0f766e] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Project
              </button>
              <button className="flex items-center gap-2 bg-[#f97316] text-white px-4 py-2 rounded-lg hover:bg-[#ea580c] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Requests
              </button>
              <button className="p-2 text-[#6b7280] hover:text-[#374151] hover:bg-[#f9fafb] rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Side - KPI Cards */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Total Employees */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-[#f97316] rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                  </div>
                </div>
                <h3 className="text-[14px] font-medium text-[#6b7280] mb-2">Total Employees</h3>
                <p className="text-[24px] font-bold mb-2">{totalEmployees}</p>
                <Link href="/admin/employees" className="text-[12px] text-[#f97316] hover:underline">View All</Link>
                </div>

              {/* Pending Leave Requests */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-[#14b8a6] rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                </div>
                <h3 className="text-[14px] font-medium text-[#6b7280] mb-2">Pending Leave Requests</h3>
                <p className="text-[24px] font-bold mb-2">{pending.length}</p>
                <Link href="/admin/leave" className="text-[12px] text-[#f97316] hover:underline">View All</Link>
                </div>

              {/* Employees on Leave Today */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-[#3b82f6] rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                  </div>
                </div>
                <h3 className="text-[14px] font-medium text-[#6b7280] mb-2">Employees on Leave Today</h3>
                <p className="text-[24px] font-bold mb-2">{leaveToday.length}</p>
                <Link href="/admin/leave" className="text-[12px] text-[#f97316] hover:underline">View All</Link>
                </div>

              {/* Recent Activities */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 bg-[#ec4899] rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                  </div>
                </div>
                <h3 className="text-[14px] font-medium text-[#6b7280] mb-2">Recent Activities</h3>
                <p className="text-[24px] font-bold mb-2">{activities.length}</p>
                <span className="text-[12px] text-[#6b7280]">Leave requests this week</span>
              </div>
            </div>
          </div>

          {/* Right Side - Two Cards */}
          <div className="space-y-6">
            {/* Employee Status Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[18px] font-semibold">Employee Status</h2>
                <button className="px-3 py-1 bg-[#f97316] text-white text-[12px] rounded-md hover:bg-[#ea580c] transition-colors">
                  This Week
                </button>
              </div>
              
              {/* Total Employee */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[14px] text-[#6b7280]">Total Employee</span>
                  <span className="text-[24px] font-bold">{totalEmployees}</span>
                </div>
                <div className="w-full bg-[#f3f4f6] rounded-full h-3">
                  <div className="bg-[#f97316] h-3 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>

              {/* Employee Status Summary */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-[#f97316] rounded"></div>
                  <div>
                    <p className="text-[12px] text-[#6b7280]">Active</p>
                    <p className="text-[18px] font-bold">{totalEmployees}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 bg-[#14b8a6] rounded"></div>
                  <div>
                    <p className="text-[12px] text-[#6b7280]">On Leave</p>
                    <p className="text-[18px] font-bold">{leaveToday.length}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="mb-4">
                <h3 className="text-[14px] font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <Link href="/admin/employees/invite" className="block w-full bg-[#f97316] text-white py-2 px-4 rounded-lg hover:bg-[#ea580c] transition-colors text-[14px] font-medium text-center">
                    Invite New Employee
                  </Link>
                  <Link href="/admin/leave" className="block w-full bg-[#14b8a6] text-white py-2 px-4 rounded-lg hover:bg-[#0f766e] transition-colors text-[14px] font-medium text-center">
                    Manage Leave Requests
                  </Link>
                </div>
              </div>

              <Link href="/admin/employees" className="block w-full bg-[#f97316] text-white py-2 rounded-lg hover:bg-[#ea580c] transition-colors text-[14px] font-medium text-center">
                View All Employees
              </Link>
            </div>
          </div>
        </div>

        {/* Second Row - Todo and System Status */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Todo Section */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-semibold">Todo</h2>
              <div className="flex items-center gap-3">
                <button className="flex items-center gap-2 px-3 py-1 bg-[#f3f4f6] text-[#6b7280] rounded-lg hover:bg-[#e5e7eb] transition-colors text-[12px]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Today
                </button>
                <button 
                  onClick={() => setShowAddTodo(true)}
                  className="w-8 h-8 bg-[#f97316] rounded-full flex items-center justify-center hover:bg-[#ea580c] transition-colors"
                >
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Add Todo Input */}
            {showAddTodo && (
              <div className="mb-4 p-3 bg-[#f9fafb] rounded-lg border border-[#e5e7eb]">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Add a new task..."
                    className="flex-1 px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                    autoFocus
                  />
                  <button
                    onClick={addTodo}
                    className="px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors text-[14px] font-medium"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setShowAddTodo(false);
                      setNewTodoText('');
                    }}
                    className="px-3 py-2 text-[#6b7280] hover:text-[#374151] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
            
            {/* Todo List */}
            <div className="space-y-2">
              {todos.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <p className="text-[14px] text-[#6b7280]">No tasks yet</p>
                  <p className="text-[12px] text-[#6b7280] mt-1">Add your first task to get started</p>
                </div>
              ) : (
                todos.map((todo) => (
                  <div key={todo.id} className="flex items-center gap-3 p-3 bg-[#f9fafb] rounded-lg border border-[#e5e7eb] hover:bg-[#f3f4f6] transition-colors">
                    {/* Drag Handle */}
                    <div className="cursor-move text-[#9ca3af] hover:text-[#6b7280]">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M3 15h2v2H3v-2zm0-4h2v2H3v-2zm0-4h2v2H3V7zm4 8h2v2H7v-2zm0-4h2v2H7v-2zm0-4h2v2H7V7zm4 8h2v2h-2v-2zm0-4h2v2h-2v-2zm0-4h2v2h-2V7z"/>
                      </svg>
                    </div>
                    
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTodo(todo.id)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        todo.completed 
                          ? 'bg-[#10b981] border-[#10b981] text-white' 
                          : 'border-[#d1d5db] hover:border-[#9ca3af]'
                      }`}
                    >
                      {todo.completed && (
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    
                    {/* Todo Text */}
                    <span className={`flex-1 text-[14px] ${todo.completed ? 'line-through text-[#9ca3af]' : 'text-[#374151]'}`}>
                      {todo.text}
                    </span>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="p-1 text-[#9ca3af] hover:text-[#ef4444] transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
            
            {/* Todo Stats */}
            {todos.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#e5e7eb] flex items-center justify-between text-[12px] text-[#6b7280]">
                <span>{todos.filter(t => !t.completed).length} remaining</span>
                <span>{todos.filter(t => t.completed).length} completed</span>
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-semibold">System Status</h2>
              <span className="px-3 py-1 bg-[#10b981] text-white text-[12px] rounded-md">
                Online
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#6b7280]">Database Connection</span>
                <span className="text-[14px] text-[#10b981] font-medium">✓ Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#6b7280]">Authentication</span>
                <span className="text-[14px] text-[#10b981] font-medium">✓ Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#6b7280]">File Storage</span>
                <span className="text-[14px] text-[#10b981] font-medium">✓ Available</span>
              </div>
                </div>
            <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
              <Link href="/admin/settings" className="block w-full bg-[#6b7280] text-white py-2 px-4 rounded-lg hover:bg-[#4b5563] transition-colors text-[14px] font-medium text-center">
                System Settings
              </Link>
                </div>
                </div>
              </div>

        {/* Three Column Section */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-semibold">Quick Actions</h2>
                </div>
            <div className="space-y-3">
              <Link href="/admin/employees/invite" className="block w-full bg-[#f97316] text-white py-3 px-4 rounded-lg hover:bg-[#ea580c] transition-colors text-[14px] font-medium text-center">
                Invite New Employee
              </Link>
              <Link href="/admin/leave" className="block w-full bg-[#14b8a6] text-white py-3 px-4 rounded-lg hover:bg-[#0f766e] transition-colors text-[14px] font-medium text-center">
                Manage Leave Requests
              </Link>
              <Link href="/admin/roles" className="block w-full bg-[#3b82f6] text-white py-3 px-4 rounded-lg hover:bg-[#2563eb] transition-colors text-[14px] font-medium text-center">
                Manage Roles & Permissions
              </Link>
              <Link href="/admin/organization/departments" className="block w-full bg-[#8b5cf6] text-white py-3 px-4 rounded-lg hover:bg-[#7c3aed] transition-colors text-[14px] font-medium text-center">
                Manage Departments
              </Link>
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-semibold">Pending Approvals</h2>
              <span className="text-[12px] text-[#6b7280]">{pending.length} pending</span>
            </div>
            <div className="space-y-3">
              {pending.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-[#6b7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-[14px] text-[#6b7280]">No pending approvals</p>
                  <p className="text-[12px] text-[#6b7280] mt-1">Leave requests will appear here for approval</p>
                </div>
              ) : (
                pending.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-start justify-between gap-3 p-3 bg-[#f9fafb] rounded-lg">
                <div className="flex-1">
                  <p className="text-[14px] font-medium">Leave request – {empById[p.userId] || p.userId}</p>
                  <p className="text-[12px] text-[#6b7280]">{p.type} • {p.fromDate} → {p.toDate}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="rounded-md bg-[#10b981] text-white px-2 py-1 text-[10px] hover:bg-[#059669]" onClick={() => setStatus(p.id, 'approved')}>✓</button>
                  <button className="rounded-md bg-[#ef4444] text-white px-2 py-1 text-[10px] hover:bg-[#dc2626]" onClick={() => setStatus(p.id, 'rejected')}>✗</button>
                </div>
              </div>
                ))
              )}
          </div>
            {pending.length > 4 && (
              <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
                <Link href="/admin/leave" className="block text-center text-[12px] text-[#f97316] hover:underline">
              View All ({pending.length})
            </Link>
              </div>
            )}
          </div>

          {/* System Information */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[18px] font-semibold">System Information</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#6b7280]">Organization ID</span>
                <span className="text-[12px] text-[#374151] font-mono bg-[#f3f4f6] px-2 py-1 rounded">
                  {orgId ? orgId.substring(0, 8) + '...' : 'Not loaded'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#6b7280]">Total Employees</span>
                <span className="text-[14px] font-semibold">{totalEmployees}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#6b7280]">Pending Requests</span>
                <span className="text-[14px] font-semibold">{pending.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[14px] text-[#6b7280]">On Leave Today</span>
                <span className="text-[14px] font-semibold">{leaveToday.length}</span>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t border-[#e5e7eb]">
              <Link href="/admin/settings" className="block w-full bg-[#6b7280] text-white py-2 px-4 rounded-lg hover:bg-[#4b5563] transition-colors text-[14px] font-medium text-center">
                System Settings
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}


