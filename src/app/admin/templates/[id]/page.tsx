"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useMemo, useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  collectionGroup,
  getDocs,
  getDoc,
  query,
  where,
  doc,
} from "firebase/firestore";
import RichTextEditor from "@/components/RichTextEditor";
import {
  AVAILABLE_FIELDS,
  DEFAULT_LETTER_TEMPLATE,
  processTemplateToHtml,
  formatLongDate,
  type EmployeeData,
} from "@/lib/template-utils";

// Employee interface for dropdown
interface Employee {
  id: string;
  name: string;
  employeeId: string;
  email: string;
  department: string;
  jobTitle: string;
  hireDate: string;
  employeeType: string;
  status: string;
  location?: string;
  compensation?: string;
  salary?: string;
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
  const [employeeName, setEmployeeName] = useState("");
  const [designation, setDesignation] = useState("");
  const [department, setDepartment] = useState("");
  const [employmentType, setEmploymentType] = useState("Full-time");
  const [employeeId, setEmployeeId] = useState("");
  const [dateOfJoining, setDateOfJoining] = useState("");
  const [currentSalary, setCurrentSalary] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [companyStreet, setCompanyStreet] = useState("");
  const [companyCity, setCompanyCity] = useState("");
  const [companyState, setCompanyState] = useState("");
  const [companyZip, setCompanyZip] = useState("");
  const [companyCountry, setCompanyCountry] = useState("");
  const [issueDate, setIssueDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [hrName, setHrName] = useState("");
  const [hrTitle, setHrTitle] = useState("");
  const [hrEmail, setHrEmail] = useState("");
  const [hrWebsite, setHrWebsite] = useState("");
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [letterContent, setLetterContent] = useState(DEFAULT_LETTER_TEMPLATE);
  const [useRichEditor, setUseRichEditor] = useState(true);
  const [templateName, setTemplateName] = useState("");
  const [savedTemplates, setSavedTemplates] = useState<
    Array<{ name: string; content: string; id: string }>
  >([]);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [availableSignatories, setAvailableSignatories] = useState<
    Array<{
      name: string;
      title: string;
      email: string;
      signatureImage?: string;
    }>
  >([]);

  // Employee dropdown state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [bulkItems, setBulkItems] = useState<
    Array<{
      employeeName: string;
      designation: string;
      department: string;
      employmentType: string;
      employeeId: string;
      dateOfJoining: string;
      currentSalary: string;
    }>
  >([]);
  const [excelRows, setExcelRows] = useState<Array<Record<string, string>>>([]);
  const [excelHeaders, setExcelHeaders] = useState<string[]>([]);
  const mappingKeys = [
    "employeeName",
    "employeeId",
    "designation",
    "department",
    "employmentType",
    "dateOfJoining",
    "currentSalary",
  ] as const;
  type MappingKey = (typeof mappingKeys)[number];
  const [mapping, setMapping] = useState<Record<MappingKey, string>>({
    employeeName: "",
    employeeId: "",
    designation: "",
    department: "",
    employmentType: "",
    dateOfJoining: "",
    currentSalary: "",
  });

  const companyAddressLine = `${companyStreet}`.trim();
  const companyCityLine =
    `${companyCity}, ${companyState}, ${companyZip}`.trim();

  // Get current employee data for template processing
  const getCurrentEmployeeData = (): EmployeeData => ({
    employeeName,
    designation,
    department,
    employmentType,
    employeeId,
    dateOfJoining,
    currentSalary,
    companyName,
    companyStreet,
    companyCity,
    companyState,
    companyZip,
    companyCountry,
    issueDate,
    hrName,
    hrTitle,
    hrEmail,
    hrWebsite,
  });

  function handleExport() {
    const formattedJoin = formatLongDate(dateOfJoining) || "[Date of Joining]";
    const formattedIssue = formatLongDate(issueDate);
    const addressHtml = `${companyAddressLine || "[Street Address]"}<br/>${
      companyCityLine || "[City, State, Zip]"
    }<br/>${companyCountry || "[Country]"}`;
    const signatureImgHTML = signatureDataUrl
      ? `<img src="${signatureDataUrl}" style="height:64px;object-fit:contain;display:block;margin-left:auto;margin-bottom:4px;" />`
      : "";

    // Process the rich text content with placeholders and convert to HTML
    const processedContent = processTemplateToHtml(
      letterContent,
      getCurrentEmployeeData()
    );

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
          <div class="row"><div class="label">Name</div><div class="value">${
            employeeName || "[Name]"
          }</div></div>
          <div class="row"><div class="label">Employee ID</div><div class="value">${
            employeeId || "[Employee ID]"
          }</div></div>
          <div class="row"><div class="label">Designation</div><div class="value">${
            designation || "[Designation]"
          }</div></div>
          <div class="row"><div class="label">Department</div><div class="value">${
            department || "[Department]"
          }</div></div>
          <div class="row"><div class="label">Employment</div><div class="value">${employmentType}</div></div>
          <div class="row"><div class="label">Joined</div><div class="value">${formattedJoin}</div></div>
          <div class="row"><div class="label">Salary</div><div class="value">${
            currentSalary || "[Current Salary]"
          }</div></div>
          <div class="row"><div class="label">Address</div><div class="value">${addressHtml}</div></div>

          <div class="rule"></div>

          <div class="para">${processedContent}</div>

          <div class="rule"></div>

          <div class="footer">
            <div class="issued">Issued on ${formattedIssue}</div>
            <div class="sign">
              ${signatureImgHTML}
              <div class="sign-name">${hrName || "[HR Name]"}</div>
              <div class="sign-meta">${hrTitle || "[HR Title]"}</div>
              <div class="sign-meta">${companyName || "[Company Name]"}</div>
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

  // function addCurrentToBulk() {
  //   setBulkItems((prev) => [
  //     ...prev,
  //     {
  //       employeeName,
  //       designation,
  //       department,
  //       employmentType,
  //       employeeId,
  //       dateOfJoining,
  //       currentSalary,
  //     },
  //   ]);
  // }

  function removeBulkItem(index: number) {
    setBulkItems((prev) => prev.filter((_, i) => i !== index));
  }

  // function handleBulkCsvImport(e: React.ChangeEvent<HTMLInputElement>) {
  //   const file = e.target.files?.[0];
  //   if (!file) return;
  //   const reader = new FileReader();
  //   reader.onload = () => {
  //     try {
  //       const text = String(reader.result || "");
  //       const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  //       if (lines.length === 0) return;
  //       let startIdx = 0;
  //       const header = lines[0].toLowerCase();
  //       const hasHeader = [
  //         "name",
  //         "employee",
  //         "designation",
  //         "department",
  //       ].some((h) => header.includes(h));
  //       if (hasHeader) startIdx = 1;
  //       const parsed: Array<{
  //         employeeName: string;
  //         designation: string;
  //         department: string;
  //         employmentType: string;
  //         employeeId: string;
  //         dateOfJoining: string;
  //         currentSalary: string;
  //       }> = [];
  //       for (let i = startIdx; i < lines.length; i++) {
  //         const cols = lines[i].split(",").map((c) => c.trim());
  //         const [
  //           nameCol,
  //           empIdCol,
  //           titleCol,
  //           deptCol,
  //           typeCol,
  //           joinCol,
  //           salaryCol,
  //         ] = cols;
  //         if (!nameCol) continue;
  //         parsed.push({
  //           employeeName: nameCol,
  //           employeeId: empIdCol || "",
  //           designation: titleCol || "",
  //           department: deptCol || "",
  //           employmentType: typeCol || employmentType,
  //           dateOfJoining: joinCol || dateOfJoining,
  //           currentSalary: salaryCol || currentSalary,
  //         });
  //       }
  //       if (parsed.length > 0) setBulkItems((prev) => [...prev, ...parsed]);
  //     } catch {}
  //   };
  //   reader.readAsText(file);
  // }

  async function handleExcelUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    type XlsxModule = {
      read: (
        data: ArrayBuffer | Uint8Array,
        opts?: { type?: string }
      ) => unknown;
      utils: {
        sheet_to_json: (
          ws: unknown,
          opts?: { defval?: string }
        ) => Array<Record<string, string>>;
      };
    };
    let XLSX: XlsxModule;
    try {
      XLSX = await import("xlsx");
    } catch {
      XLSX = await import("xlsx/xlsx.mjs");
    }
    const data = await file.arrayBuffer();
    const wb = XLSX.read(data, { type: "array" }) as unknown as {
      Sheets: Record<string, unknown>;
      SheetNames: string[];
    };
    const ws = (wb.Sheets as Record<string, unknown>)[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(ws, { defval: "" }) as Array<
      Record<string, string>
    >;
    setExcelRows(json);
    setExcelHeaders(json.length ? Object.keys(json[0]) : []);
  }

  function confirmMappingFromExcel() {
    if (!excelRows.length) return;
    const items = excelRows.map((row) => ({
      employeeName: row[mapping.employeeName] || "",
      employeeId: row[mapping.employeeId] || "",
      designation: row[mapping.designation] || "",
      department: row[mapping.department] || "",
      employmentType: row[mapping.employmentType] || employmentType,
      dateOfJoining: row[mapping.dateOfJoining] || dateOfJoining,
      currentSalary: row[mapping.currentSalary] || currentSalary,
    }));
    setBulkItems((prev) => [...prev, ...items]);
  }

  function handleExportBulk() {
    if (bulkItems.length === 0) return;
    const formattedIssue = formatLongDate(issueDate);
    const addressHtml = `${companyAddressLine || "[Street Address]"}<br/>${
      companyCityLine || "[City, State, Zip]"
    }<br/>${companyCountry || "[Country]"}`;
    const signatureImgHTML = signatureDataUrl
      ? `<img src="${signatureDataUrl}" style="height:60px;object-fit:contain;display:block;margin-left:auto;margin-bottom:4px;" />`
      : "";

    const docs = bulkItems
      .map((it) => {
        // Create employee data for this bulk item
        const employeeData: EmployeeData = {
          employeeName: it.employeeName,
          designation: it.designation,
          department: it.department,
          employmentType: it.employmentType,
          employeeId: it.employeeId,
          dateOfJoining: it.dateOfJoining,
          currentSalary: it.currentSalary,
          companyName,
          companyStreet,
          companyCity,
          companyState,
          companyZip,
          companyCountry,
          issueDate,
          hrName,
          hrTitle,
          hrEmail,
          hrWebsite,
        };

        // Process the rich text content with placeholders for this employee and convert to HTML
        const processedContent = processTemplateToHtml(
          letterContent,
          employeeData
        );

        return `
        <div class="doc">
          <div class="card">
            <div class="header"><div class="title">LETTER OF EMPLOYMENT</div></div>
            <div class="content">
              <div class="row"><div class="label">Name</div><div class="value">${
                it.employeeName || "[Name]"
              }</div></div>
              <div class="row"><div class="label">Employee ID</div><div class="value">${
                it.employeeId || "[Employee ID]"
              }</div></div>
              <div class="row"><div class="label">Designation</div><div class="value">${
                it.designation || "[Designation]"
              }</div></div>
              <div class="row"><div class="label">Department</div><div class="value">${
                it.department || "[Department]"
              }</div></div>
              <div class="row"><div class="label">Employment</div><div class="value">${
                it.employmentType
              }</div></div>
              <div class="row"><div class="label">Joined</div><div class="value">${
                formatLongDate(it.dateOfJoining) || "[Date of Joining]"
              }</div></div>
              <div class="row"><div class="label">Salary</div><div class="value">${
                it.currentSalary || "[Current Salary]"
              }</div></div>
              <div class="row"><div class="label">Address</div><div class="value">${addressHtml}</div></div>

              <div class="rule"></div>

              <div class="para">${processedContent}</div>

              <div class="rule"></div>

              <div class="footer">
                <div class="issued">Issued on ${formattedIssue}</div>
                <div class="sign">
                  ${signatureImgHTML}
                  <div class="sign-name">${hrName || "[HR Name]"}</div>
                  <div class="sign-meta">${hrTitle || "[HR Title]"}</div>
                  <div class="sign-meta">${
                    companyName || "[Company Name]"
                  }</div>
                </div>
              </div>
            </div>
          </div>
        </div>`;
      })
      .join('<div class="page-break"></div>');

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Letters of Employment</title>
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
      .page-break { page-break-after: always; break-after: page; height: 0; }
    </style>
  </head>
  <body>
    ${docs}
    <script>
      window.onload = function(){ setTimeout(function(){ window.print(); window.close(); }, 100); };
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

  // Template management functions
  function saveTemplate() {
    if (!templateName.trim()) return;
    const newTemplate = {
      id: Date.now().toString(),
      name: templateName.trim(),
      content: letterContent,
    };
    setSavedTemplates((prev) => [...prev, newTemplate]);
    setTemplateName("");
    setShowSaveDialog(false);
    // Save to localStorage
    localStorage.setItem(
      "loe_templates",
      JSON.stringify([...savedTemplates, newTemplate])
    );
  }

  function loadTemplate(template: {
    name: string;
    content: string;
    id: string;
  }) {
    setLetterContent(template.content);
    setShowSaveDialog(false);
  }

  function deleteTemplate(templateId: string) {
    const updatedTemplates = savedTemplates.filter((t) => t.id !== templateId);
    setSavedTemplates(updatedTemplates);
    localStorage.setItem("loe_templates", JSON.stringify(updatedTemplates));
  }

  // Load templates from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("loe_templates");
    if (stored) {
      try {
        setSavedTemplates(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load saved templates:", e);
      }
    }
  }, []);

  // Fetch employees and company data from Firebase
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              // Find organization using the same pattern as other admin pages
              let orgId = null;
              let companyData = null;

              // First try: find org where user is a member (most common case)
              const cg = collectionGroup(db, "users");
              const q = query(cg, where("uid", "==", user.uid));
              const snap = await getDocs(q);

              if (!snap.empty) {
                const ref = snap.docs[0].ref;
                const parentOrg = ref.parent.parent;
                orgId = parentOrg ? parentOrg.id : null;

                if (orgId) {
                  // Get organization data
                  const orgDoc = await getDoc(doc(db, "organizations", orgId));
                  if (orgDoc.exists()) {
                    companyData = orgDoc.data();
                    console.log("Company data from organization:", companyData);
                  }
                }
              } else {
                // Fallback: find org where user is the creator
                const orgRef = collection(db, "organizations");
                const orgQuery = query(
                  orgRef,
                  where("createdBy", "==", user.uid)
                );
                const orgSnapshot = await getDocs(orgQuery);

                if (!orgSnapshot.empty) {
                  const orgDoc = orgSnapshot.docs[0];
                  orgId = orgDoc.id;
                  companyData = orgDoc.data();
                  console.log(
                    "Company data from created organization:",
                    companyData
                  );
                }
              }

              // Auto-populate company fields with organization data
              if (companyData) {
                if (companyData.name) setCompanyName(companyData.name);
                if (companyData.adminAddress) {
                  setCompanyStreet(companyData.adminAddress.street || "");
                  setCompanyCity(companyData.adminAddress.city || "");
                  setCompanyState(companyData.adminAddress.state || "");
                  setCompanyZip(companyData.adminAddress.zip || "");
                  setCompanyCountry(companyData.adminAddress.country || "");
                }

                // Also try primaryOffice if adminAddress is not available
                if (!companyData.adminAddress && companyData.primaryOffice) {
                  setCompanyStreet(companyData.primaryOffice.address || "");
                  setCompanyCity(companyData.primaryOffice.city || "");
                  setCompanyState(companyData.primaryOffice.state || "");
                  setCompanyZip(companyData.primaryOffice.zipCode || "");
                  setCompanyCountry(companyData.primaryOffice.country || "");
                }

                // Also try mailingAddress as fallback
                if (
                  !companyData.adminAddress &&
                  !companyData.primaryOffice &&
                  companyData.mailingAddress
                ) {
                  setCompanyStreet(companyData.mailingAddress.street || "");
                  setCompanyCity(companyData.mailingAddress.city || "");
                  setCompanyState(companyData.mailingAddress.state || "");
                  setCompanyZip(companyData.mailingAddress.zip || "");
                  setCompanyCountry(companyData.mailingAddress.country || "");
                }

                // Auto-populate website from company profile
                if (companyData.website) {
                  setHrWebsite(companyData.website);
                  console.log(
                    "Auto-populated website from company profile:",
                    companyData.website
                  );
                }

                // Auto-populate HR contact fields from signatory data
                if (
                  companyData.documentConfig &&
                  companyData.documentConfig.authorizedSignatories &&
                  companyData.documentConfig.authorizedSignatories.length > 0
                ) {
                  // Store all available signatories
                  setAvailableSignatories(
                    companyData.documentConfig.authorizedSignatories
                  );

                  // Use the first signatory as the default HR contact
                  const firstSignatory =
                    companyData.documentConfig.authorizedSignatories[0];
                  console.log(
                    "Auto-populating HR fields from signatory:",
                    firstSignatory
                  );

                  if (firstSignatory.name) setHrName(firstSignatory.name);
                  if (firstSignatory.title) setHrTitle(firstSignatory.title);
                  if (firstSignatory.email) setHrEmail(firstSignatory.email);

                  // Auto-populate signature image from signatory
                  if (firstSignatory.signatureImage) {
                    setSignatureDataUrl(firstSignatory.signatureImage);
                    console.log(
                      "Auto-populated signature image from signatory"
                    );
                  }
                }
              }

              if (!orgId) {
                console.error("No organization found for user");
                setEmployees([]);
                return;
              }

              // Fetch employees from the organization's employees subcollection
              const employeesRef = collection(
                db,
                "organizations",
                orgId,
                "employees"
              );
              const employeesQuery = query(
                employeesRef,
                where("status", "==", "Active")
              );
              const snapshot = await getDocs(employeesQuery);

              const employeesList: Employee[] = [];
              snapshot.forEach((doc) => {
                const data = doc.data();
                console.log("Employee data from DB:", doc.id, data);
                console.log("Salary field:", data.salary);
                console.log("Compensation field:", data.compensation);
                console.log("All data fields:", Object.keys(data));

                // Handle hireDate conversion - convert Firestore timestamp to string if needed
                let hireDateValue = "";
                if (data.hireDate) {
                  if (typeof data.hireDate === "string") {
                    hireDateValue = data.hireDate;
                  } else if (
                    data.hireDate.toDate &&
                    typeof data.hireDate.toDate === "function"
                  ) {
                    // Firestore timestamp
                    hireDateValue = data.hireDate
                      .toDate()
                      .toISOString()
                      .slice(0, 10);
                  } else if (data.hireDate.seconds) {
                    // Firestore timestamp object
                    const date = new Date(data.hireDate.seconds * 1000);
                    hireDateValue = date.toISOString().slice(0, 10);
                  } else {
                    hireDateValue = data.hireDate;
                  }
                }

                // Try multiple possible salary field names
                const salaryValue =
                  data.salary ||
                  data.compensation ||
                  data.currentSalary ||
                  data.annualSalary ||
                  "";
                console.log("Final salary value:", salaryValue);

                employeesList.push({
                  id: doc.id,
                  name: data.name || "",
                  employeeId: data.employeeId || doc.id,
                  email: data.email || "",
                  department: data.department || "",
                  jobTitle: data.jobTitle || "",
                  hireDate: hireDateValue,
                  employeeType: data.employeeType || "Full-time",
                  status: data.status || "Active",
                  location: data.location || "",
                  compensation: data.compensation || "",
                  salary: salaryValue,
                });
              });

              setEmployees(employeesList);
            } catch (orgError) {
              console.error("Error accessing organization:", orgError);
              // If organization access fails, try direct employees collection as fallback
              try {
                const employeesRef = collection(db, "employees");
                const employeesQuery = query(
                  employeesRef,
                  where("status", "==", "Active")
                );
                const snapshot = await getDocs(employeesQuery);

                const employeesList: Employee[] = [];
                snapshot.forEach((doc) => {
                  const data = doc.data();

                  // Handle hireDate conversion - convert Firestore timestamp to string if needed
                  let hireDateValue = "";
                  if (data.hireDate) {
                    if (typeof data.hireDate === "string") {
                      hireDateValue = data.hireDate;
                    } else if (
                      data.hireDate.toDate &&
                      typeof data.hireDate.toDate === "function"
                    ) {
                      // Firestore timestamp
                      hireDateValue = data.hireDate
                        .toDate()
                        .toISOString()
                        .slice(0, 10);
                    } else if (data.hireDate.seconds) {
                      // Firestore timestamp object
                      const date = new Date(data.hireDate.seconds * 1000);
                      hireDateValue = date.toISOString().slice(0, 10);
                    } else {
                      hireDateValue = data.hireDate;
                    }
                  }

                  // Try multiple possible salary field names
                  const salaryValue =
                    data.salary ||
                    data.compensation ||
                    data.currentSalary ||
                    data.annualSalary ||
                    "";

                  employeesList.push({
                    id: doc.id,
                    name: data.name || "",
                    employeeId: data.employeeId || doc.id,
                    email: data.email || "",
                    department: data.department || "",
                    jobTitle: data.jobTitle || "",
                    hireDate: hireDateValue,
                    employeeType: data.employeeType || "Full-time",
                    status: data.status || "Active",
                    location: data.location || "",
                    compensation: data.compensation || "",
                    salary: salaryValue,
                  });
                });

                setEmployees(employeesList);
              } catch (fallbackError) {
                console.error("Fallback employee fetch failed:", fallbackError);
                setEmployees([]);
              }
            }
          }
        });

        return () => unsubscribe();
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoadingEmployees(false);
      }
    };

    fetchEmployees();
  }, []);

  // Auto-populate form fields when employee is selected
  // Handle signatory selection
  const handleSignatorySelect = (signatory: {
    name: string;
    title: string;
    email: string;
    signatureImage?: string;
  }) => {
    setHrName(signatory.name);
    setHrTitle(signatory.title);
    setHrEmail(signatory.email);

    // Update signature image if available
    if (signatory.signatureImage) {
      setSignatureDataUrl(signatory.signatureImage);
      console.log(
        "Updated signature image from selected signatory:",
        signatory.name
      );
    } else {
      // Clear signature if selected signatory doesn't have one
      setSignatureDataUrl(null);
      console.log(
        "Cleared signature image - selected signatory has no signature"
      );
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);

    if (employeeId === "") {
      // Clear form if no employee selected
      setEmployeeName("");
      setDesignation("");
      setDepartment("");
      setEmployeeId("");
      setDateOfJoining("");
      setCurrentSalary("");
      setEmploymentType("Full-time");
      return;
    }

    const selectedEmployee = employees.find((emp) => emp.id === employeeId);
    console.log("Selected employee:", selectedEmployee);
    console.log("Employee compensation:", selectedEmployee?.compensation);
    console.log("Employee salary:", selectedEmployee?.salary);

    if (selectedEmployee) {
      setEmployeeName(selectedEmployee.name);
      setDesignation(selectedEmployee.jobTitle);
      setDepartment(selectedEmployee.department);
      setEmployeeId(selectedEmployee.employeeId);

      // Set hireDate (already converted to string during fetch)
      setDateOfJoining(selectedEmployee.hireDate || "");

      const salaryValue =
        selectedEmployee.compensation || selectedEmployee.salary || "";
      console.log("Setting salary value:", salaryValue);
      setCurrentSalary(salaryValue);
      setEmploymentType(selectedEmployee.employeeType);
    }
  };

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1a1a1a]">
      <style>{`
        @media print { 
          .no-print { display: none !important; } 
          .print-area { box-shadow: none !important; } 
          .print-letter-card { border: 0 !important; } 
          .print-letter-header { border: 0 !important; } 
          .print-letter-container { max-width: 700px !important; width: 100% !important; margin: 0 auto !important; } 
          .print-layout { border: 0 !important; padding: 0 !important; } 
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } 
          @page { margin: 20mm; } 
        }
        
        /* Custom MDEditor Styles */
        .w-md-editor {
          border: 1px solid #d1d5db !important;
          border-radius: 6px !important;
        }
        
        .w-md-editor-toolbar {
          background-color: #f9fafb !important;
          border-bottom: 1px solid #e5e7eb !important;
          height: 40px !important;
        }
        
        .w-md-editor-toolbar button {
          color: #6b7280 !important;
        }
        
        .w-md-editor-toolbar button:hover {
          background-color: #f3f4f6 !important;
          color: #374151 !important;
        }
        
        .w-md-editor-toolbar button.active {
          background-color: #fef7ed !important;
          color: #f97316 !important;
        }
        
        .w-md-editor-text-container {
          background-color: white !important;
        }
        
        .w-md-editor-text {
          font-size: 14px !important;
          line-height: 1.5 !important;
          color: #111827 !important;
        }
        
        /* Employee dropdown styling */
        select option {
          padding: 8px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        
        select {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
      `}</style>
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

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr_300px] gap-6">
          {/* Left: Form */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 md:p-5 h-max no-print">
            <h2 className="text-[16px] font-semibold">Bulk Create</h2>

            <div className="mb-4 space-y-4">
              <div className="flex flex-wrap gap-2">
                <div className="mt-4 space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <label className="px-3 py-2 rounded-md border border-[#d1d5db] text-[14px] hover:bg-[#f9fafb] cursor-pointer">
                      Upload Excel
                      <input
                        type="file"
                        accept=".xlsx,.xls"
                        onChange={handleExcelUpload}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      disabled={bulkItems.length === 0}
                      onClick={handleExportBulk}
                      className="px-3 py-2 rounded-md border border-[#f97316] text-[#f97316] text-[14px] hover:bg-[#fef7ed] disabled:opacity-50"
                    >
                      Export Bulk ({bulkItems.length})
                    </button>
                  </div>
                </div>
              </div>

              <h2 className="text-[16px] font-semibold">Employment Details</h2>

              <div className="mb-4">
                <label className="block mb-1 text-[12px] text-[#6b7280]">
                  Select Employee
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                    className="w-full sm:flex-1 rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316] bg-white"
                    disabled={loadingEmployees}
                  >
                    <option value="">
                      {loadingEmployees
                        ? "Loading employees..."
                        : "Select an employee to auto-fill"}
                    </option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.jobTitle}
                      </option>
                    ))}
                  </select>
                  {selectedEmployeeId && (
                    <button
                      type="button"
                      onClick={() => handleEmployeeSelect("")}
                      className="w-full sm:w-auto px-3 py-2 text-[12px] border border-[#d1d5db] rounded-md hover:bg-[#f9fafb] bg-white whitespace-nowrap sm:flex-shrink-0"
                    >
                      Clear
                    </button>
                  )}
                </div>
                {employees.length === 0 && !loadingEmployees && (
                  <p className="mt-1 text-[12px] text-[#6b7280]">
                    No active employees found. Please ensure you have proper
                    permissions to access employee data.
                  </p>
                )}
              </div>

              <Field label="Full name">
                <input
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                  className={`w-full rounded-md border px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316] ${
                    selectedEmployeeId && employeeName
                      ? "border-[#10b981] bg-[#f0fdf4]"
                      : "border-[#d1d5db]"
                  }`}
                  placeholder={
                    selectedEmployeeId ? "Auto-filled from employee data" : ""
                  }
                />
              </Field>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Employee ID">
                  <input
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className={`w-full rounded-md border px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316] ${
                      selectedEmployeeId && employeeId
                        ? "border-[#10b981] bg-[#f0fdf4]"
                        : "border-[#d1d5db]"
                    }`}
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
                    className={`w-full rounded-md border px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316] ${
                      selectedEmployeeId && designation
                        ? "border-[#10b981] bg-[#f0fdf4]"
                        : "border-[#d1d5db]"
                    }`}
                  />
                </Field>
                <Field label="Department">
                  <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={`w-full rounded-md border px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316] ${
                      selectedEmployeeId && department
                        ? "border-[#10b981] bg-[#f0fdf4]"
                        : "border-[#d1d5db]"
                    }`}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Date of joining">
                  <input
                    type="date"
                    value={dateOfJoining}
                    onChange={(e) => setDateOfJoining(e.target.value)}
                    className={`w-full rounded-md border px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316] ${
                      selectedEmployeeId && dateOfJoining
                        ? "border-[#10b981] bg-[#f0fdf4]"
                        : "border-[#d1d5db]"
                    }`}
                  />
                </Field>
                <Field label="Current salary">
                  <input
                    value={currentSalary}
                    onChange={(e) => setCurrentSalary(e.target.value)}
                    className={`w-full rounded-md border px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316] ${
                      selectedEmployeeId && currentSalary
                        ? "border-[#10b981] bg-[#f0fdf4]"
                        : "border-[#d1d5db]"
                    }`}
                  />
                </Field>
              </div>

              <div className="mt-6">
                <h3 className="text-[14px] font-medium text-[#374151]">
                  Company
                </h3>
                <p className="text-[12px] text-[#6b7280] mt-1">
                  These fields are automatically filled from your company&apos;s
                  Primary Business Address
                </p>
              </div>

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
                {excelRows.length > 0 ? (
                  <div className="mb-4 rounded-md border border-[#e5e7eb] p-3 bg-[#fafafa]">
                    <div className="text-[14px] font-medium text-[#111827] mb-2">
                      Map columns
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
                      {mappingKeys.map((fieldKey) => (
                        <div key={fieldKey} className="flex items-center gap-2">
                          <div className="w-36 text-[#6b7280]">{fieldKey}</div>
                          <select
                            className="flex-1 rounded-md border border-[#d1d5db] px-2 py-1 bg-white"
                            value={mapping[fieldKey]}
                            onChange={(e) =>
                              setMapping((m) => ({
                                ...m,
                                [fieldKey]: e.target.value,
                              }))
                            }
                          >
                            <option value="">—</option>
                            {excelHeaders.map((h) => (
                              <option key={h} value={h}>
                                {h}
                              </option>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={confirmMappingFromExcel}
                        className="px-3 py-2 rounded-md border border-[#d1d5db] text-[14px] hover:bg-[#f9fafb]"
                      >
                        Confirm mapping
                      </button>
                      <button
                        onClick={() => {
                          setExcelRows([]);
                          setExcelHeaders([]);
                        }}
                        className="px-3 py-2 rounded-md border border-[#d1d5db] text-[14px] hover:bg-[#f9fafb]"
                      >
                        Close
                      </button>
                    </div>
                    <div className="mt-3 overflow-auto max-h-56 border border-[#e5e7eb] rounded">
                      <table className="w-full text-[12px]">
                        <thead className="bg-[#f9fafb]">
                          <tr>
                            {excelHeaders.map((h) => (
                              <th
                                key={h}
                                className="text-left px-2 py-1 border-b border-[#e5e7eb]"
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {excelRows.slice(0, 50).map((row, idx) => (
                            <tr
                              key={idx}
                              className="odd:bg-white even:bg-[#fafafa]"
                            >
                              {excelHeaders.map((h) => (
                                <td
                                  key={h}
                                  className="px-2 py-1 border-b border-[#f1f5f9] whitespace-nowrap"
                                >
                                  {String(row[h] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}
                {bulkItems.length > 0 ? (
                  <div className="mb-4 rounded-md border border-[#e5e7eb] p-3 bg-[#fafafa] text-[12px] text-[#374151]">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        Bulk queue: {bulkItems.length}
                      </div>
                      <button
                        type="button"
                        className="px-2 py-1 rounded border border-[#d1d5db] hover:bg-[#f3f4f6]"
                        onClick={() => setBulkItems([])}
                      >
                        Clear
                      </button>
                    </div>
                    <ul className="mt-2 space-y-1 max-h-28 overflow-auto">
                      {bulkItems.map((it, i) => (
                        <li
                          key={i}
                          className="flex items-center justify-between"
                        >
                          <span>
                            {i + 1}. {it.employeeName} — {it.designation}
                          </span>
                          <button
                            onClick={() => removeBulkItem(i)}
                            className="text-[#ef4444]"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                <div className="px-6 py-4 text-center print-letter-header">
                  <h2 className="text-[14px] font-semibold tracking-wide">
                    LETTER OF EMPLOYMENT
                  </h2>
                </div>
                <div className="px-6 py-5 text-[13px]">
                  <div className="space-y-1 text-[#111827]">
                    <div className="flex items-start gap-2">
                      <span className="w-28 text-[#6b7280]">Name</span>
                      <span className="font-medium">
                        {employeeName || "[Name]"}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-28 text-[#6b7280]">Employee ID</span>
                      <span>{employeeId || "[Employee ID]"}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-28 text-[#6b7280]">Designation</span>
                      <span>{designation || "[Designation]"}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-28 text-[#6b7280]">Department</span>
                      <span>{department || "[Department]"}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-28 text-[#6b7280]">Employment</span>
                      <span>{employmentType}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-28 text-[#6b7280]">Joined</span>
                      <span>
                        {formatLongDate(dateOfJoining) || "[Date of Joining]"}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-28 text-[#6b7280]">Salary</span>
                      <span>{currentSalary || "[Current Salary]"}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="w-28 text-[#6b7280]">Address</span>
                      <span>
                        {companyAddressLine || "[Street Address]"}
                        <br />
                        {companyCityLine || "[City, State, Zip]"}
                        <br />
                        {companyCountry || "[Country]"}
                      </span>
                    </div>
                  </div>

                  <div className="my-6 h-px bg-[#e5e7eb]" />

                  <div
                    className="space-y-4 leading-relaxed text-[#111827] prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: processTemplateToHtml(
                        letterContent,
                        getCurrentEmployeeData()
                      ),
                    }}
                  />

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
                      <div className="text-[18px] font-semibold">
                        {hrName || "[HR Name]"}
                      </div>
                      <div className="text-[12px] text-[#6b7280]">
                        {hrTitle || "[HR Title]"}
                      </div>
                      <div className="text-[12px] text-[#6b7280]">
                        {companyName || "[Company Name]"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 md:p-5 h-max no-print">
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
              Letter Content
            </h3>

            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-[14px]">
                    <input
                      type="radio"
                      name="editorMode"
                      checked={useRichEditor}
                      onChange={() => setUseRichEditor(true)}
                      className="text-[#f97316] focus:ring-[#f97316]"
                    />
                    Rich Text Editor
                  </label>
                  <label className="flex items-center gap-2 text-[14px]">
                    <input
                      type="radio"
                      name="editorMode"
                      checked={!useRichEditor}
                      onChange={() => setUseRichEditor(false)}
                      className="text-[#f97316] focus:ring-[#f97316]"
                    />
                    Simple Text
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSaveDialog(true)}
                    className="px-3 py-1 text-[12px] border border-[#d1d5db] rounded-md hover:bg-[#f9fafb] bg-white"
                  >
                    Save Template
                  </button>
                  {savedTemplates.length > 0 && (
                    <select
                      onChange={(e) => {
                        const template = savedTemplates.find(
                          (t) => t.id === e.target.value
                        );
                        if (template) loadTemplate(template);
                      }}
                      className="px-2 py-1 text-[12px] border border-[#d1d5db] rounded-md bg-white"
                      defaultValue=""
                    >
                      <option value="">Load Template</option>
                      {savedTemplates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {useRichEditor ? (
                <RichTextEditor
                  value={letterContent}
                  onChange={setLetterContent}
                  availableFields={AVAILABLE_FIELDS}
                />
              ) : (
                <Field label="Letter Content">
                  <textarea
                    value={letterContent}
                    onChange={(e) => setLetterContent(e.target.value)}
                    rows={8}
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                    placeholder="Enter your letter content. Use {{fieldName}} for placeholders."
                  />
                </Field>
              )}
            </div>

            <div className="mt-6">
              <h3 className="text-[14px] font-medium text-[#374151]">
                Contact
              </h3>
              <p className="text-[12px] text-[#6b7280] mt-1">
                HR contact fields and signature images are automatically filled
                from your Digital Signatures. Website is filled from Company
                Profile.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Field label="Signature (PNG)">
                  <input
                    type="file"
                    accept="image/png"
                    onChange={handleSignatureChange}
                    className="block w-full text-[14px]"
                  />
                  {signatureDataUrl && (
                    <div className="mt-2">
                      <p className="text-[12px] text-[#6b7280] mb-1">
                        Signature Preview:
                      </p>
                      <img
                        src={signatureDataUrl}
                        alt="Signature preview"
                        className="max-w-[200px] max-h-[60px] border border-[#d1d5db] rounded"
                      />
                    </div>
                  )}
                </Field>
              </div>

              {availableSignatories.length > 1 && (
                <div className="sm:col-span-2">
                  <Field label="Select Signatory">
                    <select
                      onChange={(e) => {
                        const selectedSignatory = availableSignatories.find(
                          (s) => s.name === e.target.value
                        );
                        if (selectedSignatory) {
                          handleSignatorySelect(selectedSignatory);
                        }
                      }}
                      className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                    >
                      <option value="">Select a signatory...</option>
                      {availableSignatories.map((signatory, index) => (
                        <option key={index} value={signatory.name}>
                          {signatory.name} - {signatory.title}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
              )}
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
              <Field label="Website">
                <input
                  type="url"
                  value={hrWebsite}
                  onChange={(e) => setHrWebsite(e.target.value)}
                  placeholder="https://www.company.com"
                  className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                />
              </Field>
            </div>
          </div>
        </div>
      </div>

      {/* Save Template Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-w-[90vw]">
            <h3 className="text-[16px] font-semibold mb-4">Save Template</h3>
            <div className="mb-4">
              <label className="block text-[14px] font-medium text-[#374151] mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:border-[#f97316]"
                placeholder="Enter template name..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveTemplate();
                  if (e.key === "Escape") setShowSaveDialog(false);
                }}
              />
            </div>
            <div className="flex items-center gap-2 justify-end">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="px-3 py-2 text-[14px] border border-[#d1d5db] rounded-md hover:bg-[#f9fafb]"
              >
                Cancel
              </button>
              <button
                onClick={saveTemplate}
                disabled={!templateName.trim()}
                className="px-3 py-2 text-[14px] bg-[#f97316] text-white rounded-md hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved Templates List */}
      {savedTemplates.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white border border-[#e5e7eb] rounded-lg shadow-lg p-4 max-w-sm z-40">
          <h4 className="text-[14px] font-medium mb-2">Saved Templates</h4>
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {savedTemplates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between text-[12px]"
              >
                <button
                  onClick={() => loadTemplate(template)}
                  className="text-left hover:text-[#f97316] flex-1 truncate"
                >
                  {template.name}
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="text-[#ef4444] hover:text-[#dc2626] ml-2"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
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
