export default function SetupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#ffffff] text-[#1a1a1a]">
      <div className="w-full max-w-[560px] text-center">
        <h1 className="text-[24px] font-semibold">Setup wizard</h1>
        <p className="mt-2 text-[14px] text-[#6b7280]">We’ll guide you through configuring your company settings.</p>
        <a href="/admin" className="mt-8 inline-flex items-center rounded-md bg-[#1f2937] text-white px-6 py-3 text-[16px] font-medium hover:bg-[#111827]">Go to Admin Dashboard</a>
      </div>
    </div>
  );
}


