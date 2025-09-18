"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, doc, getDocs, onSnapshot, query, where, orderBy, limit } from "firebase/firestore";

type PerformanceReview = {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  status: 'draft' | 'in_progress' | 'completed' | 'overdue';
  overallRating: number;
  goals: number;
  goalsCompleted: number;
  lastUpdated: string;
};

type PerformanceGoal = {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  description: string;
  targetDate: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  progress: number;
  priority: 'low' | 'medium' | 'high';
};

type PerformanceMetric = {
  id: string;
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
};

export default function PerformancePage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [reviews, setReviews] = useState<PerformanceReview[]>([]);
  const [goals, setGoals] = useState<PerformanceGoal[]>([]);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [empById, setEmpById] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('Q4 2024');
  const [loading, setLoading] = useState(true);

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
        s.forEach((d) => { 
          const data = d.data() as Record<string, unknown>; 
          map[d.id] = (data["name"] as string) || d.id; 
        });
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

      // Mock data for demonstration - in production, this would come from Firestore
      setReviews([
        {
          id: '1',
          employeeId: 'emp1',
          employeeName: 'John Smith',
          period: 'Q4 2024',
          status: 'completed',
          overallRating: 4.2,
          goals: 5,
          goalsCompleted: 4,
          lastUpdated: '2024-12-15'
        },
        {
          id: '2',
          employeeId: 'emp2',
          employeeName: 'Sarah Johnson',
          period: 'Q4 2024',
          status: 'in_progress',
          overallRating: 3.8,
          goals: 4,
          goalsCompleted: 2,
          lastUpdated: '2024-12-10'
        },
        {
          id: '3',
          employeeId: 'emp3',
          employeeName: 'Mike Chen',
          period: 'Q4 2024',
          status: 'overdue',
          overallRating: 0,
          goals: 3,
          goalsCompleted: 0,
          lastUpdated: '2024-11-30'
        }
      ]);

      setGoals([
        {
          id: '1',
          employeeId: 'emp1',
          employeeName: 'John Smith',
          title: 'Increase Sales by 20%',
          description: 'Achieve quarterly sales target of $500K',
          targetDate: '2024-12-31',
          status: 'completed',
          progress: 100,
          priority: 'high'
        },
        {
          id: '2',
          employeeId: 'emp2',
          employeeName: 'Sarah Johnson',
          title: 'Complete Leadership Training',
          description: 'Finish advanced management certification',
          targetDate: '2024-12-20',
          status: 'in_progress',
          progress: 75,
          priority: 'medium'
        },
        {
          id: '3',
          employeeId: 'emp3',
          employeeName: 'Mike Chen',
          title: 'Improve Customer Satisfaction',
          description: 'Achieve 95% customer satisfaction rating',
          targetDate: '2024-12-15',
          status: 'overdue',
          progress: 60,
          priority: 'high'
        }
      ]);

      setMetrics([
        {
          id: '1',
          name: 'Average Performance Rating',
          value: 3.8,
          target: 4.0,
          trend: 'up',
          change: 0.2
        },
        {
          id: '2',
          name: 'Goal Completion Rate',
          value: 78,
          target: 85,
          trend: 'up',
          change: 5
        },
        {
          id: '3',
          name: 'Review Completion Rate',
          value: 65,
          target: 90,
          trend: 'down',
          change: -10
        },
        {
          id: '4',
          name: 'Employee Engagement',
          value: 82,
          target: 80,
          trend: 'stable',
          change: 2
        }
      ]);

      setLoading(false);
      return () => { offEmp(); };
    });
    return () => unsub();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      case 'stable': return '→';
      default: return '→';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#f97316] border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-[14px] text-[#6b7280]">Loading Performance Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header Section */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#8b5cf6] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-[24px] font-semibold">Performance Management</h1>
                <p className="text-[14px] text-[#6b7280] mt-1">
                  Track employee performance, manage reviews, and monitor goals
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#8b5cf6] focus:border-transparent"
              >
                <option value="Q4 2024">Q4 2024</option>
                <option value="Q3 2024">Q3 2024</option>
                <option value="Q2 2024">Q2 2024</option>
                <option value="Q1 2024">Q1 2024</option>
              </select>
              <button className="flex items-center gap-2 bg-[#8b5cf6] text-white px-4 py-2 rounded-lg hover:bg-[#7c3aed] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                New Review
              </button>
              <button className="flex items-center gap-2 bg-[#14b8a6] text-white px-4 py-2 rounded-lg hover:bg-[#0f766e] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </button>
            </div>
          </div>
        </div>

        {/* Performance Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric) => (
            <div key={metric.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-[#8b5cf6] rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <span className={`text-[12px] px-2 py-1 rounded-full ${
                  metric.trend === 'up' ? 'bg-green-100 text-green-800' :
                  metric.trend === 'down' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {getTrendIcon(metric.trend)} {metric.change > 0 ? '+' : ''}{metric.change}%
                </span>
              </div>
              <h3 className="text-[14px] font-medium text-[#6b7280] mb-2">{metric.name}</h3>
              <div className="flex items-baseline gap-2">
                <p className="text-[24px] font-bold">{metric.value}</p>
                <span className="text-[12px] text-[#6b7280]">/ {metric.target}</span>
              </div>
              <div className="mt-3 w-full bg-[#f3f4f6] rounded-full h-2">
                <div 
                  className="bg-[#8b5cf6] h-2 rounded-full" 
                  style={{ width: `${(metric.value / metric.target) * 100}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Reviews Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-[18px] font-semibold">Performance Reviews</h2>
                <div className="flex items-center gap-3">
                  <button className="px-3 py-1 bg-[#f3f4f6] text-[#6b7280] rounded-lg hover:bg-[#e5e7eb] transition-colors text-[12px]">
                    All Reviews
                  </button>
                  <button className="px-3 py-1 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors text-[12px]">
                    Export
                  </button>
                </div>
              </div>
              
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="flex items-center justify-between p-4 bg-[#f9fafb] rounded-lg border border-[#e5e7eb] hover:bg-[#f3f4f6] transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-[#8b5cf6] rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {review.employeeName.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-[14px] font-medium">{review.employeeName}</h3>
                        <p className="text-[12px] text-[#6b7280]">{review.period}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-[12px] text-[#6b7280]">Overall Rating</p>
                        <p className="text-[16px] font-bold">{review.overallRating || 'N/A'}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[12px] text-[#6b7280]">Goals</p>
                        <p className="text-[16px] font-bold">{review.goalsCompleted}/{review.goals}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-[12px] ${getStatusColor(review.status)}`}>
                        {review.status.replace('_', ' ')}
                      </span>
                      <button className="px-3 py-1 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors text-[12px]">
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 pt-4 border-t border-[#e5e7eb]">
                <Link href="/admin/performance/reviews" className="block text-center text-[12px] text-[#8b5cf6] hover:underline">
                  View All Reviews ({reviews.length})
                </Link>
              </div>
            </div>
          </div>

          {/* Goals Management Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-semibold">Active Goals</h2>
              <button className="px-3 py-1 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors text-[12px]">
                New Goal
              </button>
            </div>
            
            <div className="space-y-4">
              {goals.map((goal) => (
                <div key={goal.id} className="p-4 bg-[#f9fafb] rounded-lg border border-[#e5e7eb]">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-[14px] font-medium">{goal.title}</h3>
                      <p className="text-[12px] text-[#6b7280]">{goal.employeeName}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-[10px] ${getPriorityColor(goal.priority)}`}>
                      {goal.priority}
                    </span>
                  </div>
                  
                  <p className="text-[12px] text-[#6b7280] mb-3">{goal.description}</p>
                  
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] text-[#6b7280]">Progress</span>
                      <span className="text-[12px] font-medium">{goal.progress}%</span>
                    </div>
                    <div className="w-full bg-[#f3f4f6] rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          goal.progress >= 80 ? 'bg-green-500' :
                          goal.progress >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-[#6b7280]">Due: {goal.targetDate}</span>
                    <span className={`px-2 py-1 rounded-full text-[10px] ${getStatusColor(goal.status)}`}>
                      {goal.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 pt-4 border-t border-[#e5e7eb]">
              <Link href="/admin/performance/goals" className="block text-center text-[12px] text-[#8b5cf6] hover:underline">
                View All Goals ({goals.length})
              </Link>
            </div>
          </div>
        </div>

        {/* Performance Analytics Section */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Trends Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-semibold">Performance Trends</h2>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 bg-[#f3f4f6] text-[#6b7280] rounded-lg hover:bg-[#e5e7eb] transition-colors text-[12px]">
                  6M
                </button>
                <button className="px-3 py-1 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors text-[12px]">
                  1Y
                </button>
              </div>
            </div>
            
            {/* Mock Chart Area */}
            <div className="h-64 bg-[#f9fafb] rounded-lg flex items-center justify-center border border-[#e5e7eb]">
              <div className="text-center">
                <svg className="w-16 h-16 text-[#6b7280] mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-[14px] text-[#6b7280]">Performance Trends Chart</p>
                <p className="text-[12px] text-[#6b7280] mt-1">Chart integration coming soon</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-semibold">Quick Actions</h2>
            </div>
            
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors text-[14px] font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Schedule Performance Review
              </button>
              
              <button className="w-full flex items-center gap-3 p-3 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0f766e] transition-colors text-[14px] font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Set Employee Goals
              </button>
              
              <button className="w-full flex items-center gap-3 p-3 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-colors text-[14px] font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Generate Performance Report
              </button>
              
              <button className="w-full flex items-center gap-3 p-3 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors text-[14px] font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                Performance Templates
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-[#e5e7eb]">
              <Link href="/admin/learning" className="block w-full bg-[#6b7280] text-white py-2 px-4 rounded-lg hover:bg-[#4b5563] transition-colors text-[14px] font-medium text-center">
                Learning & Development
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-semibold">Recent Performance Activity</h2>
            <button className="px-3 py-1 bg-[#f3f4f6] text-[#6b7280] rounded-lg hover:bg-[#e5e7eb] transition-colors text-[12px]">
              View All
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 bg-[#f9fafb] rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium">John Smith completed Q4 2024 performance review</p>
                <p className="text-[12px] text-[#6b7280]">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-[#f9fafb] rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium">New goal assigned to Sarah Johnson</p>
                <p className="text-[12px] text-[#6b7280]">5 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-[#f9fafb] rounded-lg">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium">Mike Chen&apos;s performance review is overdue</p>
                <p className="text-[12px] text-[#6b7280]">1 day ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
