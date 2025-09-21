"use client";

import { useState, useEffect } from "react";
import { 
  validateEmployeeIdFormat, 
  previewEmployeeIdFormat, 
  generateEmployeeIdPreview,
  getFormatVariablesHelp 
} from "@/lib/employee-id-generator";

interface CompanySettings {
  documentConfig: {
    employeeIdFormat: string;
    documentRefFormat: string;
    invoiceNumberFormat: string;
    authorizedSignatories: Array<{
      name: string;
      title: string;
      signatureTemplate: string;
    }>;
    retentionPolicy: {
      employeeRecords: number;
      taxDocuments: number;
      performanceReviews: number;
    };
  };
  communicationPrefs: {
    emailTemplates: {
      welcome: string;
      termination: string;
      generalNotification: string;
    };
    notificationSettings: {
      emailEnabled: boolean;
      smsEnabled: boolean;
      pushEnabled: boolean;
    };
    localization: {
      defaultLanguage: string;
      multiLanguageSupport: boolean;
      dateFormat: string;
      timeFormat: string;
      currencyFormat: string;
    };
  };
  [key: string]: unknown;
}

interface DocumentCommSectionProps {
  formData: CompanySettings;
  onInputChange: (field: string, value: string | number | boolean | string[]) => void;
  onNestedInputChange: (parent: string, field: string, value: unknown) => void;
}

const LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-ES", label: "Spanish (Spain)" },
  { value: "es-MX", label: "Spanish (Mexico)" },
  { value: "fr-FR", label: "French (France)" },
  { value: "de-DE", label: "German (Germany)" },
  { value: "it-IT", label: "Italian (Italy)" },
  { value: "pt-BR", label: "Portuguese (Brazil)" },
  { value: "zh-CN", label: "Chinese (Simplified)" },
  { value: "ja-JP", label: "Japanese (Japan)" }
];

const DATE_FORMATS = [
  "MM/DD/YYYY",
  "DD/MM/YYYY", 
  "YYYY-MM-DD",
  "DD-MM-YYYY",
  "MM-DD-YYYY"
];

const TIME_FORMATS = [
  "12-hour",
  "24-hour"
];

const CURRENCY_FORMATS = [
  "USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR", "BRL"
];

const FORMAT_EXAMPLES = {
  employeeIdFormat: "EMP{YYYY}-{###} → EMP2024-001",
  documentRefFormat: "DOC-{YYYY}-{MM}-{###} → DOC-2024-01-001",
  invoiceNumberFormat: "INV-{YYYY}-{###} → INV-2024-001"
};

