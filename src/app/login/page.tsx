"use client";
import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
export default function LoginPage() {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-[#ffffff] text-[#1a1a1a]">
      <section className="p-8 md:p-12">
        <div className="max-w-[420px] mx-auto">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="h-5 w-5 rounded bg-[#f97316]" aria-hidden />
            <span className="text-[16px] font-semibold">HRMSTech</span>
          </Link>
          <h1 className="mt-10 text-[24px] font-semibold">Welcome back</h1>
          <p className="mt-2 text-[14px] text-[#6b7280]">Sign in to your account to continue.</p>

          <form className="mt-8 space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="email" className="block mb-1 text-[14px] font-medium text-[#374151]">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                placeholder="you@company.com"
              />
              <p className="mt-1 text-[12px] text-[#6b7280]">Use your work email.</p>
            </div>

            <PasswordField />

            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-[14px] text-[#374151]">
                <input type="checkbox" className="h-4 w-4 rounded border-[#d1d5db]" />
                Remember me
              </label>
              <a href="#" className="text-[14px] text-[#f97316] hover:opacity-80">Forgot password?</a>
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-[#1f2937] text-white px-4 py-3 text-[16px] font-medium hover:bg-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
            >
              Sign in
            </button>

            <p className="text-[14px] text-[#6b7280] text-center">
              Don’t have an account? <a href="#" className="text-[#f97316]">Start free trial</a>
            </p>
          </form>
        </div>
      </section>

      <aside className="hidden md:block relative">
        <Image
          src="https://images.unsplash.com/photo-1521737604893-d14cc237f11d?q=80&w=1600&auto=format&fit=crop"
          alt="HR team collaborating in a modern office"
          fill
          priority
          sizes="(min-width: 768px) 50vw, 100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/20" />
      </aside>
    </div>
  );
}

function PasswordField() {
  const [visible, setVisible] = useState(false);
  return (
    <div>
      <label htmlFor="password" className="block mb-1 text-[14px] font-medium text-[#374151]">Password</label>
      <div className="relative">
        <input
          id="password"
          name="password"
          type={visible ? "text" : "password"}
          required
          autoComplete="current-password"
          className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-[16px] pr-12 focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          placeholder="••••••••"
        />
        <button
          type="button"
          aria-label="Toggle password visibility"
          className="absolute inset-y-0 right-3 my-auto h-8 px-2 rounded text-[12px] text-[#374151] border border-[#d1d5db] bg-white hover:bg-[#f9fafb]"
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
      <p className="mt-1 text-[12px] text-[#6b7280]">Use at least 8 characters.</p>
    </div>
  );
}


