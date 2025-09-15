"use client";

import { useState } from "react";

interface SecurityAuditSettings {
  accessControl: {
    ipRestrictions: {
      enabled: boolean;
      allowedIPs: string[];
      blockedIPs: string[];
    };
    geographicLimitations: {
      enabled: boolean;
      allowedCountries: string[];
      blockedCountries: string[];
    };
    vpnRequirements: {
      enabled: boolean;
      requiredForAdmin: boolean;
      requiredForHR: boolean;
    };
  };
  dataEncryption: {
    encryptionAtRest: {
      enabled: boolean;
      algorithm: string;
      keyRotationPeriod: number;
    };
    dataInTransit: {
      enabled: boolean;
      protocol: string;
      certificateValidation: boolean;
    };
    keyManagement: {
      provider: string;
      backupEnabled: boolean;
      keyVersioning: boolean;
    };
  };
  privacySettings: {
    employeeDataVisibility: {
      selfViewOnly: boolean;
      managerViewTeam: boolean;
      hrViewAll: boolean;
    };
    managerAccessLimitations: {
      restrictedDepartments: string[];
      viewOnlyMode: boolean;
      approvalRequired: boolean;
    };
    hrDataSegregation: {
      enabled: boolean;
      sensitiveDataAccess: string[];
      auditRequired: boolean;
    };
  };
  auditTrail: {
    activityLogging: {
      enabled: boolean;
      logLevel: string;
      includeUserActions: boolean;
      includeSystemEvents: boolean;
    };
    logRetention: {
      period: number;
      archiveAfterDays: number;
      compressionEnabled: boolean;
    };
    auditReports: {
      autoGeneration: boolean;
      frequency: string;
      recipients: string[];
    };
  };
  complianceMonitoring: {
    regulatoryTracking: {
      enabled: boolean;
      jurisdictions: string[];
      requirements: string[];
    };
    policyCompliance: {
      enabled: boolean;
      checkFrequency: string;
      violationThreshold: number;
    };
    violationReporting: {
      enabled: boolean;
      notificationChannels: string[];
      escalationLevels: number;
    };
  };
  dataRightsManagement: {
    employeeDataAccess: {
      selfServiceEnabled: boolean;
      dataPortability: boolean;
      accessLogging: boolean;
    };
    dataCorrectionWorkflows: {
      enabled: boolean;
      approvalRequired: boolean;
      notificationRequired: boolean;
    };
    dataDeletionProcedures: {
      enabled: boolean;
      retentionPeriod: number;
      secureDeletion: boolean;
    };
  };
  [key: string]: unknown;
}

interface SecurityAuditSectionProps {
  formData: SecurityAuditSettings;
  onInputChange: (field: string, value: unknown) => void;
  onNestedInputChange: (parent: string, field: string, value: unknown) => void;
}

const COUNTRIES = ["US", "CA", "GB", "DE", "FR", "AU", "JP", "IN", "BR", "MX"];
const ENCRYPTION_ALGORITHMS = ["AES-256", "AES-128", "RSA-2048", "RSA-4096"];
const PROTOCOLS = ["TLS 1.3", "TLS 1.2", "HTTPS", "SFTP"];
const LOG_LEVELS = ["debug", "info", "warn", "error"];
const FREQUENCIES = ["daily", "weekly", "monthly", "quarterly"];

