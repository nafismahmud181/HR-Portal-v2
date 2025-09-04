"use client";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  collectionGroup,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";

type Department = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  organizationId: string;
  createdAt?: unknown;
};

export default function SettingsPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [listening, setListening] = useState(false);

  // Derive admin's organizationId by reading membership doc
  useEffect(() => {
    let cancelled = false;
    async function resolveOrgId() {
      setLoadingOrg(true);
      try {
        const user = auth.currentUser;
        if (!user) {
          setOrganizationId(null);
          return;
        }
        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid), limit(1));
        const snap = await getDocs(q);
        if (snap.empty) {
          setOrganizationId(null);
          return;
        }
        const doc = snap.docs[0];
        const orgId = doc.ref.parent.parent?.id ?? null;
        if (!cancelled) setOrganizationId(orgId);
      } finally {
        if (!cancelled) setLoadingOrg(false);
      }
    }
    resolveOrgId();
    return () => {
      cancelled = true;
    };
  }, []);

  // Subscribe to departments for this organization
  useEffect(() => {
    if (!organizationId || listening) return;
    const col = collection(db, "departments");
    const q = query(col, where("organizationId", "==", organizationId));
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs
        .map((d: QueryDocumentSnapshot<DocumentData>) => ({
          id: d.id,
          ...(d.data() as Omit<Department, "id">),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setDepartments(rows);
    });
    setListening(true);
    return () => {
      setListening(false);
      unsub();
    };
  }, [db, organizationId, listening]);

  const canSubmit = useMemo(() => {
    return !creating && !!organizationId && name.trim().length > 1;
  }, [creating, organizationId, name]);

  async function handleCreateDepartment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!organizationId) return;
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setError("Department name must be at least 2 characters.");
      return;
    }
    try {
      setCreating(true);
      await addDoc(collection(db, "departments"), {
        name: trimmedName,
        code: code.trim() || undefined,
        description: description.trim() || undefined,
        organizationId,
        createdAt: serverTimestamp(),
      });
      setName("");
      setCode("");
      setDescription("");
      setSuccess("Department created.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create department";
      setError(message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="px-6 py-8">
      <h1 className="text-[20px] font-semibold">Company Settings</h1>
      <p className="mt-2 text-[14px] text-[#6b7280]">Organization profile, policies, and preferences.</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <section className="rounded-lg border border-[#e5e7eb] bg-white">
          <div className="p-5 border-b border-[#e5e7eb]"><h2 className="text-[16px] font-semibold">Create Department</h2></div>
          <form className="p-5 space-y-4" onSubmit={handleCreateDepartment}>
            <div>
              <label className="block text-[13px] text-[#374151]">Name</label>
              <input
                className="mt-1 w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#94a3b8]"
                placeholder="e.g., Engineering"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="block text-[13px] text-[#374151]">Code (optional)</label>
              <input
                className="mt-1 w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#94a3b8]"
                placeholder="e.g., ENG"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[13px] text-[#374151]">Description (optional)</label>
              <textarea
                className="mt-1 w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#94a3b8]"
                placeholder="Short description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={!canSubmit}
                className="rounded-md bg-[#1f2937] text-white px-4 py-2 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#111827]"
              >
                {creating ? "Creating…" : "Create Department"}
              </button>
              {loadingOrg && <span className="text-[12px] text-[#6b7280]">Resolving organization…</span>}
            </div>
            {error && <p className="text-[12px] text-[#dc2626]">{error}</p>}
            {success && <p className="text-[12px] text-[#16a34a]">{success}</p>}
          </form>
        </section>

        <section className="rounded-lg border border-[#e5e7eb] bg-white">
          <div className="p-5 border-b border-[#e5e7eb]"><h2 className="text-[16px] font-semibold">Departments</h2></div>
          <div className="p-5">
            {!organizationId ? (
              <p className="text-[13px] text-[#6b7280]">No organization resolved.</p>
            ) : departments.length === 0 ? (
              <p className="text-[13px] text-[#6b7280]">No departments yet.</p>
            ) : (
              <ul className="divide-y divide-[#e5e7eb]">
                {departments.map((d) => (
                  <li key={d.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-[14px] font-medium">{d.name}</p>
                      {(d.code || d.description) && (
                        <p className="text-[12px] text-[#6b7280]">
                          {d.code ? `${d.code}` : null}
                          {d.code && d.description ? " • " : null}
                          {d.description ? d.description : null}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

