"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, collectionGroup, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Bell } from "lucide-react";


export default function EmployeeDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("You must be signed in.");
        setLoading(false);
        return;
      }

      try {
        // Find user in organization using collection group query (same as layout)
        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid));
        const snap = await getDocs(q);
        
        if (snap.empty) {
          setError("Organization membership not found.");
          setLoading(false);
          return;
        }

        const userData = snap.docs[0].data() as { role?: string };
        const userRole = userData.role || "";
        
        if (userRole !== "employee") {
          setError("Access denied. Employee role required.");
          setLoading(false);
          return;
        }

        setRole(userRole);

        // Get organization ID from the user document reference
        const membershipRef = snap.docs[0].ref;
        const parentOrg = membershipRef.parent.parent; // organizations/{orgId}
        const orgId = parentOrg ? parentOrg.id : null;

        // Try to get the employee data from the employees collection
        let employeeName: string = user.displayName || "Employee";
        if (orgId && user.uid) {
          try {
            const empRef = doc(db, "organizations", orgId, "employees", user.uid);
            const empSnap = await getDoc(empRef);
            if (empSnap.exists()) {
              const employeeDoc = empSnap.data() as Record<string, unknown>;
              employeeName = (employeeDoc.name as string) || user.displayName || "Employee";
            }
          } catch (empError) {
            console.warn("Could not fetch employee data:", empError);
          }
        }
        setUserName(employeeName);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  // Function to get current date info
  const getCurrentDate = () => {
    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    return {
      day: days[now.getDay()],
      date: now.getDate(),
      month: months[now.getMonth()],
      year: now.getFullYear()
    };
  };

  const currentDate = getCurrentDate();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#4A90E2] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#5F6368]">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-[#FF6B6B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#FF6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-[24px] font-[600] text-[#202124] mb-2">Access Restricted</h1>
          <p className="text-[#FF6B6B]">{error}</p>
        </div>
      </div>
    );
  }

  if (role !== "employee") {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-[#FF6B6B]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-[#FF6B6B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-[24px] font-[600] text-[#202124] mb-2">Access Restricted</h1>
          <p className="text-[#5F6368]">This page is only available to employees.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      <div className="max-w-[1440px] mx-auto px-6 py-6">
        {/* Top Header */}
        <div className="flex items-center justify-between mb-8">
          {/* Welcome Message */}
          <div>
            <h1 className="text-[26px] font-[700] text-[#202124] leading-[1.2]">
              Hello {userName}!
            </h1>
            <p className="text-[16px] text-[#5F6368] mt-1">
              Today is {currentDate.day} - {currentDate.date} {currentDate.month}, {currentDate.year}
            </p>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-[#9AA0A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-3 bg-white border border-[#DADCE0] rounded-[12px] text-[16px] text-[#202124] placeholder-[#9AA0A6] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
              />
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="p-3 bg-white rounded-[12px] border border-[#DADCE0] hover:bg-[#F1F3F4] transition-colors duration-200">
              <Bell className="w-6 h-6 text-[#5F6368]" />
            </button>

            {/* Messages */}
            <button className="p-3 bg-white rounded-[12px] border border-[#DADCE0] hover:bg-[#F1F3F4] transition-colors duration-200">
              <svg className="w-6 h-6 text-[#5F6368]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Card */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-[600] text-[#202124]">Overview</h2>
                <select className="bg-[#F8F9FA] border border-[#DADCE0] rounded-[8px] px-3 py-2 text-[14px] text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]">
                  <option>This month</option>
                  <option>Last month</option>
                  <option>This year</option>
                </select>
              </div>
              
              {/* Metrics */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-1 h-8 bg-[#4A90E2] rounded-full"></div>
                  <div>
                    <p className="text-[32px] font-[700] text-[#202124]">23</p>
                    <p className="text-[14px] text-[#5F6368]">Tasks Assigned</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-1 h-8 bg-[#00D4AA] rounded-full"></div>
                  <div>
                    <p className="text-[32px] font-[700] text-[#202124]">8</p>
                    <p className="text-[14px] text-[#5F6368]">Task Completed</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="w-1 h-8 bg-[#FFB84D] rounded-full"></div>
                  <div>
                    <p className="text-[32px] font-[700] text-[#202124]">15</p>
                    <p className="text-[14px] text-[#5F6368]">In Progress</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Task Overview Table */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-[600] text-[#202124]">Task Overview</h2>
                <select className="bg-[#F8F9FA] border border-[#DADCE0] rounded-[8px] px-3 py-2 text-[14px] text-[#202124] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]">
                  <option>This month</option>
                  <option>Last month</option>
                  <option>This year</option>
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-[#E8EAED]">
                      <th className="text-left py-4 px-0 text-[14px] font-[600] text-[#5F6368] uppercase tracking-wide">PROJECT NAME</th>
                      <th className="text-left py-4 px-4 text-[14px] font-[600] text-[#5F6368] uppercase tracking-wide">PROJECT TYPE</th>
                      <th className="text-left py-4 px-4 text-[14px] font-[600] text-[#5F6368] uppercase tracking-wide">DEADLINE</th>
                      <th className="text-left py-4 px-4 text-[14px] font-[600] text-[#5F6368] uppercase tracking-wide">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8EAED]">
                    <tr className="hover:bg-[#F8F9FA] transition-colors duration-200">
                      <td className="py-4 px-0 text-[14px] text-[#202124]">Redesign Fintech Dashboard</td>
                      <td className="py-4 px-4 text-[14px] text-[#5F6368]">UI Design</td>
                      <td className="py-4 px-4 text-[14px] text-[#5F6368]">Feb 6</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-[500] bg-[#4A90E2]/10 text-[#4A90E2]">
                          In Progress
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F8F9FA] transition-colors duration-200">
                      <td className="py-4 px-0 text-[14px] text-[#202124]">Prototype Design</td>
                      <td className="py-4 px-4 text-[14px] text-[#5F6368]">Prototype Design</td>
                      <td className="py-4 px-4 text-[14px] text-[#5F6368]">Feb 8</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-[500] bg-[#4A90E2]/10 text-[#4A90E2]">
                          In Progress
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F8F9FA] transition-colors duration-200">
                      <td className="py-4 px-0 text-[14px] text-[#202124]">Prototype Design</td>
                      <td className="py-4 px-4 text-[14px] text-[#5F6368]">Prototype Design</td>
                      <td className="py-4 px-4 text-[14px] text-[#5F6368]">Feb 12</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-[500] bg-[#4A90E2]/10 text-[#4A90E2]">
                          In Progress
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F8F9FA] transition-colors duration-200">
                      <td className="py-4 px-0 text-[14px] text-[#202124]">Wireframe design for food app</td>
                      <td className="py-4 px-4 text-[14px] text-[#5F6368]">Wireframe design</td>
                      <td className="py-4 px-4 text-[14px] text-[#5F6368]">Feb 6</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-[500] bg-[#FFB84D]/10 text-[#FFB84D]">
                          In Review
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F8F9FA] transition-colors duration-200">
                      <td className="py-4 px-0 text-[14px] text-[#202124]">Prototype Design</td>
                      <td className="py-4 px-4 text-[14px] text-[#5F6368]">Prototype Design</td>
                      <td className="py-4 px-4 text-[14px] text-[#5F6368]">Feb 4</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-[500] bg-[#00D4AA]/10 text-[#00D4AA]">
                          Complete
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-[#F8F9FA] transition-colors duration-200">
                      <td className="py-4 px-0 text-[14px] text-[#202124]">User research Emedical app</td>
                      <td className="py-4 px-4 text-[14px] text-[#5F6368]">UX Design</td>
                      <td className="py-4 px-4 text-[14px] text-[#5F6368]">Jan 23</td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-[500] bg-[#FF6B6B]/10 text-[#FF6B6B]">
                          Overdue
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Upcoming Holidays */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <h2 className="text-[20px] font-[600] text-[#202124] mb-6">Upcoming Holidays</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-[12px]">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#4A90E2]/10 rounded-[8px] flex items-center justify-center">
                      <span className="text-[#4A90E2] text-[12px] font-[600]">12</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-[500] text-[#202124]">FEB</p>
                      <p className="text-[12px] text-[#5F6368]">Office Day</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-[#5F6368]">18 days left</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-[12px]">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#00D4AA]/10 rounded-[8px] flex items-center justify-center">
                      <span className="text-[#00D4AA] text-[12px] font-[600]">26</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-[500] text-[#202124]">MAR</p>
                      <p className="text-[12px] text-[#5F6368]">Independence Day</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-[#5F6368]">60 days left</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-[12px]">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#FFB84D]/10 rounded-[8px] flex items-center justify-center">
                      <span className="text-[#FFB84D] text-[12px] font-[600]">14</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-[500] text-[#202124]">APR</p>
                      <p className="text-[12px] text-[#5F6368]">Bengali New Year</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-[#5F6368]">79 days left</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#F8F9FA] rounded-[12px]">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-[#FF6B6B]/10 rounded-[8px] flex items-center justify-center">
                      <span className="text-[#FF6B6B] text-[12px] font-[600]">14</span>
                    </div>
                    <div>
                      <p className="text-[14px] font-[500] text-[#202124]">APR</p>
                      <p className="text-[12px] text-[#5F6368]">Bengali New Year</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[12px] text-[#5F6368]">79 days left</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Progress */}
            <div className="bg-white rounded-[16px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <h2 className="text-[20px] font-[600] text-[#202124] mb-2">Weekly Progress</h2>
              <p className="text-[14px] text-[#5F6368] mb-6">Start from Jan 23-29, 2023</p>
              
              {/* Circular Progress */}
              <div className="flex justify-center">
                <div className="relative w-32 h-32">
                  <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-[#E8EAED]"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className="text-[#FFB84D]"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="transparent"
                      strokeDasharray="49, 100"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-[20px] font-[700] text-[#202124]">49%</span>
                    <span className="text-[12px] text-[#5F6368]">Task Finished</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Sections - Added below existing dashboard */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Approaching Deadline */}
          <div>
            <div className="bg-white rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[20px] font-[600] text-[#3C4043]">Approaching Deadline</h2>
                <select className="bg-[#F8F9FA] border border-[#DADCE0] rounded-[8px] px-3 py-2 text-[14px] text-[#5F6368] focus:outline-none focus:ring-2 focus:ring-[#4A90E2]">
                  <option>This month</option>
                  <option>Last month</option>
                  <option>This year</option>
                </select>
              </div>
              
              {/* Deadline Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Card 1 */}
                <div className="bg-[#F8F9FA] rounded-[8px] p-4 border border-[#E8EAED]">
                  <div className="mb-3">
                    <p className="text-[14px] font-[600] text-[#3C4043]">30 JAN</p>
                  </div>
                  <h3 className="text-[16px] font-[600] text-[#3C4043] mb-2">Designing app deadline</h3>
                  <p className="text-[14px] text-[#9AA0A6] mb-2">Mobile App UI Design</p>
                  <p className="text-[12px] text-[#9AA0A6]">5 days left</p>
                </div>

                {/* Card 2 */}
                <div className="bg-[#F8F9FA] rounded-[8px] p-4 border border-[#E8EAED]">
                  <div className="mb-3">
                    <p className="text-[14px] font-[600] text-[#3C4043]">01 FEB</p>
                  </div>
                  <h3 className="text-[16px] font-[600] text-[#3C4043] mb-2">Meeting</h3>
                  <p className="text-[14px] text-[#9AA0A6] mb-2">Dashboard UI Design</p>
                  <p className="text-[12px] text-[#9AA0A6]">7 Days left</p>
                </div>

                {/* Card 3 */}
                <div className="bg-[#F8F9FA] rounded-[8px] p-4 border border-[#E8EAED]">
                  <div className="mb-3">
                    <p className="text-[14px] font-[600] text-[#3C4043]">31 JAN</p>
                  </div>
                  <h3 className="text-[16px] font-[600] text-[#3C4043] mb-2">Wireframe presentaion</h3>
                  <p className="text-[14px] text-[#9AA0A6] mb-2">Food App Wireframe</p>
                  <p className="text-[12px] text-[#9AA0A6]">6 days left</p>
                </div>

                {/* Card 4 */}
                <div className="bg-[#F8F9FA] rounded-[8px] p-4 border border-[#E8EAED]">
                  <div className="mb-3">
                    <p className="text-[14px] font-[600] text-[#3C4043]">14 FEB</p>
                  </div>
                  <h3 className="text-[16px] font-[600] text-[#3C4043] mb-2">Dinner Party</h3>
                  <p className="text-[14px] text-[#9AA0A6] mb-2">Office Team</p>
                  <p className="text-[12px] text-[#9AA0A6]">20 days left</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Apply For Leaves */}
          <div>
            <div className="bg-white rounded-[12px] p-6 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
              <h2 className="text-[20px] font-[600] text-[#3C4043] mb-6">Apply For Leaves</h2>
              
              <div className="space-y-4">
                {/* From Date */}
                <div>
                  <label className="block text-[14px] text-[#9AA0A6] mb-2">From</label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-white border border-[#DADCE0] rounded-[8px] text-[14px] text-[#3C4043] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-[#9AA0A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* To Date */}
                <div>
                  <label className="block text-[14px] text-[#9AA0A6] mb-2">To</label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full px-4 py-3 bg-white border border-[#DADCE0] rounded-[8px] text-[14px] text-[#3C4043] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent"
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <svg className="w-5 h-5 text-[#9AA0A6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Apply Button */}
                <button className="w-full mt-6 bg-[#00D4AA] hover:bg-[#00B894] text-white font-[500] py-3 px-4 rounded-[8px] transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#00D4AA] focus:ring-offset-2">
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
