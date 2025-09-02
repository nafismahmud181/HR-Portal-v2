export default function Home() {
  return (
    <div className="font-sans text-[#1a1a1a] bg-[#ffffff]">
      {/* Header */}
      <header aria-label="Primary" className="sticky top-0 z-50 backdrop-blur bg-white/80 border-b border-[#e5e7eb]">
        <div className="max-w-[1200px] mx-auto px-6 h-[60px] flex items-center justify-between">
          <a href="#" className="flex items-center gap-2">
            <span className="h-5 w-5 rounded bg-[#f97316]" aria-hidden />
            <span className="text-[16px] font-semibold text-[#1a1a1a]">HRMSTech</span>
          </a>
          <nav className="hidden sm:flex items-center gap-6 text-[14px] text-[#374151]">
            <a href="#features" className="hover:text-[#1a1a1a]">Features</a>
            <a href="#benefits" className="hover:text-[#1a1a1a]">Benefits</a>
            <a href="#pricing" className="hover:text-[#1a1a1a]">Pricing</a>
            <a href="/login" className="hover:text-[#1a1a1a]">Log in</a>
            <a href="#get-started" className="inline-flex items-center rounded-md bg-[#1f2937] text-white px-4 py-2 font-medium hover:bg-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]">Start Free Trial</a>
          </nav>
        </div>
      </header>
      {/* Hero */}
      <section
        aria-label="Hero"
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(1200px_600px_at_80%_-10%,#fef7ed,transparent_60%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,rgba(249,115,22,0.06),transparent_30%)]" />
        <div className="max-w-[1200px] mx-auto px-6 pt-20 pb-16 sm:pt-28 sm:pb-24">
          <div className="max-w-[760px]">
            <h1 className="text-[28px] sm:text-[40px] font-semibold leading-[1.2] tracking-tight text-[#1a1a1a]">
              Simplify HR, Empower Your Team
            </h1>
            <p className="mt-4 text-[16px] leading-[1.6] text-[#374151]">
              HRMSTech centralizes employee management, payroll, attendance, performance, and analytics—so your HR runs smoother and your people thrive.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="#pricing"
                className="inline-flex items-center justify-center rounded-md bg-[#1f2937] text-white px-6 py-3 text-[16px] font-medium hover:bg-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
              >
                Start Free Trial
          </a>
          <a
                href="#demo"
                className="inline-flex items-center justify-center rounded-md border border-[#d1d5db] text-[#374151] px-6 py-3 text-[16px] font-medium bg-white hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]"
              >
                Book a Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" aria-label="Features" className="bg-[#f8f9fa] py-14 sm:py-16 scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-[22px] sm:text-[28px] font-semibold text-[#1a1a1a]">Everything you need to manage HR</h2>
          <p className="mt-2 text-[#6b7280] text-[14px]">Clean tools that scale with your team.</p>
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="rounded-lg border border-[#e5e7eb] bg-white p-6 hover:shadow-sm transition-shadow">
                <div className="h-10 w-10 rounded-md flex items-center justify-center bg-[#fef7ed]">
                  <f.icon />
                </div>
                <h3 className="mt-4 text-[16px] font-semibold text-[#1a1a1a]">{f.title}</h3>
                <p className="mt-2 text-[14px] text-[#6b7280]">{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits + Testimonials */}
      <section id="benefits" aria-label="Benefits" className="py-16 scroll-mt-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {BENEFITS.map((b) => (
              <div key={b.title} className="rounded-lg border border-[#e5e7eb] p-6">
                <h3 className="text-[18px] font-semibold text-[#1a1a1a]">{b.title}</h3>
                <p className="mt-2 text-[14px] text-[#374151]">{b.problem}</p>
                <p className="mt-2 text-[14px] text-[#10b981]">{b.solution}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <figure key={t.name} className="rounded-lg border border-[#e5e7eb] bg-white p-6">
                <blockquote className="text-[14px] text-[#374151]">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-[12px] text-[#6b7280]">{t.name}, {t.role}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" aria-label="Pricing" className="bg-[#f8f9fa] py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="text-[22px] sm:text-[28px] font-semibold text-[#1a1a1a]">Simple, transparent pricing</h2>
          <p className="mt-2 text-[#6b7280] text-[14px]">Scale confidently with plans that grow with you.</p>

          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
            {PRICING.map((tier) => (
              <div
                key={tier.name}
                className={`relative rounded-lg border ${
                  tier.highlight ? "border-[#f97316] ring-2 ring-[#f97316]/20" : "border-[#e5e7eb]"
                } bg-white p-6 flex flex-col`}
              >
                {tier.highlight ? (
                  <div className="absolute -top-3 right-4 inline-flex items-center rounded-full bg-[#f97316] px-3 py-1 text-[12px] font-medium text-white">
                    Most Popular
                  </div>
                ) : null}
                <h3 className="text-[16px] font-semibold text-[#1a1a1a]">{tier.name}</h3>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-[28px] font-semibold text-[#1a1a1a]">{tier.price}</span>
                  <span className="text-[12px] text-[#6b7280]">/month</span>
                </div>
                <p className="mt-2 text-[14px] text-[#374151]">{tier.summary}</p>
                <ul className="mt-4 space-y-2 text-[14px] text-[#374151]">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="mt-[3px] inline-block h-2 w-2 rounded-full bg-[#10b981]" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href="#get-started"
                  className={`mt-6 inline-flex items-center justify-center rounded-md px-5 py-3 text-[16px] font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316] ${
                    tier.highlight
                      ? "bg-[#1f2937] text-white hover:bg-[#111827]"
                      : "border border-[#d1d5db] text-[#374151] hover:bg-[#f9fafb]"
                  }`}
                >
                  Choose {tier.name}
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="get-started" aria-label="Call to action" className="py-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <h3 className="text-[18px] font-semibold text-[#1a1a1a]">Get Started Today</h3>
              <p className="mt-2 text-[14px] text-[#374151]">Launch your HR modernization in minutes—no credit card required.</p>
            </div>
            <div className="flex gap-3">
              <a href="#pricing" className="inline-flex items-center justify-center rounded-md bg-[#1f2937] text-white px-6 py-3 text-[16px] font-medium hover:bg-[#111827] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]">
                Start Free Trial
              </a>
              <a href="#demo" className="inline-flex items-center justify-center rounded-md border border-[#d1d5db] text-[#374151] px-6 py-3 text-[16px] font-medium bg-white hover:bg-[#f9fafb] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]">
                Book a Demo
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer aria-label="Footer" className="bg-[#111827] text-[#ededed] py-12">
        <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-[#f97316]" aria-hidden />
              <span className="text-[16px] font-semibold">HRMSTech</span>
            </div>
            <p className="mt-3 text-[14px] text-[#9ca3af]">Modern HR software for growing teams.</p>
          </div>
          <div>
            <h4 className="text-[14px] font-semibold">Company</h4>
            <ul className="mt-3 space-y-2 text-[14px] text-[#d1d5db]">
              <li><a className="hover:underline" href="#">About</a></li>
              <li><a className="hover:underline" href="#">Careers</a></li>
              <li><a className="hover:underline" href="#">Blog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[14px] font-semibold">Resources</h4>
            <ul className="mt-3 space-y-2 text-[14px] text-[#d1d5db]">
              <li><a className="hover:underline" href="#pricing">Pricing</a></li>
              <li><a className="hover:underline" href="#">Help Center</a></li>
              <li><a className="hover:underline" href="#">Security</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-[14px] font-semibold">Contact</h4>
            <ul className="mt-3 space-y-2 text-[14px] text-[#d1d5db]">
              <li>support@hrmstech.com</li>
              <li>+1 (555) 123-4567</li>
              <li className="flex gap-3 pt-1">
                <a aria-label="LinkedIn" href="#" className="hover:opacity-80"><IconLinkedIn /></a>
                <a aria-label="Twitter" href="#" className="hover:opacity-80"><IconTwitter /></a>
                <a aria-label="Facebook" href="#" className="hover:opacity-80"><IconFacebook /></a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-[1200px] mx-auto px-6 mt-8 border-t border-[#374151] pt-6 text-[12px] text-[#9ca3af]">
          © {new Date().getFullYear()} HRMSTech. All rights reserved.
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