export default function DocumentCommSection({ formData, onNestedInputChange }: DocumentCommSectionProps) {
  const [showAddSignatory, setShowAddSignatory] = useState(false);
  const [editingSignatoryIndex, setEditingSignatoryIndex] = useState<number | null>(null);
  const [newSignatory, setNewSignatory] = useState({
    name: "",
    title: "",
    signatureTemplate: ""
  });
  
  // Employee ID format preview and validation
  const [employeeIdPreview, setEmployeeIdPreview] = useState<string>("");
  const [employeeIdValidation, setEmployeeIdValidation] = useState<{ valid: boolean; errors: string[] }>({ valid: true, errors: [] });
  const [showEmployeeIdPreview, setShowEmployeeIdPreview] = useState(false);

  // Update preview and validation when format changes
  useEffect(() => {
    const format = formData.documentConfig.employeeIdFormat;
    if (format) {
      const validation = validateEmployeeIdFormat(format);
      setEmployeeIdValidation(validation);
      
      if (validation.valid) {
        const preview = previewEmployeeIdFormat(format);
        setEmployeeIdPreview(preview);
      } else {
        setEmployeeIdPreview("Invalid format");
      }
    }
  }, [formData.documentConfig.employeeIdFormat]);

  const addSignatory = () => {
    if (newSignatory.name.trim() && newSignatory.title.trim()) {
      const updatedSignatories = [...formData.documentConfig.authorizedSignatories, { ...newSignatory }];
      onNestedInputChange("documentConfig", "authorizedSignatories", updatedSignatories);
      setNewSignatory({ name: "", title: "", signatureTemplate: "" });
      setShowAddSignatory(false);
    }
  };

  const updateSignatory = (index: number) => {
    const updatedSignatories = formData.documentConfig.authorizedSignatories.map((signatory, i) => 
      i === index ? { ...newSignatory } : signatory
    );
    onNestedInputChange("documentConfig", "authorizedSignatories", updatedSignatories);
    setEditingSignatoryIndex(null);
    setNewSignatory({ name: "", title: "", signatureTemplate: "" });
  };

  const removeSignatory = (index: number) => {
    const updatedSignatories = formData.documentConfig.authorizedSignatories.filter((_, i) => i !== index);
    onNestedInputChange("documentConfig", "authorizedSignatories", updatedSignatories);
  };

  const startEditSignatory = (index: number) => {
    const signatory = formData.documentConfig.authorizedSignatories[index];
    setNewSignatory({ ...signatory });
    setEditingSignatoryIndex(index);
    setShowAddSignatory(true);
  };

  const cancelEdit = () => {
    setShowAddSignatory(false);
    setEditingSignatoryIndex(null);
    setNewSignatory({ name: "", title: "", signatureTemplate: "" });
  };

  return (
    <div className="space-y-8">
      {/* Document Configuration */}
      <section>
        <h2 className="text-[20px] font-semibold mb-6">Document Configuration</h2>
        
        {/* Document Numbering Scheme */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Document Numbering Scheme</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[14px] font-medium mb-2">Employee ID Format</label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={formData.documentConfig.employeeIdFormat}
                  onChange={(e) => onNestedInputChange("documentConfig", "employeeIdFormat", e.target.value)}
                  placeholder="EMP{YYYY}-{###}"
                  className={`w-full rounded-md border px-3 py-2 text-[14px] focus:outline-none focus:ring-2 ${
                    employeeIdValidation.valid 
                      ? 'border-[#d1d5db] focus:ring-[#f97316]' 
                      : 'border-red-500 focus:ring-red-500'
                  }`}
                />
                
                {/* Validation Errors */}
                {!employeeIdValidation.valid && employeeIdValidation.errors.length > 0 && (
                  <div className="text-[12px] text-red-600">
                    {employeeIdValidation.errors.map((error, index) => (
                      <div key={index}>• {error}</div>
                    ))}
                  </div>
                )}
                
                {/* Preview */}
                {employeeIdValidation.valid && employeeIdPreview && (
                  <div className="flex items-center gap-2">
                    <span className="text-[12px] text-[#6b7280]">Preview:</span>
                    <code className="px-2 py-1 bg-[#f3f4f6] border border-[#d1d5db] rounded text-[12px] font-mono">
                      {employeeIdPreview}
                    </code>
                    <button
                      type="button"
                      onClick={() => setShowEmployeeIdPreview(!showEmployeeIdPreview)}
                      className="text-[12px] text-[#f97316] hover:underline"
                    >
                      {showEmployeeIdPreview ? 'Hide' : 'Show'} more examples
                    </button>
                  </div>
                )}
                
                {/* Multiple Examples */}
                {showEmployeeIdPreview && employeeIdValidation.valid && (
                  <div className="mt-2 p-3 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg">
                    <div className="text-[12px] font-medium text-[#374151] mb-2">Example IDs:</div>
                    <div className="space-y-1">
                      {generateEmployeeIdPreview(formData.documentConfig.employeeIdFormat, 5).map((example, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-[11px] text-[#6b7280] w-8">#{index + 1}:</span>
                          <code className="px-2 py-1 bg-white border border-[#d1d5db] rounded text-[11px] font-mono">
                            {example}
                          </code>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <p className="text-[12px] text-[#6b7280]">
                  Example: {FORMAT_EXAMPLES.employeeIdFormat}
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Document Reference Format</label>
              <input
                type="text"
                value={formData.documentConfig.documentRefFormat}
                onChange={(e) => onNestedInputChange("documentConfig", "documentRefFormat", e.target.value)}
                placeholder="DOC-{YYYY}-{MM}-{###}"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
              <p className="mt-1 text-[12px] text-[#6b7280]">
                Example: {FORMAT_EXAMPLES.documentRefFormat}
              </p>
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Invoice/Expense Number Format</label>
              <input
                type="text"
                value={formData.documentConfig.invoiceNumberFormat}
                onChange={(e) => onNestedInputChange("documentConfig", "invoiceNumberFormat", e.target.value)}
                placeholder="INV-{YYYY}-{###}"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
              <p className="mt-1 text-[12px] text-[#6b7280]">
                Example: {FORMAT_EXAMPLES.invoiceNumberFormat}
              </p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-[#f9fafb] border border-[#e5e7eb] rounded-lg">
            <h4 className="text-[14px] font-medium mb-3">Format Variables:</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px]">
              {getFormatVariablesHelp().map((variable, index) => (
                <div key={index} className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-white border border-[#d1d5db] rounded text-[11px] font-mono min-w-0 flex-shrink-0">
                    {variable.placeholder}
                  </code>
                  <span className="text-[#6b7280]">{variable.description}</span>
                  <span className="text-[#9ca3af]">({variable.example})</span>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-[12px] font-medium text-blue-800 mb-1">💡 Tips:</div>
              <ul className="text-[11px] text-blue-700 space-y-1">
                <li>• Use <code>{'{###}'}</code> for 3-digit sequential numbers (001, 002, 003...)</li>
                <li>• Use <code>{'{####}'}</code> for 4-digit sequential numbers (0001, 0002, 0003...)</li>
                <li>• Sequential numbers are automatically generated and unique</li>
                <li>• You can combine multiple variables: <code>EMP{'{YYYY}'}-{'{DEPT}'}-{'{###}'}</code></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Digital Signature Settings */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-medium">Digital Signature Settings</h3>
            <button
              onClick={() => setShowAddSignatory(true)}
              className="px-4 py-2 bg-[#f97316] text-white rounded-md text-[14px] font-medium hover:bg-[#ea580c]"
            >
              Add Signatory
            </button>
          </div>

          {/* Add/Edit Signatory Form */}
          {showAddSignatory && (
            <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6 mb-6">
              <h4 className="text-[16px] font-medium mb-4">
                {editingSignatoryIndex !== null ? "Edit Authorized Signatory" : "Add New Authorized Signatory"}
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[14px] font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={newSignatory.name}
                    onChange={(e) => setNewSignatory(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Full name"
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                  />
                </div>
                
                <div>
                  <label className="block text-[14px] font-medium mb-2">Title *</label>
                  <input
                    type="text"
                    value={newSignatory.title}
                    onChange={(e) => setNewSignatory(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Job title"
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-[14px] font-medium mb-2">Signature Template</label>
                  <textarea
                    value={newSignatory.signatureTemplate}
                    onChange={(e) => setNewSignatory(prev => ({ ...prev, signatureTemplate: e.target.value }))}
                    placeholder="Digital signature template or instructions"
                    rows={3}
                    className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={editingSignatoryIndex !== null ? () => updateSignatory(editingSignatoryIndex) : addSignatory}
                  className="px-4 py-2 bg-[#f97316] text-white rounded-md text-[14px] font-medium hover:bg-[#ea580c]"
                >
                  {editingSignatoryIndex !== null ? "Update Signatory" : "Add Signatory"}
                </button>
                <button
                  onClick={cancelEdit}
                  className="px-4 py-2 border border-[#d1d5db] text-[#374151] rounded-md text-[14px] font-medium hover:bg-[#f9fafb]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Signatories List */}
          <div className="space-y-4">
            {formData.documentConfig.authorizedSignatories.length === 0 ? (
              <div className="text-center py-8 text-[#6b7280]">
                <p className="text-[14px]">No authorized signatories added yet.</p>
                <p className="text-[12px] mt-1">Click &quot;Add Signatory&quot; to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border border-[#e5e7eb] rounded-lg">
                  <thead className="bg-[#f9fafb]">
                    <tr>
                      <th className="text-left p-3 text-[14px] font-medium">Name</th>
                      <th className="text-left p-3 text-[14px] font-medium">Title</th>
                      <th className="text-left p-3 text-[14px] font-medium">Signature Template</th>
                      <th className="text-left p-3 text-[14px] font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.documentConfig.authorizedSignatories.map((signatory, index) => (
                      <tr key={index} className="border-t border-[#e5e7eb]">
                        <td className="p-3 text-[14px]">{signatory.name}</td>
                        <td className="p-3 text-[14px]">{signatory.title}</td>
                        <td className="p-3 text-[14px] max-w-xs truncate">{signatory.signatureTemplate || "—"}</td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEditSignatory(index)}
                              className="px-3 py-1 text-[12px] text-[#f97316] border border-[#f97316] rounded hover:bg-[#fef7ed]"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => removeSignatory(index)}
                              className="px-3 py-1 text-[12px] text-[#dc2626] border border-[#dc2626] rounded hover:bg-[#fef2f2]"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Document Retention Policy */}
        <div>
          <h3 className="text-[16px] font-medium mb-4">Document Retention Policy</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-[14px] font-medium mb-2">Employee Records (Years)</label>
              <input
                type="number"
                value={formData.documentConfig.retentionPolicy.employeeRecords}
                onChange={(e) => onNestedInputChange("documentConfig", "retentionPolicy", {
                  ...formData.documentConfig.retentionPolicy,
                  employeeRecords: parseInt(e.target.value) || 0
                })}
                min="1"
                max="50"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
              <p className="mt-1 text-[12px] text-[#6b7280]">How long to keep employee files</p>
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Tax Documents (Years)</label>
              <input
                type="number"
                value={formData.documentConfig.retentionPolicy.taxDocuments}
                onChange={(e) => onNestedInputChange("documentConfig", "retentionPolicy", {
                  ...formData.documentConfig.retentionPolicy,
                  taxDocuments: parseInt(e.target.value) || 0
                })}
                min="1"
                max="50"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
              <p className="mt-1 text-[12px] text-[#6b7280]">Tax document retention period</p>
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Performance Reviews (Years)</label>
              <input
                type="number"
                value={formData.documentConfig.retentionPolicy.performanceReviews}
                onChange={(e) => onNestedInputChange("documentConfig", "retentionPolicy", {
                  ...formData.documentConfig.retentionPolicy,
                  performanceReviews: parseInt(e.target.value) || 0
                })}
                min="1"
                max="50"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
              <p className="mt-1 text-[12px] text-[#6b7280]">Performance review retention</p>
            </div>
          </div>
        </div>
      </section>

      {/* Communication Preferences */}
      <section>
        <h2 className="text-[20px] font-semibold mb-6">Communication Preferences</h2>
        
        {/* Email Templates */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Email Templates</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-[14px] font-medium mb-2">Welcome Email Template</label>
              <textarea
                value={formData.communicationPrefs.emailTemplates.welcome}
                onChange={(e) => onNestedInputChange("communicationPrefs", "emailTemplates", {
                  ...formData.communicationPrefs.emailTemplates,
                  welcome: e.target.value
                })}
                placeholder="Welcome to {companyName}! We're excited to have you join our team."
                rows={4}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
              <p className="mt-1 text-[12px] text-[#6b7280]">Available variables: {'{companyName}'}, {'{employeeName}'}, {'{startDate}'}</p>
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Termination Email Template</label>
              <textarea
                value={formData.communicationPrefs.emailTemplates.termination}
                onChange={(e) => onNestedInputChange("communicationPrefs", "emailTemplates", {
                  ...formData.communicationPrefs.emailTemplates,
                  termination: e.target.value
                })}
                placeholder="This letter confirms the termination of your employment with {companyName}."
                rows={4}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
              <p className="mt-1 text-[12px] text-[#6b7280]">Available variables: {'{companyName}'}, {'{employeeName}'}, {'{terminationDate}'}</p>
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">General Notification Template</label>
              <textarea
                value={formData.communicationPrefs.emailTemplates.generalNotification}
                onChange={(e) => onNestedInputChange("communicationPrefs", "emailTemplates", {
                  ...formData.communicationPrefs.emailTemplates,
                  generalNotification: e.target.value
                })}
                placeholder="This is a general notification from {companyName}."
                rows={4}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
              <p className="mt-1 text-[12px] text-[#6b7280]">Available variables: {'{companyName}'}, {'{employeeName}'}, {'{message}'}</p>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Notification Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.communicationPrefs.notificationSettings.emailEnabled}
                  onChange={(e) => onNestedInputChange("communicationPrefs", "notificationSettings", {
                    ...formData.communicationPrefs.notificationSettings,
                    emailEnabled: e.target.checked
                  })}
                  className="rounded border-[#d1d5db]"
                />
                <span className="text-[14px] font-medium">Email notifications enabled</span>
              </label>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.communicationPrefs.notificationSettings.smsEnabled}
                  onChange={(e) => onNestedInputChange("communicationPrefs", "notificationSettings", {
                    ...formData.communicationPrefs.notificationSettings,
                    smsEnabled: e.target.checked
                  })}
                  className="rounded border-[#d1d5db]"
                />
                <span className="text-[14px] font-medium">SMS notifications enabled</span>
              </label>
            </div>
            
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.communicationPrefs.notificationSettings.pushEnabled}
                  onChange={(e) => onNestedInputChange("communicationPrefs", "notificationSettings", {
                    ...formData.communicationPrefs.notificationSettings,
                    pushEnabled: e.target.checked
                  })}
                  className="rounded border-[#d1d5db]"
                />
                <span className="text-[14px] font-medium">Push notifications enabled</span>
              </label>
            </div>
          </div>
        </div>

        {/* Language & Localization */}
        <div>
          <h3 className="text-[16px] font-medium mb-4">Language & Localization</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[14px] font-medium mb-2">Default Company Language</label>
              <select
                value={formData.communicationPrefs.localization.defaultLanguage}
                onChange={(e) => onNestedInputChange("communicationPrefs", "localization", {
                  ...formData.communicationPrefs.localization,
                  defaultLanguage: e.target.value
                })}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="multiLanguageSupport"
                checked={formData.communicationPrefs.localization.multiLanguageSupport}
                onChange={(e) => onNestedInputChange("communicationPrefs", "localization", {
                  ...formData.communicationPrefs.localization,
                  multiLanguageSupport: e.target.checked
                })}
                className="rounded border-[#d1d5db]"
              />
              <label htmlFor="multiLanguageSupport" className="text-[14px] font-medium cursor-pointer">
                Enable multi-language support
              </label>
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Date Format</label>
              <select
                value={formData.communicationPrefs.localization.dateFormat}
                onChange={(e) => onNestedInputChange("communicationPrefs", "localization", {
                  ...formData.communicationPrefs.localization,
                  dateFormat: e.target.value
                })}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              >
                {DATE_FORMATS.map((format) => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Time Format</label>
              <select
                value={formData.communicationPrefs.localization.timeFormat}
                onChange={(e) => onNestedInputChange("communicationPrefs", "localization", {
                  ...formData.communicationPrefs.localization,
                  timeFormat: e.target.value
                })}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              >
                {TIME_FORMATS.map((format) => (
                  <option key={format} value={format}>{format}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[14px] font-medium mb-2">Currency Format</label>
              <select
                value={formData.communicationPrefs.localization.currencyFormat}
                onChange={(e) => onNestedInputChange("communicationPrefs", "localization", {
                  ...formData.communicationPrefs.localization,
                  currencyFormat: e.target.value
                })}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              >
                {CURRENCY_FORMATS.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
