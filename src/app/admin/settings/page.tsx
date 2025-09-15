import Link from "next/link";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-[28px] font-semibold">Settings</h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">Manage your organization configuration and preferences.</p>
        
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link 
            href="/admin/settings/company"
            className="block p-6 border border-[#e5e7eb] rounded-lg hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#f97316] rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🏢</span>
              </div>
              <h3 className="text-[16px] font-semibold">Company Settings</h3>
            </div>
            <p className="text-[14px] text-[#6b7280]">
              Configure company profile, contact information, branding, working hours, and organizational structure.
            </p>
          </Link>
          
          <div className="block p-6 border border-[#e5e7eb] rounded-lg bg-[#f9fafb]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#6b7280] rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">👥</span>
              </div>
              <h3 className="text-[16px] font-semibold text-[#6b7280]">User Management</h3>
            </div>
            <p className="text-[14px] text-[#6b7280]">
              Manage user roles, permissions, and access controls. Coming soon.
            </p>
          </div>
          
          <div className="block p-6 border border-[#e5e7eb] rounded-lg bg-[#f9fafb]">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#6b7280] rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">🔧</span>
              </div>
              <h3 className="text-[16px] font-semibold text-[#6b7280]">System Settings</h3>
            </div>
            <p className="text-[14px] text-[#6b7280]">
              Configure system preferences, integrations, and advanced settings. Coming soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


