"use client";

import { useState } from "react";

interface WorkflowAutomationSettings {
  approvalWorkflows: {
    leaveRequestWorkflow: {
      enabled: boolean;
      approvalChain: Array<{
        level: number;
        role: string;
        autoApprovalThreshold: number;
        escalationHours: number;
      }>;
      escalationRules: {
        enabled: boolean;
        escalationAfterHours: number;
        notifyManager: boolean;
        notifyHR: boolean;
      };
    };
    expenseApprovalWorkflow: {
      enabled: boolean;
      amountBasedLevels: Array<{
        minAmount: number;
        maxAmount: number;
        approverRole: string;
        autoApproval: boolean;
      }>;
      departmentSpecific: Array<{
        department: string;
        approverRole: string;
        specialRules: string;
      }>;
    };
    documentApprovalWorkflow: {
      enabled: boolean;
      reviewChain: Array<{
        documentType: string;
        reviewerRole: string;
        required: boolean;
        versionControl: boolean;
      }>;
      versionControl: {
        enabled: boolean;
        maxVersions: number;
        autoArchive: boolean;
      };
    };
  };
  automationRules: {
    employeeLifecycleAutomation: {
      onboardingTasks: {
        enabled: boolean;
        tasks: Array<{
          name: string;
          assignee: string;
          dueDays: number;
          required: boolean;
        }>;
        autoAssign: boolean;
      };
      offboardingWorkflows: {
        enabled: boolean;
        steps: Array<{
          name: string;
          assignee: string;
          dueDays: number;
          required: boolean;
        }>;
        autoTrigger: boolean;
      };
      statusChangeTriggers: {
        enabled: boolean;
        triggers: Array<{
          fromStatus: string;
          toStatus: string;
          actions: string[];
          notifyRoles: string[];
        }>;
      };
    };
    documentGenerationAutomation: {
      automaticCreation: {
        enabled: boolean;
        triggers: Array<{
          event: string;
          documentType: string;
          template: string;
          recipients: string[];
        }>;
      };
      scheduledGeneration: {
        enabled: boolean;
        schedules: Array<{
          name: string;
          documentType: string;
          frequency: string;
          recipients: string[];
        }>;
      };
      bulkProcessing: {
        enabled: boolean;
        batchSize: number;
        processingTime: string;
        retryAttempts: number;
      };
    };
    notificationAutomation: {
      eventBasedNotifications: {
        enabled: boolean;
        events: Array<{
          eventType: string;
          recipients: string[];
          channels: string[];
          template: string;
        }>;
      };
      reminderSchedules: {
        enabled: boolean;
        reminders: Array<{
          name: string;
          frequency: string;
          recipients: string[];
          message: string;
        }>;
      };
      escalationNotifications: {
        enabled: boolean;
        escalationLevels: number;
        notifyChain: string[];
        escalationDelay: number;
      };
    };
  };
  [key: string]: unknown;
}

interface WorkflowAutomationSectionProps {
  formData: WorkflowAutomationSettings;
  onInputChange: (field: string, value: unknown) => void;
  onNestedInputChange: (parent: string, field: string, value: unknown) => void;
}

const ROLES = ["superAdmin", "hrAdmin", "manager", "employee"];
const DEPARTMENTS = ["HR", "Finance", "IT", "Operations", "Sales", "Marketing"];
const DOCUMENT_TYPES = ["Contract", "Policy", "Report", "Certificate", "Invoice"];
const FREQUENCIES = ["daily", "weekly", "monthly", "quarterly"];
const CHANNELS = ["email", "sms", "push", "slack"];
const STATUSES = ["active", "inactive", "pending", "terminated", "on_leave"];

