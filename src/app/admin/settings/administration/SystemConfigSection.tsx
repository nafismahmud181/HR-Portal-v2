"use client";

import { useState } from "react";

interface AdministrationSettings {
  databaseSettings: {
    backupSchedule: {
      enabled: boolean;
      frequency: string;
      time: string;
      retentionPeriod: number;
    };
    backupVerification: {
      enabled: boolean;
      verificationMethod: string;
    };
  };
  storageSettings: {
    fileUploadLimits: {
      maxFileSize: number;
      allowedFileTypes: string[];
      maxFilesPerUpload: number;
    };
    documentStorage: {
      retentionPeriod: number;
      archiveAfterDays: number;
      compressionEnabled: boolean;
    };
    archiveSettings: {
      enabled: boolean;
      archiveAfterDays: number;
      compressionLevel: string;
    };
  };
  dataImportExport: {
    bulkImportTemplates: Array<{
      name: string;
      type: string;
      fields: string[];
    }>;
    exportFormats: string[];
    migrationTools: {
      enabled: boolean;
      supportedFormats: string[];
    };
  };
  apiConfiguration: {
    apiKeys: Array<{
      name: string;
      key: string;
      permissions: string[];
      expiresAt: string;
    }>;
    rateLimiting: {
      enabled: boolean;
      requestsPerMinute: number;
      burstLimit: number;
    };
    webhooks: Array<{
      name: string;
      url: string;
      events: string[];
      enabled: boolean;
    }>;
  };
  thirdPartyIntegrations: {
    payrollProviders: Array<{
      name: string;
      enabled: boolean;
      apiKey: string;
      webhookUrl: string;
    }>;
    accountingSoftware: Array<{
      name: string;
      enabled: boolean;
      connectionString: string;
      syncFrequency: string;
    }>;
    backgroundCheckServices: Array<{
      name: string;
      enabled: boolean;
      apiKey: string;
      webhookUrl: string;
    }>;
    benefitsPlatforms: Array<{
      name: string;
      enabled: boolean;
      apiKey: string;
      webhookUrl: string;
    }>;
  };
  emailServiceProvider: {
    smtpConfiguration: {
      host: string;
      port: number;
      username: string;
      password: string;
      encryption: string;
    };
    deliverySettings: {
      retryAttempts: number;
      retryDelay: number;
      bounceHandling: boolean;
    };
    bounceHandling: {
      enabled: boolean;
      bounceThreshold: number;
      autoUnsubscribe: boolean;
    };
  };
  [key: string]: unknown;
}

interface SystemConfigSectionProps {
  formData: AdministrationSettings;
  onInputChange: (field: string, value: unknown) => void;
  onNestedInputChange: (parent: string, field: string, value: unknown) => void;
}

const BACKUP_FREQUENCIES = ["hourly", "daily", "weekly", "monthly"];
const COMPRESSION_LEVELS = ["low", "medium", "high"];
const ENCRYPTION_TYPES = ["none", "tls", "ssl"];
const EXPORT_FORMATS = ["csv", "xlsx", "pdf", "json"];
const PAYROLL_PROVIDERS = ["ADP", "Paychex", "Gusto", "BambooHR", "Workday"];
const ACCOUNTING_SOFTWARE = ["QuickBooks", "Xero", "Sage", "FreshBooks", "Wave"];
const BACKGROUND_CHECK_SERVICES = ["Checkr", "GoodHire", "Sterling", "First Advantage"];
const BENEFITS_PLATFORMS = ["Gusto", "Justworks", "TriNet", "ADP TotalSource"];

