"use client";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, getDocs, query, where, addDoc, serverTimestamp, doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";

type Employee = {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  department: string;
  jobTitle: string;
  manager: string;
  hireDate: string; // ISO date
  status: "Active" | "Probation" | "Inactive" | "On Leave";
  location: string;
  employeeType: "Full-time" | "Part-time" | "Contract" | "Intern";
  avatarUrl?: string;
  dob?: string; // ISO date for birthday filters
};

// Additional type definitions for nested data structures
interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
}

interface BankDetails {
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  accountType: string;
}

interface EmployeeData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  status: string;
  primaryEmergencyContact?: EmergencyContact;
  secondaryEmergencyContact?: EmergencyContact;
  bankDetails?: BankDetails;
  [key: string]: unknown; // For other dynamic properties
}

type SortKey = keyof Pick<
  Employee,
  | "name"
  | "employeeId"
  | "email"
  | "department"
  | "jobTitle"
  | "manager"
  | "hireDate"
  | "status"
>;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

function statusClasses(status: Employee["status"]) {
  switch (status) {
    case "Active":
      return "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]";
    case "Probation":
      return "bg-[#fffbeb] text-[#b45309] border-[#fde68a]";
    case "Inactive":
      return "bg-[#fef2f2] text-[#b91c1c] border-[#fecaca]";
    case "On Leave":
      return "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]";
    default:
      return "bg-[#f3f4f6] text-[#374151] border-[#e5e7eb]";
  }
}

