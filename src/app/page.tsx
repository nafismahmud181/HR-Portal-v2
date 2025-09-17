"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="font-sans text-[#1a1a1a] bg-[#ffffff]">
      {/* Header */}
      <header aria-label="Primary" className="sticky top-0 z-50 backdrop-blur bg-white/80 border-b border-[#e5e7eb]">
        <div className="max-w-[1200px] mx-auto px-6 h-[60px] flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <Image src="/images/logo/logo.png" alt="HRMSTech Logo" width={20} height={20} className="rounded" />
            <span className="text-[16px] font-semibold text-[#1a1a1a]">HRMSTech</span>
          </a>
          <nav className="hidden sm:flex items-center gap-6 text-[14px] text-[#374151]">
            <a href="#features" className="hover:text-[#1a1a1a]">Features</a>
            <a href="#benefits" className="hover:text-[#1a1a1a]">Benefits</a>
            <a href="#pricing" className="hover:text-[#1a1a1a]">Pricing</a>
            <a href="/login" className="hover:text-[#1a1a1a]">Log in</a>
            <a href="/register" className="inline-flex items-center rounded-md bg-[#1f2937] text-white px-4 py-2 font-medium hover:bg-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]">Signup</a>
          </nav>
          <button
            type="button"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
            className="sm:hidden inline-flex items-center justify-center rounded-md border border-[#d1d5db] p-2 text-[#374151] hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {mobileOpen ? (
                <>
                  <path d="M18 6L6 18" />
                  <path d="M6 6l12 12" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
        {mobileOpen ? (
          <div className="sm:hidden border-t border-[#e5e7eb] bg-white/95 backdrop-blur">
            <div className="max-w-[1200px] mx-auto px-6 py-3 flex flex-col gap-3 text-[14px] text-[#374151]">
              <a href="#features" className="hover:text-[#1a1a1a]" onClick={() => setMobileOpen(false)}>Features</a>
              <a href="#benefits" className="hover:text-[#1a1a1a]" onClick={() => setMobileOpen(false)}>Benefits</a>
              <a href="#pricing" className="hover:text-[#1a1a1a]" onClick={() => setMobileOpen(false)}>Pricing</a>
              <a href="/login" className="hover:text-[#1a1a1a]" onClick={() => setMobileOpen(false)}>Log in</a>
              <a href="/register" className="inline-flex items-center justify-center rounded-md bg-[#1f2937] text-white px-4 py-2 font-medium hover:bg-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]" onClick={() => setMobileOpen(false)}>Signup</a>
            </div>
          </div>
        ) : null}
      </header>
      {/* Hero */}
      <section
        aria-label="Hero"
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_80%_-10%,#fef7ed,transparent_60%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(249,115,22,0.06),transparent_30%)]" />
        <div className="max-w-[1200px] mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-[600px]">
              <h1 className="text-[28px] sm:text-[40px] font-semibold leading-[1.2] tracking-tight text-[#1a1a1a]">
                Modern HR Management Software Designed for Small Teams & Startups.
              </h1>
              <p className="mt-4 text-[16px] leading-[1.6] text-[#374151]">
                Say goodbye to spreadsheets. Automate employee onboarding, documents, payroll, and performance—all from one platform.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <a
                  href="/register"
                  className="inline-flex items-center justify-center rounded-md bg-[#1f2937] text-white px-6 py-3 text-[16px] font-medium hover:bg-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
                >
                  👉 Start Free Trial
                </a>
                <a
                  href="#demo"
                  className="inline-flex items-center justify-center rounded-md border border-[#d1d5db] text-[#374151] px-6 py-3 text-[16px] font-medium bg-white hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
                >
                  Book a Demo
                </a>
              </div>
            </div>
            <div className="relative">
              {/* Dashboard Mockup */}
              <div className="relative bg-white rounded-lg shadow-2xl border border-[#e5e7eb] p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-4 bg-[#f3f4f6] rounded w-3/4"></div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="h-16 bg-[#fef7ed] rounded-lg flex items-center justify-center">
                      <IconUsers />
                    </div>
                    <div className="h-16 bg-[#fef7ed] rounded-lg flex items-center justify-center">
                      <IconMoney />
                    </div>
                    <div className="h-16 bg-[#fef7ed] rounded-lg flex items-center justify-center">
                      <IconClock />
                    </div>
                  </div>
                  <div className="h-32 bg-[#f9fafb] rounded-lg"></div>
                </div>
              </div>
              {/* Background Illustration */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-[#fef7ed] rounded-full opacity-60"></div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-[#fef7ed] rounded-full opacity-40"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem → Solution */}
      <section aria-label="Problem Solution" className="py-16 bg-[#f8f9fa]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-[24px] sm:text-[32px] font-semibold text-[#1a1a1a] mb-6">
                The Problem Every Startup Faces
              </h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-600 text-sm">❌</span>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-[#1a1a1a]">Manual HR tasks take too much time</h3>
                    <p className="text-[14px] text-[#6b7280] mt-1">Spreadsheets, emails, and manual processes eat up hours every week</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-600 text-sm">❌</span>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-[#1a1a1a]">Employees confused about documents & leave requests</h3>
                    <p className="text-[14px] text-[#6b7280] mt-1">Scattered information leads to confusion and delays</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-red-600 text-sm">❌</span>
                  </div>
                  <div>
                    <h3 className="text-[16px] font-semibold text-[#1a1a1a]">Founders can&apos;t track HR properly</h3>
                    <p className="text-[14px] text-[#6b7280] mt-1">No visibility into team performance, compliance, or growth metrics</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg border border-[#e5e7eb] p-8">
              <h3 className="text-[20px] font-semibold text-[#1a1a1a] mb-4">The HRMSTech Solution</h3>
              <p className="text-[16px] text-[#374151] mb-6">
                HRMSTech automates these processes so startups can save time, cut errors, and grow faster.
              </p>
              <div className="space-y-6">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <div>
                    <span className="text-[14px] font-medium text-[#374151]">Automated onboarding workflows</span>
                    <p className="text-[12px] text-[#6b7280] mt-1">→ Employees onboard in &lt;5 mins, no paperwork</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <div>
                    <span className="text-[14px] font-medium text-[#374151]">Centralized document management</span>
                    <p className="text-[12px] text-[#6b7280] mt-1">→ All docs in one place, instant access &amp; approval</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <div>
                    <span className="text-[14px] font-medium text-[#374151]">One-click payroll processing</span>
                    <p className="text-[12px] text-[#6b7280] mt-1">→ Export-ready data, zero calculation errors</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <div>
                    <span className="text-[14px] font-medium text-[#374151]">Real-time performance tracking</span>
                    <p className="text-[12px] text-[#6b7280] mt-1">→ Live dashboards, instant insights &amp; feedback</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-green-600 text-xs">✓</span>
                  </div>
                  <div>
                    <span className="text-[14px] font-medium text-[#374151]">Compliance &amp; audit trails</span>
                    <p className="text-[12px] text-[#6b7280] mt-1">→ Automated reports, never miss a deadline</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features */}
      <section id="features" aria-label="Key Features" className="py-16 scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-[24px] sm:text-[32px] font-semibold text-[#1a1a1a]">Key Features That Make HR Simple</h2>
            <p className="mt-2 text-[16px] text-[#6b7280]">Everything you need to manage your team efficiently</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {KEY_FEATURES.map((feature) => (
              <div key={feature.title} className="group">
                <div className="bg-white rounded-lg border border-[#e5e7eb] p-6 hover:shadow-lg transition-all duration-300 hover:border-[#f97316]/20">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="h-12 w-12 rounded-lg flex items-center justify-center bg-[#fef7ed] group-hover:bg-[#f97316] transition-colors duration-300">
                      <feature.icon />
                    </div>
                    <h3 className="text-[18px] font-semibold text-[#1a1a1a]">{feature.title}</h3>
                  </div>
                  <p className="text-[14px] text-[#6b7280] leading-relaxed mb-3">{feature.description}</p>
                  <div className="text-[12px] text-[#f97316] font-medium">
                    → {feature.benefit}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="#all-features" className="inline-flex items-center gap-2 text-[#f97316] hover:text-[#ea580c] font-medium">
              See All Features
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </section>

      {/* Product Demo */}
      <section id="demo" aria-label="Product Demo" className="py-16 bg-[#f8f9fa]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-[24px] sm:text-[32px] font-semibold text-[#1a1a1a]">See HRMSTech in Action</h2>
            <p className="mt-2 text-[16px] text-[#6b7280]">Simple, intuitive workflows that save you time</p>
          </div>
          
          {/* Demo Flow */}
          <div className="mb-12">
            <div className="bg-white rounded-lg border border-[#e5e7eb] p-8">
              <h3 className="text-[20px] font-semibold text-[#1a1a1a] mb-6 text-center">How It Works: Admin → Employee → Results</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="bg-[#fef7ed] rounded-lg p-6 mb-4">
                    <div className="w-16 h-16 bg-[#f97316] rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconUsers />
                    </div>
                    <h4 className="font-semibold text-[#1a1a1a] mb-2">1. Admin Invites</h4>
                    <p className="text-[14px] text-[#6b7280]">Send employee invitations with custom onboarding workflows</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-[#fef7ed] rounded-lg p-6 mb-4">
                    <div className="w-16 h-16 bg-[#f97316] rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconClock />
                    </div>
                    <h4 className="font-semibold text-[#1a1a1a] mb-2">2. Employee Logs In</h4>
                    <p className="text-[14px] text-[#6b7280]">Complete onboarding, submit documents, request leave</p>
                  </div>
                </div>
                <div className="text-center">
                  <div className="bg-[#fef7ed] rounded-lg p-6 mb-4">
                    <div className="w-16 h-16 bg-[#f97316] rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconChart />
                    </div>
                    <h4 className="font-semibold text-[#1a1a1a] mb-2">3. Documents Generated</h4>
                    <p className="text-[14px] text-[#6b7280]">Automated reports, certificates, and payroll data ready</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* UI Screenshots */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-[#e5e7eb] p-6">
                <h4 className="text-[16px] font-semibold text-[#1a1a1a] mb-4">Dashboard Overview</h4>
                <div className="bg-[#f9fafb] rounded-lg p-4 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#fef7ed] rounded-lg flex items-center justify-center mx-auto mb-3">
                      <IconChart />
                    </div>
                    <p className="text-[14px] text-[#6b7280]">Real-time analytics & insights</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-[#e5e7eb] p-6">
                <h4 className="text-[16px] font-semibold text-[#1a1a1a] mb-4">Employee Profile</h4>
                <div className="bg-[#f9fafb] rounded-lg p-4 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#fef7ed] rounded-lg flex items-center justify-center mx-auto mb-3">
                      <IconUsers />
                    </div>
                    <p className="text-[14px] text-[#6b7280]">Complete employee management</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg border border-[#e5e7eb] p-6">
                <h4 className="text-[16px] font-semibold text-[#1a1a1a] mb-4">Reports & Analytics</h4>
                <div className="bg-[#f9fafb] rounded-lg p-4 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#fef7ed] rounded-lg flex items-center justify-center mx-auto mb-3">
                      <IconTarget />
                    </div>
                    <p className="text-[14px] text-[#6b7280]">Export-ready payroll data</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-[#e5e7eb] p-6">
                <h4 className="text-[16px] font-semibold text-[#1a1a1a] mb-4">Document Hub</h4>
                <div className="bg-[#f9fafb] rounded-lg p-4 h-48 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#fef7ed] rounded-lg flex items-center justify-center mx-auto mb-3">
                      <IconShield />
                    </div>
                    <p className="text-[14px] text-[#6b7280]">Centralized document storage</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Video Demo CTA */}
          <div className="text-center mt-12">
            <div className="bg-white rounded-lg border border-[#e5e7eb] p-8 max-w-2xl mx-auto">
              <h3 className="text-[20px] font-semibold text-[#1a1a1a] mb-4">Watch 30-Second Demo</h3>
              <p className="text-[14px] text-[#6b7280] mb-6">See how easy it is to manage your team with HRMSTech</p>
              <div className="bg-[#f9fafb] rounded-lg p-8 h-48 flex items-center justify-center mb-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-[#f97316] rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z"/>
                    </svg>
                  </div>
                  <p className="text-[14px] text-[#6b7280]">Click → Result Demo Video</p>
                </div>
              </div>
              <a href="#demo" className="inline-flex items-center justify-center rounded-md bg-[#1f2937] text-white px-6 py-3 text-[16px] font-medium hover:bg-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]">
                Watch Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" aria-label="Benefits" className="py-16 scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-[24px] sm:text-[32px] font-semibold text-[#1a1a1a]">Real Results for Your Business</h2>
            <p className="mt-2 text-[16px] text-[#6b7280]">Measurable outcomes that matter to growing teams</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {BENEFITS_OUTCOMES.map((benefit) => (
              <div key={benefit.title} className="text-center group">
                <div className="bg-white rounded-lg border border-[#e5e7eb] p-8 hover:shadow-lg transition-all duration-300 hover:border-[#f97316]/20">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="w-20 h-20 bg-[#fef7ed] rounded-full flex items-center justify-center group-hover:bg-[#f97316] transition-colors duration-300">
                      <benefit.icon />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#f97316] rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{benefit.number}</span>
                    </div>
                  </div>
                  <div className="text-[28px] font-bold text-[#f97316] mb-2">{benefit.number}</div>
                  <h3 className="text-[18px] font-semibold text-[#1a1a1a] mb-3">{benefit.title}</h3>
                  <p className="text-[14px] text-[#6b7280] leading-relaxed mb-4">{benefit.description}</p>
                  <div className="text-[12px] text-[#374151] italic border-l-2 border-[#f97316] pl-3">
                    &quot;{benefit.quote}&quot;
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Testimonials */}
      <section id="testimonials" aria-label="Social Proof" className="py-16 bg-[#f8f9fa]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-[24px] sm:text-[32px] font-semibold text-[#1a1a1a]">Trusted by Growing Teams</h2>
            <p className="mt-2 text-[16px] text-[#6b7280]">See what early adopters are saying about HRMSTech</p>
          </div>
          
          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {TESTIMONIALS_NEW.map((testimonial) => (
              <div key={testimonial.name} className="bg-white rounded-lg border border-[#e5e7eb] p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <blockquote className="text-[14px] text-[#374151] leading-relaxed mb-4">
                  &quot;{testimonial.quote}&quot;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#fef7ed] rounded-full flex items-center justify-center">
                    <span className="text-[#f97316] font-semibold text-sm">{testimonial.initials}</span>
                  </div>
                  <div>
                    <div className="text-[14px] font-semibold text-[#1a1a1a]">{testimonial.name}</div>
                    <div className="text-[12px] text-[#6b7280]">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Industry Logos */}
          <div className="bg-white rounded-lg border border-[#e5e7eb] p-8">
            <h3 className="text-[18px] font-semibold text-[#1a1a1a] text-center mb-8">Trusted by Teams Across Industries</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
              {INDUSTRY_LOGOS.map((industry) => (
                <div key={industry.name} className="text-center group">
                  <div className="w-16 h-16 bg-[#f9fafb] rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-[#fef7ed] transition-colors duration-300">
                    <industry.icon />
                  </div>
                  <div className="text-[14px] font-medium text-[#374151]">{industry.name}</div>
                  <div className="text-[12px] text-[#6b7280]">{industry.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" aria-label="Pricing" className="py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-[24px] sm:text-[32px] font-semibold text-[#1a1a1a]">Simple, Transparent Pricing</h2>
            <p className="mt-2 text-[16px] text-[#6b7280]">Choose the plan that fits your team size and needs</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {PRICING_NEW.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-lg border ${
                  tier.highlight ? "border-[#f97316] ring-2 ring-[#f97316]/20" : "border-[#e5e7eb]"
                } bg-white p-8 flex flex-col`}
              >
                {tier.highlight ? (
                  <div className="absolute -top-3 right-4 inline-flex items-center rounded-full bg-[#f97316] px-3 py-1 text-[12px] font-medium text-white">
                    Most Popular
                  </div>
                ) : null}
                <h3 className="text-[20px] font-semibold text-[#1a1a1a]">{tier.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-[36px] font-bold text-[#1a1a1a]">{tier.price}</span>
                  {tier.price !== "Custom" && <span className="text-[14px] text-[#6b7280]">/user/month</span>}
                </div>
                <p className="mt-4 text-[14px] text-[#374151]">{tier.summary}</p>
                <ul className="mt-6 space-y-3 text-[14px] text-[#374151] flex-grow">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <span className="mt-[3px] inline-block h-2 w-2 rounded-full bg-[#10b981]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="/register"
                  className={`mt-8 inline-flex items-center justify-center rounded-md px-6 py-3 text-[16px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] ${
                    tier.highlight
                      ? "bg-[#1f2937] text-white hover:bg-[#111827]"
                      : "border border-[#d1d5db] text-[#374151] hover:bg-[#f9fafb]"
                  }`}
                >
                  Get Started
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section id="get-started" aria-label="Final Call to Action" className="py-16 bg-[#f8f9fa]">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center">
            <h2 className="text-[24px] sm:text-[32px] font-semibold text-[#1a1a1a] mb-4">
              Start Managing Your HR in Under 5 Minutes
            </h2>
            <p className="text-[16px] text-[#6b7280] mb-8">No credit card required</p>
            <a 
              href="/register" 
              className="inline-flex items-center gap-2 rounded-md bg-[#1f2937] text-white px-8 py-4 text-[18px] font-medium hover:bg-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] transition-all duration-300"
            >
              👉 Start Free Trial Now
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer aria-label="Footer" className="bg-[#111827] text-[#ededed] py-12">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Image src="/images/logo/logo.png" alt="HRMSTech Logo" width={24} height={24} className="rounded" />
                <span className="text-[16px] font-semibold">HRMSTech</span>
              </div>
              <p className="text-[14px] text-[#9ca3af] mb-6">
                HRMSTech is built for startups who need HR that just works. 
                Simple, powerful, and designed to grow with your team.
              </p>
              
              {/* Newsletter Signup */}
              <div className="bg-[#1f2937] rounded-lg p-4">
                <h5 className="text-[14px] font-semibold mb-2">Stay Updated</h5>
                <p className="text-[12px] text-[#9ca3af] mb-3">Get HR tips and product updates delivered to your inbox.</p>
                <form className="flex gap-2">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-3 py-2 text-[12px] bg-[#374151] border border-[#4b5563] rounded-md text-white placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#f97316] text-white text-[12px] font-medium rounded-md hover:bg-[#ea580c] focus:outline-none focus:ring-2 focus:ring-[#f97316] focus:ring-offset-2 focus:ring-offset-[#111827] transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
              </div>
            </div>
            <div>
              <h4 className="text-[14px] font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-[14px] text-[#d1d5db]">
                <li><a className="hover:underline" href="#">About Us</a></li>
                <li><a className="hover:underline" href="#">Careers</a></li>
                <li><a className="hover:underline" href="#">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[14px] font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-[14px] text-[#d1d5db]">
                <li><a className="hover:underline" href="#">Privacy Policy</a></li>
                <li><a className="hover:underline" href="#">Terms of Service</a></li>
                <li><a className="hover:underline" href="#">Support</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[14px] font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-[14px] text-[#d1d5db]">
                <li>support@hrmstech.com</li>
                <li>+1 (555) 123-4567</li>
                <li className="flex gap-3 pt-2">
                  <a aria-label="LinkedIn" href="#" className="hover:opacity-80 transition-opacity">
                    <IconLinkedIn />
                  </a>
                  <a aria-label="Twitter" href="#" className="hover:opacity-80 transition-opacity">
                    <IconTwitter />
                  </a>
                  <a aria-label="Facebook" href="#" className="hover:opacity-80 transition-opacity">
                    <IconFacebook />
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-[#374151] pt-6 text-center">
            <p className="text-[12px] text-[#9ca3af]">
              Copyright © {new Date().getFullYear()} HRMSTech. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Icons & content data
function IconUsers() {
  return (
    <svg className="h-5 w-5 text-[#f97316]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function IconMoney() {
  return (
    <svg className="h-5 w-5 text-[#f97316]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg className="h-5 w-5 text-[#f97316]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function IconChart() {
  return (
    <svg className="h-5 w-5 text-[#f97316]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 3v18h18" />
      <rect x="7" y="10" width="3" height="7" />
      <rect x="12" y="6" width="3" height="11" />
      <rect x="17" y="13" width="3" height="4" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg className="h-5 w-5 text-[#f97316]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg className="h-5 w-5 text-[#f97316]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </svg>
  );
}

function IconLinkedIn() {
  return (
    <svg className="h-5 w-5 text-[#d1d5db]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4.98 3.5C4.98 4.88 3.86 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5zM0 8h5v16H0V8zm7.5 0h4.7v2.2h.1c.7-1.3 2.4-2.7 4.9-2.7 5.2 0 6.1 3.4 6.1 7.9V24h-5v-6.9c0-1.7 0-3.9-2.4-3.9-2.4 0-2.8 1.8-2.8 3.8V24h-5V8z" />
    </svg>
  );
}

function IconTwitter() {
  return (
    <svg className="h-5 w-5 text-[#d1d5db]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 4.6c-.9.4-1.8.6-2.8.8 1-.6 1.7-1.5 2-2.6-.9.6-2 .9-3.1 1.2A4.8 4.8 0 0 0 16.6 3c-2.7 0-4.8 2.2-4.8 4.9 0 .4 0 .8.1 1.1-4-.2-7.5-2.2-9.8-5.2-.4.8-.6 1.6-.6 2.5 0 1.7.8 3.2 2.1 4.1-.7 0-1.4-.2-2-.6 0 2.4 1.7 4.4 3.9 4.8-.4.1-.8.2-1.2.2-.3 0-.6 0-.9-.1.6 2 2.4 3.5 4.6 3.5A9.6 9.6 0 0 1 0 20.5 13.6 13.6 0 0 0 7.5 22c9 0 14-7.6 14-14.2v-.6c1-.7 1.8-1.6 2.5-2.6z" />
    </svg>
  );
}

function IconFacebook() {
  return (
    <svg className="h-5 w-5 text-[#d1d5db]" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M22.675 0h-21.35C.594 0 0 .593 0 1.326v21.348C0 23.406.594 24 1.326 24H12.82v-9.294H9.692V11.08h3.127V8.41c0-3.1 1.894-4.788 4.659-4.788 1.325 0 2.463.098 2.795.142v3.24l-1.918.001c-1.503 0-1.794.714-1.794 1.764v2.31h3.587l-.467 3.626H16.56V24h6.115C23.406 24 24 23.406 24 22.674V1.326C24 .593 23.406 0 22.675 0z" />
    </svg>
  );
}

const KEY_FEATURES = [
  {
    title: "Smart Onboarding",
    description: "Invite employees in minutes with automated workflows and custom checklists.",
    benefit: "Get new hires productive from Day 1",
    icon: IconUsers,
  },
  {
    title: "Digital Document Hub",
    description: "LOEs, certificates, approvals all in one place with secure storage.",
    benefit: "No more searching folders, all HR docs in one place",
    icon: IconShield,
  },
  {
    title: "Leave & Attendance",
    description: "Track and approve with one click. Real-time visibility for managers.",
    benefit: "Approve requests instantly, never lose track of team availability",
    icon: IconClock,
  },
  {
    title: "Payroll Ready",
    description: "Export-ready data for salary processing with automated calculations.",
    benefit: "Zero errors, instant payroll processing",
    icon: IconMoney,
  },
  {
    title: "Performance Reviews",
    description: "Transparent evaluation system with 360-degree feedback.",
    benefit: "Fair evaluations that actually drive performance",
    icon: IconTarget,
  },
  {
    title: "Multi-language Support",
    description: "English + Korean/Bangla and more languages for global teams.",
    benefit: "Every team member feels included, regardless of language",
    icon: IconChart,
  },
];

const FEATURES = [
  {
    title: "Employee Management",
    text: "Centralize profiles, roles, documents, and onboarding in one place.",
    icon: IconUsers,
  },
  {
    title: "Payroll",
    text: "Accurate, on-time payroll with taxes and deductions handled.",
    icon: IconMoney,
  },
  {
    title: "Attendance",
    text: "Track shifts, leave, and overtime with real-time visibility.",
    icon: IconClock,
  },
  {
    title: "Performance Tracking",
    text: "OKRs, reviews, and feedback to drive continuous improvement.",
    icon: IconTarget,
  },
  {
    title: "Analytics",
    text: "Dashboards and insights to make data-driven decisions.",
    icon: IconChart,
  },
  {
    title: "Compliance",
    text: "Policies, audits, and record-keeping made effortless.",
    icon: IconShield,
  },
];

const BENEFITS_OUTCOMES = [
  {
    title: "Save Admin Time",
    number: "40%",
    description: "Reduce manual HR tasks and focus on strategic work that drives growth.",
    quote: "We reduced HR admin time by 42% using HRMSTech.",
    icon: IconClock,
  },
  {
    title: "Zero Compliance Headaches",
    number: "100%",
    description: "Automated policies and audit trails keep you compliant without the stress.",
    quote: "Compliance audits are now effortless and stress-free.",
    icon: IconShield,
  },
  {
    title: "Happier Employees",
    number: "85%",
    description: "Self-service portal empowers employees and reduces support tickets.",
    quote: "Our team loves the self-service portal - no more waiting for HR.",
    icon: IconUsers,
  },
  {
    title: "Scalable Growth",
    number: "∞",
    description: "Grows with your startup from 5 to 500+ employees seamlessly.",
    quote: "HRMSTech scaled perfectly as we grew from 10 to 200 employees.",
    icon: IconChart,
  },
];

const BENEFITS = [
  {
    title: "Reduce busywork",
    problem: "Manual HR tasks slow teams down and introduce errors.",
    solution: "Automated workflows keep everything accurate and on schedule.",
  },
  {
    title: "Boost engagement",
    problem: "Scattered tools make it hard for employees to stay aligned.",
    solution: "One place for goals, feedback, and recognition keeps teams motivated.",
  },
  {
    title: "Stay compliant",
    problem: "Changing regulations create risk and confusion.",
    solution: "Built‑in policies and audit trails reduce risk and save time.",
  },
];

const TESTIMONIALS_NEW = [
  {
    name: "Sarah Chen",
    initials: "SC",
    role: "Startup Founder, TechFlow",
    quote: "HRMSTech saved us 10+ hours every week. Our onboarding is now 100% digital.",
  },
  {
    name: "Marcus Rodriguez",
    initials: "MR",
    role: "HR Director, GrowthCo",
    quote: "The self-service portal reduced our support tickets by 60%. Employees love the autonomy.",
  },
  {
    name: "Priya Sharma",
    initials: "PS",
    role: "People Ops Lead, InnovateLab",
    quote: "Compliance used to keep me up at night. Now it's automated and I sleep better.",
  },
];

const INDUSTRY_LOGOS = [
  {
    name: "IT Startups",
    description: "Tech companies",
    icon: IconChart,
  },
  {
    name: "Agencies",
    description: "Creative & marketing",
    icon: IconTarget,
  },
  {
    name: "SMEs",
    description: "Small businesses",
    icon: IconUsers,
  },
  {
    name: "Consulting",
    description: "Professional services",
    icon: IconShield,
  },
];

const TESTIMONIALS = [
  {
    name: "Amelia Hart",
    role: "HR Manager, FinEdge",
    quote: "Payroll and attendance went from hours to minutes each week.",
  },
  {
    name: "Rohan Patel",
    role: "People Ops, Crest Labs",
    quote: "The team finally has one source of truth for all things HR.",
  },
  {
    name: "Emily Nguyen",
    role: "Head of HR, Northwind",
    quote: "Reviews are organized, fair, and actually drive performance now.",
  },
];

const PRICING_NEW = [
  {
    name: "Starter",
    price: "Free",
    summary: "Perfect for small teams getting started with HR automation.",
    features: [
      "Up to 5 employees",
      "Basic onboarding workflows",
      "Document storage",
      "Leave management",
      "Email support"
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$5",
    summary: "Advanced features for growing teams that need more power.",
    features: [
      "Unlimited employees",
      "Advanced onboarding",
      "Payroll integration",
      "Performance reviews",
      "Analytics dashboard",
      "Priority support"
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    summary: "Tailored solutions for large organizations with specific needs.",
    features: [
      "Custom integrations",
      "SSO/SAML",
      "Dedicated account manager",
      "Custom SLA",
      "Advanced compliance",
      "White-label options"
    ],
    highlight: false,
  },
];

const PRICING = [
  {
    name: "Basic",
    price: "$49",
    summary: "Core HR tools for small teams starting out.",
    features: ["Employee profiles", "Attendance tracking", "Basic reports"],
    highlight: false,
  },
  {
    name: "Professional",
    price: "$99",
    summary: "Advanced automations and analytics for growing companies.",
    features: [
      "Payroll",
      "Performance reviews",
      "Advanced analytics",
      "Priority support",
    ],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    summary: "Security, control, and support at scale.",
    features: ["SSO/SAML", "Custom SLA", "Dedicated CSM", "Audit & compliance"],
    highlight: false,
  },
];

