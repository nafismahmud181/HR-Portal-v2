"use client";

import { useState } from "react";

interface CompanySettings {
  reportingStructure: {
    type: string;
    maxApprovalLevels: number;
    skipLevelApproval: boolean;
  };
  costCenters: Array<{
    name: string;
    department: string;
    projectAllocation: boolean;
  }>;
  [key: string]: unknown;
}

interface OrgStructureSectionProps {
  formData: CompanySettings;
  onInputChange: (field: string, value: unknown) => void;
  onNestedInputChange: (parent: string, field: string, value: unknown) => void;
}

const REPORTING_STRUCTURE_TYPES = [
  { value: "traditional", label: "Traditional Hierarchy", description: "Clear top-down reporting structure" },
  { value: "matrix", label: "Matrix Organization", description: "Dual reporting relationships" },
  { value: "flat", label: "Flat Structure", description: "Minimal management layers" }
];

const SAMPLE_DEPARTMENTS = [
  "Engineering", "Marketing", "Sales", "Human Resources", "Finance", 
  "Operations", "Customer Support", "Product Management", "Design", "Legal"
];

export default function OrgStructureSection({ formData, onInputChange, onNestedInputChange }: OrgStructureSectionProps) {
  const [showAddCostCenter, setShowAddCostCenter] = useState(false);
  const [editingCostCenterIndex, setEditingCostCenterIndex] = useState<number | null>(null);
  const [newCostCenter, setNewCostCenter] = useState({
    name: "",
    department: "",
    projectAllocation: false
  });

  const addCostCenter = () => {
    if (newCostCenter.name.trim() && newCostCenter.department.trim()) {
      const updatedCostCenters = [...formData.costCenters, { ...newCostCenter }];
      onInputChange("costCenters", updatedCostCenters);
      setNewCostCenter({
        name: "",
        department: "",
        projectAllocation: false
      });
      setShowAddCostCenter(false);
    }
  };

  const updateCostCenter = (index: number) => {
    const updatedCostCenters = formData.costCenters.map((center, i) => 
      i === index ? { ...newCostCenter } : center
    );
    onInputChange("costCenters", updatedCostCenters);
    setEditingCostCenterIndex(null);
    setNewCostCenter({
      name: "",
      department: "",
      projectAllocation: false
    });
  };

  const removeCostCenter = (index: number) => {
    const updatedCostCenters = formData.costCenters.filter((_, i) => i !== index);
    onInputChange("costCenters", updatedCostCenters);
  };

  const startEditCostCenter = (index: number) => {
    const center = formData.costCenters[index];
    setNewCostCenter({ ...center });
    setEditingCostCenterIndex(index);
    setShowAddCostCenter(true);
  };

  const cancelEdit = () => {
    setShowAddCostCenter(false);
    setEditingCostCenterIndex(null);
    setNewCostCenter({
      name: "",
      department: "",
      projectAllocation: false
    });
  };

  return (
    <div className="space-y-8">
      {/* Reporting Structure */}
      <section>
        <h2 className="text-[20px] font-semibold mb-6">Reporting Structure</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-[14px] font-medium mb-3">Reporting Structure Type</label>
            <div className="space-y-3">
              {REPORTING_STRUCTURE_TYPES.map((type) => (
                <label key={type.value} className="flex items-start gap-3 cursor-pointer p-3 border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb]">
                  <input
                    type="radio"
                    name="reportingStructure"
                    value={type.value}
                    checked={formData.reportingStructure.type === type.value}
                    onChange={(e) => onNestedInputChange("reportingStructure", "type", e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <div className="text-[14px] font-medium">{type.label}</div>
                    <div className="text-[12px] text-[#6b7280] mt-1">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[14px] font-medium mb-2">Maximum Approval Chain Length</label>
              <input
                type="number"
                value={formData.reportingStructure.maxApprovalLevels}
                onChange={(e) => onNestedInputChange("reportingStructure", "maxApprovalLevels", parseInt(e.target.value) || 1)}
                min="1"
                max="10"
                className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
              />
              <p className="mt-1 text-[12px] text-[#6b7280]">Maximum number of approval levels in the chain</p>
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="skipLevelApproval"
                checked={formData.reportingStructure.skipLevelApproval}
                onChange={(e) => onNestedInputChange("reportingStructure", "skipLevelApproval", e.target.checked)}
                className="rounded border-[#d1d5db]"
              />
              <label htmlFor="skipLevelApproval" className="text-[14px] font-medium cursor-pointer">
                Allow skip-level approval
              </label>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Centers */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-semibold">Cost Centers</h2>
          <button
            onClick={() => setShowAddCostCenter(true)}
            className="px-4 py-2 bg-[#f97316] text-white rounded-md text-[14px] font-medium hover:bg-[#ea580c]"
          >
            Add Cost Center
          </button>
        </div>

        {/* Add/Edit Cost Center Form */}
        {showAddCostCenter && (
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-6 mb-6">
            <h3 className="text-[16px] font-medium mb-4">
              {editingCostCenterIndex !== null ? "Edit Cost Center" : "Add New Cost Center"}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[14px] font-medium mb-2">Cost Center Name *</label>
                <input
                  type="text"
                  value={newCostCenter.name}
                  onChange={(e) => setNewCostCenter(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Engineering - Product Development"
                  className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                />
              </div>
              
              <div>
                <label className="block text-[14px] font-medium mb-2">Department *</label>
                <select
                  value={newCostCenter.department}
                  onChange={(e) => setNewCostCenter(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full rounded-md border border-[#d1d5db] px-3 py-2 text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#f97316]"
                >
                  <option value="">Select department</option>
                  {SAMPLE_DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCostCenter.projectAllocation}
                    onChange={(e) => setNewCostCenter(prev => ({ ...prev, projectAllocation: e.target.checked }))}
                    className="rounded border-[#d1d5db]"
                  />
                  <span className="text-[14px] font-medium">Enable project-based cost allocation</span>
                </label>
                <p className="mt-1 text-[12px] text-[#6b7280]">
                  Allow costs to be allocated to specific projects within this cost center
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-4">
              <button
                onClick={editingCostCenterIndex !== null ? () => updateCostCenter(editingCostCenterIndex) : addCostCenter}
                className="px-4 py-2 bg-[#f97316] text-white rounded-md text-[14px] font-medium hover:bg-[#ea580c]"
              >
                {editingCostCenterIndex !== null ? "Update Cost Center" : "Add Cost Center"}
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

        {/* Cost Centers List */}
        <div className="space-y-4">
          {formData.costCenters.length === 0 ? (
            <div className="text-center py-8 text-[#6b7280]">
              <p className="text-[14px]">No cost centers configured yet.</p>
              <p className="text-[12px] mt-1">Click &quot;Add Cost Center&quot; to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border border-[#e5e7eb] rounded-lg">
                <thead className="bg-[#f9fafb]">
                  <tr>
                    <th className="text-left p-3 text-[14px] font-medium">Cost Center Name</th>
                    <th className="text-left p-3 text-[14px] font-medium">Department</th>
                    <th className="text-left p-3 text-[14px] font-medium">Project Allocation</th>
                    <th className="text-left p-3 text-[14px] font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.costCenters.map((center, index) => (
                    <tr key={index} className="border-t border-[#e5e7eb]">
                      <td className="p-3 text-[14px]">{center.name}</td>
                      <td className="p-3 text-[14px]">{center.department}</td>
                      <td className="p-3 text-[14px]">
                        <span className={`px-2 py-1 rounded-full text-[12px] ${
                          center.projectAllocation 
                            ? "bg-green-100 text-green-800" 
                            : "bg-gray-100 text-gray-800"
                        }`}>
                          {center.projectAllocation ? "Enabled" : "Disabled"}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEditCostCenter(index)}
                            className="px-3 py-1 text-[12px] text-[#f97316] border border-[#f97316] rounded hover:bg-[#fef7ed]"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => removeCostCenter(index)}
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
      </section>

      {/* Organizational Structure Summary */}
      <section>
        <h2 className="text-[20px] font-semibold mb-6">Structure Summary</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4">
            <h3 className="text-[16px] font-medium mb-2">Reporting Structure</h3>
            <p className="text-[14px] text-[#6b7280] mb-2">
              {REPORTING_STRUCTURE_TYPES.find(t => t.value === formData.reportingStructure.type)?.label || "Not set"}
            </p>
            <p className="text-[12px] text-[#6b7280]">
              Max approval levels: {formData.reportingStructure.maxApprovalLevels}
            </p>
          </div>
          
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4">
            <h3 className="text-[16px] font-medium mb-2">Cost Centers</h3>
            <p className="text-[14px] text-[#6b7280] mb-2">
              Total: {formData.costCenters.length}
            </p>
            <p className="text-[12px] text-[#6b7280]">
              With project allocation: {formData.costCenters.filter(c => c.projectAllocation).length}
            </p>
          </div>
          
          <div className="bg-[#f9fafb] border border-[#e5e7eb] rounded-lg p-4">
            <h3 className="text-[16px] font-medium mb-2">Departments</h3>
            <p className="text-[14px] text-[#6b7280] mb-2">
              Unique departments: {new Set(formData.costCenters.map(c => c.department)).size}
            </p>
            <p className="text-[12px] text-[#6b7280]">
              Cost centers per dept: {formData.costCenters.length > 0 ? (formData.costCenters.length / new Set(formData.costCenters.map(c => c.department)).size).toFixed(1) : "0"}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
