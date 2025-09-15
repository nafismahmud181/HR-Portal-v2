"use client";

import { useState } from "react";

interface AdministrationSettings {
  userRoles: {
    superAdmin: {
      permissions: string[];
      description: string;
    };
    hrAdmin: {
      permissions: string[];
      description: string;
    };
    manager: {
      permissions: string[];
      description: string;
    };
    employee: {
      permissions: string[];
      description: string;
    };
    customRoles: Array<{
      id: string;
      name: string;
      permissions: string[];
      description: string;
    }>;
  };
  permissionMatrix: {
    modules: string[];
    features: string[];
    dataVisibility: {
      employeeData: string[];
      payrollData: string[];
      performanceData: string[];
    };
  };
  roleAssignmentRules: {
    autoAssignment: {
      enabled: boolean;
      jobTitleMapping: Array<{
        jobTitle: string;
        role: string;
      }>;
      departmentMapping: Array<{
        department: string;
        role: string;
      }>;
    };
    approvalHierarchy: {
      enabled: boolean;
      levels: number;
      skipLevelApproval: boolean;
    };
  };
  passwordPolicy: {
    minimumLength: number;
    complexityRequired: boolean;
    expirationPeriod: number;
    historyCount: number;
    specialCharactersRequired: boolean;
    numbersRequired: boolean;
    uppercaseRequired: boolean;
    lowercaseRequired: boolean;
  };
  accountSecurity: {
    mfaEnabled: boolean;
    sessionTimeout: number;
    failedLoginLimit: number;
    accountLockoutDuration: number;
    passwordResetRequired: boolean;
  };
  ssoSettings: {
    enabled: boolean;
    provider: string;
    domainAutoLogin: boolean;
    userProvisioning: {
      enabled: boolean;
      autoCreateAccounts: boolean;
      defaultRole: string;
    };
  };
  [key: string]: unknown;
}

interface UserManagementSectionProps {
  formData: AdministrationSettings;
  onInputChange: (field: string, value: unknown) => void;
  onNestedInputChange: (parent: string, field: string, value: unknown) => void;
}

const PERMISSIONS = [
  "all", "hr_management", "employee_data", "payroll", "reports", "team_management",
  "performance", "leave_approval", "self_service", "leave_request", "profile_update",
  "recruitment", "system_admin", "user_management", "settings_access"
];

const SSO_PROVIDERS = [
  "Google Workspace", "Microsoft Azure AD", "Okta", "Auth0", "OneLogin", "Ping Identity"
];

const DEFAULT_ROLES = ["superAdmin", "hrAdmin", "manager", "employee"];

