"use client";

import { useState } from "react";

interface CompanySettings {
  primaryOffice: {
    name: string;
    address: string;
    contact: string;
    hrRepresentative: string;
    timeZone: string;
  };
  branchOffices: Array<{
    name: string;
    address: string;
    contact: string;
    hrRepresentative: string;
    timeZone: string;
  }>;
  [key: string]: unknown;
}

interface OfficeLocationsSectionProps {
  formData: CompanySettings;
  onInputChange: (field: string, value: unknown) => void;
  onNestedInputChange: (parent: string, field: string, value: unknown) => void;
}

const TIME_ZONES = [
  "UTC-12:00", "UTC-11:00", "UTC-10:00", "UTC-09:00", "UTC-08:00",
  "UTC-07:00", "UTC-06:00", "UTC-05:00", "UTC-04:00", "UTC-03:00",
  "UTC-02:00", "UTC-01:00", "UTC+00:00", "UTC+01:00", "UTC+02:00",
  "UTC+03:00", "UTC+04:00", "UTC+05:00", "UTC+06:00", "UTC+07:00",
  "UTC+08:00", "UTC+09:00", "UTC+10:00", "UTC+11:00", "UTC+12:00"
];

export default function OfficeLocationsSection({ formData, onInputChange, onNestedInputChange }: OfficeLocationsSectionProps) {
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [editingBranchIndex, setEditingBranchIndex] = useState<number | null>(null);
  const [newBranchOffice, setNewBranchOffice] = useState({
    name: "",
    address: "",
    contact: "",
    hrRepresentative: "",
    timeZone: "UTC+00:00"
  });

  const addBranchOffice = () => {
    if (newBranchOffice.name.trim() && newBranchOffice.address.trim()) {
      const updatedBranches = [...formData.branchOffices, { ...newBranchOffice }];
      onInputChange("branchOffices", updatedBranches);
      setNewBranchOffice({
        name: "",
        address: "",
        contact: "",
        hrRepresentative: "",
        timeZone: "UTC+00:00"
      });
      setShowAddBranch(false);
    }
  };

  const updateBranchOffice = (index: number) => {
    const updatedBranches = formData.branchOffices.map((branch, i) => 
      i === index ? { ...newBranchOffice } : branch
    );
    onInputChange("branchOffices", updatedBranches);
    setEditingBranchIndex(null);
    setNewBranchOffice({
      name: "",
      address: "",
      contact: "",
      hrRepresentative: "",
      timeZone: "UTC+00:00"
    });
  };

  const removeBranchOffice = (index: number) => {
    const updatedBranches = formData.branchOffices.filter((_, i) => i !== index);
    onInputChange("branchOffices", updatedBranches);
  };

  const startEditBranch = (index: number) => {
    const branch = formData.branchOffices[index];
    setNewBranchOffice({ ...branch });
    setEditingBranchIndex(index);
    setShowAddBranch(true);
  };

  const cancelEdit = () => {
    setShowAddBranch(false);
    setEditingBranchIndex(null);
    setNewBranchOffice({
      name: "",
      address: "",
      contact: "",
      hrRepresentative: "",
      timeZone: "UTC+00:00"
    });
  };

  return (
    <div className="space-y-8">
      {/* Primary Office */}
      <section>
        <h2 className="text-[20px] font-semibold mb-6">Primary Office (Headquarters)</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-[14px] font-medium mb-2">Office Name</label>
            <input
              type="text"
              value={formData.primaryOffice.name}
              onChange={(e) => onNestedInputChange("primaryOffice", "name", e.target.value)}
              placeholder="Headquarters"
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Time Zone</label>
            <select
              value={formData.primaryOffice.timeZone}
              onChange={(e) => onNestedInputChange("primaryOffice", "timeZone", e.target.value)}
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            >
              {TIME_ZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-2">
            <label className="block text-[14px] font-medium mb-2">Address</label>
            <textarea
              value={formData.primaryOffice.address}
              onChange={(e) => onNestedInputChange("primaryOffice", "address", e.target.value)}
              placeholder="Enter complete office address"
              rows={3}
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Contact Information</label>
            <input
              type="text"
              value={formData.primaryOffice.contact}
              onChange={(e) => onNestedInputChange("primaryOffice", "contact", e.target.value)}
              placeholder="Phone, email, etc."
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
          
          <div>
            <label className="block text-[14px] font-medium mb-2">Local HR Representative</label>
            <input
              type="text"
              value={formData.primaryOffice.hrRepresentative}
              onChange={(e) => onNestedInputChange("primaryOffice", "hrRepresentative", e.target.value)}
              placeholder="HR contact name"
              className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
            />
          </div>
        </div>
      </section>

      {/* Branch Offices */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-semibold">Branch Offices/Locations</h2>
          <button
            onClick={() => setShowAddBranch(true)}
            className="px-4 py-2 bg-[#f97316] text-white rounded-md text-[14px] font-medium hover:bg-[#ea580c]"
          >
            Add Branch Office
          </button>
        </div>

        {/* Add/Edit Branch Office Form */}
        {showAddBranch && (
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6 mb-6">
            <h3 className="text-[16px] font-medium mb-4">
              {editingBranchIndex !== null ? "Edit Branch Office" : "Add New Branch Office"}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[14px] font-medium mb-2">Office Name *</label>
                <input
                  type="text"
                  value={newBranchOffice.name}
                  onChange={(e) => setNewBranchOffice(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Branch office name"
                  className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                />
              </div>
              
              <div>
                <label className="block text-[14px] font-medium mb-2">Time Zone</label>
                <select
                  value={newBranchOffice.timeZone}
                  onChange={(e) => setNewBranchOffice(prev => ({ ...prev, timeZone: e.target.value }))}
                  className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                >
                  {TIME_ZONES.map((tz) => (
                    <option key={tz} value={tz}>{tz}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-[14px] font-medium mb-2">Address *</label>
                <textarea
                  value={newBranchOffice.address}
                  onChange={(e) => setNewBranchOffice(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Enter complete office address"
                  rows={3}
                  className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                />
              </div>
              
              <div>
                <label className="block text-[14px] font-medium mb-2">Contact Information</label>
                <input
                  type="text"
                  value={newBranchOffice.contact}
                  onChange={(e) => setNewBranchOffice(prev => ({ ...prev, contact: e.target.value }))}
                  placeholder="Phone, email, etc."
                  className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                />
              </div>
              
              <div>
                <label className="block text-[14px] font-medium mb-2">Local HR Representative</label>
                <input
                  type="text"
                  value={newBranchOffice.hrRepresentative}
                  onChange={(e) => setNewBranchOffice(prev => ({ ...prev, hrRepresentative: e.target.value }))}
                  placeholder="HR contact name"
                  className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={editingBranchIndex !== null ? () => updateBranchOffice(editingBranchIndex) : addBranchOffice}
                className="px-4 py-2 bg-[#f97316] text-white rounded-md text-[14px] font-medium hover:bg-[#ea580c]"
              >
                {editingBranchIndex !== null ? "Update Branch" : "Add Branch"}
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

        {/* Branch Offices List */}
        <div className="space-y-4">
          {formData.branchOffices.length === 0 ? (
            <div className="text-center py-8 text-[#6b7280]">
              <p className="text-[14px]">No branch offices added yet.</p>
              <p className="text-[12px] mt-1">Click &quot;Add Branch Office&quot; to get started.</p>
            </div>
          ) : (
            formData.branchOffices.map((branch, index) => (
              <div key={index} className="border border-[#e5e7eb] rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-[16px] font-medium">{branch.name}</h4>
                      <span className="px-2 py-1 bg-[#f3f4f6] text-[12px] text-[#6b7280] rounded">
                        {branch.timeZone}
                      </span>
                    </div>
                    
                    <div className="space-y-1 text-[14px] text-[#6b7280]">
                      <p><strong>Address:</strong> {branch.address}</p>
                      {branch.contact && <p><strong>Contact:</strong> {branch.contact}</p>}
                      {branch.hrRepresentative && <p><strong>HR Rep:</strong> {branch.hrRepresentative}</p>}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => startEditBranch(index)}
                      className="px-3 py-1 text-[12px] text-[#f97316] border border-[#f97316] rounded hover:bg-[#fef7ed]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removeBranchOffice(index)}
                      className="px-3 py-1 text-[12px] text-[#dc2626] border border-[#dc2626] rounded hover:bg-[#fef2f2]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
