"use client";

import { useState } from "react";
import Image from "next/image";

interface CompanySettings {
  companyName: string;
  displayName: string;
  registrationNumber: string;
  taxId: string;
  industryType: string;
  companySize: string;
  foundedDate: string;
  websiteUrl: string;
  description: string;
  primaryAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  mailingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  primaryPhone: string;
  primaryEmail: string;
  hrEmail: string;
  supportEmail: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  emailSignature: string;
  workingHours: unknown;
  holidays: unknown;
  fiscalYear: unknown;
  primaryOffice: unknown;
  branchOffices: unknown[];
  remoteWorkPolicy: unknown;
  reportingStructure: unknown;
  costCenters: unknown[];
}

interface CompanyProfileSectionProps {
  formData: CompanySettings;
  onInputChange: (field: string, value: string | number | boolean | string[]) => void;
  onNestedInputChange: (parent: string, field: string, value: unknown) => void;
}

const INDUSTRY_TYPES = [
  "Technology", "Healthcare", "Finance", "Manufacturing", "Retail", 
  "Education", "Government", "Non-profit", "Consulting", "Other"
];

const COMPANY_SIZES = [
  "1-10", "11-50", "51-200", "201-500", "500+"
];

export default function CompanyProfileSection({ formData, onInputChange, onNestedInputChange }: CompanyProfileSectionProps) {
  const [useSameAddress, setUseSameAddress] = useState(false);

  return (
    <div className="space-y-8">
      {/* Basic Information */}
      <section>
        <h2 className="text-[20px] font-semibold mb-6">Basic Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[14px] font-medium mb-2">Company Name (Legal) *</label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => onInputChange("companyName", e.target.value)}
              placeholder="Enter legal company name"
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Display Name (Brand) *</label>
            <input
              type="text"
              value={formData.displayName}
              onChange={(e) => onInputChange("displayName", e.target.value)}
              placeholder="Enter brand name"
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Registration Number</label>
            <input
              type="text"
              value={formData.registrationNumber}
              onChange={(e) => onInputChange("registrationNumber", e.target.value)}
              placeholder="Business license number"
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Tax ID / EIN Number</label>
            <input
              type="text"
              value={formData.taxId}
              onChange={(e) => onInputChange("taxId", e.target.value)}
              placeholder="Tax identification number"
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Industry Type</label>
            <select
              value={formData.industryType}
              onChange={(e) => onInputChange("industryType", e.target.value)}
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            >
              <option value="">Select industry</option>
              {INDUSTRY_TYPES.map((industry) => (
                <option key={industry} value={industry}>{industry}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Company Size</label>
            <select
              value={formData.companySize}
              onChange={(e) => onInputChange("companySize", e.target.value)}
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            >
              <option value="">Select size</option>
              {COMPANY_SIZES.map((size) => (
                <option key={size} value={size}>{size} employees</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Founded Date</label>
            <input
              type="date"
              value={formData.foundedDate}
              onChange={(e) => onInputChange("foundedDate", e.target.value)}
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Company Website URL</label>
            <input
              type="url"
              value={formData.websiteUrl}
              onChange={(e) => onInputChange("websiteUrl", e.target.value)}
              placeholder="https://www.company.com"
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-[14px] font-medium mb-2">Company Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => onInputChange("description", e.target.value)}
            placeholder="Brief description of your company for documents and employee portal"
            rows={4}
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
        </div>
      </section>

      {/* Contact Information */}
      <section>
        <h2 className="text-[20px] font-semibold mb-6">Contact Information</h2>
        
        {/* Primary Business Address */}
        <div className="mb-6">
          <h3 className="text-[16px] font-medium mb-4">Primary Business Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[14px] font-medium mb-2">Street Address</label>
              <input
                type="text"
                value={formData.primaryAddress.street}
                onChange={(e) => onNestedInputChange("primaryAddress", "street", e.target.value)}
                placeholder="Enter street address"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
            <div>
              <label className="block text-[14px] font-medium mb-2">City</label>
              <input
                type="text"
                value={formData.primaryAddress.city}
                onChange={(e) => onNestedInputChange("primaryAddress", "city", e.target.value)}
                placeholder="City"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
            <div>
              <label className="block text-[14px] font-medium mb-2">State/Province</label>
              <input
                type="text"
                value={formData.primaryAddress.state}
                onChange={(e) => onNestedInputChange("primaryAddress", "state", e.target.value)}
                placeholder="State/Province"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
            <div>
              <label className="block text-[14px] font-medium mb-2">ZIP/Postal Code</label>
              <input
                type="text"
                value={formData.primaryAddress.zipCode}
                onChange={(e) => onNestedInputChange("primaryAddress", "zipCode", e.target.value)}
                placeholder="ZIP/Postal Code"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
            <div>
              <label className="block text-[14px] font-medium mb-2">Country</label>
              <input
                type="text"
                value={formData.primaryAddress.country}
                onChange={(e) => onNestedInputChange("primaryAddress", "country", e.target.value)}
                placeholder="Country"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
          </div>
        </div>

        {/* Mailing Address */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <input
              type="checkbox"
              id="useSameAddress"
              checked={useSameAddress}
              onChange={(e) => {
                setUseSameAddress(e.target.checked);
                if (e.target.checked) {
                  onNestedInputChange("mailingAddress", "street", formData.primaryAddress.street);
                  onNestedInputChange("mailingAddress", "city", formData.primaryAddress.city);
                  onNestedInputChange("mailingAddress", "state", formData.primaryAddress.state);
                  onNestedInputChange("mailingAddress", "zipCode", formData.primaryAddress.zipCode);
                  onNestedInputChange("mailingAddress", "country", formData.primaryAddress.country);
                }
              }}
              className="rounded border-[#d1d5db]"
            />
            <label htmlFor="useSameAddress" className="text-[14px] font-medium">
              Use same as primary address
            </label>
          </div>
          
          <h3 className="text-[16px] font-medium mb-4">Mailing Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-[14px] font-medium mb-2">Street Address</label>
              <input
                type="text"
                value={formData.mailingAddress.street}
                onChange={(e) => onNestedInputChange("mailingAddress", "street", e.target.value)}
                placeholder="Enter mailing address"
                disabled={useSameAddress}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316] disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-[14px] font-medium mb-2">City</label>
              <input
                type="text"
                value={formData.mailingAddress.city}
                onChange={(e) => onNestedInputChange("mailingAddress", "city", e.target.value)}
                placeholder="City"
                disabled={useSameAddress}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316] disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-[14px] font-medium mb-2">State/Province</label>
              <input
                type="text"
                value={formData.mailingAddress.state}
                onChange={(e) => onNestedInputChange("mailingAddress", "state", e.target.value)}
                placeholder="State/Province"
                disabled={useSameAddress}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316] disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-[14px] font-medium mb-2">ZIP/Postal Code</label>
              <input
                type="text"
                value={formData.mailingAddress.zipCode}
                onChange={(e) => onNestedInputChange("mailingAddress", "zipCode", e.target.value)}
                placeholder="ZIP/Postal Code"
                disabled={useSameAddress}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316] disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-[14px] font-medium mb-2">Country</label>
              <input
                type="text"
                value={formData.mailingAddress.country}
                onChange={(e) => onNestedInputChange("mailingAddress", "country", e.target.value)}
                placeholder="Country"
                disabled={useSameAddress}
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316] disabled:bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[14px] font-medium mb-2">Primary Phone Number</label>
            <input
              type="tel"
              value={formData.primaryPhone}
              onChange={(e) => onInputChange("primaryPhone", e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Primary Email Address</label>
            <input
              type="email"
              value={formData.primaryEmail}
              onChange={(e) => onInputChange("primaryEmail", e.target.value)}
              placeholder="contact@company.com"
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">HR Contact Email</label>
            <input
              type="email"
              value={formData.hrEmail}
              onChange={(e) => onInputChange("hrEmail", e.target.value)}
              placeholder="hr@company.com"
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Support/Help Desk Email</label>
            <input
              type="email"
              value={formData.supportEmail}
              onChange={(e) => onInputChange("supportEmail", e.target.value)}
              placeholder="support@company.com"
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
        </div>
      </section>

      {/* Branding & Visual Identity */}
      <section>
        <h2 className="text-[20px] font-semibold mb-6">Branding & Visual Identity</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[14px] font-medium mb-2">Company Logo URL</label>
            <input
              type="url"
              value={formData.logo}
              onChange={(e) => onInputChange("logo", e.target.value)}
              placeholder="https://example.com/logo.png"
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
            {formData.logo && (
              <div className="mt-2">
                <Image src={formData.logo} alt="Company Logo" width={64} height={64} className="h-16 w-auto object-contain" />
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Favicon URL</label>
            <input
              type="url"
              value={formData.favicon}
              onChange={(e) => onInputChange("favicon", e.target.value)}
              placeholder="https://example.com/favicon.ico"
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
            {formData.favicon && (
              <div className="mt-2">
                <Image src={formData.favicon} alt="Favicon" width={32} height={32} className="h-8 w-8 object-contain" />
              </div>
            )}
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Primary Brand Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => onInputChange("primaryColor", e.target.value)}
                className="w-12 h-8 rounded border border-[#d1d5db]"
              />
              <input
                type="text"
                value={formData.primaryColor}
                onChange={(e) => onInputChange("primaryColor", e.target.value)}
                placeholder="#f97316"
                className="flex-1 rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Secondary Brand Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => onInputChange("secondaryColor", e.target.value)}
                className="w-12 h-8 rounded border border-[#d1d5db]"
              />
              <input
                type="text"
                value={formData.secondaryColor}
                onChange={(e) => onInputChange("secondaryColor", e.target.value)}
                placeholder="#1f2937"
                className="flex-1 rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
            </div>
          </div>
        </div>
        
        <div className="mt-6">
          <label className="block text-[14px] font-medium mb-2">Email Signature Template</label>
          <textarea
            value={formData.emailSignature}
            onChange={(e) => onInputChange("emailSignature", e.target.value)}
            placeholder="Best regards,&#10;[Your Name]&#10;[Your Title]&#10;[Company Name]"
            rows={4}
            className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
          />
        </div>
      </section>
    </div>
  );
}