export default function WorkflowAutomationSection({ formData, onInputChange, onNestedInputChange }: WorkflowAutomationSectionProps) {
  const [newApprovalLevel, setNewApprovalLevel] = useState({
    level: 1,
    role: "",
    autoApprovalThreshold: 0,
    escalationHours: 24
  });
  const [newAmountLevel, setNewAmountLevel] = useState({
    minAmount: 0,
    maxAmount: 1000,
    approverRole: "",
    autoApproval: false
  });
  const [newOnboardingTask, setNewOnboardingTask] = useState({
    name: "",
    assignee: "",
    dueDays: 7,
    required: true
  });

  const addApprovalLevel = () => {
    if (newApprovalLevel.role) {
      const updatedChain = [...formData.approvalWorkflows.leaveRequestWorkflow.approvalChain, { ...newApprovalLevel }];
      onNestedInputChange("approvalWorkflows", "leaveRequestWorkflow", {
        ...formData.approvalWorkflows.leaveRequestWorkflow,
        approvalChain: updatedChain
      });
      setNewApprovalLevel({ level: 1, role: "", autoApprovalThreshold: 0, escalationHours: 24 });
    }
  };

  const removeApprovalLevel = (index: number) => {
    const updatedChain = formData.approvalWorkflows.leaveRequestWorkflow.approvalChain.filter((_: unknown, i: number) => i !== index);
    onNestedInputChange("approvalWorkflows", "leaveRequestWorkflow", {
      ...formData.approvalWorkflows.leaveRequestWorkflow,
      approvalChain: updatedChain
    });
  };

  const addAmountLevel = () => {
    if (newAmountLevel.approverRole) {
      const updatedLevels = [...formData.approvalWorkflows.expenseApprovalWorkflow.amountBasedLevels, { ...newAmountLevel }];
      onNestedInputChange("approvalWorkflows", "expenseApprovalWorkflow", {
        ...formData.approvalWorkflows.expenseApprovalWorkflow,
        amountBasedLevels: updatedLevels
      });
      setNewAmountLevel({ minAmount: 0, maxAmount: 1000, approverRole: "", autoApproval: false });
    }
  };

  const removeAmountLevel = (index: number) => {
    const updatedLevels = formData.approvalWorkflows.expenseApprovalWorkflow.amountBasedLevels.filter((_: unknown, i: number) => i !== index);
    onNestedInputChange("approvalWorkflows", "expenseApprovalWorkflow", {
      ...formData.approvalWorkflows.expenseApprovalWorkflow,
      amountBasedLevels: updatedLevels
    });
  };

  const addOnboardingTask = () => {
    if (newOnboardingTask.name.trim()) {
      const updatedTasks = [...formData.automationRules.employeeLifecycleAutomation.onboardingTasks.tasks, { ...newOnboardingTask }];
      onNestedInputChange("automationRules", "employeeLifecycleAutomation", {
        ...formData.automationRules.employeeLifecycleAutomation,
        onboardingTasks: {
          ...formData.automationRules.employeeLifecycleAutomation.onboardingTasks,
          tasks: updatedTasks
        }
      });
      setNewOnboardingTask({ name: "", assignee: "", dueDays: 7, required: true });
    }
  };

  const removeOnboardingTask = (index: number) => {
    const updatedTasks = formData.automationRules.employeeLifecycleAutomation.onboardingTasks.tasks.filter((_: unknown, i: number) => i !== index);
    onNestedInputChange("automationRules", "employeeLifecycleAutomation", {
      ...formData.automationRules.employeeLifecycleAutomation,
      onboardingTasks: {
        ...formData.automationRules.employeeLifecycleAutomation.onboardingTasks,
        tasks: updatedTasks
      }
    });
  };

  return (
    <div className="space-y-8">
      {/* Approval Workflows */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <h2 className="text-[20px] font-semibold mb-6">Approval Workflows</h2>
        
        {/* Leave Request Workflow */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-medium">Leave Request Workflow</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.approvalWorkflows.leaveRequestWorkflow.enabled}
                onChange={(e) => onNestedInputChange("approvalWorkflows", "leaveRequestWorkflow", {
                  ...formData.approvalWorkflows.leaveRequestWorkflow,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable leave request workflow</span>
            </label>
          </div>
          
          {formData.approvalWorkflows.leaveRequestWorkflow.enabled && (
            <div className="space-y-4">
              <div>
                <h4 className="text-[14px] font-medium mb-3">Approval Chain</h4>
                <div className="space-y-3">
                  {formData.approvalWorkflows.leaveRequestWorkflow.approvalChain.map((level, index) => (
                    <div key={index} className="border border-[#e5e7eb] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-[12px] font-medium">Level {level.level}</h5>
                        <button
                          onClick={() => removeApprovalLevel(index)}
                          className="text-red-600 hover:text-red-700 text-[10px]"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#6b7280]">
                        <div>Role: {level.role}</div>
                        <div>Auto-approval: {level.autoApprovalThreshold} days</div>
                        <div>Escalation: {level.escalationHours}h</div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-2 border-dashed border-[#d1d5db] rounded-lg p-4">
                    <h5 className="text-[12px] font-medium mb-3">Add Approval Level</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-medium text-[#374151] mb-1 block">Level</label>
                        <input
                          type="number"
                          min="1"
                          value={newApprovalLevel.level}
                          onChange={(e) => setNewApprovalLevel(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                          className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[#374151] mb-1 block">Role</label>
                        <select
                          value={newApprovalLevel.role}
                          onChange={(e) => setNewApprovalLevel(prev => ({ ...prev, role: e.target.value }))}
                          className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                        >
                          <option value="">Select role</option>
                          {ROLES.map(role => (
                            <option key={role} value={role}>{role.replace(/([A-Z])/g, ' $1').trim()}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[#374151] mb-1 block">Auto-approval (days)</label>
                        <input
                          type="number"
                          min="0"
                          value={newApprovalLevel.autoApprovalThreshold}
                          onChange={(e) => setNewApprovalLevel(prev => ({ ...prev, autoApprovalThreshold: parseInt(e.target.value) }))}
                          className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[#374151] mb-1 block">Escalation (hours)</label>
                        <input
                          type="number"
                          min="1"
                          value={newApprovalLevel.escalationHours}
                          onChange={(e) => setNewApprovalLevel(prev => ({ ...prev, escalationHours: parseInt(e.target.value) }))}
                          className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                        />
                      </div>
                    </div>
                    <button
                      onClick={addApprovalLevel}
                      className="mt-3 px-3 py-1 bg-[#f97316] text-white rounded text-[11px] hover:bg-[#ea580c]"
                    >
                      Add Level
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-[14px] font-medium mb-3">Escalation Rules</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.approvalWorkflows.leaveRequestWorkflow.escalationRules.enabled}
                      onChange={(e) => onNestedInputChange("approvalWorkflows", "leaveRequestWorkflow", {
                        ...formData.approvalWorkflows.leaveRequestWorkflow,
                        escalationRules: {
                          ...formData.approvalWorkflows.leaveRequestWorkflow.escalationRules,
                          enabled: e.target.checked
                        }
                      })}
                      className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                    />
                    <span className="text-[14px]">Enable escalation rules</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[14px] font-medium text-[#374151] mb-2 block">Escalation After (hours)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.approvalWorkflows.leaveRequestWorkflow.escalationRules.escalationAfterHours}
                        onChange={(e) => onNestedInputChange("approvalWorkflows", "leaveRequestWorkflow", {
                          ...formData.approvalWorkflows.leaveRequestWorkflow,
                          escalationRules: {
                            ...formData.approvalWorkflows.leaveRequestWorkflow.escalationRules,
                            escalationAfterHours: parseInt(e.target.value)
                          }
                        })}
                        className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.approvalWorkflows.leaveRequestWorkflow.escalationRules.notifyManager}
                        onChange={(e) => onNestedInputChange("approvalWorkflows", "leaveRequestWorkflow", {
                          ...formData.approvalWorkflows.leaveRequestWorkflow,
                          escalationRules: {
                            ...formData.approvalWorkflows.leaveRequestWorkflow.escalationRules,
                            notifyManager: e.target.checked
                          }
                        })}
                        className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                      />
                      <span className="text-[14px]">Notify manager on escalation</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.approvalWorkflows.leaveRequestWorkflow.escalationRules.notifyHR}
                        onChange={(e) => onNestedInputChange("approvalWorkflows", "leaveRequestWorkflow", {
                          ...formData.approvalWorkflows.leaveRequestWorkflow,
                          escalationRules: {
                            ...formData.approvalWorkflows.leaveRequestWorkflow.escalationRules,
                            notifyHR: e.target.checked
                          }
                        })}
                        className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                      />
                      <span className="text-[14px]">Notify HR on escalation</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Expense Approval Workflow */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-medium">Expense Approval Workflow</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.approvalWorkflows.expenseApprovalWorkflow.enabled}
                onChange={(e) => onNestedInputChange("approvalWorkflows", "expenseApprovalWorkflow", {
                  ...formData.approvalWorkflows.expenseApprovalWorkflow,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable expense approval workflow</span>
            </label>
          </div>
          
          {formData.approvalWorkflows.expenseApprovalWorkflow.enabled && (
            <div>
              <h4 className="text-[14px] font-medium mb-3">Amount-Based Approval Levels</h4>
              <div className="space-y-3">
                {formData.approvalWorkflows.expenseApprovalWorkflow.amountBasedLevels.map((level, index) => (
                  <div key={index} className="border border-[#e5e7eb] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-[12px] font-medium">Level {index + 1}</h5>
                      <button
                        onClick={() => removeAmountLevel(index)}
                        className="text-red-600 hover:text-red-700 text-[10px]"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#6b7280]">
                      <div>Amount: ${level.minAmount} - ${level.maxAmount}</div>
                      <div>Approver: {level.approverRole}</div>
                      <div>Auto-approval: {level.autoApproval ? "Yes" : "No"}</div>
                    </div>
                  </div>
                ))}
                
                <div className="border-2 border-dashed border-[#d1d5db] rounded-lg p-4">
                  <h5 className="text-[12px] font-medium mb-3">Add Amount Level</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-[#374151] mb-1 block">Min Amount ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={newAmountLevel.minAmount}
                        onChange={(e) => setNewAmountLevel(prev => ({ ...prev, minAmount: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-[#374151] mb-1 block">Max Amount ($)</label>
                      <input
                        type="number"
                        min="0"
                        value={newAmountLevel.maxAmount}
                        onChange={(e) => setNewAmountLevel(prev => ({ ...prev, maxAmount: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-[#374151] mb-1 block">Approver Role</label>
                      <select
                        value={newAmountLevel.approverRole}
                        onChange={(e) => setNewAmountLevel(prev => ({ ...prev, approverRole: e.target.value }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      >
                        <option value="">Select role</option>
                        {ROLES.map(role => (
                          <option key={role} value={role}>{role.replace(/([A-Z])/g, ' $1').trim()}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newAmountLevel.autoApproval}
                          onChange={(e) => setNewAmountLevel(prev => ({ ...prev, autoApproval: e.target.checked }))}
                          className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                        />
                        <span className="text-[10px]">Auto-approval</span>
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={addAmountLevel}
                    className="mt-3 px-3 py-1 bg-[#f97316] text-white rounded text-[11px] hover:bg-[#ea580c]"
                  >
                    Add Level
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Document Approval Workflow */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-medium">Document Approval Workflow</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.approvalWorkflows.documentApprovalWorkflow.enabled}
                onChange={(e) => onNestedInputChange("approvalWorkflows", "documentApprovalWorkflow", {
                  ...formData.approvalWorkflows.documentApprovalWorkflow,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable document approval workflow</span>
            </label>
          </div>
          
          {formData.approvalWorkflows.documentApprovalWorkflow.enabled && (
            <div className="space-y-4">
              <div>
                <h4 className="text-[14px] font-medium mb-3">Version Control</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.approvalWorkflows.documentApprovalWorkflow.versionControl.enabled}
                      onChange={(e) => onNestedInputChange("approvalWorkflows", "documentApprovalWorkflow", {
                        ...formData.approvalWorkflows.documentApprovalWorkflow,
                        versionControl: {
                          ...formData.approvalWorkflows.documentApprovalWorkflow.versionControl,
                          enabled: e.target.checked
                        }
                      })}
                      className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                    />
                    <span className="text-[14px]">Enable version control</span>
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[14px] font-medium text-[#374151] mb-2 block">Max Versions</label>
                      <input
                        type="number"
                        min="1"
                        max="50"
                        value={formData.approvalWorkflows.documentApprovalWorkflow.versionControl.maxVersions}
                        onChange={(e) => onNestedInputChange("approvalWorkflows", "documentApprovalWorkflow", {
                          ...formData.approvalWorkflows.documentApprovalWorkflow,
                          versionControl: {
                            ...formData.approvalWorkflows.documentApprovalWorkflow.versionControl,
                            maxVersions: parseInt(e.target.value)
                          }
                        })}
                        className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                      />
                    </div>
                  </div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.approvalWorkflows.documentApprovalWorkflow.versionControl.autoArchive}
                      onChange={(e) => onNestedInputChange("approvalWorkflows", "documentApprovalWorkflow", {
                        ...formData.approvalWorkflows.documentApprovalWorkflow,
                        versionControl: {
                          ...formData.approvalWorkflows.documentApprovalWorkflow.versionControl,
                          autoArchive: e.target.checked
                        }
                      })}
                      className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                    />
                    <span className="text-[14px]">Auto-archive old versions</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Automation Rules */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <h2 className="text-[20px] font-semibold mb-6">Automation Rules</h2>
        
        {/* Employee Lifecycle Automation */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Employee Lifecycle Automation</h3>
          
          {/* Onboarding Tasks */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[14px] font-medium">Onboarding Task Automation</h4>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.automationRules.employeeLifecycleAutomation.onboardingTasks.enabled}
                  onChange={(e) => onNestedInputChange("automationRules", "employeeLifecycleAutomation", {
                    ...formData.automationRules.employeeLifecycleAutomation,
                    onboardingTasks: {
                      ...formData.automationRules.employeeLifecycleAutomation.onboardingTasks,
                      enabled: e.target.checked
                    }
                  })}
                  className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-[14px]">Enable onboarding automation</span>
              </label>
            </div>
            
            {formData.automationRules.employeeLifecycleAutomation.onboardingTasks.enabled && (
              <div className="space-y-3">
                {formData.automationRules.employeeLifecycleAutomation.onboardingTasks.tasks.map((task, index) => (
                  <div key={index} className="border border-[#e5e7eb] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="text-[12px] font-medium">{task.name}</h5>
                      <button
                        onClick={() => removeOnboardingTask(index)}
                        className="text-red-600 hover:text-red-700 text-[10px]"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#6b7280]">
                      <div>Assignee: {task.assignee}</div>
                      <div>Due: {task.dueDays} days</div>
                      <div>Required: {task.required ? "Yes" : "No"}</div>
                    </div>
                  </div>
                ))}
                
                <div className="border-2 border-dashed border-[#d1d5db] rounded-lg p-4">
                  <h5 className="text-[12px] font-medium mb-3">Add Onboarding Task</h5>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-medium text-[#374151] mb-1 block">Task Name</label>
                      <input
                        type="text"
                        value={newOnboardingTask.name}
                        onChange={(e) => setNewOnboardingTask(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-[#374151] mb-1 block">Assignee</label>
                      <select
                        value={newOnboardingTask.assignee}
                        onChange={(e) => setNewOnboardingTask(prev => ({ ...prev, assignee: e.target.value }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      >
                        <option value="">Select assignee</option>
                        {ROLES.map(role => (
                          <option key={role} value={role}>{role.replace(/([A-Z])/g, ' $1').trim()}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-medium text-[#374151] mb-1 block">Due Days</label>
                      <input
                        type="number"
                        min="1"
                        value={newOnboardingTask.dueDays}
                        onChange={(e) => setNewOnboardingTask(prev => ({ ...prev, dueDays: parseInt(e.target.value) }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      />
                    </div>
                    <div className="flex items-center">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newOnboardingTask.required}
                          onChange={(e) => setNewOnboardingTask(prev => ({ ...prev, required: e.target.checked }))}
                          className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                        />
                        <span className="text-[10px]">Required</span>
                      </label>
                    </div>
                  </div>
                  <button
                    onClick={addOnboardingTask}
                    className="mt-3 px-3 py-1 bg-[#f97316] text-white rounded text-[11px] hover:bg-[#ea580c]"
                  >
                    Add Task
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Status Change Triggers */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[14px] font-medium">Status Change Triggers</h4>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.automationRules.employeeLifecycleAutomation.statusChangeTriggers.enabled}
                  onChange={(e) => onNestedInputChange("automationRules", "employeeLifecycleAutomation", {
                    ...formData.automationRules.employeeLifecycleAutomation,
                    statusChangeTriggers: {
                      ...formData.automationRules.employeeLifecycleAutomation.statusChangeTriggers,
                      enabled: e.target.checked
                    }
                  })}
                  className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-[14px]">Enable status change triggers</span>
              </label>
            </div>
          </div>
        </div>

        {/* Document Generation Automation */}
        <div className="mb-8">
          <h3 className="text-[16px] font-medium mb-4">Document Generation Automation</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-medium">Automatic Document Creation</h4>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.automationRules.documentGenerationAutomation.automaticCreation.enabled}
                  onChange={(e) => onNestedInputChange("automationRules", "documentGenerationAutomation", {
                    ...formData.automationRules.documentGenerationAutomation,
                    automaticCreation: {
                      ...formData.automationRules.documentGenerationAutomation.automaticCreation,
                      enabled: e.target.checked
                    }
                  })}
                  className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-[14px]">Enable automatic creation</span>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-medium">Scheduled Document Generation</h4>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.automationRules.documentGenerationAutomation.scheduledGeneration.enabled}
                  onChange={(e) => onNestedInputChange("automationRules", "documentGenerationAutomation", {
                    ...formData.automationRules.documentGenerationAutomation,
                    scheduledGeneration: {
                      ...formData.automationRules.documentGenerationAutomation.scheduledGeneration,
                      enabled: e.target.checked
                    }
                  })}
                  className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-[14px]">Enable scheduled generation</span>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-medium">Bulk Processing</h4>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.automationRules.documentGenerationAutomation.bulkProcessing.enabled}
                  onChange={(e) => onNestedInputChange("automationRules", "documentGenerationAutomation", {
                    ...formData.automationRules.documentGenerationAutomation,
                    bulkProcessing: {
                      ...formData.automationRules.documentGenerationAutomation.bulkProcessing,
                      enabled: e.target.checked
                    }
                  })}
                  className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-[14px]">Enable bulk processing</span>
              </label>
            </div>
          </div>
        </div>

        {/* Notification Automation */}
        <div>
          <h3 className="text-[16px] font-medium mb-4">Notification Automation</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-medium">Event-Based Notifications</h4>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.automationRules.notificationAutomation.eventBasedNotifications.enabled}
                  onChange={(e) => onNestedInputChange("automationRules", "notificationAutomation", {
                    ...formData.automationRules.notificationAutomation,
                    eventBasedNotifications: {
                      ...formData.automationRules.notificationAutomation.eventBasedNotifications,
                      enabled: e.target.checked
                    }
                  })}
                  className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-[14px]">Enable event-based notifications</span>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-medium">Reminder Schedules</h4>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.automationRules.notificationAutomation.reminderSchedules.enabled}
                  onChange={(e) => onNestedInputChange("automationRules", "notificationAutomation", {
                    ...formData.automationRules.notificationAutomation,
                    reminderSchedules: {
                      ...formData.automationRules.notificationAutomation.reminderSchedules,
                      enabled: e.target.checked
                    }
                  })}
                  className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-[14px]">Enable reminder schedules</span>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <h4 className="text-[14px] font-medium">Escalation Notifications</h4>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.automationRules.notificationAutomation.escalationNotifications.enabled}
                  onChange={(e) => onNestedInputChange("automationRules", "notificationAutomation", {
                    ...formData.automationRules.notificationAutomation,
                    escalationNotifications: {
                      ...formData.automationRules.notificationAutomation.escalationNotifications,
                      enabled: e.target.checked
                    }
                  })}
                  className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                />
                <span className="text-[14px]">Enable escalation notifications</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