export default function UserManagementSection({ formData, onInputChange, onNestedInputChange }: UserManagementSectionProps) {
  const [newCustomRole, setNewCustomRole] = useState({
    name: "",
    permissions: [] as string[],
    description: ""
  });
  const [newJobTitleMapping, setNewJobTitleMapping] = useState({
    jobTitle: "",
    role: ""
  });
  const [newDepartmentMapping, setNewDepartmentMapping] = useState({
    department: "",
    role: ""
  });

  const addCustomRole = () => {
    if (newCustomRole.name.trim() && newCustomRole.permissions.length > 0) {
      const updatedRoles = [...formData.userRoles.customRoles, {
        id: Date.now().toString(),
        ...newCustomRole
      }];
      onNestedInputChange("userRoles", "customRoles", updatedRoles);
      setNewCustomRole({ name: "", permissions: [], description: "" });
    }
  };

  const removeCustomRole = (id: string) => {
    const updatedRoles = formData.userRoles.customRoles.filter((role: { id: string }) => role.id !== id);
    onNestedInputChange("userRoles", "customRoles", updatedRoles);
  };

  const togglePermission = (role: string, permission: string) => {
    const currentPermissions = formData.userRoles[role as keyof typeof formData.userRoles] as { permissions: string[] };
    const updatedPermissions = currentPermissions.permissions.includes(permission)
      ? currentPermissions.permissions.filter((p: string) => p !== permission)
      : [...currentPermissions.permissions, permission];
    
    onNestedInputChange("userRoles", role, {
      ...currentPermissions,
      permissions: updatedPermissions
    });
  };

  const addJobTitleMapping = () => {
    if (newJobTitleMapping.jobTitle.trim() && newJobTitleMapping.role) {
      const updatedMappings = [...formData.roleAssignmentRules.autoAssignment.jobTitleMapping, { ...newJobTitleMapping }];
      onNestedInputChange("roleAssignmentRules", "autoAssignment", {
        ...formData.roleAssignmentRules.autoAssignment,
        jobTitleMapping: updatedMappings
      });
      setNewJobTitleMapping({ jobTitle: "", role: "" });
    }
  };

  const removeJobTitleMapping = (index: number) => {
    const updatedMappings = formData.roleAssignmentRules.autoAssignment.jobTitleMapping.filter((_: unknown, i: number) => i !== index);
    onNestedInputChange("roleAssignmentRules", "autoAssignment", {
      ...formData.roleAssignmentRules.autoAssignment,
      jobTitleMapping: updatedMappings
    });
  };

  const addDepartmentMapping = () => {
    if (newDepartmentMapping.department.trim() && newDepartmentMapping.role) {
      const updatedMappings = [...formData.roleAssignmentRules.autoAssignment.departmentMapping, { ...newDepartmentMapping }];
      onNestedInputChange("roleAssignmentRules", "autoAssignment", {
        ...formData.roleAssignmentRules.autoAssignment,
        departmentMapping: updatedMappings
      });
      setNewDepartmentMapping({ department: "", role: "" });
    }
  };

  const removeDepartmentMapping = (index: number) => {
    const updatedMappings = formData.roleAssignmentRules.autoAssignment.departmentMapping.filter((_: unknown, i: number) => i !== index);
    onNestedInputChange("roleAssignmentRules", "autoAssignment", {
      ...formData.roleAssignmentRules.autoAssignment,
      departmentMapping: updatedMappings
    });
  };

  return (
    <div className="space-y-8">
      {/* User Roles & Permissions */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <h2 className="text-[20px] font-semibold mb-6">User Roles & Permissions</h2>
        
        {/* Default Roles */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Default Roles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_ROLES.map((role) => {
              const roleData = formData.userRoles[role as keyof typeof formData.userRoles] as { permissions: string[]; description: string };
              return (
                <div key={role} className="border border-[#e5e7eb] rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[14px] font-medium capitalize">{role.replace(/([A-Z])/g, ' $1').trim()}</h4>
                    <span className="text-[12px] text-[#6b7280]">{roleData.permissions.length} permissions</span>
                  </div>
                  <p className="text-[12px] text-[#6b7280] mb-3">{roleData.description}</p>
                  <div className="space-y-2">
                    <label className="text-[12px] font-medium text-[#374151]">Permissions:</label>
                    <div className="grid grid-cols-2 gap-1">
                      {PERMISSIONS.map((permission) => (
                        <label key={permission} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleData.permissions.includes(permission)}
                            onChange={() => togglePermission(role, permission)}
                            className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                          />
                          <span className="text-[11px] text-[#6b7280]">{permission.replace(/_/g, ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Custom Roles */}
        <div>
          <h3 className="text-[16px] font-medium mb-4">Custom Roles</h3>
          <div className="space-y-4">
            {formData.userRoles.customRoles.map((role) => (
              <div key={role.id} className="border border-[#e5e7eb] rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[14px] font-medium">{role.name}</h4>
                  <button
                    onClick={() => removeCustomRole(role.id)}
                    className="text-red-600 hover:text-red-700 text-[12px]"
                  >
                    Remove
                  </button>
                </div>
                <p className="text-[12px] text-[#6b7280] mb-3">{role.description}</p>
                <div className="text-[12px] text-[#6b7280]">
                  Permissions: {role.permissions.join(", ")}
                </div>
              </div>
            ))}
            
            <div className="border-2 border-dashed border-[#d1d5db] rounded-lg p-4">
              <h4 className="text-[14px] font-medium mb-3">Add Custom Role</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Role name"
                  value={newCustomRole.name}
                  onChange={(e) => setNewCustomRole(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                />
                <textarea
                  placeholder="Role description"
                  value={newCustomRole.description}
                  onChange={(e) => setNewCustomRole(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  rows={2}
                />
                <div>
                  <label className="text-[12px] font-medium text-[#374151] mb-2 block">Permissions:</label>
                  <div className="grid grid-cols-3 gap-2">
                    {PERMISSIONS.map((permission) => (
                      <label key={permission} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newCustomRole.permissions.includes(permission)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewCustomRole(prev => ({ ...prev, permissions: [...prev.permissions, permission] }));
                            } else {
                              setNewCustomRole(prev => ({ ...prev, permissions: prev.permissions.filter(p => p !== permission) }));
                            }
                          }}
                          className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                        />
                        <span className="text-[11px] text-[#6b7280]">{permission.replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button
                  onClick={addCustomRole}
                  className="px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors text-[14px]"
                >
                  Add Custom Role
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Role Assignment Rules */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <h2 className="text-[20px] font-semibold mb-6">Role Assignment Rules</h2>
        
        <div className="space-y-6">
          {/* Auto Assignment */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-medium">Auto Assignment</h3>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.roleAssignmentRules.autoAssignment.enabled}
                  onChange={(e) => onNestedInputChange("roleAssignmentRules", "autoAssignment", {
                    ...formData.roleAssignmentRules.autoAssignment,
                    enabled: e.target.checked
                  })}
                  className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-[14px]">Enable auto assignment</span>
              </label>
            </div>

            {/* Job Title Mapping */}
            <div className="mb-4">
              <h4 className="text-[14px] font-medium mb-3">Job Title Mapping</h4>
              <div className="space-y-2">
                {formData.roleAssignmentRules.autoAssignment.jobTitleMapping.map((mapping, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-[#f9fafb] rounded">
                    <span className="text-[14px]">{mapping.jobTitle}</span>
                    <span className="text-[14px] text-[#6b7280]">→</span>
                    <span className="text-[14px]">{mapping.role}</span>
                    <button
                      onClick={() => removeJobTitleMapping(index)}
                      className="text-red-600 hover:text-red-700 text-[12px] ml-auto"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Job title"
                    value={newJobTitleMapping.jobTitle}
                    onChange={(e) => setNewJobTitleMapping(prev => ({ ...prev, jobTitle: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  />
                  <select
                    value={newJobTitleMapping.role}
                    onChange={(e) => setNewJobTitleMapping(prev => ({ ...prev, role: e.target.value }))}
                    className="px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  >
                    <option value="">Select role</option>
                    {DEFAULT_ROLES.map(role => (
                      <option key={role} value={role}>{role.replace(/([A-Z])/g, ' $1').trim()}</option>
                    ))}
                  </select>
                  <button
                    onClick={addJobTitleMapping}
                    className="px-3 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors text-[14px]"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Department Mapping */}
            <div>
              <h4 className="text-[14px] font-medium mb-3">Department Mapping</h4>
              <div className="space-y-2">
                {formData.roleAssignmentRules.autoAssignment.departmentMapping.map((mapping, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-[#f9fafb] rounded">
                    <span className="text-[14px]">{mapping.department}</span>
                    <span className="text-[14px] text-[#6b7280]">→</span>
                    <span className="text-[14px]">{mapping.role}</span>
                    <button
                      onClick={() => removeDepartmentMapping(index)}
                      className="text-red-600 hover:text-red-700 text-[12px] ml-auto"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Department"
                    value={newDepartmentMapping.department}
                    onChange={(e) => setNewDepartmentMapping(prev => ({ ...prev, department: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  />
                  <select
                    value={newDepartmentMapping.role}
                    onChange={(e) => setNewDepartmentMapping(prev => ({ ...prev, role: e.target.value }))}
                    className="px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  >
                    <option value="">Select role</option>
                    {DEFAULT_ROLES.map(role => (
                      <option key={role} value={role}>{role.replace(/([A-Z])/g, ' $1').trim()}</option>
                    ))}
                  </select>
                  <button
                    onClick={addDepartmentMapping}
                    className="px-3 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors text-[14px]"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Approval Hierarchy */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[16px] font-medium">Approval Hierarchy</h3>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.roleAssignmentRules.approvalHierarchy.enabled}
                  onChange={(e) => onNestedInputChange("roleAssignmentRules", "approvalHierarchy", {
                    ...formData.roleAssignmentRules.approvalHierarchy,
                    enabled: e.target.checked
                  })}
                  className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-[14px]">Enable approval hierarchy</span>
              </label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[14px] font-medium text-[#374151] mb-2 block">Approval Levels</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.roleAssignmentRules.approvalHierarchy.levels}
                  onChange={(e) => onNestedInputChange("roleAssignmentRules", "approvalHierarchy", {
                    ...formData.roleAssignmentRules.approvalHierarchy,
                    levels: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.roleAssignmentRules.approvalHierarchy.skipLevelApproval}
                    onChange={(e) => onNestedInputChange("roleAssignmentRules", "approvalHierarchy", {
                      ...formData.roleAssignmentRules.approvalHierarchy,
                      skipLevelApproval: e.target.checked
                    })}
                    className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                  />
                  <span className="text-[14px]">Allow skip-level approval</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Password Policy */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <h2 className="text-[20px] font-semibold mb-6">Password Policy</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[14px] font-medium text-[#374151] mb-2 block">Minimum Length</label>
            <input
              type="number"
              min="6"
              max="50"
              value={formData.passwordPolicy.minimumLength}
              onChange={(e) => onNestedInputChange("passwordPolicy", "minimumLength", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-[14px] font-medium text-[#374151] mb-2 block">Expiration Period (days)</label>
            <input
              type="number"
              min="30"
              max="365"
              value={formData.passwordPolicy.expirationPeriod}
              onChange={(e) => onNestedInputChange("passwordPolicy", "expirationPeriod", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-[14px] font-medium text-[#374151] mb-2 block">Password History Count</label>
            <input
              type="number"
              min="0"
              max="20"
              value={formData.passwordPolicy.historyCount}
              onChange={(e) => onNestedInputChange("passwordPolicy", "historyCount", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="text-[16px] font-medium">Complexity Requirements</h3>
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.passwordPolicy.complexityRequired}
                onChange={(e) => onNestedInputChange("passwordPolicy", "complexityRequired", e.target.checked)}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Require complexity</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.passwordPolicy.specialCharactersRequired}
                onChange={(e) => onNestedInputChange("passwordPolicy", "specialCharactersRequired", e.target.checked)}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Special characters</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.passwordPolicy.numbersRequired}
                onChange={(e) => onNestedInputChange("passwordPolicy", "numbersRequired", e.target.checked)}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Numbers</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.passwordPolicy.uppercaseRequired}
                onChange={(e) => onNestedInputChange("passwordPolicy", "uppercaseRequired", e.target.checked)}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Uppercase letters</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.passwordPolicy.lowercaseRequired}
                onChange={(e) => onNestedInputChange("passwordPolicy", "lowercaseRequired", e.target.checked)}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Lowercase letters</span>
            </label>
          </div>
        </div>
      </div>

      {/* Account Security */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <h2 className="text-[20px] font-semibold mb-6">Account Security</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-[14px] font-medium text-[#374151] mb-2 block">Session Timeout (minutes)</label>
            <input
              type="number"
              min="5"
              max="480"
              value={formData.accountSecurity.sessionTimeout}
              onChange={(e) => onNestedInputChange("accountSecurity", "sessionTimeout", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-[14px] font-medium text-[#374151] mb-2 block">Failed Login Limit</label>
            <input
              type="number"
              min="3"
              max="20"
              value={formData.accountSecurity.failedLoginLimit}
              onChange={(e) => onNestedInputChange("accountSecurity", "failedLoginLimit", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
            />
          </div>
          <div>
            <label className="text-[14px] font-medium text-[#374151] mb-2 block">Account Lockout Duration (minutes)</label>
            <input
              type="number"
              min="5"
              max="1440"
              value={formData.accountSecurity.accountLockoutDuration}
              onChange={(e) => onNestedInputChange("accountSecurity", "accountLockoutDuration", parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
            />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <h3 className="text-[16px] font-medium">Security Features</h3>
          <div className="space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.accountSecurity.mfaEnabled}
                onChange={(e) => onNestedInputChange("accountSecurity", "mfaEnabled", e.target.checked)}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable Multi-Factor Authentication</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.accountSecurity.passwordResetRequired}
                onChange={(e) => onNestedInputChange("accountSecurity", "passwordResetRequired", e.target.checked)}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Require password reset on first login</span>
            </label>
          </div>
        </div>
      </div>

      {/* Single Sign-On (SSO) */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <h2 className="text-[20px] font-semibold mb-6">Single Sign-On (SSO)</h2>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-medium">SSO Configuration</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.ssoSettings.enabled}
                onChange={(e) => onNestedInputChange("ssoSettings", "enabled", e.target.checked)}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable SSO</span>
            </label>
          </div>

          {formData.ssoSettings.enabled && (
            <div className="space-y-4">
              <div>
                <label className="text-[14px] font-medium text-[#374151] mb-2 block">SSO Provider</label>
                <select
                  value={formData.ssoSettings.provider}
                  onChange={(e) => onNestedInputChange("ssoSettings", "provider", e.target.value)}
                  className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                >
                  <option value="">Select provider</option>
                  {SSO_PROVIDERS.map(provider => (
                    <option key={provider} value={provider}>{provider}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.ssoSettings.domainAutoLogin}
                  onChange={(e) => onNestedInputChange("ssoSettings", "domainAutoLogin", e.target.checked)}
                  className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-[14px]">Enable domain-based auto-login</span>
              </label>

              <div>
                <h4 className="text-[14px] font-medium mb-3">User Provisioning</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.ssoSettings.userProvisioning.enabled}
                      onChange={(e) => onNestedInputChange("ssoSettings", "userProvisioning", {
                        ...formData.ssoSettings.userProvisioning,
                        enabled: e.target.checked
                      })}
                      className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                    />
                    <span className="text-[14px]">Enable user provisioning</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.ssoSettings.userProvisioning.autoCreateAccounts}
                      onChange={(e) => onNestedInputChange("ssoSettings", "userProvisioning", {
                        ...formData.ssoSettings.userProvisioning,
                        autoCreateAccounts: e.target.checked
                      })}
                      className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                    />
                    <span className="text-[14px]">Auto-create accounts</span>
                  </label>
                  <div>
                    <label className="text-[14px] font-medium text-[#374151] mb-2 block">Default Role</label>
                    <select
                      value={formData.ssoSettings.userProvisioning.defaultRole}
                      onChange={(e) => onNestedInputChange("ssoSettings", "userProvisioning", {
                        ...formData.ssoSettings.userProvisioning,
                        defaultRole: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                    >
                      {DEFAULT_ROLES.map(role => (
                        <option key={role} value={role}>{role.replace(/([A-Z])/g, ' $1').trim()}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
