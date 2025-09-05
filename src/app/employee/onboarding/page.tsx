"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collectionGroup, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";

export default function EmployeeOnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  const [orgId, setOrgId] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  const [phoneNumber, setPhoneNumber] = useState("");
  const [dob, setDob] = useState("");
  const [nidNumber, setNidNumber] = useState("");
  const [passportNumber, setPassportNumber] = useState("");
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactRelation, setEmergencyContactRelation] = useState("");
  const [presentAddress, setPresentAddress] = useState("");

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
          setError("Organization membership not found.");
          setLoading(false);
          return;
        }
        const membershipRef = snap.docs[0].ref;
        const parentOrg = membershipRef.parent.parent; // organizations/{orgId}
        const foundOrgId = parentOrg ? parentOrg.id : null;
        setOrgId(foundOrgId);
        setEmployeeId(user.uid);

        if (foundOrgId) {
          const empRef = doc(db, "organizations", foundOrgId, "employees", user.uid);
          const empSnap = await getDoc(empRef);
          if (empSnap.exists()) {
            const data = empSnap.data() as Record<string, unknown> & { onboardingCompleted?: boolean };
            if (data.onboardingCompleted === true) {
              router.replace("/employee");
              return;
            }
            setPhoneNumber((data.phoneNumber as string) || "");
            setDob((data.dob as string) || "");
            setNidNumber((data.nidNumber as string) || "");
            setPassportNumber((data.passportNumber as string) || "");
            setEmergencyContactName((data.emergencyContactName as string) || "");
            setEmergencyContactPhone((data.emergencyContactPhone as string) || "");
            setEmergencyContactRelation((data.emergencyContactRelation as string) || "");
            setPresentAddress((data.presentAddress as string) || "");
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load onboarding data");
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!orgId || !employeeId) return;
    // Required field validation
    if (!phoneNumber || !dob || !nidNumber || !emergencyContactName || !emergencyContactPhone || !emergencyContactRelation || !presentAddress) {
      setError("Please fill in all required fields.");
      return;
    }
    setSaving(true);
    try {
      const empRef = doc(db, "organizations", orgId, "employees", employeeId);
      await updateDoc(empRef, {
        phoneNumber,
        dob, // stored as YYYY-MM-DD string
        nidNumber,
        passportNumber: passportNumber || "",
        emergencyContactName,
        emergencyContactPhone,
        emergencyContactRelation,
        presentAddress,
        onboardingCompleted: true,
      });
      router.replace("/employee");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save information");
    } finally {
      setSaving(false);
    }
  }

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
        <h1 className="text-[24px] font-semibold">Complete Your Profile</h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">Please provide the following information to access your portal.</p>

        <form onSubmit={onSubmit} className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block mb-1 text-[14px] font-medium text-[#374151]">Phone Number<span className="text-[#ef4444]"> *</span></label>
            <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} type="tel" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" />
          </div>

          <div>
            <label className="block mb-1 text-[14px] font-medium text-[#374151]">Date of Birth<span className="text-[#ef4444]"> *</span></label>
            <input value={dob} onChange={(e) => setDob(e.target.value)} type="date" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" />
          </div>

          <div>
            <label className="block mb-1 text-[14px] font-medium text-[#374151]">NID Number<span className="text-[#ef4444]"> *</span></label>
            <input value={nidNumber} onChange={(e) => setNidNumber(e.target.value)} type="text" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" />
          </div>

          <div className="md:col-span-2">
            <label className="block mb-1 text-[14px] font-medium text-[#374151]">Passport Number (optional)</label>
            <input value={passportNumber} onChange={(e) => setPassportNumber(e.target.value)} type="text" className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" />
          </div>

          <div className="md:col-span-2 pt-2 border-t border-[#e5e7eb]">
            <p className="text-[14px] font-medium text-[#374151]">Emergency Contact</p>
          </div>

          <div>
            <label className="block mb-1 text-[14px] font-medium text-[#374151]">Name<span className="text-[#ef4444]"> *</span></label>
            <input value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} type="text" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" />
          </div>

          <div>
            <label className="block mb-1 text-[14px] font-medium text-[#374151]">Phone<span className="text-[#ef4444]"> *</span></label>
            <input value={emergencyContactPhone} onChange={(e) => setEmergencyContactPhone(e.target.value)} type="tel" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" />
          </div>

          <div className="md:col-span-2">
            <label className="block mb-1 text-[14px] font-medium text-[#374151]">Relationship<span className="text-[#ef4444]"> *</span></label>
            <input value={emergencyContactRelation} onChange={(e) => setEmergencyContactRelation(e.target.value)} type="text" required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" />
          </div>

          <div className="md:col-span-2">
            <label className="block mb-1 text-[14px] font-medium text-[#374151]">Present Address<span className="text-[#ef4444]"> *</span></label>
            <textarea value={presentAddress} onChange={(e) => setPresentAddress(e.target.value)} required className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] min-h-[100px]" />
          </div>

          {error ? <p className="md:col-span-2 text-[14px] text-[#ef4444]">{error}</p> : null}

          <div className="md:col-span-2">
            <button type="submit" disabled={saving} className="w-full md:w-auto rounded-md bg-[#1f2937] text-white px-6 py-3 text-[16px] font-medium hover:bg-[#111827] disabled:opacity-60">
              {saving ? "Saving…" : "Save and continue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


