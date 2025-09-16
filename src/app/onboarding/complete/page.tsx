"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collectionGroup, getDocs, query, where, doc, getDoc } from "firebase/firestore";

interface EmployeeData {
  firstName?: string;
  lastName?: string;
  email?: string;
  onboardingCompletedAt?: string;
  department?: string;
  position?: string;
  startDate?: string;
}

export default function OnboardingCompletePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [employeeData, setEmployeeData] = useState<EmployeeData | null>(null);
  const [hrContact, setHrContact] = useState({
    name: "Sarah Johnson",
    email: "hr@company.com",
    phone: "+1 (555) 123-4567"
  });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.replace("/login");
        return;
      }
      try {
        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (snap.empty) {
          router.replace("/login");
          return;
        }
        const membershipRef = snap.docs[0].ref;
        const parentOrg = membershipRef.parent.parent;
        const foundOrgId = parentOrg ? parentOrg.id : null;

        if (foundOrgId) {
          const empRef = doc(db, "organizations", foundOrgId, "employees", user.uid);
          const empSnap = await getDoc(empRef);
          if (empSnap.exists()) {
            const data = empSnap.data() as Record<string, unknown> & { onboardingCompleted?: boolean };
            if (!data.onboardingCompleted) {
              router.replace("/employee/onboarding");
              return;
            }
            setEmployeeData({
              firstName: data.firstName as string,
              lastName: data.lastName as string,
              email: data.email as string,
              onboardingCompletedAt: data.onboardingCompletedAt as string,
              department: data.department as string,
              position: data.position as string,
              startDate: data.startDate as string
            });
          }
        }
      } catch (e) {
        console.error("Error loading employee data:", e);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const nextSteps = [
    {
      title: "Welcome Meeting",
      description: "Attend your welcome meeting with HR",
      time: "First day, 9:00 AM",
      location: "Conference Room A"
    },
    {
      title: "IT Setup",
      description: "Get your computer and system access",
      time: "First day, 10:00 AM",
      location: "IT Department"
    },
    {
      title: "Team Introduction",
      description: "Meet your team and manager",
      time: "First day, 2:00 PM",
      location: "Your Department"
    },
    {
      title: "Training Session",
      description: "Complete mandatory training modules",
      time: "First week",
      location: "Online Learning Portal"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-16 bg-[#ffffff] text-[#1a1a1a]">
        <div className="max-w-[720px] mx-auto">
          <p className="text-[14px] text-[#6b7280]">Loading…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-6 py-16 bg-[#ffffff] text-[#1a1a1a]">
      <div className="max-w-[720px] mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-[28px] font-semibold text-green-600 mb-2">Congratulations!</h1>
          <p className="text-[16px] text-[#6b7280]">
            Welcome to the team, {employeeData?.firstName}! Your onboarding is complete.
          </p>
        </div>

        {/* Employee Information */}
        <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 mb-6">
          <h2 className="text-[18px] font-medium mb-4">Your Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">Name</label>
              <p className="text-[14px]">{employeeData?.firstName} {employeeData?.lastName}</p>
            </div>
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">Email</label>
              <p className="text-[14px]">{employeeData?.email}</p>
            </div>
            {employeeData?.department && (
              <div>
                <label className="text-[12px] font-medium text-[#6b7280]">Department</label>
                <p className="text-[14px]">{employeeData.department}</p>
              </div>
            )}
            {employeeData?.position && (
              <div>
                <label className="text-[12px] font-medium text-[#6b7280]">Position</label>
                <p className="text-[14px]">{employeeData.position}</p>
              </div>
            )}
            {employeeData?.startDate && (
              <div>
                <label className="text-[12px] font-medium text-[#6b7280]">Start Date</label>
                <p className="text-[14px]">{formatDate(employeeData.startDate)}</p>
              </div>
            )}
            <div>
              <label className="text-[12px] font-medium text-[#6b7280]">Onboarding Completed</label>
              <p className="text-[14px]">{employeeData?.onboardingCompletedAt ? formatDate(employeeData.onboardingCompletedAt) : "Today"}</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 mb-6">
          <h2 className="text-[18px] font-medium mb-4">Your First Day Schedule</h2>
          <div className="space-y-4">
            {nextSteps.map((step, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 bg-[#f9fafb] rounded-lg">
                <div className="w-8 h-8 bg-[#f97316] text-white rounded-full flex items-center justify-center text-[12px] font-medium">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <h3 className="text-[14px] font-medium">{step.title}</h3>
                  <p className="text-[13px] text-[#6b7280] mb-1">{step.description}</p>
                  <div className="flex items-center space-x-4 text-[12px] text-[#6b7280]">
                    <span className="flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{step.time}</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{step.location}</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Important Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-[18px] font-medium text-blue-900 mb-4">Important Information</h2>
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-[14px] font-medium text-blue-900">Employee Handbook</h3>
                <p className="text-[13px] text-blue-700">Please review the employee handbook before your first day.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-[14px] font-medium text-blue-900">Benefits Enrollment</h3>
                <p className="text-[13px] text-blue-700">Complete your benefits enrollment within 30 days of your start date.</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              <div>
                <h3 className="text-[14px] font-medium text-blue-900">Training Requirements</h3>
                <p className="text-[13px] text-blue-700">Complete all mandatory training modules within your first week.</p>
              </div>
            </div>
          </div>
        </div>

        {/* HR Contact Information */}
        <div className="bg-white border border-[#e5e7eb] rounded-lg p-6 mb-6">
          <h2 className="text-[18px] font-medium mb-4">HR Contact Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-[#f9fafb] rounded-lg">
              <div className="w-12 h-12 bg-[#f97316] rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-[14px] font-medium">{hrContact.name}</h3>
              <p className="text-[12px] text-[#6b7280]">HR Manager</p>
            </div>
            <div className="text-center p-4 bg-[#f9fafb] rounded-lg">
              <div className="w-12 h-12 bg-[#f97316] rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-[14px] font-medium">Email</h3>
              <p className="text-[12px] text-[#6b7280]">{hrContact.email}</p>
            </div>
            <div className="text-center p-4 bg-[#f9fafb] rounded-lg">
              <div className="w-12 h-12 bg-[#f97316] rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <h3 className="text-[14px] font-medium">Phone</h3>
              <p className="text-[12px] text-[#6b7280]">{hrContact.phone}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => router.push("/employee")}
            className="flex-1 px-6 py-3 bg-[#f97316] text-white rounded-md text-[16px] font-medium hover:bg-[#ea580c] flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
            <span>Access Employee Portal</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 px-6 py-3 border border-[#d1d5db] text-[#374151] rounded-md text-[16px] font-medium hover:bg-[#f9fafb] flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span>Print This Page</span>
          </button>
        </div>

        {/* Footer Message */}
        <div className="mt-8 text-center">
          <p className="text-[14px] text-[#6b7280]">
            We&apos;re excited to have you on the team! If you have any questions, don&apos;t hesitate to reach out to HR.
          </p>
        </div>
      </div>
    </div>
  );
}