export default function SystemConfigSection({ formData, onInputChange, onNestedInputChange }: SystemConfigSectionProps) {
  const [newApiKey, setNewApiKey] = useState({
    name: "",
    permissions: [] as string[],
    expiresAt: ""
  });
  const [newWebhook, setNewWebhook] = useState({
    name: "",
    url: "",
    events: [] as string[],
    enabled: true
  });

  const addApiKey = () => {
    if (newApiKey.name.trim()) {
      const updatedKeys = [...formData.apiConfiguration.apiKeys, {
        ...newApiKey,
        key: `api_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }];
      onNestedInputChange("apiConfiguration", "apiKeys", updatedKeys);
      setNewApiKey({ name: "", permissions: [], expiresAt: "" });
    }
  };

  const removeApiKey = (index: number) => {
    const updatedKeys = formData.apiConfiguration.apiKeys.filter((_: unknown, i: number) => i !== index);
    onNestedInputChange("apiConfiguration", "apiKeys", updatedKeys);
  };

  const addWebhook = () => {
    if (newWebhook.name.trim() && newWebhook.url.trim()) {
      const updatedWebhooks = [...formData.apiConfiguration.webhooks, { ...newWebhook }];
      onNestedInputChange("apiConfiguration", "webhooks", updatedWebhooks);
      setNewWebhook({ name: "", url: "", events: [], enabled: true });
    }
  };

  const removeWebhook = (index: number) => {
    const updatedWebhooks = formData.apiConfiguration.webhooks.filter((_: unknown, i: number) => i !== index);
    onNestedInputChange("apiConfiguration", "webhooks", updatedWebhooks);
  };

  return (
    <div className="space-y-8">
      {/* Database & Storage Settings */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <h2 className="text-[20px] font-semibold mb-6">Database & Storage Settings</h2>
        
        {/* Backup Configuration */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Data Backup Configuration</h3>
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.databaseSettings.backupSchedule.enabled}
                onChange={(e) => onNestedInputChange("databaseSettings", "backupSchedule", {
                  ...formData.databaseSettings.backupSchedule,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable automated backups</span>
            </label>
            
            {formData.databaseSettings.backupSchedule.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-[14px] font-medium text-[#374151] mb-2 block">Frequency</label>
                  <select
                    value={formData.databaseSettings.backupSchedule.frequency}
                    onChange={(e) => onNestedInputChange("databaseSettings", "backupSchedule", {
                      ...formData.databaseSettings.backupSchedule,
                      frequency: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  >
                    {BACKUP_FREQUENCIES.map(freq => (
                      <option key={freq} value={freq}>{freq}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[14px] font-medium text-[#374151] mb-2 block">Time</label>
                  <input
                    type="time"
                    value={formData.databaseSettings.backupSchedule.time}
                    onChange={(e) => onNestedInputChange("databaseSettings", "backupSchedule", {
                      ...formData.databaseSettings.backupSchedule,
                      time: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-medium text-[#374151] mb-2 block">Retention (days)</label>
                  <input
                    type="number"
                    min="7"
                    max="365"
                    value={formData.databaseSettings.backupSchedule.retentionPeriod}
                    onChange={(e) => onNestedInputChange("databaseSettings", "backupSchedule", {
                      ...formData.databaseSettings.backupSchedule,
                      retentionPeriod: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Storage Management */}
        <div>
          <h3 className="text-[16px] font-medium mb-4">Storage Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[14px] font-medium text-[#374151] mb-2 block">Max File Size (MB)</label>
              <input
                type="number"
                min="1"
                max="100"
                value={formData.storageSettings.fileUploadLimits.maxFileSize}
                onChange={(e) => onNestedInputChange("storageSettings", "fileUploadLimits", {
                  ...formData.storageSettings.fileUploadLimits,
                  maxFileSize: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-[14px] font-medium text-[#374151] mb-2 block">Max Files Per Upload</label>
              <input
                type="number"
                min="1"
                max="20"
                value={formData.storageSettings.fileUploadLimits.maxFilesPerUpload}
                onChange={(e) => onNestedInputChange("storageSettings", "fileUploadLimits", {
                  ...formData.storageSettings.fileUploadLimits,
                  maxFilesPerUpload: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-[14px] font-medium text-[#374151] mb-2 block">Document Retention (days)</label>
              <input
                type="number"
                min="30"
                max="2555"
                value={formData.storageSettings.documentStorage.retentionPeriod}
                onChange={(e) => onNestedInputChange("storageSettings", "documentStorage", {
                  ...formData.storageSettings.documentStorage,
                  retentionPeriod: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-[14px] font-medium text-[#374151] mb-2 block">Archive After (days)</label>
              <input
                type="number"
                min="90"
                max="2555"
                value={formData.storageSettings.archiveSettings.archiveAfterDays}
                onChange={(e) => onNestedInputChange("storageSettings", "archiveSettings", {
                  ...formData.storageSettings.archiveSettings,
                  archiveAfterDays: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.storageSettings.archiveSettings.enabled}
                onChange={(e) => onNestedInputChange("storageSettings", "archiveSettings", {
                  ...formData.storageSettings.archiveSettings,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable automatic archiving</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.storageSettings.documentStorage.compressionEnabled}
                onChange={(e) => onNestedInputChange("storageSettings", "documentStorage", {
                  ...formData.storageSettings.documentStorage,
                  compressionEnabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable compression</span>
            </label>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <h2 className="text-[20px] font-semibold mb-6">API Configuration</h2>
        
        {/* API Keys */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">API Keys</h3>
          <div className="space-y-4">
            {formData.apiConfiguration.apiKeys.map((key, index) => (
              <div key={index} className="border border-[#e5e7eb] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[14px] font-medium">{key.name}</h4>
                  <button
                    onClick={() => removeApiKey(index)}
                    className="text-red-600 hover:text-red-700 text-[12px]"
                  >
                    Remove
                  </button>
                </div>
                <div className="text-[12px] text-[#6b7280] space-y-1">
                  <div>Key: {key.key}</div>
                  <div>Permissions: {key.permissions.join(", ")}</div>
                  <div>Expires: {key.expiresAt || "Never"}</div>
                </div>
              </div>
            ))}
            
            <div className="border-2 border-dashed border-[#d1d5db] rounded-lg p-4">
              <h4 className="text-[14px] font-medium mb-3">Add New API Key</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Key name"
                  value={newApiKey.name}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                />
                <input
                  type="date"
                  value={newApiKey.expiresAt}
                  onChange={(e) => setNewApiKey(prev => ({ ...prev, expiresAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                />
                <button
                  onClick={addApiKey}
                  className="px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors text-[14px]"
                >
                  Generate API Key
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Rate Limiting */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Rate Limiting</h3>
          <div className="space-y-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.apiConfiguration.rateLimiting.enabled}
                onChange={(e) => onNestedInputChange("apiConfiguration", "rateLimiting", {
                  ...formData.apiConfiguration.rateLimiting,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable rate limiting</span>
            </label>
            
            {formData.apiConfiguration.rateLimiting.enabled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[14px] font-medium text-[#374151] mb-2 block">Requests per minute</label>
                  <input
                    type="number"
                    min="10"
                    max="1000"
                    value={formData.apiConfiguration.rateLimiting.requestsPerMinute}
                    onChange={(e) => onNestedInputChange("apiConfiguration", "rateLimiting", {
                      ...formData.apiConfiguration.rateLimiting,
                      requestsPerMinute: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-medium text-[#374151] mb-2 block">Burst limit</label>
                  <input
                    type="number"
                    min="20"
                    max="2000"
                    value={formData.apiConfiguration.rateLimiting.burstLimit}
                    onChange={(e) => onNestedInputChange("apiConfiguration", "rateLimiting", {
                      ...formData.apiConfiguration.rateLimiting,
                      burstLimit: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Webhooks */}
        <div>
          <h3 className="text-[16px] font-medium mb-4">Webhooks</h3>
          <div className="space-y-4">
            {formData.apiConfiguration.webhooks.map((webhook, index) => (
              <div key={index} className="border border-[#e5e7eb] rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[14px] font-medium">{webhook.name}</h4>
                  <button
                    onClick={() => removeWebhook(index)}
                    className="text-red-600 hover:text-red-700 text-[12px]"
                  >
                    Remove
                  </button>
                </div>
                <div className="text-[12px] text-[#6b7280] space-y-1">
                  <div>URL: {webhook.url}</div>
                  <div>Events: {webhook.events.join(", ")}</div>
                  <div>Status: {webhook.enabled ? "Enabled" : "Disabled"}</div>
                </div>
              </div>
            ))}
            
            <div className="border-2 border-dashed border-[#d1d5db] rounded-lg p-4">
              <h4 className="text-[14px] font-medium mb-3">Add New Webhook</h4>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Webhook name"
                  value={newWebhook.name}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                />
                <input
                  type="url"
                  placeholder="Webhook URL"
                  value={newWebhook.url}
                  onChange={(e) => setNewWebhook(prev => ({ ...prev, url: e.target.value }))}
                  className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                />
                <button
                  onClick={addWebhook}
                  className="px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors text-[14px]"
                >
                  Add Webhook
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Email Service Provider */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <h2 className="text-[20px] font-semibold mb-6">Email Service Provider</h2>
        
        <div className="space-y-6">
          <h3 className="text-[16px] font-medium">SMTP Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[14px] font-medium text-[#374151] mb-2 block">SMTP Host</label>
              <input
                type="text"
                value={formData.emailServiceProvider.smtpConfiguration.host}
                onChange={(e) => onNestedInputChange("emailServiceProvider", "smtpConfiguration", {
                  ...formData.emailServiceProvider.smtpConfiguration,
                  host: e.target.value
                })}
                className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-[14px] font-medium text-[#374151] mb-2 block">Port</label>
              <input
                type="number"
                value={formData.emailServiceProvider.smtpConfiguration.port}
                onChange={(e) => onNestedInputChange("emailServiceProvider", "smtpConfiguration", {
                  ...formData.emailServiceProvider.smtpConfiguration,
                  port: parseInt(e.target.value)
                })}
                className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-[14px] font-medium text-[#374151] mb-2 block">Username</label>
              <input
                type="text"
                value={formData.emailServiceProvider.smtpConfiguration.username}
                onChange={(e) => onNestedInputChange("emailServiceProvider", "smtpConfiguration", {
                  ...formData.emailServiceProvider.smtpConfiguration,
                  username: e.target.value
                })}
                className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-[14px] font-medium text-[#374151] mb-2 block">Password</label>
              <input
                type="password"
                value={formData.emailServiceProvider.smtpConfiguration.password}
                onChange={(e) => onNestedInputChange("emailServiceProvider", "smtpConfiguration", {
                  ...formData.emailServiceProvider.smtpConfiguration,
                  password: e.target.value
                })}
                className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-[14px] font-medium text-[#374151] mb-2 block">Encryption</label>
              <select
                value={formData.emailServiceProvider.smtpConfiguration.encryption}
                onChange={(e) => onNestedInputChange("emailServiceProvider", "smtpConfiguration", {
                  ...formData.emailServiceProvider.smtpConfiguration,
                  encryption: e.target.value
                })}
                className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
              >
                {ENCRYPTION_TYPES.map(type => (
                  <option key={type} value={type}>{type.toUpperCase()}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-[14px] font-medium">Delivery Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[14px] font-medium text-[#374151] mb-2 block">Retry Attempts</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.emailServiceProvider.deliverySettings.retryAttempts}
                  onChange={(e) => onNestedInputChange("emailServiceProvider", "deliverySettings", {
                    ...formData.emailServiceProvider.deliverySettings,
                    retryAttempts: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                />
              </div>
              <div>
                <label className="text-[14px] font-medium text-[#374151] mb-2 block">Retry Delay (seconds)</label>
                <input
                  type="number"
                  min="60"
                  max="3600"
                  value={formData.emailServiceProvider.deliverySettings.retryDelay}
                  onChange={(e) => onNestedInputChange("emailServiceProvider", "deliverySettings", {
                    ...formData.emailServiceProvider.deliverySettings,
                    retryDelay: parseInt(e.target.value)
                  })}
                  className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                />
              </div>
            </div>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.emailServiceProvider.bounceHandling.enabled}
                onChange={(e) => onNestedInputChange("emailServiceProvider", "bounceHandling", {
                  ...formData.emailServiceProvider.bounceHandling,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable bounce handling</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
