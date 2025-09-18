"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, doc, getDocs, onSnapshot, query, where, orderBy, limit } from "firebase/firestore";

type ReportTemplate = {
  id: string;
  name: string;
  description: string;
  category: 'employee' | 'performance' | 'payroll' | 'attendance' | 'compliance';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  lastGenerated: string;
  status: 'active' | 'inactive';
  icon: string;
};

type ReportMetric = {
  id: string;
  name: string;
  value: number;
  target: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  format: 'number' | 'percentage' | 'currency';
};

type ReportCategory = {
  id: string;
  name: string;
  description: string;
  reportCount: number;
  icon: string;
  color: string;
};

export default function ReportsPage() {
  const [orgId, setOrgId] = useState<string | null>(null);
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [metrics, setMetrics] = useState<ReportMetric[]>([]);
  const [categories, setCategories] = useState<ReportCategory[]>([]);
  const [empById, setEmpById] = useState<Record<string, string>>({});
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string } | null>(null);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('Q4 2024');
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

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
      setTemplates([
        {
          id: '1',
          name: 'Employee Performance Summary',
          description: 'Comprehensive performance metrics for all employees',
          category: 'performance',
          frequency: 'monthly',
          lastGenerated: '2024-12-15',
          status: 'active',
          icon: 'chart-bar'
        },
        {
          id: '2',
          name: 'Payroll Summary Report',
          description: 'Monthly payroll breakdown and cost analysis',
          category: 'payroll',
          frequency: 'monthly',
          lastGenerated: '2024-12-01',
          status: 'active',
          icon: 'currency-dollar'
        },
        {
          id: '3',
          name: 'Attendance Analytics',
          description: 'Employee attendance patterns and trends',
          category: 'attendance',
          frequency: 'weekly',
          lastGenerated: '2024-12-10',
          status: 'active',
          icon: 'clock'
        },
        {
          id: '4',
          name: 'Compliance Checklist',
          description: 'HR compliance status and audit trail',
          category: 'compliance',
          frequency: 'quarterly',
          lastGenerated: '2024-10-01',
          status: 'active',
          icon: 'shield-check'
        },
        {
          id: '5',
          name: 'Employee Demographics',
          description: 'Workforce demographics and diversity metrics',
          category: 'employee',
          frequency: 'yearly',
          lastGenerated: '2024-01-01',
          status: 'active',
          icon: 'users'
        }
      ]);

      setMetrics([
        {
          id: '1',
          name: 'Total Reports Generated',
          value: 156,
          target: 200,
          trend: 'up',
          change: 12,
          format: 'number'
        },
        {
          id: '2',
          name: 'Report Accuracy Rate',
          value: 98.5,
          target: 95,
          trend: 'up',
          change: 2.3,
          format: 'percentage'
        },
        {
          id: '3',
          name: 'Average Generation Time',
          value: 2.3,
          target: 3.0,
          trend: 'down',
          change: -15,
          format: 'number'
        },
        {
          id: '4',
          name: 'User Satisfaction',
          value: 4.7,
          target: 4.5,
          trend: 'stable',
          change: 0.2,
          format: 'number'
        }
      ]);

      setCategories([
        {
          id: 'employee',
          name: 'Employee Reports',
          description: 'Employee data, demographics, and HR analytics',
          reportCount: 12,
          icon: 'users',
          color: '#3b82f6'
        },
        {
          id: 'performance',
          name: 'Performance Reports',
          description: 'Performance metrics, reviews, and goal tracking',
          reportCount: 8,
          icon: 'chart-bar',
          color: '#8b5cf6'
        },
        {
          id: 'payroll',
          name: 'Payroll Reports',
          description: 'Salary, benefits, and compensation analytics',
          reportCount: 6,
          icon: 'currency-dollar',
          color: '#10b981'
        },
        {
          id: 'attendance',
          name: 'Attendance Reports',
          description: 'Time tracking, leave, and attendance patterns',
          reportCount: 10,
          icon: 'clock',
          color: '#f59e0b'
        },
        {
          id: 'compliance',
          name: 'Compliance Reports',
          description: 'Legal compliance, audits, and regulatory reports',
          reportCount: 4,
          icon: 'shield-check',
          color: '#ef4444'
        }
      ]);

      setLoading(false);
      return () => { offEmp(); };
    });
    return () => unsub();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
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

  const formatValue = (value: number, format: string) => {
    switch (format) {
      case 'percentage': return `${value}%`;
      case 'currency': return `$${value.toLocaleString()}`;
      default: return value.toLocaleString();
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconProps = "w-5 h-5 text-white";
    switch (iconName) {
      case 'chart-bar':
        return (
          <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'currency-dollar':
        return (
          <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        );
      case 'clock':
        return (
          <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'shield-check':
        return (
          <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'users':
        return (
          <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        );
      default:
        return (
          <svg className={iconProps} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
    }
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#f97316] border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-[14px] text-[#6b7280]">Loading Reports Data...</p>
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
              <div className="w-12 h-12 bg-[#f97316] rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-[24px] font-semibold">Reports & Analytics</h1>
                <p className="text-[14px] text-[#6b7280] mt-1">
                  Generate insights, track metrics, and export data for informed decision-making
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select 
                value={selectedPeriod} 
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="px-4 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              >
                <option value="Q4 2024">Q4 2024</option>
                <option value="Q3 2024">Q3 2024</option>
                <option value="Q2 2024">Q2 2024</option>
                <option value="Q1 2024">Q1 2024</option>
              </select>
              <button className="flex items-center gap-2 bg-[#f97316] text-white px-4 py-2 rounded-lg hover:bg-[#ea580c] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Custom Report
              </button>
              <button className="flex items-center gap-2 bg-[#14b8a6] text-white px-4 py-2 rounded-lg hover:bg-[#0f766e] transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export All
              </button>
            </div>
          </div>
        </div>

        {/* Report Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metrics.map((metric) => (
            <div key={metric.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 bg-[#f97316] rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
                <p className="text-[24px] font-bold">{formatValue(metric.value, metric.format)}</p>
                <span className="text-[12px] text-[#6b7280]">/ {formatValue(metric.target, metric.format)}</span>
              </div>
              <div className="mt-3 w-full bg-[#f3f4f6] rounded-full h-2">
                <div 
                  className="bg-[#f97316] h-2 rounded-full" 
                  style={{ width: `${Math.min((metric.value / metric.target) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        {/* Report Categories */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-semibold">Report Categories</h2>
            <button 
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-lg text-[12px] transition-colors ${
                selectedCategory === 'all' 
                  ? 'bg-[#f97316] text-white' 
                  : 'bg-[#f3f4f6] text-[#6b7280] hover:bg-[#e5e7eb]'
              }`}
            >
              All Categories
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedCategory === category.id
                    ? 'border-[#f97316] bg-[#fef7ed]'
                    : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db]'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: category.color }}
                  >
                    {getIconComponent(category.icon)}
                  </div>
                  <div className="text-left">
                    <h3 className="text-[14px] font-medium">{category.name}</h3>
                    <p className="text-[12px] text-[#6b7280]">{category.reportCount} reports</p>
                  </div>
                </div>
                <p className="text-[12px] text-[#6b7280] text-left">{category.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Report Templates */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-semibold">Report Templates</h2>
            <div className="flex items-center gap-3">
              <button className="px-3 py-1 bg-[#f3f4f6] text-[#6b7280] rounded-lg hover:bg-[#e5e7eb] transition-colors text-[12px]">
                Filter
              </button>
              <button className="px-3 py-1 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors text-[12px]">
                New Template
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div key={template.id} className="p-4 bg-[#f9fafb] rounded-lg border border-[#e5e7eb] hover:bg-[#f3f4f6] transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#f97316] rounded-lg flex items-center justify-center">
                      {getIconComponent(template.icon)}
                    </div>
                    <div>
                      <h3 className="text-[14px] font-medium">{template.name}</h3>
                      <p className="text-[12px] text-[#6b7280] capitalize">{template.frequency}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-[10px] ${getStatusColor(template.status)}`}>
                    {template.status}
                  </span>
                </div>
                
                <p className="text-[12px] text-[#6b7280] mb-4">{template.description}</p>
                
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#6b7280]">Last generated: {template.lastGenerated}</span>
                  <div className="flex items-center gap-2">
                    <button className="px-3 py-1 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors text-[12px]">
                      Generate
                    </button>
                    <button className="px-3 py-1 bg-[#6b7280] text-white rounded-lg hover:bg-[#4b5563] transition-colors text-[12px]">
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Analytics Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Report Generation Trends */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[18px] font-semibold">Report Generation Trends</h2>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 bg-[#f3f4f6] text-[#6b7280] rounded-lg hover:bg-[#e5e7eb] transition-colors text-[12px]">
                  6M
                </button>
                <button className="px-3 py-1 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors text-[12px]">
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
                <p className="text-[14px] text-[#6b7280]">Report Generation Trends</p>
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
              <button className="w-full flex items-center gap-3 p-3 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors text-[14px] font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Custom Report
              </button>
              
              <button className="w-full flex items-center gap-3 p-3 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0f766e] transition-colors text-[14px] font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Schedule Automated Reports
              </button>
              
              <button className="w-full flex items-center gap-3 p-3 bg-[#3b82f6] text-white rounded-lg hover:bg-[#2563eb] transition-colors text-[14px] font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export Data Archive
              </button>
              
              <button className="w-full flex items-center gap-3 p-3 bg-[#8b5cf6] text-white rounded-lg hover:bg-[#7c3aed] transition-colors text-[14px] font-medium">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics Dashboard
              </button>
            </div>
            
            <div className="mt-6 pt-4 border-t border-[#e5e7eb]">
              <Link href="/admin/settings/administration" className="block w-full bg-[#6b7280] text-white py-2 px-4 rounded-lg hover:bg-[#4b5563] transition-colors text-[14px] font-medium text-center">
                Report Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Report Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[18px] font-semibold">Recent Report Activity</h2>
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
                <p className="text-[14px] font-medium">Employee Performance Summary generated successfully</p>
                <p className="text-[12px] text-[#6b7280]">2 hours ago • PDF exported</p>
              </div>
              <button className="px-3 py-1 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors text-[12px]">
                Download
              </button>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-[#f9fafb] rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium">New custom report template created</p>
                <p className="text-[12px] text-[#6b7280]">5 hours ago • Monthly attendance report</p>
              </div>
              <button className="px-3 py-1 bg-[#6b7280] text-white rounded-lg hover:bg-[#4b5563] transition-colors text-[12px]">
                View
              </button>
            </div>
            
            <div className="flex items-center gap-4 p-3 bg-[#f9fafb] rounded-lg">
              <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-[14px] font-medium">Scheduled report generation failed</p>
                <p className="text-[12px] text-[#6b7280]">1 day ago • Payroll Summary Report</p>
              </div>
              <button className="px-3 py-1 bg-[#ef4444] text-white rounded-lg hover:bg-[#dc2626] transition-colors text-[12px]">
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
