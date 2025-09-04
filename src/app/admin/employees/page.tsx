"use client";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, getDocs, query, where } from "firebase/firestore";

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

const MOCK_EMPLOYEES: Employee[] = [
  {
    id: "1",
    name: "Ava Johnson",
    employeeId: "E-1001",
    email: "ava.johnson@company.com",
    department: "Engineering",
    jobTitle: "Frontend Developer",
    manager: "Liam Patel",
    hireDate: "2024-04-15",
    status: "Active",
    location: "New York",
    employeeType: "Full-time",
    dob: "1995-04-10",
  },
  {
    id: "2",
    name: "Noah Smith",
    employeeId: "E-1002",
    email: "noah.smith@company.com",
    department: "People Ops",
    jobTitle: "HR Generalist",
    manager: "Mia Nguyen",
    hireDate: "2025-02-01",
    status: "Probation",
    location: "Remote",
    employeeType: "Full-time",
    dob: "1993-05-22",
  },
  {
    id: "3",
    name: "Sophia Chen",
    employeeId: "E-1003",
    email: "sophia.chen@company.com",
    department: "Finance",
    jobTitle: "Accountant",
    manager: "Harper Singh",
    hireDate: "2023-09-10",
    status: "On Leave",
    location: "London",
    employeeType: "Part-time",
    dob: "1990-12-03",
  },
  {
    id: "4",
    name: "Ethan Garcia",
    employeeId: "E-1004",
    email: "ethan.garcia@company.com",
    department: "Engineering",
    jobTitle: "Backend Developer",
    manager: "Liam Patel",
    hireDate: "2021-03-05",
    status: "Inactive",
    location: "Berlin",
    employeeType: "Contract",
    dob: "1991-01-17",
  },
  {
    id: "5",
    name: "Olivia Brown",
    employeeId: "E-1005",
    email: "olivia.brown@company.com",
    department: "Design",
    jobTitle: "Product Designer",
    manager: "Ava Johnson",
    hireDate: "2025-03-20",
    status: "Active",
    location: "San Francisco",
    employeeType: "Full-time",
    dob: "1994-03-20",
  },
];

export default function EmployeesPage() {
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState<Employee[]>([]);
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
        const orgId = parentOrg ? parentOrg.id : null;
        if (!orgId) {
          setEmployees([]);
          return;
        }
        const empCol = collection(db, "organizations", orgId, "employees");
        const empSnap = await getDocs(empCol);
        const list: Employee[] = empSnap.docs.map((d) => {
          const data: any = d.data();
          const toIso = (v: any) => (v && typeof v.toDate === "function" ? v.toDate().toISOString() : v ? String(v) : "");
          return {
            id: d.id,
            name: data.name ?? "",
            employeeId: data.employeeId ?? d.id,
            email: data.email ?? "",
            department: data.department ?? "",
            jobTitle: data.jobTitle ?? "",
            manager: data.manager ?? "",
            hireDate: toIso(data.hireDate),
            status: (data.status as Employee["status"]) ?? "Active",
            location: data.location ?? "",
            employeeType: data.employeeType ?? "Full-time",
            avatarUrl: data.avatarUrl,
            dob: toIso(data.dob) || undefined,
          } as Employee;
        });
        setEmployees(list);
      } catch {
        setEmployees([]);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

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
          <button className="rounded-md bg-[#1f2937] text-white px-4 py-2 text-[14px] hover:bg-[#111827]">Add Employee</button>
          <button className="rounded-md border border-[#d1d5db] px-4 py-2 text-[14px] hover:bg-[#f9fafb]">Import</button>
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
                          <img src={e.avatarUrl} alt={e.name} className="h-9 w-9 rounded-full object-cover" />
                        ) : (
                          <div className="h-9 w-9 rounded-full grid place-items-center text-[12px] font-medium text-white" style={{ backgroundColor: "#4f46e5" }}>
                            {getInitials(e.name)}
                          </div>
                        )}
                        <div>
                          <div className="font-medium">{e.name}</div>
                          <div className="text-[12px] text-[#6b7280]">{e.employeeId}</div>
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
                        <button className="text-[#374151] hover:underline">View</button>
                        <button className="text-[#374151] hover:underline">Edit</button>
                        <button className="rounded-md border border-[#d1d5db] px-2 py-1 text-[12px] hover:bg-[#f9fafb]">More</button>
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
                        <img src={e.avatarUrl} alt={e.name} className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="h-8 w-8 rounded-full grid place-items-center text-[11px] font-medium text-white" style={{ backgroundColor: "#4f46e5" }}>
                          {getInitials(e.name)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-[14px]">{e.name}</div>
                        <div className="text-[12px] text-[#6b7280]">{e.employeeId}</div>
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
                    <button className="text-[#374151] hover:underline">View</button>
                    <button className="text-[#374151] hover:underline">Edit</button>
                    <button className="rounded-md border border-[#d1d5db] px-2 py-1 text-[12px] hover:bg-[#f9fafb]">More</button>
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
    </div>
  );
}
 
