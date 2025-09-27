"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, getDocs, onSnapshot, query, where } from "firebase/firestore";
import { Card, CardContent } from "@/components/ui/card";

import { 
  UserCheck, 
  Users,
  Calendar, 
} from "lucide-react";

type PendingItem = { id: string; userId: string; name: string; type: string; fromDate: string; toDate: string; createdAt?: string };


export default function AdminDashboardPage() {
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [leaveToday, setLeaveToday] = useState<Array<{ userId: string; type: string; fromDate: string; toDate: string }>>([]);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [totalEmployees, setTotalEmployees] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) return;
      const cg = collectionGroup(db, "users");
      const q = query(cg, where("uid", "==", user.uid));
      const snap = await getDocs(q);
      const parentOrg = snap.empty ? null : snap.docs[0].ref.parent.parent;
      const foundOrgId = parentOrg ? parentOrg.id : null;
      if (!foundOrgId) return;

      // Employee total count
      const empCol = collection(db, "organizations", foundOrgId, "employees");
      const offEmp = onSnapshot(empCol, (s) => {
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
      return () => { offEmp(); offLeaves(); offApproved(); };
    });
    return () => unsub();
  }, []);


  // Calculate metrics
  const totalPresent = totalEmployees - leaveToday.length;
  const totalAbsent = 15; // Mock data
  const totalOnLeave = leaveToday.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-8xl mx-auto px-6 py-8">
        {/* Header Section */}
        {/* <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
          </div>
        </div> */}

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Employee Card */}
          <Card className="rounded-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-none flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Total Employee</p>
                    <p className="text-2xl font-bold">{totalEmployees}</p>
                    <p className="text-xs text-muted-foreground">registered</p>
                  </div>
                </div>
                <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-none text-sm">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  +12%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Active Today Card */}
          <Card className="rounded-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-green-100 rounded-none flex items-center justify-center">
                    <UserCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Active Today</p>
                    <p className="text-2xl font-bold">{totalPresent}</p>
                    <p className="text-xs text-muted-foreground">present today</p>
                  </div>
                </div>
                <div className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded-none text-sm">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  85%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total On Leave Today Card */}
          <Card className="rounded-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-orange-100 rounded-none flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">On Leave Today</p>
                    <p className="text-2xl font-bold">{totalOnLeave}</p>
                    <p className="text-xs text-muted-foreground">employees</p>
                  </div>
                </div>
                <div className="flex items-center bg-orange-100 text-orange-800 px-2 py-1 rounded-none text-sm">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  5%
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next Pay Day Card */}
          <Card className="rounded-none">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-none flex items-center justify-center">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Next Pay Day</p>
                    <p className="text-2xl font-bold">15</p>
                    <p className="text-xs text-muted-foreground">Dec 2024</p>
                  </div>
                </div>
                <div className="flex items-center bg-purple-100 text-purple-800 px-2 py-1 rounded-none text-sm">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                  3 days
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 3-Column Layout */}
        
      </div>
    </div>
  );
}