export default function SecurityAuditSection({ formData, onInputChange, onNestedInputChange }: SecurityAuditSectionProps) {
  const [newIP, setNewIP] = useState("");
  const [newCountry, setNewCountry] = useState("");

  const addIP = (type: "allowed" | "blocked") => {
    if (newIP.trim()) {
      const field = type === "allowed" ? "allowedIPs" : "blockedIPs";
      const currentIPs = formData.accessControl.ipRestrictions[field];
      const updatedIPs = [...currentIPs, newIP.trim()];
      onNestedInputChange("accessControl", "ipRestrictions", {
        ...formData.accessControl.ipRestrictions,
        [field]: updatedIPs
      });
      setNewIP("");
    }
  };

  const removeIP = (type: "allowed" | "blocked", index: number) => {
    const field = type === "allowed" ? "allowedIPs" : "blockedIPs";
    const currentIPs = formData.accessControl.ipRestrictions[field];
    const updatedIPs = currentIPs.filter((_: string, i: number) => i !== index);
    onNestedInputChange("accessControl", "ipRestrictions", {
      ...formData.accessControl.ipRestrictions,
      [field]: updatedIPs
    });
  };

  const addCountry = (type: "allowed" | "blocked") => {
    if (newCountry.trim()) {
      const field = type === "allowed" ? "allowedCountries" : "blockedCountries";
      const currentCountries = formData.accessControl.geographicLimitations[field];
      const updatedCountries = [...currentCountries, newCountry.trim()];
      onNestedInputChange("accessControl", "geographicLimitations", {
        ...formData.accessControl.geographicLimitations,
        [field]: updatedCountries
      });
      setNewCountry("");
    }
  };

  const removeCountry = (type: "allowed" | "blocked", index: number) => {
    const field = type === "allowed" ? "allowedCountries" : "blockedCountries";
    const currentCountries = formData.accessControl.geographicLimitations[field];
    const updatedCountries = currentCountries.filter((_: string, i: number) => i !== index);
    onNestedInputChange("accessControl", "geographicLimitations", {
      ...formData.accessControl.geographicLimitations,
      [field]: updatedCountries
    });
  };

  return (
    <div className="space-y-8">
      {/* Security Settings */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <h2 className="text-[20px] font-semibold mb-6">Security Settings</h2>
        
        {/* Access Control */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Access Control</h3>
          
          {/* IP Restrictions */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[14px] font-medium">IP Address Restrictions</h4>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.accessControl.ipRestrictions.enabled}
                  onChange={(e) => onNestedInputChange("accessControl", "ipRestrictions", {
                    ...formData.accessControl.ipRestrictions,
                    enabled: e.target.checked
                  })}
                  className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-[14px]">Enable IP restrictions</span>
              </label>
            </div>
            
            {formData.accessControl.ipRestrictions.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-[12px] font-medium text-[#374151] mb-2">Allowed IPs</h5>
                  <div className="space-y-2">
                    {formData.accessControl.ipRestrictions.allowedIPs.map((ip, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="text-[12px]">{ip}</span>
                        <button
                          onClick={() => removeIP("allowed", index)}
                          className="text-red-600 hover:text-red-700 text-[10px]"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="IP address"
                        value={newIP}
                        onChange={(e) => setNewIP(e.target.value)}
                        className="flex-1 px-2 py-1 border border-[#d1d5db] rounded text-[12px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      />
                      <button
                        onClick={() => addIP("allowed")}
                        className="px-2 py-1 bg-green-600 text-white rounded text-[10px] hover:bg-green-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="text-[12px] font-medium text-[#374151] mb-2">Blocked IPs</h5>
                  <div className="space-y-2">
                    {formData.accessControl.ipRestrictions.blockedIPs.map((ip, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                        <span className="text-[12px]">{ip}</span>
                        <button
                          onClick={() => removeIP("blocked", index)}
                          className="text-red-600 hover:text-red-700 text-[10px]"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        placeholder="IP address"
                        value={newIP}
                        onChange={(e) => setNewIP(e.target.value)}
                        className="flex-1 px-2 py-1 border border-[#d1d5db] rounded text-[12px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      />
                      <button
                        onClick={() => addIP("blocked")}
                        className="px-2 py-1 bg-red-600 text-white rounded text-[10px] hover:bg-red-700"
                      >
                        Block
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Geographic Limitations */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[14px] font-medium">Geographic Access Limitations</h4>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.accessControl.geographicLimitations.enabled}
                  onChange={(e) => onNestedInputChange("accessControl", "geographicLimitations", {
                    ...formData.accessControl.geographicLimitations,
                    enabled: e.target.checked
                  })}
                  className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-[14px]">Enable geographic restrictions</span>
              </label>
            </div>
            
            {formData.accessControl.geographicLimitations.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-[12px] font-medium text-[#374151] mb-2">Allowed Countries</h5>
                  <div className="space-y-2">
                    {formData.accessControl.geographicLimitations.allowedCountries.map((country, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="text-[12px]">{country}</span>
                        <button
                          onClick={() => removeCountry("allowed", index)}
                          className="text-red-600 hover:text-red-700 text-[10px]"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <select
                        value={newCountry}
                        onChange={(e) => setNewCountry(e.target.value)}
                        className="flex-1 px-2 py-1 border border-[#d1d5db] rounded text-[12px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => addCountry("allowed")}
                        className="px-2 py-1 bg-green-600 text-white rounded text-[10px] hover:bg-green-700"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h5 className="text-[12px] font-medium text-[#374151] mb-2">Blocked Countries</h5>
                  <div className="space-y-2">
                    {formData.accessControl.geographicLimitations.blockedCountries.map((country, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded">
                        <span className="text-[12px]">{country}</span>
                        <button
                          onClick={() => removeCountry("blocked", index)}
                          className="text-red-600 hover:text-red-700 text-[10px]"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <div className="flex items-center space-x-2">
                      <select
                        value={newCountry}
                        onChange={(e) => setNewCountry(e.target.value)}
                        className="flex-1 px-2 py-1 border border-[#d1d5db] rounded text-[12px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      >
                        <option value="">Select country</option>
                        {COUNTRIES.map(country => (
                          <option key={country} value={country}>{country}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => addCountry("blocked")}
                        className="px-2 py-1 bg-red-600 text-white rounded text-[10px] hover:bg-red-700"
                      >
                        Block
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* VPN Requirements */}
          <div>
            <h4 className="text-[14px] font-medium mb-4">VPN Requirements</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.accessControl.vpnRequirements.enabled}
                  onChange={(e) => onNestedInputChange("accessControl", "vpnRequirements", {
                    ...formData.accessControl.vpnRequirements,
                    enabled: e.target.checked
                  })}
                  className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-[14px]">Enable VPN requirements</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.accessControl.vpnRequirements.requiredForAdmin}
                  onChange={(e) => onNestedInputChange("accessControl", "vpnRequirements", {
                    ...formData.accessControl.vpnRequirements,
                    requiredForAdmin: e.target.checked
                  })}
                  className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-[14px]">Required for admin access</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.accessControl.vpnRequirements.requiredForHR}
                  onChange={(e) => onNestedInputChange("accessControl", "vpnRequirements", {
                    ...formData.accessControl.vpnRequirements,
                    requiredForHR: e.target.checked
                  })}
                  className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-[14px]">Required for HR access</span>
              </label>
            </div>
          </div>
        </div>

        {/* Data Encryption */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Data Encryption</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[14px] font-medium text-[#374151] mb-2 block">Encryption Algorithm</label>
              <select
                value={formData.dataEncryption.encryptionAtRest.algorithm}
                onChange={(e) => onNestedInputChange("dataEncryption", "encryptionAtRest", {
                  ...formData.dataEncryption.encryptionAtRest,
                  algorithm: e.target.value
                })}
                className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              >
                {ENCRYPTION_ALGORITHMS.map(algo => (
                  <option key={algo} value={algo}>{algo}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[14px] font-medium text-[#374151] mb-2 block">Key Rotation Period (days)</label>
              <input
                type="number"
                min="30"
                max="365"
                value={formData.dataEncryption.encryptionAtRest.keyRotationPeriod}
                onChange={(e) => onNestedInputChange("dataEncryption", "encryptionAtRest", {
                  ...formData.dataEncryption.encryptionAtRest,
                  keyRotationPeriod: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-[14px] font-medium text-[#374151] mb-2 block">Data in Transit Protocol</label>
              <select
                value={formData.dataEncryption.dataInTransit.protocol}
                onChange={(e) => onNestedInputChange("dataEncryption", "dataInTransit", {
                  ...formData.dataEncryption.dataInTransit,
                  protocol: e.target.value
                })}
                className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              >
                {PROTOCOLS.map(protocol => (
                  <option key={protocol} value={protocol}>{protocol}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.dataEncryption.encryptionAtRest.enabled}
                onChange={(e) => onNestedInputChange("dataEncryption", "encryptionAtRest", {
                  ...formData.dataEncryption.encryptionAtRest,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable encryption at rest</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.dataEncryption.dataInTransit.enabled}
                onChange={(e) => onNestedInputChange("dataEncryption", "dataInTransit", {
                  ...formData.dataEncryption.dataInTransit,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable data in transit protection</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.dataEncryption.dataInTransit.certificateValidation}
                onChange={(e) => onNestedInputChange("dataEncryption", "dataInTransit", {
                  ...formData.dataEncryption.dataInTransit,
                  certificateValidation: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable certificate validation</span>
            </label>
          </div>
        </div>

        {/* Privacy Settings */}
        <div>
          <h3 className="text-[16px] font-medium mb-4">Privacy Settings</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-[14px] font-medium mb-3">Employee Data Visibility</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.privacySettings.employeeDataVisibility.selfViewOnly}
                    onChange={(e) => onNestedInputChange("privacySettings", "employeeDataVisibility", {
                      ...formData.privacySettings.employeeDataVisibility,
                      selfViewOnly: e.target.checked
                    })}
                    className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                  />
                  <span className="text-[14px]">Employees can only view their own data</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.privacySettings.employeeDataVisibility.managerViewTeam}
                    onChange={(e) => onNestedInputChange("privacySettings", "employeeDataVisibility", {
                      ...formData.privacySettings.employeeDataVisibility,
                      managerViewTeam: e.target.checked
                    })}
                    className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                  />
                  <span className="text-[14px]">Managers can view team data</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.privacySettings.employeeDataVisibility.hrViewAll}
                    onChange={(e) => onNestedInputChange("privacySettings", "employeeDataVisibility", {
                      ...formData.privacySettings.employeeDataVisibility,
                      hrViewAll: e.target.checked
                    })}
                    className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                  />
                  <span className="text-[14px]">HR can view all employee data</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit & Compliance */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <h2 className="text-[20px] font-semibold mb-6">Audit & Compliance</h2>
        
        {/* Audit Trail Configuration */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Audit Trail Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[14px] font-medium text-[#374151] mb-2 block">Log Level</label>
              <select
                value={formData.auditTrail.activityLogging.logLevel}
                onChange={(e) => onNestedInputChange("auditTrail", "activityLogging", {
                  ...formData.auditTrail.activityLogging,
                  logLevel: e.target.value
                })}
                className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              >
                {LOG_LEVELS.map(level => (
                  <option key={level} value={level}>{level.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[14px] font-medium text-[#374151] mb-2 block">Log Retention (days)</label>
              <input
                type="number"
                min="30"
                max="2555"
                value={formData.auditTrail.logRetention.period}
                onChange={(e) => onNestedInputChange("auditTrail", "logRetention", {
                  ...formData.auditTrail.logRetention,
                  period: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.auditTrail.activityLogging.enabled}
                onChange={(e) => onNestedInputChange("auditTrail", "activityLogging", {
                  ...formData.auditTrail.activityLogging,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable activity logging</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.auditTrail.activityLogging.includeUserActions}
                onChange={(e) => onNestedInputChange("auditTrail", "activityLogging", {
                  ...formData.auditTrail.activityLogging,
                  includeUserActions: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Include user actions</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.auditTrail.activityLogging.includeSystemEvents}
                onChange={(e) => onNestedInputChange("auditTrail", "activityLogging", {
                  ...formData.auditTrail.activityLogging,
                  includeSystemEvents: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Include system events</span>
            </label>
          </div>
        </div>

        {/* Compliance Monitoring */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Compliance Monitoring</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[14px] font-medium text-[#374151] mb-2 block">Check Frequency</label>
              <select
                value={formData.complianceMonitoring.policyCompliance.checkFrequency}
                onChange={(e) => onNestedInputChange("complianceMonitoring", "policyCompliance", {
                  ...formData.complianceMonitoring.policyCompliance,
                  checkFrequency: e.target.value
                })}
                className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              >
                {FREQUENCIES.map(freq => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[14px] font-medium text-[#374151] mb-2 block">Violation Threshold</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.complianceMonitoring.policyCompliance.violationThreshold}
                onChange={(e) => onNestedInputChange("complianceMonitoring", "policyCompliance", {
                  ...formData.complianceMonitoring.policyCompliance,
                  violationThreshold: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.complianceMonitoring.regulatoryTracking.enabled}
                onChange={(e) => onNestedInputChange("complianceMonitoring", "regulatoryTracking", {
                  ...formData.complianceMonitoring.regulatoryTracking,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable regulatory requirement tracking</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.complianceMonitoring.policyCompliance.enabled}
                onChange={(e) => onNestedInputChange("complianceMonitoring", "policyCompliance", {
                  ...formData.complianceMonitoring.policyCompliance,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable policy compliance checking</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.complianceMonitoring.violationReporting.enabled}
                onChange={(e) => onNestedInputChange("complianceMonitoring", "violationReporting", {
                  ...formData.complianceMonitoring.violationReporting,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable violation reporting</span>
            </label>
          </div>
        </div>

        {/* Data Rights Management */}
        <div>
          <h3 className="text-[16px] font-medium mb-4">Data Rights Management</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-[14px] font-medium mb-3">Employee Data Access</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.dataRightsManagement.employeeDataAccess.selfServiceEnabled}
                    onChange={(e) => onNestedInputChange("dataRightsManagement", "employeeDataAccess", {
                      ...formData.dataRightsManagement.employeeDataAccess,
                      selfServiceEnabled: e.target.checked
                    })}
                    className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                  />
                  <span className="text-[14px]">Enable self-service data access</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.dataRightsManagement.employeeDataAccess.dataPortability}
                    onChange={(e) => onNestedInputChange("dataRightsManagement", "employeeDataAccess", {
                      ...formData.dataRightsManagement.employeeDataAccess,
                      dataPortability: e.target.checked
                    })}
                    className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                  />
                  <span className="text-[14px]">Enable data portability</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.dataRightsManagement.employeeDataAccess.accessLogging}
                    onChange={(e) => onNestedInputChange("dataRightsManagement", "employeeDataAccess", {
                      ...formData.dataRightsManagement.employeeDataAccess,
                      accessLogging: e.target.checked
                    })}
                    className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                  />
                  <span className="text-[14px]">Enable access logging</span>
                </label>
              </div>
            </div>
            
            <div>
              <h4 className="text-[14px] font-medium mb-3">Data Correction Workflows</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.dataRightsManagement.dataCorrectionWorkflows.enabled}
                    onChange={(e) => onNestedInputChange("dataRightsManagement", "dataCorrectionWorkflows", {
                      ...formData.dataRightsManagement.dataCorrectionWorkflows,
                      enabled: e.target.checked
                    })}
                    className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                  />
                  <span className="text-[14px]">Enable data correction workflows</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.dataRightsManagement.dataCorrectionWorkflows.approvalRequired}
                    onChange={(e) => onNestedInputChange("dataRightsManagement", "dataCorrectionWorkflows", {
                      ...formData.dataRightsManagement.dataCorrectionWorkflows,
                      approvalRequired: e.target.checked
                    })}
                    className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                  />
                  <span className="text-[14px]">Require approval for corrections</span>
                </label>
              </div>
            </div>
            
            <div>
              <h4 className="text-[14px] font-medium mb-3">Data Deletion Procedures</h4>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.dataRightsManagement.dataDeletionProcedures.enabled}
                    onChange={(e) => onNestedInputChange("dataRightsManagement", "dataDeletionProcedures", {
                      ...formData.dataRightsManagement.dataDeletionProcedures,
                      enabled: e.target.checked
                    })}
                    className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                  />
                  <span className="text-[14px]">Enable data deletion procedures</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.dataRightsManagement.dataDeletionProcedures.secureDeletion}
                    onChange={(e) => onNestedInputChange("dataRightsManagement", "dataDeletionProcedures", {
                      ...formData.dataRightsManagement.dataDeletionProcedures,
                      secureDeletion: e.target.checked
                    })}
                    className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                  />
                  <span className="text-[14px]">Enable secure deletion</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
