export default function AdminDashboardPage() {
  return (
    <div className="min-h-screen px-6 py-16 bg-[#ffffff] text-[#1a1a1a]">
      <div className="max-w-[1200px] mx-auto">
        <h1 className="text-[24px] font-semibold">Admin Dashboard</h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">Overview of your organization at a glance.</p>

        {/* Quick Actions Panel */}
        <section aria-label="Quick Actions" className="mt-10">
          <h2 className="text-[18px] font-semibold">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="/admin/employees/invite" className="rounded-lg border border-[#e5e7eb] p-4 hover:shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                <span className="text-[14px] font-medium">Invite Employee</span>
              </div>
            </a>
            <a href="#" className="rounded-lg border border-[#e5e7eb] p-4 hover:shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                <span className="text-[14px] font-medium">Create Department</span>
              </div>
            </a>
            <a href="#" className="rounded-lg border border-[#e5e7eb] p-4 hover:shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                <span className="text-[14px] font-medium">Run Payroll</span>
              </div>
            </a>
            <a href="#" className="rounded-lg border border-[#e5e7eb] p-4 hover:shadow-sm">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#f97316]" />
                <span className="text-[14px] font-medium">New Announcement</span>
              </div>
            </a>
          </div>
        </section>

        {/* Analytics Overview */}
        <section aria-label="Analytics Overview" className="mt-10">
          <h2 className="text-[18px] font-semibold">Analytics Overview</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Employees', value: '128', delta: '+4 this month' },
              { label: 'Attendance', value: '96%', delta: '+2% vs last wk' },
              { label: 'Payroll Due', value: '$84,200', delta: 'in 3 days' },
              { label: 'Open Roles', value: '5', delta: '2 interviews today' },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-[#e5e7eb] p-5 bg-white">
                <p className="text-[12px] text-[#6b7280]">{kpi.label}</p>
                <p className="mt-2 text-[22px] font-semibold">{kpi.value}</p>
                <p className="mt-1 text-[12px] text-[#10b981]">{kpi.delta}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activities */}
          <section aria-label="Recent Activities" className="lg:col-span-2 rounded-lg border border-[#e5e7eb] bg-white">
            <div className="p-5 border-b border-[#e5e7eb]"><h2 className="text-[18px] font-semibold">Recent Activities</h2></div>
            <ul className="divide-y divide-[#e5e7eb]">
              {[
                { who: 'Amelia Hart', what: 'Approved leave request', when: '2h ago' },
                { who: 'Rohan Patel', what: 'Added new employee: Priya K.', when: '5h ago' },
                { who: 'Payroll', what: 'Generated payslips for March', when: '1d ago' },
                { who: 'IT', what: 'Updated security policy', when: '2d ago' },
              ].map((a, idx) => (
                <li key={idx} className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-[14px] font-medium">{a.what}</p>
                    <p className="text-[12px] text-[#6b7280]">{a.who}</p>
                  </div>
                  <span className="text-[12px] text-[#6b7280]">{a.when}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Pending Approvals */}
          <section aria-label="Pending Approvals" className="rounded-lg border border-[#e5e7eb] bg-white">
            <div className="p-5 border-b border[#e5e7eb]"><h2 className="text-[18px] font-semibold">Pending Approvals</h2></div>
            <ul className="p-5 space-y-4">
              {[
                { title: 'Leave request – Priya K.', meta: 'From Apr 15 to Apr 18' },
                { title: 'Expense claim – John D.', meta: '$240 • Travel' },
                { title: 'New role approval – Sales Associate', meta: 'Dept: Sales' },
              ].map((p, idx) => (
                <li key={idx} className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[14px] font-medium">{p.title}</p>
                    <p className="text-[12px] text-[#6b7280]">{p.meta}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="rounded-md border border-[#d1d5db] px-3 py-1.5 text-[12px] hover:bg-[#f9fafb]">View</button>
                    <button className="rounded-md bg-[#1f2937] text-white px-3 py-1.5 text-[12px] hover:bg-[#111827]">Approve</button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* System Notifications */}
        <section aria-label="System Notifications" className="mt-10 rounded-lg border border-[#e5e7eb] bg-white">
          <div className="p-5 border-b border[#e5e7eb]"><h2 className="text-[18px] font-semibold">System Notifications</h2></div>
          <ul className="p-5 space-y-3">
            {[
              { text: 'Policy reminder: Upload signed handbook by April 30.', level: 'info' },
              { text: 'Payroll cutoff approaching in 2 days.', level: 'warning' },
              { text: 'New version deployed. See what’s new.', level: 'info' },
            ].map((n, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className={`mt-1 h-2 w-2 rounded-full ${n.level === 'warning' ? 'bg-[#f59e0b]' : 'bg-[#3b82f6]'}`} />
                <p className="text-[14px]">{n.text}</p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}


