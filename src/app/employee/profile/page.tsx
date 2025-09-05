"use client";
import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collectionGroup, getDocs, query, where, doc, getDoc } from "firebase/firestore";

type EmployeeProfile = {
  employeeId?: string;
  name?: string;
  email?: string;
  departmentId?: string;
  department?: string;
  roleId?: string;
  jobTitle?: string;
  employeeType?: string;
  status?: string;
  hireDate?: unknown;
  location?: string;
  phoneNumber?: string;
  dob?: string;
  nidNumber?: string;
  passportNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  presentAddress?: string;
  onboardingCompleted?: boolean;
};

export default function EmployeeProfilePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError("You must be signed in.");
        setLoading(false);
        return;
      }
      try {
        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (snap.empty) {
          setError("Organization membership not found.");
          setLoading(false);
          return;
        }
        const membershipRef = snap.docs[0].ref;
        const parentOrg = membershipRef.parent.parent; // organizations/{orgId}
        const orgId = parentOrg ? parentOrg.id : null;
        if (!orgId) {
          setError("Organization not found.");
          setLoading(false);
          return;
        }
        const empRef = doc(db, "organizations", orgId, "employees", user.uid);
        const empSnap = await getDoc(empRef);
        if (!empSnap.exists()) {
          setError("Employee profile not found.");
          setLoading(false);
          return;
        }
        const data = empSnap.data() as EmployeeProfile;
        setProfile(data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-[22px] font-semibold">My Profile</h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-6 py-8">
        <h1 className="text-[22px] font-semibold">My Profile</h1>
        <p className="mt-2 text-[14px] text-[#ef4444]">{error}</p>
      </div>
    );
  }

  const rowsA = [
    { label: "Full name", value: profile?.name || "—" },
    { label: "Email", value: profile?.email || "—" },
    { label: "Department", value: profile?.department || "—" },
    { label: "Role", value: profile?.jobTitle || "—" },
    { label: "Employment status", value: profile?.employeeType || "—" },
    { label: "Location", value: profile?.location || "—" },
  ];

  const rowsB = [
    { label: "Phone number", value: profile?.phoneNumber || "—" },
    { label: "Date of birth", value: profile?.dob || "—" },
    { label: "NID number", value: profile?.nidNumber || "—" },
    { label: "Passport number", value: profile?.passportNumber || "—" },
    { label: "Present address", value: profile?.presentAddress || "—" },
  ];

  const rowsC = [
    { label: "Emergency name", value: profile?.emergencyContactName || "—" },
    { label: "Emergency relation", value: profile?.emergencyContactRelation || "—" },
    { label: "Emergency phone", value: profile?.emergencyContactPhone || "—" },
  ];

  return (
    <div className="px-6 py-8">
      <h1 className="text-[22px] font-semibold">My Profile</h1>
      <p className="mt-2 text-[14px] text-[#6b7280]">Your personal and employment information.</p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 rounded-lg border border-[#e5e7eb] bg-white">
          <div className="p-5 border-b border-[#e5e7eb]"><h2 className="text-[16px] font-semibold">Employment</h2></div>
          <dl className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {rowsA.map((r) => (
              <div key={r.label}>
                <dt className="text-[12px] text-[#6b7280]">{r.label}</dt>
                <dd className="mt-1 text-[14px]">{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="rounded-lg border border-[#e5e7eb] bg-white">
          <div className="p-5 border-b border-[#e5e7eb]"><h2 className="text-[16px] font-semibold">Emergency Contact</h2></div>
          <dl className="p-5 grid grid-cols-1 gap-x-8 gap-y-4">
            {rowsC.map((r) => (
              <div key={r.label}>
                <dt className="text-[12px] text-[#6b7280]">{r.label}</dt>
                <dd className="mt-1 text-[14px]">{r.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="mt-6 rounded-lg border border-[#e5e7eb] bg-white">
        <div className="p-5 border-b border-[#e5e7eb]"><h2 className="text-[16px] font-semibold">Personal Details</h2></div>
        <dl className="p-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {rowsB.map((r) => (
            <div key={r.label}>
              <dt className="text-[12px] text-[#6b7280]">{r.label}</dt>
              <dd className="mt-1 text-[14px]">{r.value}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}


