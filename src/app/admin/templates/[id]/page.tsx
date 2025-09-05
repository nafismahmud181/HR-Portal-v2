"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

function formatLongDate(input: string) {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export default function TemplateEditorPage() {
  const params = useParams();
  const id =
    typeof params?.id === "string"
      ? params.id
      : Array.isArray(params?.id)
      ? params?.id[0]
      : "";

  const isLoe = useMemo(() => {
    const normalized = id?.toLowerCase();
    return (
      normalized === "employment-verification-letter" ||
      normalized === "loe" ||
      normalized === "letter-of-employment" ||
      normalized === "letter-of-employment-loe"
    );
  }, [id]);

  if (!isLoe) {
    return (
      <div className="max-w-[1100px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[#f97316]" />
            <span className="text-[16px] font-semibold">Template Editor</span>
          </div>
          <Link
            href="/admin/templates"
            className="px-3 py-2 rounded-md border border-[#e5e7eb] hover:bg-[#f9fafb] text-[14px]"
          >
            Back to Templates
          </Link>
        </div>

        <div className="mt-8 rounded-lg border border-[#e5e7eb] bg-white p-8 text-center">
          <h2 className="text-[18px] font-semibold">Coming soon</h2>
          <p className="mt-2 text-[14px] text-[#6b7280]">
            The selected template editor is under construction. Please choose
            the
            <span className="font-medium">
              {" "}
              LOE / Employment Verification
            </span>{" "}
            template to try the editor.
          </p>
        </div>
      </div>
    );
  }

  return <LoeEditor />;
}

function LoeEditor() {
  const [employeeName, setEmployeeName] = useState("Ben Macklemoore");
  const [designation, setDesignation] = useState("Software Engineer");
  const [department, setDepartment] = useState("Engineering");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [employeeId, setEmployeeId] = useState("EMP-1024");
  const [dateOfJoining, setDateOfJoining] = useState("2019-06-01");
  const [currentSalary, setCurrentSalary] = useState("$96,000 per annum");
  const [companyName, setCompanyName] = useState("HRMSTech");
  const [companyStreet, setCompanyStreet] = useState("3781 Patterson Street");
  const [companyCity, setCompanyCity] = useState("Houston");
  const [companyState, setCompanyState] = useState("TX");
  const [companyZip, setCompanyZip] = useState("77092");
  const [companyCountry, setCompanyCountry] = useState("USA");
  const [issueDate, setIssueDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [hrName, setHrName] = useState("Harry Mayer");
  const [hrTitle, setHrTitle] = useState("HR Manager");
  const [hrEmail, setHrEmail] = useState("hr@hrmstech.com");
  const [hrPhone, setHrPhone] = useState("+1 (555) 012-3456");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);

  const companyAddressLine = `${companyStreet}`.trim();
  const companyCityLine =
    `${companyCity}, ${companyState}, ${companyZip}`.trim();

  function handleExport() {
    const formattedJoin = formatLongDate(dateOfJoining);
    const formattedIssue = formatLongDate(issueDate);
    const addressHtml = `${companyAddressLine}<br/>${companyCityLine}<br/>${companyCountry}`;
    const signatureImgHTML = signatureDataUrl
      ? `<img src="${signatureDataUrl}" style="height:64px;object-fit:contain;display:block;margin-left:auto;margin-bottom:4px;" />`
      : "";

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Letter of Employment</title>
    <style>
      @page { margin: 15mm; }
      html, body { height: 100%; }
      body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; color: #111827; }
      .doc { max-width: 800px; margin: 0 auto; }
      .card { border: 0; border-radius: 0; }
      .header { padding: 0 0 8px; text-align: center; border-bottom: 0; }
      .title { font-weight: 600; font-size: 14px; letter-spacing: 0.02em; margin: 0; }
      .content { padding: 0; font-size: 13px; }
      .row { display: flex; align-items: flex-start; gap: 8px; margin: 0 0 6px; }
      .label { width: 7rem; color: #6b7280; }
      .value { font-weight: 500; }
      .rule { border-top: 1px solid #e5e7eb; height: 0; margin: 16px 0; }
      .para { font-size: 13px; line-height: 1.65; margin: 12px 0; }
      .footer { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 12px; }
      .issued { color: #6b7280; font-size: 12px; }
      .sign-name { font-weight: 600; font-size: 18px; }
      .sign-meta { color: #6b7280; font-size: 12px; }
      .sign { text-align: right; }
    </style>
  </head>
  <body>
    <div class="doc">
      <div class="card">
        <div class="header"><div class="title">LETTER OF EMPLOYMENT</div></div>
        <div class="content">
          <div class="row"><div class="label">Name</div><div class="value">${employeeName}</div></div>
          <div class="row"><div class="label">Employee ID</div><div class="value">${employeeId}</div></div>
          <div class="row"><div class="label">Designation</div><div class="value">${designation}</div></div>
          <div class="row"><div class="label">Department</div><div class="value">${department}</div></div>
          <div class="row"><div class="label">Employment</div><div class="value">${employmentType}</div></div>
          <div class="row"><div class="label">Joined</div><div class="value">${formattedJoin}</div></div>
          <div class="row"><div class="label">Salary</div><div class="value">${currentSalary}</div></div>
          <div class="row"><div class="label">Address</div><div class="value">${addressHtml}</div></div>

          <div class="rule"></div>

          <p class="para">This letter is to confirm that <strong>${employeeName}</strong> is employed with <strong>${companyName}</strong> as a <strong>${designation}</strong>${
      department ? ` in the <strong>${department}</strong> department` : ""
    } since ${formattedJoin}. The nature of employment is ${employmentType.toLowerCase()} and the current compensation is ${currentSalary}.</p>

          <p class="para">This letter is issued upon request of the employee for whatever purpose it may serve. For additional verification, please contact ${hrName} (${hrTitle}) at ${hrEmail} or ${hrPhone}.</p>

          <div class="rule"></div>

          <div class="footer">
            <div class="issued">Issued on ${formattedIssue}</div>
            <div class="sign">
              ${signatureImgHTML}
              <div class="sign-name">${hrName}</div>
              <div class="sign-meta">${hrTitle}</div>
              <div class="sign-meta">${companyName}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <script>
      window.onload = function(){
        setTimeout(function(){ window.print(); window.close(); }, 100);
      };
    </script>
  </body>
</html>`;

    const printWindow = window.open("", "_blank", "width=900,height=1000");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
  }

  function handleSignatureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "image/png") {
      // Only PNG supported per requirement
      const reader = new FileReader();
      reader.onload = () => setSignatureDataUrl(reader.result as string);
      reader.readAsDataURL(file);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setSignatureDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1a1a1a]">
      <style>{`@media print { .no-print { display: none !important; } .print-area { box-shadow: none !important; } .print-letter-card { border: 0 !important; } .print-letter-header { border: 0 !important; } .print-letter-container { max-width: 700px !important; width: 100% !important; margin: 0 auto !important; } .print-layout { border: 0 !important; padding: 0 !important; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { margin: 20mm; } }`}</style>
      <div className="sticky top-0 z-10 bg-white border-b border-[#e5e7eb] no-print">
        <div className="max-w-[1200px] mx-auto h-[60px] flex items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-[#f97316]" />
            <span className="text-[16px] font-semibold">
              LOE — Template Editor
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/templates"
              className="px-3 py-2 rounded-md border border-[#e5e7eb] text-[14px] hover:bg-[#f9fafb]"
            >
              Back
            </Link>
            <button
              onClick={handleExport}
              className="px-3 py-2 rounded-md border border-[#f97316] text-[#f97316] text-[14px] hover:bg-[#fef7ed]"
            >
              Export
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[360px_1fr] gap-6">
          {/* Left: Form */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 md:p-5 h-max no-print">
            <h2 className="text-[16px] font-semibold">Employment Details</h2>

            <div className="mt-4 space-y-4">
              <Field label="Full name">
                <input
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Employee ID">
                  <input
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                  />
                </Field>
                <Field label="Employment type">
                  <select
                    value={employmentType}
                    onChange={(e) => setEmploymentType(e.target.value)}
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316] bg-white"
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Intern</option>
                  </select>
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Designation">
                  <input
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                  />
                </Field>
                <Field label="Department">
                  <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Date of joining">
                  <input
                    type="date"
                    value={dateOfJoining}
                    onChange={(e) => setDateOfJoining(e.target.value)}
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                  />
                </Field>
                <Field label="Current salary">
                  <input
                    value={currentSalary}
                    onChange={(e) => setCurrentSalary(e.target.value)}
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                  />
                </Field>
              </div>

              <h3 className="mt-6 text-[14px] font-medium text-[#374151]">
                Company
              </h3>

              <Field label="Company name">
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                />
              </Field>

              <Field label="Street">
                <input
                  value={companyStreet}
                  onChange={(e) => setCompanyStreet(e.target.value)}
                  className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="City">
                  <input
                    value={companyCity}
                    onChange={(e) => setCompanyCity(e.target.value)}
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                  />
                </Field>
                <Field label="State">
                  <input
                    value={companyState}
                    onChange={(e) => setCompanyState(e.target.value)}
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                  />
                </Field>
                <Field label="Zip Code">
                  <input
                    value={companyZip}
                    onChange={(e) => setCompanyZip(e.target.value)}
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                  />
                </Field>
              </div>

              <Field label="Country">
                <input
                  value={companyCountry}
                  onChange={(e) => setCompanyCountry(e.target.value)}
                  className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                />
              </Field>

              <h3 className="mt-6 text-[14px] font-medium text-[#374151]">
                Issuance
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Issue date">
                  <input
                    type="date"
                    value={issueDate}
                    onChange={(e) => setIssueDate(e.target.value)}
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                  />
                </Field>
              </div>

              <h3 className="mt-6 text-[14px] font-medium text-[#374151]">
                Contact
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Signature (PNG)">
                    <input
                      type="file"
                      accept="image/png"
                      onChange={handleSignatureChange}
                      className="block w-full text-[14px]"
                    />
                  </Field>
                </div>
                <Field label="HR contact name">
                  <input
                    value={hrName}
                    onChange={(e) => setHrName(e.target.value)}
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                  />
                </Field>
                <Field label="Title">
                  <input
                    value={hrTitle}
                    onChange={(e) => setHrTitle(e.target.value)}
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={hrEmail}
                    onChange={(e) => setHrEmail(e.target.value)}
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                  />
                </Field>
                <Field label="Phone">
                  <input
                    value={hrPhone}
                    onChange={(e) => setHrPhone(e.target.value)}
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                  />
                </Field>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleExport}
                className="w-full md:w-auto px-4 py-2 rounded-md border border-[#f97316] text-[#f97316] text-[14px] hover:bg-[#fef7ed]"
              >
                Export
              </button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 md:p-6 print-layout">
            <div className="mx-auto max-w-[800px] print-letter-container">
              <div className="rounded-md print-area print-letter-card">
                <div className="px-6 py-4 text-center print-letter-header">
                  <h2 className="text-[14px] font-semibold tracking-wide">
                    LETTER OF EMPLOYMENT
                  </h2>
                </div>
                <div className="px-6 py-5 text-[13px]">
                  <div className="space-y-1 text-[#111827]">
                    <div className="flex items-start gap-2">
                      <span className="w-28 text-[#6b7280]">Name</span>
                      <span className="font-medium">{employeeName}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-28 text-[#6b7280]">Employee ID</span>
                      <span>{employeeId}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-28 text-[#6b7280]">Designation</span>
                      <span>{designation}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-28 text-[#6b7280]">Department</span>
                      <span>{department}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-28 text-[#6b7280]">Employment</span>
                      <span>{employmentType}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-28 text-[#6b7280]">Joined</span>
                      <span>{formatLongDate(dateOfJoining)}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-28 text-[#6b7280]">Salary</span>
                      <span>{currentSalary}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-28 text-[#6b7280]">Address</span>
                      <span>
                        {companyAddressLine}
                        <br />
                        {companyCityLine}
                        <br />
                        {companyCountry}
                      </span>
                    </div>
                  </div>

                  <div className="my-6 h-px bg-[#e5e7eb]" />

                  <div className="space-y-4 leading-relaxed text-[#111827]">
                    <p>
                      This letter is to confirm that{" "}
                      <span className="font-medium">{employeeName}</span> is
                      employed with
                      <span className="font-medium"> {companyName}</span> as a{" "}
                      <span className="font-medium">{designation}</span>
                      {department ? (
                        <>
                          {" "}
                          in the{" "}
                          <span className="font-medium">{department}</span>{" "}
                          department
                        </>
                      ) : null}{" "}
                      since {formatLongDate(dateOfJoining)}. The nature of
                      employment is {employmentType.toLowerCase()} and the
                      current compensation is {currentSalary}.
                    </p>
                    <p>
                      This letter is issued upon request of the employee for
                      whatever purpose it may serve. For additional
                      verification, please contact {hrName} ({hrTitle}) at{" "}
                      {hrEmail} or {hrPhone}.
                    </p>
                  </div>

                  <div className="my-6 h-px bg-[#e5e7eb]" />

                  <div className="flex items-end justify-between">
                    <div className="text-[12px] text-[#6b7280]">
                      Issued on {formatLongDate(issueDate)}
                    </div>
                    <div className="text-right flex flex-col items-end">
                      {signatureDataUrl && (
                        <Image
                          src={signatureDataUrl}
                          alt="Signature"
                          width={220}
                          height={64}
                          className="h-16 w-auto max-w-[220px] object-contain mb-1 self-end ml-auto"
                          unoptimized
                        />
                      )}
                      <div className="text-[18px] font-semibold">{hrName}</div>
                      <div className="text-[12px] text-[#6b7280]">
                        {hrTitle}
                      </div>
                      <div className="text-[12px] text-[#6b7280]">
                        {companyName}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[12px] text-[#6b7280]">{label}</div>
      {children}
    </label>
  );
}
