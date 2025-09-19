"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collectionGroup, getDocs, query, where, doc, getDoc, collection, onSnapshot } from "firebase/firestore";
import Link from "next/link";

interface LeaveRequest {
  id: string;
  type: string;
  fromDate: string;
  toDate: string;
  reason: string;
  status: string;
  createdAt: string;
  userId: string;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: unknown;
}

interface EmployeeData {
  name: string;
  email: string;
  department: string;
  jobTitle: string;
  status: string;
}

export default function EmployeeDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [dataLoading, setDataLoading] = useState({
    leaveRequests: true,
    notifications: true
  });

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
        const orgIdFromRef = parentOrg ? parentOrg.id : null;
        setOrgId(orgIdFromRef);
        setUserId(user.uid);
        const data = snap.docs[0].data() as { role?: string; name?: string };
        setRole(data.role ?? null);
        
        // Try to get the employee data from the employees collection
        let employeeName = data.name || user.displayName || "Employee";
        let empData: EmployeeData | null = null;
        if (orgIdFromRef && user.uid) {
          try {
            const empRef = doc(db, "organizations", orgIdFromRef, "employees", user.uid);
            const empSnap = await getDoc(empRef);
            if (empSnap.exists()) {
              const employeeDoc = empSnap.data() as Record<string, unknown>;
              empData = {
                name: (employeeDoc.name as string) || user.displayName || "Employee",
                email: (employeeDoc.email as string) || user.email || "",
                department: (employeeDoc.department as string) || "",
                jobTitle: (employeeDoc.jobTitle as string) || "",
                status: (employeeDoc.status as string) || "Active"
              };
              employeeName = empData.name;
            }
          } catch (empError) {
            console.warn("Could not fetch employee data:", empError);
          }
        }
        setEmployeeData(empData);
        setUserName(employeeName);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unable to load membership");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to leave requests
  useEffect(() => {
    if (!orgId || !userId) return;
    
    const col = collection(db, "organizations", orgId, "leaveRequests");
    const q = query(col);
    const unsubscribe = onSnapshot(q, 
      (snap) => {
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
            createdAt: typeof ts?.toDate === "function" ? ts!.toDate()!.toLocaleString() : "",
            userId: (data["userId"] as string) || "",
          };
        }).filter((r) => r.userId === userId)
          .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        setLeaveRequests(list);
        setDataLoading(prev => ({ ...prev, leaveRequests: false }));
      },
      (error) => {
        console.warn("Could not fetch leave requests:", error);
        setLeaveRequests([]); // Set empty array on error
        setDataLoading(prev => ({ ...prev, leaveRequests: false }));
      }
    );
    
    return () => unsubscribe();
  }, [orgId, userId]);

  // Subscribe to notifications
  useEffect(() => {
    if (!orgId || !userId) return;
    
    const col = collection(db, "organizations", orgId, "notifications");
    const q = query(col, where("employeeId", "==", userId));
    const unsubscribe = onSnapshot(q, 
      (snap) => {
        const list = snap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            title: (data.title as string) || "",
            message: (data.message as string) || "",
            type: (data.type as string) || "info",
            read: (data.read as boolean) || false,
            createdAt: data.createdAt
          };
        }).filter((n) => n.title || n.message)
          .sort((a, b) => {
            const aTime = (a.createdAt as { toDate?: () => Date })?.toDate ? 
              (a.createdAt as { toDate: () => Date }).toDate().getTime() : 0;
            const bTime = (b.createdAt as { toDate?: () => Date })?.toDate ? 
              (b.createdAt as { toDate: () => Date }).toDate().getTime() : 0;
            return bTime - aTime;
          });
        setNotifications(list.slice(0, 5)); // Show only latest 5
        setDataLoading(prev => ({ ...prev, notifications: false }));
      },
      (error) => {
        console.warn("Could not fetch notifications:", error);
        setNotifications([]); // Set empty array on error
        setDataLoading(prev => ({ ...prev, notifications: false }));
      }
    );
    
    return () => unsubscribe();
  }, [orgId, userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (role !== "employee") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-gray-600">This page is only available to employees.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {userName}! 👋
              </h1>
              <p className="mt-2 text-gray-600">
                Here&apos;s what&apos;s happening with your work today
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {(() => {
            const pendingLeaves = leaveRequests.filter(r => r.status === 'pending').length;
            const approvedLeaves = leaveRequests.filter(r => r.status === 'approved').length;
            const totalLeaves = leaveRequests.length;
            const newNotifications = notifications.filter(n => !n.read).length;
            
            return [
              { 
                label: 'Leave Requests', 
                value: totalLeaves.toString(), 
                change: totalLeaves > 0 ? `${pendingLeaves} pending` : 'No requests yet', 
                icon: '🏖️',
                color: 'blue',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200'
              },
              { 
                label: 'Approved Leaves', 
                value: approvedLeaves.toString(), 
                change: approvedLeaves > 0 ? 'This year' : 'None yet', 
                icon: '✅',
                color: 'green',
                bgColor: 'bg-green-50',
                borderColor: 'border-green-200'
              },
              { 
                label: 'Notifications', 
                value: notifications.length.toString(), 
                change: newNotifications > 0 ? `${newNotifications} unread` : 'All read', 
                icon: '🔔',
                color: 'orange',
                bgColor: 'bg-orange-50',
                borderColor: 'border-orange-200'
              },
              { 
                label: 'Employee Status', 
                value: employeeData?.status || 'Active', 
                change: employeeData?.department || 'Loading...', 
                icon: '👤',
                color: 'purple',
                bgColor: 'bg-purple-50',
                borderColor: 'border-purple-200'
              },
            ];
          })().map((metric, index) => (
            <div key={index} className={`${metric.bgColor} ${metric.borderColor} border rounded-xl p-6 hover:shadow-lg transition-all duration-200`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{metric.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{metric.change}</p>
                </div>
                <div className="text-3xl">{metric.icon}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Leave Requests */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Recent Leave Requests</h2>
                  <Link href="/employee/leave" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                    View all
                  </Link>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {dataLoading.leaveRequests ? (
                  <div className="px-6 py-8 text-center">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="mt-2 text-gray-500">Loading leave requests...</p>
                  </div>
                ) : leaveRequests.length === 0 ? (
                  <div className="px-6 py-8 text-center">
                    <p className="text-gray-500">No leave requests yet</p>
                    <Link href="/employee/leave" className="mt-2 inline-block text-blue-600 hover:text-blue-700 text-sm font-medium">
                      Submit your first request
                    </Link>
                  </div>
                ) : (
                  leaveRequests.slice(0, 5).map((request, index) => (
                    <div key={index} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <span className="text-2xl">🏖️</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {request.type} leave: {request.fromDate} to {request.toDate}
                          </p>
                          <p className="text-sm text-gray-500">{request.createdAt}</p>
                          {request.reason && (
                            <p className="text-xs text-gray-400 mt-1">{request.reason}</p>
                          )}
                        </div>
                        <div className="flex-shrink-0">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.status === 'approved' ? 'bg-green-100 text-green-800' :
                            request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {request.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Employee Info & Quick Actions */}
          <div className="space-y-6">
            {/* Employee Information */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Employee Information</h2>
              </div>
              <div className="p-6 space-y-4">
                {employeeData ? (
                  <>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Department</p>
                        <p className="text-xs text-gray-600">{employeeData.department || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Job Title</p>
                        <p className="text-xs text-gray-600">{employeeData.jobTitle || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-xs text-gray-600">{employeeData.email || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">Status</p>
                        <p className="text-xs text-gray-600">{employeeData.status || 'Active'}</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">Loading employee information...</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Request Leave', href: '/employee/leave', icon: '🏖️', color: 'bg-green-50 hover:bg-green-100 text-green-700' },
                    { label: 'Clock In/Out', href: '/employee/time', icon: '⏰', color: 'bg-blue-50 hover:bg-blue-100 text-blue-700' },
                    { label: 'View Payslip', href: '/employee/payroll', icon: '💰', color: 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700' },
                    { label: 'Start Training', href: '/employee/learning', icon: '🎓', color: 'bg-purple-50 hover:bg-purple-100 text-purple-700' },
                  ].map((action, index) => (
                    <Link
                      key={index}
                      href={action.href}
                      className={`${action.color} p-4 rounded-lg border border-transparent hover:shadow-md transition-all duration-200 text-center`}
                    >
                      <div className="text-2xl mb-2">{action.icon}</div>
                      <p className="text-sm font-medium">{action.label}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {notifications.filter(n => !n.read).length} new
                  </span>
                )}
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {dataLoading.notifications ? (
                  <div className="text-center py-8">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-blue-600 border-r-transparent"></div>
                    <p className="mt-2 text-gray-500">Loading notifications...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0">
                        <span className="text-2xl">
                          {notification.type === 'success' ? '✅' :
                           notification.type === 'warning' ? '⚠️' :
                           notification.type === 'error' ? '❌' : '📢'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                        <p className="text-sm text-gray-700">{notification.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(notification.createdAt as { toDate?: () => Date })?.toDate ? 
                            (notification.createdAt as { toDate: () => Date }).toDate().toLocaleString() : 
                            'Recently'
                          }
                        </p>
                      </div>
                      <div className="flex-shrink-0">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          notification.type === 'success' ? 'bg-green-100 text-green-800' :
                          notification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          notification.type === 'error' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {notification.type}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Employee Summary */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
            <div className="px-6 py-8">
              <div className="flex items-center justify-between">
                <div className="text-white">
                  <h2 className="text-2xl font-bold mb-2">Employee Summary</h2>
                  <p className="text-blue-100">Welcome to your HRMS dashboard!</p>
                </div>
                <div className="text-right text-white">
                  <div className="text-4xl font-bold">{employeeData?.status || 'Active'}</div>
                  <p className="text-blue-100">Status</p>
                </div>
              </div>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-white text-sm opacity-90">Total Leave Requests</div>
                  <div className="text-white text-2xl font-bold">{leaveRequests.length}</div>
                  <div className="text-white text-xs opacity-75 mt-1">
                    {leaveRequests.length === 0 ? 'Start by submitting your first request' : 'All your requests'}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-white text-sm opacity-90">Approved Leaves</div>
                  <div className="text-white text-2xl font-bold">{leaveRequests.filter(r => r.status === 'approved').length}</div>
                  <div className="text-white text-xs opacity-75 mt-1">
                    {leaveRequests.filter(r => r.status === 'approved').length === 0 ? 'None approved yet' : 'Successfully approved'}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <div className="text-white text-sm opacity-90">Pending Requests</div>
                  <div className="text-white text-2xl font-bold">{leaveRequests.filter(r => r.status === 'pending').length}</div>
                  <div className="text-white text-xs opacity-75 mt-1">
                    {leaveRequests.filter(r => r.status === 'pending').length === 0 ? 'No pending requests' : 'Awaiting approval'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


