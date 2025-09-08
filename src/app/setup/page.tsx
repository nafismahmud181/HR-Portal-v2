"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { collection, collectionGroup, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";

export default function SetupPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");

  // Step 1 fields
  const [legalName, setLegalName] = useState("");
  const [industry, setIndustry] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("");
  const [timeZone, setTimeZone] = useState("");
  const [ein, setEin] = useState("");

  // Step 2 fields
  const [workWeek, setWorkWeek] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [currency, setCurrency] = useState("");
  const [dateFormat, setDateFormat] = useState("");

  // Step 3 fields (Quick Policy Setup)
  const [annualLeaveEntitlement, setAnnualLeaveEntitlement] = useState<string>("");
  const [probationPeriod, setProbationPeriod] = useState("");
  const [noticePeriod, setNoticePeriod] = useState("");

  useEffect(() => {
    async function resolveOrg() {
      try {
        const user = auth.currentUser;
        if (!user) {
          setLoading(false);
          router.replace("/register");
          return;
        }
        // Resolve via membership first
        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid), limit(1));
        const snap = await getDocs(q);
        let orgId = snap.empty ? null : (snap.docs[0].ref.parent.parent?.id ?? null);
        // Fallback: resolve via organizations createdBy
        if (!orgId) {
          const oq = query(collection(db, "organizations"), where("createdBy", "==", user.uid), limit(1));
          const osnap = await getDocs(oq);
          if (!osnap.empty) {
            orgId = osnap.docs[0].id;
          }
        }
        setOrganizationId(orgId);
        if (orgId) {
          const orgDoc = await getDoc(doc(db, "organizations", orgId));
          const existingName = (orgDoc.exists() ? (orgDoc.data() as { name?: string }).name : "") || "";
          if (existingName && !legalName) {
            setLegalName(existingName);
          }
        }
      } finally {
        setLoading(false);
      }
    }
    resolveOrg();
  }, [router, legalName]);

  const canContinueStep1 = useMemo(() => {
    return (
      legalName.trim().length > 1 &&
      industry.trim().length > 0 &&
      street.trim().length > 2 &&
      city.trim().length > 1 &&
      region.trim().length > 1 &&
      postalCode.trim().length > 2 &&
      country.trim().length > 1 &&
      timeZone.trim().length > 0
    );
  }, [legalName, industry, street, city, region, postalCode, country, timeZone]);

  const canContinueStep2 = useMemo(() => {
    return (
      canContinueStep1 &&
      workWeek.trim().length > 0 &&
      startTime.trim().length > 0 &&
      endTime.trim().length > 0 &&
      currency.trim().length > 0 &&
      dateFormat.trim().length > 0
    );
  }, [canContinueStep1, workWeek, startTime, endTime, currency, dateFormat]);

  const canSubmit = useMemo(() => {
    const leaveOk = Number.isFinite(parseFloat(annualLeaveEntitlement)) && parseFloat(annualLeaveEntitlement) > 0;
    return canContinueStep2 && leaveOk && probationPeriod.trim().length > 0 && noticePeriod.trim().length > 0;
  }, [canContinueStep2, annualLeaveEntitlement, probationPeriod, noticePeriod]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      setSaving(true);
      let orgIdToUse = organizationId;
      const user = auth.currentUser;
      if (!user) throw new Error("Not signed in");
      if (!orgIdToUse) {
        // Re-resolve membership to avoid creating duplicates
        const cg = collectionGroup(db, "users");
        const q2 = query(cg, where("uid", "==", user.uid), limit(1));
        const snap2 = await getDocs(q2);
        if (!snap2.empty) {
          orgIdToUse = snap2.docs[0].ref.parent.parent?.id ?? null;
          setOrganizationId(orgIdToUse);
        }
        if (!orgIdToUse) {
          // Fallback: find organizations created by this user
          const oq = query(collection(db, "organizations"), where("createdBy", "==", user.uid), limit(1));
          const osnap = await getDocs(oq);
          if (!osnap.empty) {
            orgIdToUse = osnap.docs[0].id;
            setOrganizationId(orgIdToUse);
            // Ensure membership exists
            await setDoc(
              doc(db, "organizations", orgIdToUse, "users", user.uid),
              {
                uid: user.uid,
                email: user.email ?? "",
                role: "admin",
                createdAt: serverTimestamp(),
              },
              { merge: true }
            );
          }
        }
        if (!orgIdToUse) {
          // Last resort: create new only when absolutely none exists
          orgIdToUse = crypto.randomUUID();
          await setDoc(doc(db, "organizations", orgIdToUse), {
            name: legalName || "",
            createdBy: user.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          await setDoc(doc(db, "organizations", orgIdToUse, "users", user.uid), {
            uid: user.uid,
            email: user.email ?? "",
            role: "admin",
            createdAt: serverTimestamp(),
          });
          setOrganizationId(orgIdToUse);
        }
      }
      await setDoc(
        doc(db, "organizations", orgIdToUse as string),
        {
          legalName: legalName.trim(),
          industry,
          address: {
            street: street.trim(),
            city: city.trim(),
            region: region.trim(),
            postalCode: postalCode.trim(),
            country: country.trim(),
            formatted: `${street.trim()}, ${city.trim()}, ${region.trim()}, ${postalCode.trim()}, ${country.trim()}`,
          },
          timeZone,
          ein: ein.trim() || null,
          hrConfig: {
            workWeek,
            workingHours: {
              start: startTime,
              end: endTime,
              formatted: `${startTime} – ${endTime}`,
            },
            currency,
            dateFormat,
          },
          hrPolicies: {
            annualLeaveEntitlement: parseFloat(annualLeaveEntitlement),
            probationPeriod,
            noticePeriod,
          },
          setupCompleted: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      router.replace("/admin");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save setup";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#ffffff] text-[#1a1a1a]">
      <div className="w-full max-w-[720px]">
        <h1 className="text-[24px] font-semibold">Complete your company setup</h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">This helps configure your HRMS correctly before entering the dashboard.</p>

        <div className="mt-6 flex items-center gap-2 text-[13px]">
          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full border ${step === 1 ? "bg-[#1f2937] text-white border-[#1f2937]" : "border-[#d1d5db] text-[#374151]"}`}>1</span>
          <span>Company Details</span>
          <span className="mx-2 text-[#d1d5db]">—</span>
          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full border ${step === 2 ? "bg-[#1f2937] text-white border-[#1f2937]" : "border-[#d1d5db] text-[#374151]"}`}>2</span>
          <span>Basic HR Configuration</span>
          <span className="mx-2 text-[#d1d5db]">—</span>
          <span className={`inline-flex items-center justify-center h-6 w-6 rounded-full border ${step === 3 ? "bg-[#1f2937] text-white border-[#1f2937]" : "border-[#d1d5db] text-[#374151]"}`}>3</span>
          <span>Quick Policy Setup</span>
        </div>

        {error ? <p className="mt-4 text-[14px] text-[#ef4444]">{error}</p> : null}

        {step === 1 ? (
          <form className="mt-6 space-y-5" onSubmit={(e) => { e.preventDefault(); if (canContinueStep1) setStep(2); }}>
            <div>
              <label className="block mb-1 text-[14px] font-medium text-[#374151]">Legal company name</label>
              <input className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="Acme Corporation LLC" value={legalName} onChange={(e) => setLegalName(e.target.value)} required />
            </div>
            <div>
              <label className="block mb-1 text-[14px] font-medium text-[#374151]">Industry</label>
              <select className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] bg-white" value={industry} onChange={(e) => setIndustry(e.target.value)} required>
                <option value="">Select industry</option>
                <option value="Technology">Technology</option>
                <option value="Manufacturing">Manufacturing</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Retail">Retail</option>
                <option value="Finance">Finance</option>
                <option value="Education">Education</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-[14px] font-medium text-[#374151]">Street</label>
              <input className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="Street address" value={street} onChange={(e) => setStreet(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-[14px] font-medium text-[#374151]">City/Town</label>
                <input className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="City or town" value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
              <div>
                <label className="block mb-1 text-[14px] font-medium text-[#374151]">State/Province/Region</label>
                <input className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="State/Province/Region" value={region} onChange={(e) => setRegion(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Zip/Postal code</label>
                <input className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="ZIP / Postal code" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} required />
              </div>
              <div>
                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Country</label>
                <input className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Time zone</label>
                <select className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] bg-white" value={timeZone} onChange={(e) => setTimeZone(e.target.value)} required>
                  <option value="">Select time zone</option>
                  <option value="UTC-08:00">UTC-08:00 (Pacific)</option>
                  <option value="UTC-05:00">UTC-05:00 (Eastern)</option>
                  <option value="UTC+00:00">UTC+00:00 (UTC)</option>
                  <option value="UTC+01:00">UTC+01:00 (CET)</option>
                  <option value="UTC+05:30">UTC+05:30 (IST)</option>
                  <option value="UTC+08:00">UTC+08:00 (CST)</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Business registration number/EIN (optional)</label>
                <input className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="EIN / Registration No." value={ein} onChange={(e) => setEin(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div />
              <button disabled={!canContinueStep1} className="inline-flex items-center rounded-md bg-[#1f2937] text-white px-6 py-3 text-[16px] font-medium disabled:opacity-50 hover:bg-[#111827]">Continue</button>
            </div>
          </form>
        ) : step === 2 ? (
          <form className="mt-6 space-y-5" onSubmit={(e) => { e.preventDefault(); if (canContinueStep2) setStep(3); }}>
            <div>
              <label className="block mb-1 text-[14px] font-medium text-[#374151]">Default work week</label>
              <select className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] bg-white" value={workWeek} onChange={(e) => setWorkWeek(e.target.value)} required>
                <option value="">Select</option>
                <option value="5-day">5-day work week (Mon-Fri)</option>
                <option value="6-day">6-day work week</option>
                <option value="custom">Custom schedule</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 text-[14px] font-medium text-[#374151]">Standard working hours</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] bg-white" value={startTime} onChange={(e) => setStartTime(e.target.value)} required>
                  <option value="">Start time</option>
                  {TIME_OPTIONS.map((t) => (
                    <option key={`s-${t}`} value={t}>{t}</option>
                  ))}
                </select>
                <select className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] bg-white" value={endTime} onChange={(e) => setEndTime(e.target.value)} required>
                  <option value="">End time</option>
                  {TIME_OPTIONS.map((t) => (
                    <option key={`e-${t}`} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-[12px] text-[#6b7280]">Select your team&#39;s typical day start and end.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Currency</label>
                <select className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] bg-white" value={currency} onChange={(e) => setCurrency(e.target.value)} required>
                  <option value="">Select currency</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                  <option value="INR">INR</option>
                  <option value="AUD">AUD</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Date format preference</label>
                <select className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] bg-white" value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} required>
                  <option value="">Select format</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button type="button" className="inline-flex items-center rounded-md border border-[#d1d5db] px-6 py-3 text-[16px] text-[#374151] hover:bg-[#f9fafb]" onClick={() => setStep(1)}>Back</button>
              <button type="submit" disabled={!canContinueStep2} className="inline-flex items-center rounded-md bg-[#1f2937] text-white px-6 py-3 text-[16px] font-medium disabled:opacity-50 hover:bg-[#111827]">Continue</button>
            </div>
          </form>
        ) : (
          <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block mb-1 text-[14px] font-medium text-[#374151]">Annual leave entitlement</label>
              <input type="number" min="1" step="1" className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px]" placeholder="e.g., 20" value={annualLeaveEntitlement} onChange={(e) => setAnnualLeaveEntitlement(e.target.value)} required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Probation period duration</label>
                <select className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] bg-white" value={probationPeriod} onChange={(e) => setProbationPeriod(e.target.value)} required>
                  <option value="">Select</option>
                  <option value="1 month">1 month</option>
                  <option value="3 months">3 months</option>
                  <option value="6 months">6 months</option>
                  <option value="9 months">9 months</option>
                  <option value="12 months">12 months</option>
                </select>
              </div>
              <div>
                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Notice period for employees</label>
                <select className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] bg-white" value={noticePeriod} onChange={(e) => setNoticePeriod(e.target.value)} required>
                  <option value="">Select</option>
                  <option value="1 week">1 week</option>
                  <option value="2 weeks">2 weeks</option>
                  <option value="1 month">1 month</option>
                  <option value="2 months">2 months</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <button type="button" className="inline-flex items-center rounded-md border border-[#d1d5db] px-6 py-3 text-[16px] text-[#374151] hover:bg-[#f9fafb]" onClick={() => setStep(2)}>Back</button>
              <button type="submit" disabled={!canSubmit || saving} className="inline-flex items-center rounded-md bg-[#1f2937] text-white px-6 py-3 text-[16px] font-medium disabled:opacity-50 hover:bg-[#111827]">{saving ? "Saving…" : "Finish setup"}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

const TIME_OPTIONS = [
  "06:00 AM","06:30 AM","07:00 AM","07:30 AM","08:00 AM","08:30 AM","09:00 AM","09:30 AM","10:00 AM","10:30 AM",
  "11:00 AM","11:30 AM","12:00 PM","12:30 PM","01:00 PM","01:30 PM","02:00 PM","02:30 PM","03:00 PM","03:30 PM",
  "04:00 PM","04:30 PM","05:00 PM","05:30 PM","06:00 PM","06:30 PM","07:00 PM","07:30 PM","08:00 PM"
];


