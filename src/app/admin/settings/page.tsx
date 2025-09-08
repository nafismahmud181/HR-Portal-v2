"use client";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
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
  organizationId?: string;
  createdAt?: unknown;
};

type Role = {
  id: string;
  name: string;
  code?: string;
  description?: string;
  createdAt?: unknown;
};

export default function SettingsPage() {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loadingOrg, setLoadingOrg] = useState(true);
  const [organization, setOrganization] = useState<Record<string, unknown> | null>(null);

  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");

  const [roles, setRoles] = useState<Role[]>([]);
  const [roleName, setRoleName] = useState("");
  const [roleCode, setRoleCode] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [creatingRole, setCreatingRole] = useState(false);

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

  // Subscribe to departments for this organization (nested under organizations/{orgId}/departments)
  useEffect(() => {
    if (!organizationId) return;
    // Fetch organization details once
    (async () => {
      try {
        const snap = await getDoc(doc(db, "organizations", organizationId));
        setOrganization(snap.exists() ? (snap.data() as Record<string, unknown>) : null);
      } catch {
        setOrganization(null);
      }
    })();

    const col = collection(db, "organizations", organizationId, "departments");
    const q = query(col);
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs
        .map((d: QueryDocumentSnapshot<DocumentData>) => ({
          id: d.id,
          ...(d.data() as Omit<Department, "id">),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setDepartments(rows);
    });
    return () => {
      unsub();
    };
  }, [organizationId]);

  // Subscribe to roles for the selected department
  useEffect(() => {
    if (!organizationId || !selectedDepartmentId) return;
    const col = collection(db, "organizations", organizationId, "departments", selectedDepartmentId, "roles");
    const q = query(col);
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs
        .map((d: QueryDocumentSnapshot<DocumentData>) => ({
          id: d.id,
          ...(d.data() as Omit<Role, "id">),
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      setRoles(rows);
    });
    return () => {
      unsub();
    };
  }, [organizationId, selectedDepartmentId]);

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
      const payload: Record<string, unknown> = {
        name: trimmedName,
        createdAt: serverTimestamp(),
      };
      const trimmedCode = code.trim();
      if (trimmedCode) payload.code = trimmedCode;
      const trimmedDescription = description.trim();
      if (trimmedDescription) payload.description = trimmedDescription;
      await addDoc(collection(db, "organizations", organizationId, "departments"), payload);
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

  async function handleCreateRole(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!organizationId || !selectedDepartmentId) return;
    const trimmedName = roleName.trim();
    if (trimmedName.length < 2) {
      setError("Role name must be at least 2 characters.");
      return;
    }
    try {
      setCreatingRole(true);
      const payload: Record<string, unknown> = {
        name: trimmedName,
        createdAt: serverTimestamp(),
      };
      const trimmedCode = roleCode.trim();
      if (trimmedCode) payload.code = trimmedCode;
      const trimmedDescription = roleDescription.trim();
      if (trimmedDescription) payload.description = trimmedDescription;
      await addDoc(
        collection(db, "organizations", organizationId, "departments", selectedDepartmentId, "roles"),
        payload
      );
      setRoleName("");
      setRoleCode("");
      setRoleDescription("");
      setSuccess("Role created.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to create role";
      setError(message);
    } finally {
      setCreatingRole(false);
    }
  }

  return (
    <div className="px-6 py-8">
      <div className="flex items-start justify-between gap-6">
        <div>
          <h1 className="text-[20px] font-semibold">Settings</h1>
          <p className="mt-2 text-[14px] text-[#6b7280]">Manage your organization configuration.</p>
        </div>
        <div className="w-full max-w-[360px]">
          <input
            type="search"
            placeholder="Search settings…"
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#94a3b8]"
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-[220px_1fr] gap-6">
        <aside className="sticky top-6 self-start">
          <nav className="text-[14px] space-y-1">
            <a href="#organization" className="block px-2 py-2 rounded hover:bg-[#f9fafb]">Organization</a>
            <a href="#departments" className="block px-2 py-2 rounded hover:bg-[#f9fafb]">Departments</a>
            <a href="#roles" className="block px-2 py-2 rounded hover:bg-[#f9fafb]">Roles</a>
          </nav>
        </aside>

        <div className="space-y-8">
          <section id="organization" className="rounded-lg border border-[#e5e7eb] bg-white">
            <div className="p-5 border-b border-[#e5e7eb]"><h2 className="text-[16px] font-semibold">Organization</h2></div>
            <div className="p-5 space-y-4">
              {organization ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[14px]">
                  <InfoRow label="Legal company name" value={(organization.legalName as string) || (organization.name as string) || "—"} />
                  <InfoRow label="Industry" value={(organization.industry as string) || "—"} />
                  <InfoRow label="Time zone" value={(organization.timeZone as string) || "—"} />
                  <InfoRow label="Business registration / EIN" value={(organization.ein as string) || "—"} />
                  <InfoRow label="Company size" value={(organization.size as string) || (organization.companySize as string) || ((organization.hrConfig as any)?.companySize as string) || "—"} />
                  <InfoRow label="Currency" value={((organization.hrConfig as any)?.currency as string) || "—"} />
                  <InfoRow label="Date format" value={((organization.hrConfig as any)?.dateFormat as string) || "—"} />
                  <InfoRow label="Default work week" value={((organization.hrConfig as any)?.workWeek as string) || "—"} />
                  <InfoRow label="Working hours" value={(() => {
                    const wh = (organization.hrConfig as any)?.workingHours;
                    if (!wh) return "—";
                    if (typeof wh === "string") return wh;
                    const s = wh.start ?? "";
                    const e = wh.end ?? "";
                    return wh.formatted || (s && e ? `${s} – ${e}` : "—");
                  })()} />
                  <div className="md:col-span-2">
                    <div className="text-[13px] text-[#374151] font-medium">Address</div>
                    <div className="mt-1 text-[14px] text-[#111827]">
                      {(() => {
                        const addr = organization.address as Record<string, string> | undefined;
                        if (!addr) return "—";
                        const parts = [addr.street, addr.city, addr.region, addr.postalCode, addr.country].filter(Boolean);
                        return parts.length ? parts.join(", ") : (addr as any)?.formatted || "—";
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-[#6b7280]">Organization profile, policies, and preferences.</p>
              )}
            </div>
          </section>

          <section id="departments" className="rounded-lg border border-[#e5e7eb] bg-white">
            <div className="p-5 border-b border-[#e5e7eb]"><h2 className="text-[16px] font-semibold">Departments</h2></div>
            <div className="p-5 space-y-6">
              <form className="space-y-4" onSubmit={handleCreateDepartment}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
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
                    <input
                      className="mt-1 w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#94a3b8]"
                      placeholder="Short description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedDepartmentId(d.id)}
                          className={`rounded-md border px-3 py-1.5 text-[12px] ${
                            selectedDepartmentId === d.id
                              ? "border-[#1f2937] text-[#1f2937]"
                              : "border-[#d1d5db] text-[#374151] hover:bg-[#f9fafb]"
                          }`}
                        >
                          {selectedDepartmentId === d.id ? "Selected" : "Manage roles"}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          <section id="roles" className="rounded-lg border border-[#e5e7eb] bg-white">
            <div className="p-5 border-b border-[#e5e7eb]"><h2 className="text-[16px] font-semibold">Department Roles</h2></div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-[13px] text-[#374151]">Department</label>
                <select
                  className="mt-1 w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#94a3b8]"
                  value={selectedDepartmentId}
                  onChange={(e) => setSelectedDepartmentId(e.target.value)}
                >
                  <option value="">Select a department…</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <form className="space-y-4" onSubmit={handleCreateRole}>
                <div>
                  <label className="block text-[13px] text-[#374151]">Role name</label>
                  <input
                    className="mt-1 w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#94a3b8]"
                    placeholder="e.g., Senior Engineer"
                    value={roleName}
                    onChange={(e) => setRoleName(e.target.value)}
                    disabled={!selectedDepartmentId}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-[#374151]">Code (optional)</label>
                  <input
                    className="mt-1 w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#94a3b8]"
                    placeholder="e.g., SENG"
                    value={roleCode}
                    onChange={(e) => setRoleCode(e.target.value)}
                    disabled={!selectedDepartmentId}
                  />
                </div>
                <div>
                  <label className="block text-[13px] text-[#374151]">Description (optional)</label>
                  <textarea
                    className="mt-1 w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#94a3b8]"
                    placeholder="Short description"
                    rows={3}
                    value={roleDescription}
                    onChange={(e) => setRoleDescription(e.target.value)}
                    disabled={!selectedDepartmentId}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={creatingRole || !selectedDepartmentId || roleName.trim().length < 2}
                    className="rounded-md bg-[#1f2937] text-white px-4 py-2 text-[14px] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#111827]"
                  >
                    {creatingRole ? "Creating…" : "Create Role"}
                  </button>
                </div>
              </form>

              {!selectedDepartmentId ? (
                <p className="text-[13px] text-[#6b7280]">Select a department to view roles.</p>
              ) : roles.length === 0 ? (
                <p className="text-[13px] text-[#6b7280]">No roles yet.</p>
              ) : (
                <ul className="divide-y divide-[#e5e7eb]">
                  {roles.map((r) => (
                    <li key={r.id} className="py-3">
                      <p className="text-[14px] font-medium">{r.name}</p>
                      {(r.code || r.description) && (
                        <p className="text-[12px] text-[#6b7280]">
                          {r.code ? `${r.code}` : null}
                          {r.code && r.description ? " • " : null}
                          {r.description ? r.description : null}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[13px] text-[#374151] font-medium">{label}</div>
      <div className="mt-1 text-[14px] text-[#111827]">{value || "—"}</div>
    </div>
  );
}