function IconSearch() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#6b7280]">
      <path d="M21 21L15.8 15.8M18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function IconChevron({ dir = "down" }: { dir?: "up" | "down" }) {
  return (
    <svg width="12" height="12" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="inline-block">
      {dir === "down" ? (
        <path d="M5 7l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      ) : (
        <path d="M5 13l5-5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      )}
    </svg>
  );
}

// Removed unused MOCK_EMPLOYEES to satisfy linter in CI

export default function EmployeesPage() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importError, setImportError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importColumns, setImportColumns] = useState<string[]>([]);
  const [importRows, setImportRows] = useState<Array<Record<string, unknown>>>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({
    name: "",
    email: "",
    department: "",
    jobTitle: "",
    employeeType: "",
    status: "",
    location: "",
    phoneNumber: "",
    dob: "",
  });
  const [departments, setDepartments] = useState<Array<{ id: string; name: string }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [newEmpName, setNewEmpName] = useState("");
  const [newEmpEmail, setNewEmpEmail] = useState("");
  const [newEmpDepartmentId, setNewEmpDepartmentId] = useState("");
  const [newEmpRoleId, setNewEmpRoleId] = useState("");
  const [newEmpType, setNewEmpType] = useState<Employee["employeeType"]>("Full-time");
  const [newEmpStatus, setNewEmpStatus] = useState<Employee["status"]>("Active");
  const [newEmpLocation, setNewEmpLocation] = useState("");
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    department: "All",
    location: "All",
    status: "All",
    employeeType: "All",
  });
  const [quick, setQuick] = useState<"All" | "New Hires" | "Birthday This Month" | "On Leave">("All");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const pageSize = 10;
  
  // View Profile modal state
  const [viewOpen, setViewOpen] = useState(false);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewTab, setViewTab] = useState<"personal" | "employment" | "documents" | "emergency" | "bank" | "history">("personal");
  const [viewEmpId, setViewEmpId] = useState<string | null>(null);
  const [viewEmp, setViewEmp] = useState<Record<string, unknown> | null>(null);
  const [viewError, setViewError] = useState("");
  const [savingView, setSavingView] = useState(false);
  const [deletingEmpId, setDeletingEmpId] = useState<string | null>(null);
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setEmployees([]);
        setLoading(false);
        return;
      }
      try {
        // Find org for current user
        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (snap.empty) {
          setEmployees([]);
          return;
        }
        const ref = snap.docs[0].ref;
        const parentOrg = ref.parent.parent;
        const foundOrgId = parentOrg ? parentOrg.id : null;
        setOrgId(foundOrgId);
        if (!foundOrgId) {
          setEmployees([]);
          return;
        }
        const empCol = collection(db, "organizations", foundOrgId, "employees");
        const empSnap = await getDocs(empCol);
        type FirestoreTimestampLike = { toDate?: () => Date } | string | null | undefined;
        const toIso = (v: FirestoreTimestampLike): string => {
          if (!v) return "";
          if (typeof v === "string") return v;
          if (typeof v.toDate === "function") return v.toDate()!.toISOString();
          return String(v as unknown);
        };
        const list: Employee[] = empSnap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            name: (data["name"] as string) ?? "",
            employeeId: (data["employeeId"] as string) ?? d.id,
            email: (data["email"] as string) ?? "",
            department: (data["department"] as string) ?? "",
            jobTitle: (data["jobTitle"] as string) ?? "",
            manager: (data["manager"] as string) ?? "",
            hireDate: toIso(data["hireDate"] as FirestoreTimestampLike),
            status: (data["status"] as Employee["status"]) ?? "Active",
            location: (data["location"] as string) ?? "",
            employeeType: (data["employeeType"] as Employee["employeeType"]) ?? "Full-time",
            avatarUrl: data["avatarUrl"] as string | undefined,
            dob: ((): string | undefined => {
              const v = toIso(data["dob"] as FirestoreTimestampLike);
              return v || undefined;
            })(),
          } as Employee;
        });
        setEmployees(list);
        // Invites tracking moved to Admin → Invites page
      } catch {
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  // Load departments when modal opens
  useEffect(() => {
    async function loadDepartments() {
      if (!addOpen || !orgId) return;
      try {
        const depCol = collection(db, "organizations", orgId, "departments");
        const depSnap = await getDocs(depCol);
        const list: Array<{ id: string; name: string }>= depSnap.docs.map((d) => {
          const data = d.data() as { name?: string };
          return { id: d.id, name: data?.name ?? d.id };
        });
        setDepartments(list);
      } catch {
        setDepartments([]);
      }
    }
    loadDepartments();
  }, [addOpen, orgId]);

  // Load roles when department changes
  useEffect(() => {
    async function loadRoles() {
      if (!addOpen || !orgId || !newEmpDepartmentId) {
        setRoles([]);
        return;
      }
      try {
        const rolesCol = collection(db, "organizations", orgId, "roles");
        const rolesSnap = await getDocs(rolesCol);
        const list: Array<{ id: string; name: string }> = rolesSnap.docs
          .map((d) => {
            const data = d.data() as { title?: string; departmentIds?: string[]; primaryDepartmentId?: string; status?: string };
            return { 
              id: d.id, 
              name: data?.title ?? d.id,
              departmentIds: data?.departmentIds ?? [],
              primaryDepartmentId: data?.primaryDepartmentId,
              status: data?.status ?? "draft"
            };
          })
          .filter((role) => 
            (role.departmentIds.includes(newEmpDepartmentId) || 
            role.primaryDepartmentId === newEmpDepartmentId) &&
            role.status === "active"
          )
          .map((role) => ({ id: role.id, name: role.name }));
        setRoles(list);
      } catch {
        setRoles([]);
      }
    }
    loadRoles();
  }, [addOpen, orgId, newEmpDepartmentId]);

  async function handleAddEmployee(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!orgId) {
      setFormError("No organization context.");
      return;
    }
    if (!newEmpName || !newEmpEmail || !newEmpDepartmentId || !newEmpRoleId) {
      setFormError("Please fill all required fields.");
      return;
    }
    setSaving(true);
    try {
      const dept = departments.find((d) => d.id === newEmpDepartmentId);
      const role = roles.find((r) => r.id === newEmpRoleId);
      await addDoc(collection(db, "organizations", orgId, "employees"), {
        name: newEmpName,
        email: newEmpEmail.trim().toLowerCase(),
        departmentId: newEmpDepartmentId,
        department: dept?.name ?? "",
        roleId: newEmpRoleId,
        jobTitle: role?.name ?? "",
        location: newEmpLocation,
        employeeType: newEmpType,
        status: newEmpStatus,
        manager: "",
        hireDate: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      // Refresh list
      const empCol = collection(db, "organizations", orgId, "employees");
      const empSnap = await getDocs(empCol);
      type FirestoreTimestampLike = { toDate?: () => Date } | string | null | undefined;
      const toIso = (v: FirestoreTimestampLike): string => {
        if (!v) return "";
        if (typeof v === "string") return v;
        const maybeTs = v as { toDate?: () => Date };
        if (typeof maybeTs.toDate === "function") return maybeTs.toDate()!.toISOString();
        return String(v as unknown);
      };
      const list: Employee[] = empSnap.docs.map((d) => {
        const data = d.data() as Record<string, unknown>;
        return {
          id: d.id,
          name: (data["name"] as string) ?? "",
          employeeId: (data["employeeId"] as string) ?? d.id,
          email: (data["email"] as string) ?? "",
          department: (data["department"] as string) ?? "",
          jobTitle: (data["jobTitle"] as string) ?? "",
          manager: (data["manager"] as string) ?? "",
          hireDate: toIso(data["hireDate"] as FirestoreTimestampLike),
          status: (data["status"] as Employee["status"]) ?? "Active",
          location: (data["location"] as string) ?? "",
          employeeType: (data["employeeType"] as Employee["employeeType"]) ?? "Full-time",
          avatarUrl: data["avatarUrl"] as string | undefined,
          dob: ((): string | undefined => {
            const v = toIso(data["dob"] as FirestoreTimestampLike);
            return v || undefined;
          })(),
        } as Employee;
      });
      setEmployees(list);
      // Close modal and reset
      setAddOpen(false);
      setNewEmpName("");
      setNewEmpEmail("");
      setNewEmpDepartmentId("");
      setNewEmpRoleId("");
      setNewEmpType("Full-time");
      setNewEmpStatus("Active");
      setNewEmpLocation("");
      setRoles([]);
      setDepartments([]);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Failed to add employee");
    } finally {
      setSaving(false);
    }
  }

  const stats = useMemo(() => {
    const total = employees.length;
    const now = new Date();
    const newHires = employees.filter((e) => {
      const d = new Date(e.hireDate);
      const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    }).length;
    const onLeave = employees.filter((e) => e.status === "On Leave").length;
    const pending = employees.filter((e) => e.status === "Probation").length;
    return { total, newHires, onLeave, pending };
  }, [employees]);

  const options = useMemo(() => {
    const depts = Array.from(new Set(employees.map((e) => e.department)));
    const locs = Array.from(new Set(employees.map((e) => e.location)));
    const statuses = ["Active", "Probation", "Inactive", "On Leave"] as const;
    const types = Array.from(new Set(employees.map((e) => e.employeeType)));
    return { depts, locs, statuses, types };
  }, [employees]);

  const filtered = useMemo(() => {
    let list = [...employees];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((e) =>
        [e.name, e.email, e.department, e.jobTitle, e.manager, e.employeeId]
          .join("|")
          .toLowerCase()
          .includes(q)
      );
    }
    if (filters.department !== "All") list = list.filter((e) => e.department === filters.department);
    if (filters.location !== "All") list = list.filter((e) => e.location === filters.location);
    if (filters.status !== "All") list = list.filter((e) => e.status === filters.status);
    if (filters.employeeType !== "All") list = list.filter((e) => e.employeeType === filters.employeeType);
    if (quick === "New Hires") {
      const now = new Date();
      list = list.filter((e) => {
        const d = new Date(e.hireDate);
        const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 30;
      });
    } else if (quick === "Birthday This Month") {
      const m = new Date().getMonth();
      list = list.filter((e) => (e.dob ? new Date(e.dob).getMonth() === m : false));
    } else if (quick === "On Leave") {
      list = list.filter((e) => e.status === "On Leave");
    }
    list.sort((a, b) => {
      const va = a[sortKey];
      const vb = b[sortKey];
      let res = 0;
      if (sortKey === "hireDate") {
        res = new Date(va as string).getTime() - new Date(vb as string).getTime();
      } else {
        res = String(va).localeCompare(String(vb));
      }
      return sortDir === "asc" ? res : -res;
    });
    return list;
  }, [employees, search, filters, quick, sortKey, sortDir]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const paginated = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  useEffect(() => {
    // Reset selection when page/filter changes
    setSelected(new Set());
    setPage(1);
  }, [search, filters, quick]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function toggleSelectAll() {
    if (paginated.length === 0) return;
    const allIds = paginated.map((e) => e.id);
    const allSelected = allIds.every((id) => selected.has(id));
    if (allSelected) {
      const next = new Set(selected);
      allIds.forEach((id) => next.delete(id));
      setSelected(next);
    } else {
      const next = new Set(selected);
      allIds.forEach((id) => next.add(id));
      setSelected(next);
    }
  }

  function toggleSelect(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  }

  async function deleteEmployee(employeeId: string) {
    if (!orgId) return;
    const confirmed = typeof window === "undefined" ? true : window.confirm("Delete this employee record? This cannot be undone.");
    if (!confirmed) return;
    setDeletingEmpId(employeeId);
    try {
      // Delete employee directory record
      await deleteDoc(doc(db, "organizations", orgId, "employees", employeeId));
      // Attempt to delete membership if it uses same id
      try {
        const userRef = doc(db, "organizations", orgId, "users", employeeId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) await deleteDoc(userRef);
      } catch {}
      setEmployees((list) => list.filter((e) => e.id !== employeeId));
    } finally {
      setDeletingEmpId(null);
    }
  }

  const openEditModal = async (empId: string) => {
    if (!orgId) return;
    setIsEditMode(true);
    setViewEmpId(empId);
    setViewTab("personal");
    setViewError("");
    setViewLoading(true);
    try {
      const empRef = doc(db, "organizations", orgId, "employees", empId);
      const empSnap = await getDoc(empRef);
      setViewEmp(empSnap.exists() ? (empSnap.data() as Record<string, unknown>) : null);
    } catch (err: unknown) {
      setViewError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setViewLoading(false);
    }
    setViewOpen(true);
  };

  return (
    <div className="px-6 py-8">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[22px] font-semibold">Employees</h1>
            <span className="text-[12px] px-2.5 py-1 rounded-full border border-[#e5e7eb] text-[#374151] bg-white">{stats.total}</span>
          </div>
          <p className="mt-1 text-[14px] text-[#6b7280]">Manage employee records and onboarding.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/employees/invite" className="rounded-md border border-[#d1d5db] px-4 py-2 text-[14px] hover:bg-[#f9fafb]">Invite Employee</Link>
          <button className="rounded-md bg-[#1f2937] text-white px-4 py-2 text-[14px] hover:bg-[#111827]" onClick={() => setAddOpen(true)}>Add Employee</button>
          <button className="rounded-md border border-[#d1d5db] px-4 py-2 text-[14px] hover:bg-[#f9fafb]" onClick={() => { setImportOpen(true); setImportError(""); }}>Bulk Import</button>
          <button className="rounded-md border border-[#d1d5db] px-4 py-2 text-[14px] hover:bg-[#f9fafb]">Export</button>
          <button className="rounded-md border border-[#d1d5db] px-4 py-2 text-[14px] hover:bg-[#f9fafb]">Organization Chart</button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Employees", value: stats.total },
          { label: "New Hires", value: stats.newHires },
          { label: "On Leave Today", value: stats.onLeave },
          { label: "Pending Actions", value: stats.pending },
        ].map((s) => (
          <div key={s.label} className="rounded-lg border border-[#e5e7eb] bg-white p-4">
            <p className="text-[12px] text-[#6b7280]">{s.label}</p>
            <p className="mt-1 text-[22px] font-semibold">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search and filters */}
      <div className="mt-8 flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 rounded-md border border-[#d1d5db] px-3 py-2 bg-white">
            <IconSearch />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="flex-1 outline-none text-[14px]"
            />
          </div>
          <select
            className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white"
            value={filters.department}
            onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value }))}
          >
            <option>All</option>
            {options.depts.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select
            className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white"
            value={filters.location}
            onChange={(e) => setFilters((f) => ({ ...f, location: e.target.value }))}
          >
            <option>All</option>
            {options.locs.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select
            className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white"
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
          >
            <option>All</option>
            {options.statuses.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <select
            className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white"
            value={filters.employeeType}
            onChange={(e) => setFilters((f) => ({ ...f, employeeType: e.target.value }))}
          >
            <option>All</option>
            {options.types.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {["All", "New Hires", "Birthday This Month", "On Leave"].map((q) => (
            <button
              key={q}
              onClick={() => setQuick(q as typeof quick)}
              className={`px-3 py-1.5 rounded-md text-[13px] border ${quick === q ? "bg-[#f97316]/10 text-[#1f2937] border-[#f97316]/30" : "border-[#d1d5db] text-[#374151] hover:bg-[#f9fafb]"}`}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Pending Invites section removed; see Admin → Invites */}

      {/* Loading skeleton */}
      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-md bg-[#f3f4f6] animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="mt-6 overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white">
            <table className="hidden md:table w-full text-left">
              <thead className="text-[12px] text-[#6b7280]">
                <tr>
                  <th className="w-10 px-3 py-2">
                    <input type="checkbox" onChange={toggleSelectAll} checked={paginated.length > 0 && paginated.every((e) => selected.has(e.id))} />
                  </th>
                  {[
                    { key: "name", label: "Employee" },
                    { key: "email", label: "Email" },
                    { key: "department", label: "Department" },
                    { key: "jobTitle", label: "Job Title" },
                    { key: "manager", label: "Manager" },
                    { key: "hireDate", label: "Hire Date" },
                    { key: "status", label: "Status" },
                  ].map((col) => (
                    <th key={col.key} className="px-3 py-2 cursor-pointer select-none" onClick={() => toggleSort(col.key as SortKey)}>
                      <span className="inline-flex items-center gap-1">
                        {col.label}
                        {sortKey === col.key ? <IconChevron dir={sortDir === "asc" ? "up" : "down"} /> : null}
                      </span>
                    </th>
                  ))}
                  <th className="px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[14px]">
                {paginated.map((e) => (
                  <tr key={e.id} className="hover:bg-[#f9fafb]">
                    <td className="px-3 py-3 align-middle">
                      <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} />
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <div className="flex items-center gap-3">
                        {e.avatarUrl ? (
                          <Image src={e.avatarUrl} alt={e.name} width={36} height={36} className="h-9 w-9 rounded-full object-cover" unoptimized />
                        ) : (
                          <div className="h-9 w-9 rounded-full grid place-items-center text-[12px] font-medium text-white" style={{ backgroundColor: "#4f46e5" }}>
                            {getInitials(e.name)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{e.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 align-middle">{e.email}</td>
                    <td className="px-3 py-3 align-middle">{e.department}</td>
                    <td className="px-3 py-3 align-middle">{e.jobTitle}</td>
                    <td className="px-3 py-3 align-middle">{e.manager}</td>
                    <td className="px-3 py-3 align-middle">{new Date(e.hireDate).toLocaleDateString()}</td>
                    <td className="px-3 py-3 align-middle">
                      <span className={`text-[12px] px-2 py-1 rounded-full border ${statusClasses(e.status)}`}>{e.status}</span>
                    </td>
                    <td className="px-3 py-3 align-middle">
                      <div className="flex items-center gap-2">
                        <button className="text-[#374151] hover:underline" onClick={async () => {
                          if (!orgId) return;
                          setIsEditMode(false);
                          setViewTab("personal");
                          setViewError("");
                          setViewLoading(true);
                          setViewOpen(true);
                          setViewEmpId(e.id);
                          try {
                            const empRef = doc(db, "organizations", orgId, "employees", e.id);
                            const empSnap = await getDoc(empRef);
                            setViewEmp(empSnap.exists() ? (empSnap.data() as Record<string, unknown>) : null);
                          } catch (err: unknown) {
                            setViewError(err instanceof Error ? err.message : "Failed to load profile");
                          } finally {
                            setViewLoading(false);
                          }
                        }}>View</button>
                        <button className="text-[#374151] hover:underline" onClick={() => openEditModal(e.id)}>Edit</button>
                        <button className="text-[#b91c1c] hover:underline" disabled={deletingEmpId === e.id} onClick={() => deleteEmployee(e.id)}>{deletingEmpId === e.id ? "Deleting…" : "Delete"}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile stacked list */}
            <div className="md:hidden divide-y divide-[#e5e7eb]">
              {paginated.map((e) => (
                <div key={e.id} className="p-4 bg-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={selected.has(e.id)} onChange={() => toggleSelect(e.id)} />
                      {e.avatarUrl ? (
                        <Image src={e.avatarUrl} alt={e.name} width={32} height={32} className="h-8 w-8 rounded-full object-cover" unoptimized />
                      ) : (
                        <div className="h-8 w-8 rounded-full grid place-items-center text-[11px] font-medium text-white" style={{ backgroundColor: "#4f46e5" }}>
                          {getInitials(e.name)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-[14px]">{e.name}</div>
                      </div>
                    </div>
                    <span className={`text-[12px] px-2 py-1 rounded-full border ${statusClasses(e.status)}`}>{e.status}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-[#374151]">
                    <div><span className="text-[#6b7280]">Email:</span> {e.email}</div>
                    <div><span className="text-[#6b7280]">Department:</span> {e.department}</div>
                    <div><span className="text-[#6b7280]">Title:</span> {e.jobTitle}</div>
                    <div><span className="text-[#6b7280]">Manager:</span> {e.manager}</div>
                    <div><span className="text-[#6b7280]">Hire Date:</span> {new Date(e.hireDate).toLocaleDateString()}</div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button className="text-[#374151] hover:underline" onClick={async () => {
                      if (!orgId) return;
                      setIsEditMode(false);
                      setViewTab("personal");
                      setViewError("");
                      setViewLoading(true);
                      setViewOpen(true);
                      setViewEmpId(e.id);
                      try {
                        const empRef = doc(db, "organizations", orgId, "employees", e.id);
                        const empSnap = await getDoc(empRef);
                        setViewEmp(empSnap.exists() ? (empSnap.data() as Record<string, unknown>) : null);
                      } catch (err: unknown) {
                        setViewError(err instanceof Error ? err.message : "Failed to load profile");
                      } finally {
                        setViewLoading(false);
                      }
                    }}>View</button>
                    <button className="text-[#374151] hover:underline" onClick={() => openEditModal(e.id)}>Edit</button>
                    <button className="text-[#b91c1c] hover:underline" disabled={deletingEmpId === e.id} onClick={() => deleteEmployee(e.id)}>{deletingEmpId === e.id ? "Deleting…" : "Delete"}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bulk actions */}
          {selected.size > 0 ? (
            <div className="sticky bottom-3 mt-4 flex flex-wrap items-center gap-2 rounded-md border border-[#e5e7eb] bg-white px-3 py-2 shadow-sm">
              <span className="text-[13px] text-[#374151]">{selected.size} selected</span>
              <div className="h-4 w-px bg-[#e5e7eb]" />
              <button className="rounded-md border border-[#d1d5db] px-3 py-1.5 text-[13px] hover:bg-[#f9fafb]">Send Email</button>
              <button className="rounded-md border border-[#d1d5db] px-3 py-1.5 text-[13px] hover:bg-[#f9fafb]">Export</button>
              <button className="rounded-md border border-[#d1d5db] px-3 py-1.5 text-[13px] hover:bg-[#f9fafb]">Add Tags</button>
              <button className="rounded-md border border-[#d1d5db] px-3 py-1.5 text-[13px] hover:bg-[#f9fafb]">Change Department</button>
            </div>
          ) : null}

          {/* Pagination */}
          <div className="mt-6 flex items-center justify-between">
            <p className="text-[12px] text-[#6b7280]">
              Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border border-[#d1d5db] px-3 py-1.5 text-[13px] hover:bg-[#f9fafb] disabled:opacity-50"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className="text-[12px] text-[#374151]">Page {currentPage} of {pageCount}</span>
              <button
                className="rounded-md border border-[#d1d5db] px-3 py-1.5 text-[13px] hover:bg-[#f9fafb] disabled:opacity-50"
                disabled={currentPage >= pageCount}
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
      {/* Employee Profile Modal */}
      {viewOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => (!savingView ? setViewOpen(false) : null)} />
          <div className="relative bg-white rounded-lg shadow-lg w-[95vw] max-w-[1024px] border border-[#e5e7eb]">
            <div className="p-5 border-b border-[#e5e7eb] flex items-center justify-between">
              <h2 className="text-[16px] font-semibold">{isEditMode ? "Edit Employee Profile" : "Employee Profile"}</h2>
              <button className="text-[14px] text-[#374151]" onClick={() => (!savingView ? setViewOpen(false) : null)}>Close</button>
            </div>

            <div className="p-5">
              {/* Tabs */}
              <div className="flex flex-wrap gap-2 border-b border-[#e5e7eb] pb-2">
                {[
                  { key: "personal", label: "Personal Information (Editable by HR)" },
                  { key: "employment", label: "Employment Details" },
                  { key: "documents", label: "Documents" },
                  { key: "emergency", label: "Emergency Contacts" },
                  { key: "bank", label: "Bank Details" },
                  { key: "history", label: "History & Activities" },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setViewTab(t.key as typeof viewTab)}
                    className={`px-3 py-1.5 rounded-md text-[13px] border ${viewTab === t.key ? "bg-[#f97316]/10 text-[#1f2937] border-[#f97316]/30" : "border-[#d1d5db] text-[#374151] hover:bg-[#f9fafb]"}`}
                  >{t.label}</button>
                ))}
              </div>

              {/* Content */}
              {viewLoading ? (
                <div className="mt-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 rounded-md bg-[#f3f4f6] animate-pulse" />
                  ))}
                </div>
              ) : viewEmp ? (
                <div className="mt-5">
                  {viewTab === "personal" ? (
                    isEditMode ? (
                      <form
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!orgId || !viewEmpId) return;
                          setViewError("");
                          setSavingView(true);
                          try {
                            const empRef = doc(db, "organizations", orgId, "employees", viewEmpId);
                            await updateDoc(empRef, {
                              name: (viewEmp["name"] as string) ?? "",
                              email: (viewEmp["email"] as string) ?? "",
                              phoneNumber: (viewEmp["phoneNumber"] as string) ?? "",
                              dob: (viewEmp["dob"] as string) ?? "",
                              nidNumber: (viewEmp["nidNumber"] as string) ?? "",
                              passportNumber: (viewEmp["passportNumber"] as string) ?? "",
                              presentAddress: (viewEmp["presentAddress"] as string) ?? "",
                            });
                          } catch (err: unknown) {
                            setViewError(err instanceof Error ? err.message : "Failed to save");
                          } finally {
                            setSavingView(false);
                          }
                        }}
                      >
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Full name</label>
                          <input value={(viewEmp["name"] as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), name: e.target.value })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Email</label>
                          <input type="email" value={(viewEmp["email"] as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), email: e.target.value })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Phone</label>
                          <input value={(viewEmp["phoneNumber"] as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), phoneNumber: e.target.value })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Date of Birth</label>
                          <input type="date" value={(viewEmp["dob"] as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), dob: e.target.value })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">NID Number</label>
                          <input value={(viewEmp["nidNumber"] as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), nidNumber: e.target.value })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Passport Number</label>
                          <input value={(viewEmp["passportNumber"] as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), passportNumber: e.target.value })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
                        </div>
                        <div className="md:col-span-2">
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Present Address</label>
                          <textarea value={(viewEmp["presentAddress"] as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), presentAddress: e.target.value })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] min-h-[90px]" />
                        </div>
                        {viewError ? <p className="md:col-span-2 text-[13px] text-[#b91c1c]">{viewError}</p> : null}
                        <div className="md:col-span-2 flex items-center justify-end gap-2">
                          <button type="submit" className="rounded-md bg-[#1f2937] text-white px-4 py-2 text-[14px] hover:bg-[#111827] disabled:opacity-60" disabled={savingView}>{savingView ? "Saving…" : "Save"}</button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Full name</label>
                          <p className="text-[14px] text-[#374151]">{(viewEmp["name"] as string) || "—"}</p>
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Email</label>
                          <p className="text-[14px] text-[#374151]">{(viewEmp["email"] as string) || "—"}</p>
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Phone</label>
                          <p className="text-[14px] text-[#374151]">{(viewEmp["phoneNumber"] as string) || "—"}</p>
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Date of Birth</label>
                          <p className="text-[14px] text-[#374151]">{(viewEmp["dob"] as string) || "—"}</p>
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">NID Number</label>
                          <p className="text-[14px] text-[#374151]">{(viewEmp["nidNumber"] as string) || "—"}</p>
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Passport Number</label>
                          <p className="text-[14px] text-[#374151]">{(viewEmp["passportNumber"] as string) || "—"}</p>
                        </div>
                        <div className="md:col-span-2">
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Present Address</label>
                          <p className="text-[14px] text-[#374151]">{(viewEmp["presentAddress"] as string) || "—"}</p>
                        </div>
                      </div>
                    )
                  ) : null}

                  {viewTab === "employment" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { label: "Department", key: "department" },
                        { label: "Role", key: "jobTitle" },
                        { label: "Employment Type", key: "employeeType" },
                        { label: "Status", key: "status" },
                        { label: "Manager", key: "manager" },
                        { label: "Hire Date", key: "hireDate" },
                        { label: "Location", key: "location" },
                      ].map((r) => (
                        <div key={r.key}>
                          <p className="text-[12px] text-[#6b7280]">{r.label}</p>
                          <p className="mt-1 text-[14px]">{String((viewEmp as Record<string, unknown>)[r.key] ?? "—")}</p>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {viewTab === "documents" ? (
                    <div className="text-[14px] text-[#6b7280]">Documents module coming soon.</div>
                  ) : null}

                  {viewTab === "emergency" ? (
                    isEditMode ? (
                      <form
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!orgId || !viewEmpId) return;
                          setViewError("");
                          setSavingView(true);
                          try {
                            const empRef = doc(db, "organizations", orgId, "employees", viewEmpId);
                            await updateDoc(empRef, {
                              primaryEmergencyContact: {
                                name: ((viewEmp["primaryEmergencyContact"] as EmergencyContact)?.name as string) ?? "",
                                relationship: ((viewEmp["primaryEmergencyContact"] as EmergencyContact)?.relationship as string) ?? "",
                                phone: ((viewEmp["primaryEmergencyContact"] as EmergencyContact)?.phone as string) ?? "",
                                email: ((viewEmp["primaryEmergencyContact"] as EmergencyContact)?.email as string) ?? "",
                              },
                              secondaryEmergencyContact: {
                                name: ((viewEmp["secondaryEmergencyContact"] as EmergencyContact)?.name as string) ?? "",
                                relationship: ((viewEmp["secondaryEmergencyContact"] as EmergencyContact)?.relationship as string) ?? "",
                                phone: ((viewEmp["secondaryEmergencyContact"] as EmergencyContact)?.phone as string) ?? "",
                                email: ((viewEmp["secondaryEmergencyContact"] as EmergencyContact)?.email as string) ?? "",
                              },
                            });
                          } catch (err: unknown) {
                            setViewError(err instanceof Error ? err.message : "Failed to save");
                          } finally {
                            setSavingView(false);
                          }
                        }}
                      >
                        <div className="md:col-span-2">
                          <h3 className="text-[16px] font-medium mb-3">Primary Emergency Contact</h3>
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Name</label>
                          <input value={((viewEmp["primaryEmergencyContact"] as EmergencyContact)?.name as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), primaryEmergencyContact: { ...((viewEmp["primaryEmergencyContact"] as EmergencyContact) || {}), name: e.target.value } })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Phone</label>
                          <input value={((viewEmp["primaryEmergencyContact"] as EmergencyContact)?.phone as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), primaryEmergencyContact: { ...((viewEmp["primaryEmergencyContact"] as EmergencyContact) || {}), phone: e.target.value } })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Relationship</label>
                          <input value={((viewEmp["primaryEmergencyContact"] as EmergencyContact)?.relationship as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), primaryEmergencyContact: { ...((viewEmp["primaryEmergencyContact"] as EmergencyContact) || {}), relationship: e.target.value } })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Email</label>
                          <input value={((viewEmp["primaryEmergencyContact"] as EmergencyContact)?.email as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), primaryEmergencyContact: { ...((viewEmp["primaryEmergencyContact"] as EmergencyContact) || {}), email: e.target.value } })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
                        </div>
                        
                        <div className="md:col-span-2">
                          <h3 className="text-[16px] font-medium mb-3 mt-6">Secondary Emergency Contact</h3>
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Name</label>
                          <input value={((viewEmp["secondaryEmergencyContact"] as EmergencyContact)?.name as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), secondaryEmergencyContact: { ...((viewEmp["secondaryEmergencyContact"] as EmergencyContact) || {}), name: e.target.value } })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Phone</label>
                          <input value={((viewEmp["secondaryEmergencyContact"] as EmergencyContact)?.phone as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), secondaryEmergencyContact: { ...((viewEmp["secondaryEmergencyContact"] as EmergencyContact) || {}), phone: e.target.value } })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Relationship</label>
                          <input value={((viewEmp["secondaryEmergencyContact"] as EmergencyContact)?.relationship as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), secondaryEmergencyContact: { ...((viewEmp["secondaryEmergencyContact"] as EmergencyContact) || {}), relationship: e.target.value } })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Email</label>
                          <input value={((viewEmp["secondaryEmergencyContact"] as EmergencyContact)?.email as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), secondaryEmergencyContact: { ...((viewEmp["secondaryEmergencyContact"] as EmergencyContact) || {}), email: e.target.value } })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
                        </div>
                        
                        {viewError ? <p className="md:col-span-2 text-[13px] text-[#b91c1c]">{viewError}</p> : null}
                        <div className="md:col-span-2 flex items-center justify-end gap-2">
                          <button type="submit" className="rounded-md bg-[#1f2937] text-white px-4 py-2 text-[14px] hover:bg-[#111827] disabled:opacity-60" disabled={savingView}>{savingView ? "Saving…" : "Save"}</button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-[16px] font-medium mb-3">Primary Emergency Contact</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block mb-1 text-[14px] font-medium text-[#374151]">Name</label>
                              <p className="text-[14px] text-[#374151]">{((viewEmp["primaryEmergencyContact"] as EmergencyContact)?.name as string) || "—"}</p>
                            </div>
                            <div>
                              <label className="block mb-1 text-[14px] font-medium text-[#374151]">Phone</label>
                              <p className="text-[14px] text-[#374151]">{((viewEmp["primaryEmergencyContact"] as EmergencyContact)?.phone as string) || "—"}</p>
                            </div>
                            <div>
                              <label className="block mb-1 text-[14px] font-medium text-[#374151]">Relationship</label>
                              <p className="text-[14px] text-[#374151]">{((viewEmp["primaryEmergencyContact"] as EmergencyContact)?.relationship as string) || "—"}</p>
                            </div>
                            <div>
                              <label className="block mb-1 text-[14px] font-medium text-[#374151]">Email</label>
                              <p className="text-[14px] text-[#374151]">{((viewEmp["primaryEmergencyContact"] as EmergencyContact)?.email as string) || "—"}</p>
                            </div>
                          </div>
                        </div>
                        
                        {((viewEmp["secondaryEmergencyContact"] as EmergencyContact)?.name as string) && (
                          <div>
                            <h3 className="text-[16px] font-medium mb-3">Secondary Emergency Contact</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Name</label>
                                <p className="text-[14px] text-[#374151]">{((viewEmp["secondaryEmergencyContact"] as EmergencyContact)?.name as string) || "—"}</p>
                              </div>
                              <div>
                                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Phone</label>
                                <p className="text-[14px] text-[#374151]">{((viewEmp["secondaryEmergencyContact"] as EmergencyContact)?.phone as string) || "—"}</p>
                              </div>
                              <div>
                                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Relationship</label>
                                <p className="text-[14px] text-[#374151]">{((viewEmp["secondaryEmergencyContact"] as EmergencyContact)?.relationship as string) || "—"}</p>
                              </div>
                              <div>
                                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Email</label>
                                <p className="text-[14px] text-[#374151]">{((viewEmp["secondaryEmergencyContact"] as EmergencyContact)?.email as string) || "—"}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  ) : null}

                  {viewTab === "bank" ? (
                    isEditMode ? (
                      <form
                        className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        onSubmit={async (e) => {
                          e.preventDefault();
                          if (!orgId || !viewEmpId) return;
                          setViewError("");
                          setSavingView(true);
                          try {
                            const empRef = doc(db, "organizations", orgId, "employees", viewEmpId);
                            await updateDoc(empRef, {
                              bankDetails: {
                                bankName: ((viewEmp["bankDetails"] as BankDetails)?.bankName as string) ?? "",
                                accountNumber: ((viewEmp["bankDetails"] as BankDetails)?.accountNumber as string) ?? "",
                                routingNumber: ((viewEmp["bankDetails"] as BankDetails)?.routingNumber as string) ?? "",
                                accountType: ((viewEmp["bankDetails"] as BankDetails)?.accountType as string) ?? "",
                              },
                            });
                          } catch (err: unknown) {
                            setViewError(err instanceof Error ? err.message : "Failed to save");
                          } finally {
                            setSavingView(false);
                          }
                        }}
                      >
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Bank Name</label>
                          <input value={((viewEmp["bankDetails"] as BankDetails)?.bankName as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), bankDetails: { ...((viewEmp["bankDetails"] as BankDetails) || {}), bankName: e.target.value } })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Account Number</label>
                          <input value={((viewEmp["bankDetails"] as BankDetails)?.accountNumber as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), bankDetails: { ...((viewEmp["bankDetails"] as BankDetails) || {}), accountNumber: e.target.value } })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Account Type</label>
                          <select
                            value={((viewEmp["bankDetails"] as BankDetails)?.accountType as string) || ""}
                            onChange={(e) => setViewEmp({ ...(viewEmp || {}), bankDetails: { ...((viewEmp["bankDetails"] as BankDetails) || {}), accountType: e.target.value } })}
                            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]"
                          >
                            <option value="">Select Account Type</option>
                            <option value="Checking">Checking</option>
                            <option value="Savings">Savings</option>
                            <option value="Business">Business</option>
                          </select>
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Routing Number</label>
                          <input value={((viewEmp["bankDetails"] as BankDetails)?.routingNumber as string) || ""} onChange={(e) => setViewEmp({ ...(viewEmp || {}), bankDetails: { ...((viewEmp["bankDetails"] as BankDetails) || {}), routingNumber: e.target.value } })} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
                        </div>
                        {viewError ? <p className="md:col-span-2 text-[13px] text-[#b91c1c]">{viewError}</p> : null}
                        <div className="md:col-span-2 flex items-center justify-end gap-2">
                          <button type="submit" className="rounded-md bg-[#1f2937] text-white px-4 py-2 text-[14px] hover:bg-[#111827] disabled:opacity-60" disabled={savingView}>{savingView ? "Saving…" : "Save"}</button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Bank Name</label>
                          <p className="text-[14px] text-[#374151]">{((viewEmp["bankDetails"] as BankDetails)?.bankName as string) || "—"}</p>
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Account Number</label>
                          <p className="text-[14px] text-[#374151]">{((viewEmp["bankDetails"] as BankDetails)?.accountNumber as string) || "—"}</p>
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Account Type</label>
                          <p className="text-[14px] text-[#374151]">{((viewEmp["bankDetails"] as BankDetails)?.accountType as string) || "—"}</p>
                        </div>
                        <div>
                          <label className="block mb-1 text-[14px] font-medium text-[#374151]">Routing Number</label>
                          <p className="text-[14px] text-[#374151]">{((viewEmp["bankDetails"] as BankDetails)?.routingNumber as string) || "—"}</p>
                        </div>
                      </div>
                    )
                  ) : null}

                  {viewTab === "history" ? (
                    <div className="text-[14px] text-[#6b7280]">History & activities will appear here.</div>
                  ) : null}
                </div>
              ) : (
                <div className="text-[14px] text-[#b91c1c] mt-4">{viewError || "Profile not found."}</div>
              )}
            </div>
          </div>
        </div>
      ) : null}
      {/* Import Employees Modal */}
      {importOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => (!importing ? setImportOpen(false) : null)} />
          <div className="relative bg-white rounded-lg shadow-lg w-[95vw] max-w-[900px] border border-[#e5e7eb]">
            <div className="p-5 border-b border-[#e5e7eb] flex items-center justify-between">
              <h2 className="text-[16px] font-semibold">Import Employees (Excel)</h2>
              <button className="text-[14px] text-[#374151]" onClick={() => (!importing ? setImportOpen(false) : null)}>Close</button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <p className="text-[13px] text-[#6b7280]">Upload an .xlsx or .csv file. The first row should be column headers.</p>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={async (e) => {
                    setImportError("");
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      const XLSX = await import("xlsx");
                      const data = await file.arrayBuffer();
                      const wb = XLSX.read(data, { type: "array" });
                      const ws = wb.Sheets[wb.SheetNames[0]];
                      const rows = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Array<Record<string, unknown>>;
                      const cols = rows.length ? Object.keys(rows[0]) : [];
                      setImportRows(rows);
                      setImportColumns(cols);
                      setMapping((m) => ({ ...m, name: cols.find((c) => c.toLowerCase().includes("name")) || m.name, email: cols.find((c) => c.toLowerCase().includes("mail")) || m.email }));
                    } catch (err: unknown) {
                      setImportError(err instanceof Error ? err.message : "Failed to parse file");
                    }
                  }}
                  className="mt-2"
                />
              </div>

              {importColumns.length ? (
                <div>
                  <h3 className="text-[14px] font-medium">Map Columns</h3>
                  <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries({
                      name: "Full name",
                      email: "Email",
                      department: "Department",
                      jobTitle: "Job Title",
                      employeeType: "Employment Type",
                      status: "Status",
                      location: "Location",
                      phoneNumber: "Phone",
                      dob: "Date of Birth (YYYY-MM-DD)",
                    }).map(([key, label]) => (
                      <div key={key}>
                        <label className="block mb-1 text-[13px] text-[#374151]">{label}</label>
                        <select
                          value={mapping[key] || ""}
                          onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value }))}
                          className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white"
                        >
                          <option value="">Skip</option>
                          {importColumns.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {importRows.length ? (
                <div>
                  <h3 className="text-[14px] font-medium">Preview ({Math.min(importRows.length, 5)} of {importRows.length})</h3>
                  <div className="mt-2 overflow-x-auto">
                    <table className="min-w-[600px] text-left border border-[#e5e7eb]">
                      <thead className="text-[12px] text-[#6b7280]">
                        <tr>
                          {Object.keys(mapping).map((k) => (
                            <th key={k} className="px-3 py-2 border-b border-[#e5e7eb]">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-[13px]">
                        {importRows.slice(0, 5).map((r, i) => (
                          <tr key={i}>
                            {Object.keys(mapping).map((k) => (
                              <td key={k} className="px-3 py-1 border-b border-[#f3f4f6]">{String(r[mapping[k]] ?? "")}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}

              {importError ? <p className="text-[13px] text-[#b91c1c]">{importError}</p> : null}

              <div className="flex items-center justify-end gap-2">
                <button
                  className="rounded-md border border-[#d1d5db] px-4 py-2 text-[14px] hover:bg-[#f9fafb]"
                  disabled={importing}
                  onClick={() => setImportOpen(false)}
                >Cancel</button>
                <button
                  className="rounded-md bg-[#1f2937] text-white px-4 py-2 text-[14px] hover:bg-[#111827] disabled:opacity-60"
                  disabled={importing || !orgId || !importRows.length || !mapping.name || !mapping.email}
                  onClick={async () => {
                    if (!orgId) return;
                    setImportError("");
                    setImporting(true);
                    try {
                      const empCol = collection(db, "organizations", orgId, "employees");
                      const ops: Array<Promise<unknown>> = [];
                      for (const r of importRows) {
                        const name = String(r[mapping.name] ?? "").trim();
                        const email = String(r[mapping.email] ?? "").trim().toLowerCase();
                        if (!name || !email) continue;
                        const docData: Record<string, unknown> = {
                          name,
                          email,
                          department: mapping.department ? String(r[mapping.department] ?? "") : "",
                          jobTitle: mapping.jobTitle ? String(r[mapping.jobTitle] ?? "") : "",
                          employeeType: mapping.employeeType ? String(r[mapping.employeeType] ?? "") : "Full-time",
                          status: mapping.status ? String(r[mapping.status] ?? "") : "Active",
                          location: mapping.location ? String(r[mapping.location] ?? "") : "",
                          phoneNumber: mapping.phoneNumber ? String(r[mapping.phoneNumber] ?? "") : "",
                          dob: mapping.dob ? String(r[mapping.dob] ?? "") : "",
                          manager: "",
                          hireDate: serverTimestamp(),
                          createdAt: serverTimestamp(),
                        };
                        ops.push(addDoc(empCol, docData));
                      }
                      await Promise.all(ops);
                      setImportOpen(false);
                      // Simple refresh: reload employees after import
                      try {
                        const empSnap = await getDocs(collection(db, "organizations", orgId, "employees"));
                        type FirestoreTimestampLike = { toDate?: () => Date } | string | null | undefined;
                        const toIso = (v: FirestoreTimestampLike): string => {
                          if (!v) return "";
                          if (typeof v === "string") return v;
                          if (typeof v.toDate === "function") return v.toDate()!.toISOString();
                          return String(v as unknown);
                        };
                        const list: Employee[] = empSnap.docs.map((d) => {
                          const data = d.data() as Record<string, unknown>;
                          return {
                            id: d.id,
                            name: (data["name"] as string) ?? "",
                            employeeId: (data["employeeId"] as string) ?? d.id,
                            email: (data["email"] as string) ?? "",
                            department: (data["department"] as string) ?? "",
                            jobTitle: (data["jobTitle"] as string) ?? "",
                            manager: (data["manager"] as string) ?? "",
                            hireDate: toIso(data["hireDate"] as FirestoreTimestampLike),
                            status: (data["status"] as Employee["status"]) ?? "Active",
                            location: (data["location"] as string) ?? "",
                            employeeType: (data["employeeType"] as Employee["employeeType"]) ?? "Full-time",
                            avatarUrl: data["avatarUrl"] as string | undefined,
                            dob: ((): string | undefined => {
                              const v = toIso(data["dob"] as FirestoreTimestampLike);
                              return v || undefined;
                            })(),
                          } as Employee;
                        });
                        setEmployees(list);
                      } catch {}
                    } catch (err: unknown) {
                      setImportError(err instanceof Error ? err.message : "Failed to import");
                    } finally {
                      setImporting(false);
                    }
                  }}
                >{importing ? "Importing…" : `Import ${importRows.length} rows`}</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {/* Add Employee Modal */}
      {addOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => (!saving ? setAddOpen(false) : null)} />
          <div className="relative bg-white rounded-lg shadow-lg w-[90vw] max-w-[720px] border border-[#e5e7eb]">
            <div className="p-5 border-b border-[#e5e7eb] flex items-center justify-between">
              <h2 className="text-[16px] font-semibold">Add Employee</h2>
              <button className="text-[14px] text-[#374151]" onClick={() => (!saving ? setAddOpen(false) : null)}>Close</button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Full name</label>
                <input value={newEmpName} onChange={(e) => setNewEmpName(e.target.value)} required className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
              </div>
              <div>
                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Email</label>
                <input type="email" value={newEmpEmail} onChange={(e) => setNewEmpEmail(e.target.value)} required className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
              </div>

              <div>
                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Department</label>
                <select value={newEmpDepartmentId} onChange={(e) => { setNewEmpDepartmentId(e.target.value); setNewEmpRoleId(""); }} required className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white">
                  <option value="" disabled>{departments.length ? "Select department" : "Loading…"}</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Role</label>
                <select value={newEmpRoleId} onChange={(e) => setNewEmpRoleId(e.target.value)} required disabled={!newEmpDepartmentId || roles.length === 0} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white">
                  <option value="" disabled>{newEmpDepartmentId ? (roles.length ? "Select role" : "No roles") : "Select department first"}</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Employment Type</label>
                <select value={newEmpType} onChange={(e) => setNewEmpType(e.target.value as Employee["employeeType"])} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white">
                  {(["Full-time","Part-time","Contract","Intern"] as const).map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Status</label>
                <select value={newEmpStatus} onChange={(e) => setNewEmpStatus(e.target.value as Employee["status"])} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white">
                  {(["Active","Probation","Inactive","On Leave"] as const).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block mb-1 text-[14px] font-medium text-[#374151]">Location (optional)</label>
                <input value={newEmpLocation} onChange={(e) => setNewEmpLocation(e.target.value)} className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
              </div>

              {formError ? <p className="md:col-span-2 text-[13px] text-[#b91c1c]">{formError}</p> : null}

              <div className="md:col-span-2 flex items-center justify-end gap-2">
                <button type="button" onClick={() => (!saving ? setAddOpen(false) : null)} className="rounded-md border border-[#d1d5db] px-4 py-2 text-[14px] hover:bg-[#f9fafb]" disabled={saving}>Cancel</button>
                <button type="submit" className="rounded-md bg-[#1f2937] text-white px-4 py-2 text-[14px] hover:bg-[#111827] disabled:opacity-60" disabled={saving || !orgId}>{saving ? "Saving…" : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
 
