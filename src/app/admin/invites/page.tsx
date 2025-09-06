"use client";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collection, collectionGroup, getDocs, onSnapshot, query, where } from "firebase/firestore";
import Link from "next/link";

type InviteRow = { email: string; name?: string | null; department?: string | null; role?: string | null; createdAt?: string; status?: string; inviteUrl?: string };

export default function AdminInvitesPage() {
  const [loading, setLoading] = useState(true);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [invites, setInvites] = useState<InviteRow[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "pending" | "accepted">("All");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      try {
        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (snap.empty) { setLoading(false); return; }
        const ref = snap.docs[0].ref;
        const parentOrg = ref.parent.parent;
        const foundOrgId = parentOrg ? parentOrg.id : null;
        setOrgId(foundOrgId);
        if (!foundOrgId) { setLoading(false); return; }
        const invitesCol = collection(db, "organizations", foundOrgId, "invites");
        const off = onSnapshot(invitesCol, (snapInv) => {
          const list = snapInv.docs.map((d) => {
            const data = d.data() as Record<string, unknown>;
            const ts = data["createdAt"] as { toDate?: () => Date } | undefined;
            const origin = typeof window !== "undefined" ? window.location.origin : "";
            const url = origin ? new URL(origin) : null;
            if (url) {
              url.pathname = "/invite";
              url.searchParams.set("orgId", foundOrgId);
              url.searchParams.set("email", (data["email"] as string) ?? d.id);
            }
            return {
              email: (data["email"] as string) ?? d.id,
              name: (data["name"] as string) ?? null,
              department: (data["departmentName"] as string) ?? null,
              role: (data["roleName"] as string) ?? null,
              createdAt: typeof ts?.toDate === "function" ? ts!.toDate()!.toLocaleString() : undefined,
              status: (data["status"] as string) ?? "pending",
              inviteUrl: url ? url.toString() : undefined,
            } as InviteRow;
          });
          setInvites(list);
          setLoading(false);
        });
        return () => off();
      } catch {
        setLoading(false);
      }
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(() => {
    let list = [...invites];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => [i.name ?? "", i.email, i.department ?? "", i.role ?? ""].join("|").toLowerCase().includes(q));
    }
    if (statusFilter !== "All") list = list.filter((i) => (i.status ?? "pending") === statusFilter);
    return list;
  }, [invites, search, statusFilter]);

  return (
    <div className="px-6 py-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold">Invites</h1>
          <p className="mt-1 text-[14px] text-[#6b7280]">Track pending and accepted invitations.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/employees/invite" className="rounded-md border border-[#d1d5db] px-4 py-2 text-[14px] hover:bg-[#f9fafb]">Invite Employee</Link>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-3">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search invites..." className="flex-1 rounded-md border border-[#d1d5db] px-3 py-2 text-[14px]" />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white">
          <option value="All">All</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
        </select>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-md bg-[#f3f4f6] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-lg border border-[#e5e7eb] bg-white">
          <table className="hidden md:table w-full text-left">
            <thead className="text-[12px] text-[#6b7280]">
              <tr>
                <th className="px-3 py-2">Invitee</th>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Department</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Sent</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody className="text-[14px]">
              {filtered.map((i) => (
                <tr key={i.email} className="hover:bg-[#f9fafb]">
                  <td className="px-3 py-3 align-middle">{i.name || "—"}</td>
                  <td className="px-3 py-3 align-middle">{i.email}</td>
                  <td className="px-3 py-3 align-middle">{i.department || "—"}</td>
                  <td className="px-3 py-3 align-middle">{i.role || "—"}</td>
                  <td className="px-3 py-3 align-middle">{i.createdAt || ""}</td>
                  <td className="px-3 py-3 align-middle">
                    {((i.status ?? "pending") === "accepted") ? (
                      <span className="text-[12px] px-2 py-1 rounded-full border bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]">Accepted</span>
                    ) : (
                      <span className="text-[12px] px-2 py-1 rounded-full border bg-[#fffbeb] text-[#b45309] border-[#fde68a]">Pending</span>
                    )}
                  </td>
                  <td className="px-3 py-3 align-middle">
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded-md border border-[#d1d5db] px-2 py-1 text-[12px] hover:bg-[#f9fafb]"
                        onClick={async () => { try { if (i.inviteUrl) await navigator.clipboard.writeText(i.inviteUrl); } catch {} }}
                      >Copy Link</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-[#e5e7eb]">
            {filtered.map((i) => (
              <div key={i.email} className="p-4 bg-white">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-[14px]">{i.name || "—"}</div>
                    <div className="text-[12px] text-[#6b7280]">{i.email}</div>
                  </div>
                  {((i.status ?? "pending") === "accepted") ? (
                    <span className="text-[12px] px-2 py-1 rounded-full border bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]">Accepted</span>
                  ) : (
                    <span className="text-[12px] px-2 py-1 rounded-full border bg-[#fffbeb] text-[#b45309] border-[#fde68a]">Pending</span>
                  )}
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-[12px] text-[#374151]">
                  <div><span className="text-[#6b7280]">Department:</span> {i.department || "—"}</div>
                  <div><span className="text-[#6b7280]">Role:</span> {i.role || "—"}</div>
                  <div><span className="text-[#6b7280]">Sent:</span> {i.createdAt || ""}</div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button
                    className="rounded-md border border-[#d1d5db] px-2 py-1 text-[12px] hover:bg-[#f9fafb]"
                    onClick={async () => { try { if (i.inviteUrl) await navigator.clipboard.writeText(i.inviteUrl); } catch {} }}
                  >Copy Link</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


