"use client";

import { useState } from "react";

interface AnalyticsReportingSettings {
  reportConfiguration: {
    standardReports: {
      enabled: boolean;
      reports: Array<{
        id: string;
        name: string;
        type: string;
        schedule: string;
        recipients: string[];
        format: string;
        autoGenerate: boolean;
      }>;
      defaultFormats: string[];
      recipientGroups: Array<{
        name: string;
        members: string[];
        emailList: string[];
      }>;
    };
    customReports: {
      enabled: boolean;
      reportBuilder: {
        enabled: boolean;
        dataSources: string[];
        maxFields: number;
        allowedVisualizations: string[];
      };
      dataSourceConnections: Array<{
        name: string;
        type: string;
        connectionString: string;
        enabled: boolean;
        refreshInterval: number;
      }>;
      visualizationOptions: {
        chartTypes: string[];
        colorSchemes: string[];
        exportFormats: string[];
      };
    };
    dashboardConfiguration: {
      enabled: boolean;
      widgets: Array<{
        id: string;
        name: string;
        type: string;
        position: { x: number; y: number };
        size: { width: number; height: number };
        refreshInterval: number;
        visible: boolean;
      }>;
      roleBasedDashboards: Array<{
        role: string;
        widgets: string[];
        layout: string;
        permissions: string[];
      }>;
      refreshIntervals: {
        default: number;
        realTime: boolean;
        maxInterval: number;
      };
    };
  };
  dataAnalytics: {
    performanceMetrics: {
      enabled: boolean;
      kpiDefinitions: Array<{
        id: string;
        name: string;
        category: string;
        calculation: string;
        target: number;
        unit: string;
        frequency: string;
      }>;
      benchmarkSettings: {
        enabled: boolean;
        industryBenchmarks: Array<{
          industry: string;
          metrics: Array<{
            metric: string;
            value: number;
            percentile: number;
          }>;
        }>;
        internalBenchmarks: Array<{
          period: string;
          metrics: Array<{
            metric: string;
            value: number;
            trend: string;
          }>;
        }>;
      };
      trendAnalysis: {
        enabled: boolean;
        timePeriods: string[];
        analysisTypes: string[];
        alertThresholds: Array<{
          metric: string;
          threshold: number;
          direction: string;
        }>;
      };
    };
    complianceReporting: {
      enabled: boolean;
      regulatoryReports: Array<{
        id: string;
        name: string;
        jurisdiction: string;
        format: string;
        schedule: string;
        requirements: string[];
        autoGenerate: boolean;
      }>;
      submissionSchedules: Array<{
        reportId: string;
        frequency: string;
        dueDate: string;
        recipients: string[];
        reminders: Array<{
          daysBefore: number;
          recipients: string[];
        }>;
      }>;
      auditPreparation: {
        enabled: boolean;
        auditTrails: Array<{
          name: string;
          dataTypes: string[];
          retentionPeriod: number;
          accessLogging: boolean;
        }>;
        complianceChecks: Array<{
          name: string;
          checkType: string;
          frequency: string;
          alertOnFailure: boolean;
        }>;
      };
    };
  };
  [key: string]: unknown;
}

interface AnalyticsReportingSectionProps {
  formData: AnalyticsReportingSettings;
  onInputChange: (field: string, value: unknown) => void;
  onNestedInputChange: (parent: string, field: string, value: unknown) => void;
}

const REPORT_TYPES = ["Employee Report", "Payroll Report", "Performance Report", "Attendance Report", "Compliance Report"];
const SCHEDULES = ["daily", "weekly", "monthly", "quarterly", "annually"];
const FORMATS = ["PDF", "Excel", "CSV", "JSON"];
const VISUALIZATIONS = ["Bar Chart", "Line Chart", "Pie Chart", "Table", "Gauge", "Heatmap"];
const CHART_TYPES = ["Bar", "Line", "Pie", "Area", "Scatter", "Gauge"];
const COLOR_SCHEMES = ["Default", "Corporate", "High Contrast", "Colorblind Friendly"];
const DATA_SOURCES = ["Employee Database", "Payroll System", "Time Tracking", "Performance System", "External API"];
const KPI_CATEGORIES = ["HR Metrics", "Performance", "Compliance", "Financial", "Operational"];
const FREQUENCIES = ["daily", "weekly", "monthly", "quarterly"];
const JURISDICTIONS = ["US", "EU", "UK", "CA", "AU"];

export default function AnalyticsReportingSection({ formData, onInputChange, onNestedInputChange }: AnalyticsReportingSectionProps) {
  const [newStandardReport, setNewStandardReport] = useState({
    name: "",
    type: "",
    schedule: "",
    recipients: [] as string[],
    format: "PDF",
    autoGenerate: true
  });
  const [newKPI, setNewKPI] = useState({
    name: "",
    category: "",
    calculation: "",
    target: 0,
    unit: "",
    frequency: "monthly"
  });
  const [newRegulatoryReport, setNewRegulatoryReport] = useState({
    name: "",
    jurisdiction: "",
    format: "PDF",
    schedule: "monthly",
    requirements: [] as string[],
    autoGenerate: true
  });

  const addStandardReport = () => {
    if (newStandardReport.name.trim() && newStandardReport.type) {
      const updatedReports = [...formData.reportConfiguration.standardReports.reports, {
        id: Date.now().toString(),
        ...newStandardReport
      }];
      onNestedInputChange("reportConfiguration", "standardReports", {
        ...formData.reportConfiguration.standardReports,
        reports: updatedReports
      });
      setNewStandardReport({
        name: "",
        type: "",
        schedule: "",
        recipients: [],
        format: "PDF",
        autoGenerate: true
      });
    }
  };

  const removeStandardReport = (id: string) => {
    const updatedReports = formData.reportConfiguration.standardReports.reports.filter((report: { id: string }) => report.id !== id);
    onNestedInputChange("reportConfiguration", "standardReports", {
      ...formData.reportConfiguration.standardReports,
      reports: updatedReports
    });
  };

  const addKPI = () => {
    if (newKPI.name.trim() && newKPI.category) {
      const updatedKPIs = [...formData.dataAnalytics.performanceMetrics.kpiDefinitions, {
        id: Date.now().toString(),
        ...newKPI
      }];
      onNestedInputChange("dataAnalytics", "performanceMetrics", {
        ...formData.dataAnalytics.performanceMetrics,
        kpiDefinitions: updatedKPIs
      });
      setNewKPI({
        name: "",
        category: "",
        calculation: "",
        target: 0,
        unit: "",
        frequency: "monthly"
      });
    }
  };

  const removeKPI = (id: string) => {
    const updatedKPIs = formData.dataAnalytics.performanceMetrics.kpiDefinitions.filter((kpi: { id: string }) => kpi.id !== id);
    onNestedInputChange("dataAnalytics", "performanceMetrics", {
      ...formData.dataAnalytics.performanceMetrics,
      kpiDefinitions: updatedKPIs
    });
  };

  const addRegulatoryReport = () => {
    if (newRegulatoryReport.name.trim() && newRegulatoryReport.jurisdiction) {
      const updatedReports = [...formData.dataAnalytics.complianceReporting.regulatoryReports, {
        id: Date.now().toString(),
        ...newRegulatoryReport
      }];
      onNestedInputChange("dataAnalytics", "complianceReporting", {
        ...formData.dataAnalytics.complianceReporting,
        regulatoryReports: updatedReports
      });
      setNewRegulatoryReport({
        name: "",
        jurisdiction: "",
        format: "PDF",
        schedule: "monthly",
        requirements: [],
        autoGenerate: true
      });
    }
  };

  const removeRegulatoryReport = (id: string) => {
    const updatedReports = formData.dataAnalytics.complianceReporting.regulatoryReports.filter((report: { id: string }) => report.id !== id);
    onNestedInputChange("dataAnalytics", "complianceReporting", {
      ...formData.dataAnalytics.complianceReporting,
      regulatoryReports: updatedReports
    });
  };

  return (
    <div className="space-y-8">
      {/* Report Configuration */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <h2 className="text-[20px] font-semibold mb-6">Report Configuration</h2>
        
        {/* Standard Reports */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-medium">Standard Reports</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.reportConfiguration.standardReports.enabled}
                onChange={(e) => onNestedInputChange("reportConfiguration", "standardReports", {
                  ...formData.reportConfiguration.standardReports,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable standard reports</span>
            </label>
          </div>
          
          {formData.reportConfiguration.standardReports.enabled && (
            <div className="space-y-4">
              <div className="space-y-3">
                {formData.reportConfiguration.standardReports.reports.map((report) => (
                  <div key={report.id} className="border border-[#e5e7eb] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[14px] font-medium">{report.name}</h4>
                      <button
                        onClick={() => removeStandardReport(report.id)}
                        className="text-red-600 hover:text-red-700 text-[12px]"
                      >
                        Remove
                      </button>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[12px] text-[#6b7280]">
                      <div>Type: {report.type}</div>
                      <div>Schedule: {report.schedule}</div>
                      <div>Format: {report.format}</div>
                      <div>Auto-generate: {report.autoGenerate ? "Yes" : "No"}</div>
                      <div>Recipients: {report.recipients.length}</div>
                    </div>
                  </div>
                ))}
                
                <div className="border-2 border-dashed border-[#d1d5db] rounded-lg p-4">
                  <h4 className="text-[14px] font-medium mb-3">Add Standard Report</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[12px] font-medium text-[#374151] mb-1 block">Report Name</label>
                      <input
                        type="text"
                        value={newStandardReport.name}
                        onChange={(e) => setNewStandardReport(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[12px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-[#374151] mb-1 block">Report Type</label>
                      <select
                        value={newStandardReport.type}
                        onChange={(e) => setNewStandardReport(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[12px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      >
                        <option value="">Select type</option>
                        {REPORT_TYPES.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-[#374151] mb-1 block">Schedule</label>
                      <select
                        value={newStandardReport.schedule}
                        onChange={(e) => setNewStandardReport(prev => ({ ...prev, schedule: e.target.value }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[12px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      >
                        <option value="">Select schedule</option>
                        {SCHEDULES.map(schedule => (
                          <option key={schedule} value={schedule}>{schedule}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] font-medium text-[#374151] mb-1 block">Format</label>
                      <select
                        value={newStandardReport.format}
                        onChange={(e) => setNewStandardReport(prev => ({ ...prev, format: e.target.value }))}
                        className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[12px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                      >
                        {FORMATS.map(format => (
                          <option key={format} value={format}>{format}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center space-x-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={newStandardReport.autoGenerate}
                        onChange={(e) => setNewStandardReport(prev => ({ ...prev, autoGenerate: e.target.checked }))}
                        className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                      />
                      <span className="text-[12px]">Auto-generate</span>
                    </label>
                  </div>
                  <button
                    onClick={addStandardReport}
                    className="mt-3 px-3 py-1 bg-[#f97316] text-white rounded text-[12px] hover:bg-[#ea580c]"
                  >
                    Add Report
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Custom Reports */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-medium">Custom Reports</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.reportConfiguration.customReports.enabled}
                onChange={(e) => onNestedInputChange("reportConfiguration", "customReports", {
                  ...formData.reportConfiguration.customReports,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable custom reports</span>
            </label>
          </div>
          
          {formData.reportConfiguration.customReports.enabled && (
            <div className="space-y-4">
              <div>
                <h4 className="text-[14px] font-medium mb-3">Report Builder Settings</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[14px] font-medium text-[#374151] mb-2 block">Max Fields per Report</label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={formData.reportConfiguration.customReports.reportBuilder.maxFields}
                      onChange={(e) => onNestedInputChange("reportConfiguration", "customReports", {
                        ...formData.reportConfiguration.customReports,
                        reportBuilder: {
                          ...formData.reportConfiguration.customReports.reportBuilder,
                          maxFields: parseInt(e.target.value)
                        }
                      })}
                      className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="mt-4">
                  <h5 className="text-[12px] font-medium text-[#374151] mb-2">Available Data Sources</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {DATA_SOURCES.map(source => (
                      <label key={source} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.reportConfiguration.customReports.reportBuilder.dataSources.includes(source)}
                          onChange={(e) => {
                            const currentSources = formData.reportConfiguration.customReports.reportBuilder.dataSources;
                            const updatedSources = e.target.checked
                              ? [...currentSources, source]
                              : currentSources.filter(s => s !== source);
                            onNestedInputChange("reportConfiguration", "customReports", {
                              ...formData.reportConfiguration.customReports,
                              reportBuilder: {
                                ...formData.reportConfiguration.customReports.reportBuilder,
                                dataSources: updatedSources
                              }
                            });
                          }}
                          className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                        />
                        <span className="text-[12px]">{source}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4">
                  <h5 className="text-[12px] font-medium text-[#374151] mb-2">Allowed Visualizations</h5>
                  <div className="grid grid-cols-2 gap-2">
                    {VISUALIZATIONS.map(viz => (
                      <label key={viz} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.reportConfiguration.customReports.reportBuilder.allowedVisualizations.includes(viz)}
                          onChange={(e) => {
                            const currentViz = formData.reportConfiguration.customReports.reportBuilder.allowedVisualizations;
                            const updatedViz = e.target.checked
                              ? [...currentViz, viz]
                              : currentViz.filter(v => v !== viz);
                            onNestedInputChange("reportConfiguration", "customReports", {
                              ...formData.reportConfiguration.customReports,
                              reportBuilder: {
                                ...formData.reportConfiguration.customReports.reportBuilder,
                                allowedVisualizations: updatedViz
                              }
                            });
                          }}
                          className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                        />
                        <span className="text-[12px]">{viz}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Dashboard Configuration */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-medium">Dashboard Configuration</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.reportConfiguration.dashboardConfiguration.enabled}
                onChange={(e) => onNestedInputChange("reportConfiguration", "dashboardConfiguration", {
                  ...formData.reportConfiguration.dashboardConfiguration,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable dashboard configuration</span>
            </label>
          </div>
          
          {formData.reportConfiguration.dashboardConfiguration.enabled && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-[14px] font-medium text-[#374151] mb-2 block">Default Refresh Interval (minutes)</label>
                  <input
                    type="number"
                    min="1"
                    max="1440"
                    value={formData.reportConfiguration.dashboardConfiguration.refreshIntervals.default}
                    onChange={(e) => onNestedInputChange("reportConfiguration", "dashboardConfiguration", {
                      ...formData.reportConfiguration.dashboardConfiguration,
                      refreshIntervals: {
                        ...formData.reportConfiguration.dashboardConfiguration.refreshIntervals,
                        default: parseInt(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="text-[14px] font-medium text-[#374151] mb-2 block">Max Refresh Interval (minutes)</label>
                  <input
                    type="number"
                    min="5"
                    max="1440"
                    value={formData.reportConfiguration.dashboardConfiguration.refreshIntervals.maxInterval}
                    onChange={(e) => onNestedInputChange("reportConfiguration", "dashboardConfiguration", {
                      ...formData.reportConfiguration.dashboardConfiguration,
                      refreshIntervals: {
                        ...formData.reportConfiguration.dashboardConfiguration.refreshIntervals,
                        maxInterval: parseInt(e.target.value)
                      }
                    })}
                    className="w-full px-3 py-2 border border-[#d1d5db] rounded-lg text-[14px] focus:ring-2 focus:ring-[#f97316] focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.reportConfiguration.dashboardConfiguration.refreshIntervals.realTime}
                    onChange={(e) => onNestedInputChange("reportConfiguration", "dashboardConfiguration", {
                      ...formData.reportConfiguration.dashboardConfiguration,
                      refreshIntervals: {
                        ...formData.reportConfiguration.dashboardConfiguration.refreshIntervals,
                        realTime: e.target.checked
                      }
                    })}
                    className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                  />
                  <span className="text-[14px]">Enable real-time updates</span>
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Analytics */}
      <div className="bg-white border border-[#e5e7eb] rounded-lg p-6">
        <h2 className="text-[20px] font-semibold mb-6">Data Analytics</h2>
        
        {/* Performance Metrics */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-medium">Performance Metrics</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.dataAnalytics.performanceMetrics.enabled}
                onChange={(e) => onNestedInputChange("dataAnalytics", "performanceMetrics", {
                  ...formData.dataAnalytics.performanceMetrics,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable performance metrics</span>
            </label>
          </div>
          
          {formData.dataAnalytics.performanceMetrics.enabled && (
            <div className="space-y-4">
              <div>
                <h4 className="text-[14px] font-medium mb-3">KPI Definitions</h4>
                <div className="space-y-3">
                  {formData.dataAnalytics.performanceMetrics.kpiDefinitions.map((kpi) => (
                    <div key={kpi.id} className="border border-[#e5e7eb] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-[12px] font-medium">{kpi.name}</h5>
                        <button
                          onClick={() => removeKPI(kpi.id)}
                          className="text-red-600 hover:text-red-700 text-[10px]"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#6b7280]">
                        <div>Category: {kpi.category}</div>
                        <div>Target: {kpi.target} {kpi.unit}</div>
                        <div>Frequency: {kpi.frequency}</div>
                        <div>Calculation: {kpi.calculation}</div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-2 border-dashed border-[#d1d5db] rounded-lg p-4">
                    <h5 className="text-[12px] font-medium mb-3">Add KPI Definition</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-medium text-[#374151] mb-1 block">KPI Name</label>
                        <input
                          type="text"
                          value={newKPI.name}
                          onChange={(e) => setNewKPI(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[#374151] mb-1 block">Category</label>
                        <select
                          value={newKPI.category}
                          onChange={(e) => setNewKPI(prev => ({ ...prev, category: e.target.value }))}
                          className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                        >
                          <option value="">Select category</option>
                          {KPI_CATEGORIES.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[#374151] mb-1 block">Target Value</label>
                        <input
                          type="number"
                          value={newKPI.target}
                          onChange={(e) => setNewKPI(prev => ({ ...prev, target: parseInt(e.target.value) }))}
                          className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[#374151] mb-1 block">Unit</label>
                        <input
                          type="text"
                          value={newKPI.unit}
                          onChange={(e) => setNewKPI(prev => ({ ...prev, unit: e.target.value }))}
                          className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[#374151] mb-1 block">Frequency</label>
                        <select
                          value={newKPI.frequency}
                          onChange={(e) => setNewKPI(prev => ({ ...prev, frequency: e.target.value }))}
                          className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                        >
                          {FREQUENCIES.map(freq => (
                            <option key={freq} value={freq}>{freq}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[#374151] mb-1 block">Calculation</label>
                        <input
                          type="text"
                          value={newKPI.calculation}
                          onChange={(e) => setNewKPI(prev => ({ ...prev, calculation: e.target.value }))}
                          className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                        />
                      </div>
                    </div>
                    <button
                      onClick={addKPI}
                      className="mt-3 px-3 py-1 bg-[#f97316] text-white rounded text-[11px] hover:bg-[#ea580c]"
                    >
                      Add KPI
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-[14px] font-medium mb-3">Benchmark Settings</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.dataAnalytics.performanceMetrics.benchmarkSettings.enabled}
                      onChange={(e) => onNestedInputChange("dataAnalytics", "performanceMetrics", {
                        ...formData.dataAnalytics.performanceMetrics,
                        benchmarkSettings: {
                          ...formData.dataAnalytics.performanceMetrics.benchmarkSettings,
                          enabled: e.target.checked
                        }
                      })}
                      className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                    />
                    <span className="text-[14px]">Enable benchmark settings</span>
                  </label>
                </div>
              </div>
              
              <div>
                <h4 className="text-[14px] font-medium mb-3">Trend Analysis</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.dataAnalytics.performanceMetrics.trendAnalysis.enabled}
                      onChange={(e) => onNestedInputChange("dataAnalytics", "performanceMetrics", {
                        ...formData.dataAnalytics.performanceMetrics,
                        trendAnalysis: {
                          ...formData.dataAnalytics.performanceMetrics.trendAnalysis,
                          enabled: e.target.checked
                        }
                      })}
                      className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                    />
                    <span className="text-[14px]">Enable trend analysis</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Compliance Reporting */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[16px] font-medium">Compliance Reporting</h3>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.dataAnalytics.complianceReporting.enabled}
                onChange={(e) => onNestedInputChange("dataAnalytics", "complianceReporting", {
                  ...formData.dataAnalytics.complianceReporting,
                  enabled: e.target.checked
                })}
                className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
              />
              <span className="text-[14px]">Enable compliance reporting</span>
            </label>
          </div>
          
          {formData.dataAnalytics.complianceReporting.enabled && (
            <div className="space-y-4">
              <div>
                <h4 className="text-[14px] font-medium mb-3">Regulatory Reports</h4>
                <div className="space-y-3">
                  {formData.dataAnalytics.complianceReporting.regulatoryReports.map((report) => (
                    <div key={report.id} className="border border-[#e5e7eb] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-[12px] font-medium">{report.name}</h5>
                        <button
                          onClick={() => removeRegulatoryReport(report.id)}
                          className="text-red-600 hover:text-red-700 text-[10px]"
                        >
                          Remove
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px] text-[#6b7280]">
                        <div>Jurisdiction: {report.jurisdiction}</div>
                        <div>Format: {report.format}</div>
                        <div>Schedule: {report.schedule}</div>
                        <div>Auto-generate: {report.autoGenerate ? "Yes" : "No"}</div>
                        <div>Requirements: {report.requirements.length}</div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="border-2 border-dashed border-[#d1d5db] rounded-lg p-4">
                    <h5 className="text-[12px] font-medium mb-3">Add Regulatory Report</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-medium text-[#374151] mb-1 block">Report Name</label>
                        <input
                          type="text"
                          value={newRegulatoryReport.name}
                          onChange={(e) => setNewRegulatoryReport(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[#374151] mb-1 block">Jurisdiction</label>
                        <select
                          value={newRegulatoryReport.jurisdiction}
                          onChange={(e) => setNewRegulatoryReport(prev => ({ ...prev, jurisdiction: e.target.value }))}
                          className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                        >
                          <option value="">Select jurisdiction</option>
                          {JURISDICTIONS.map(jurisdiction => (
                            <option key={jurisdiction} value={jurisdiction}>{jurisdiction}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[#374151] mb-1 block">Format</label>
                        <select
                          value={newRegulatoryReport.format}
                          onChange={(e) => setNewRegulatoryReport(prev => ({ ...prev, format: e.target.value }))}
                          className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                        >
                          {FORMATS.map(format => (
                            <option key={format} value={format}>{format}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-medium text-[#374151] mb-1 block">Schedule</label>
                        <select
                          value={newRegulatoryReport.schedule}
                          onChange={(e) => setNewRegulatoryReport(prev => ({ ...prev, schedule: e.target.value }))}
                          className="w-full px-2 py-1 border border-[#d1d5db] rounded text-[11px] focus:ring-1 focus:ring-[#f97316] focus:border-transparent"
                        >
                          {SCHEDULES.map(schedule => (
                            <option key={schedule} value={schedule}>{schedule}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center space-x-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={newRegulatoryReport.autoGenerate}
                          onChange={(e) => setNewRegulatoryReport(prev => ({ ...prev, autoGenerate: e.target.checked }))}
                          className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                        />
                        <span className="text-[12px]">Auto-generate</span>
                      </label>
                    </div>
                    <button
                      onClick={addRegulatoryReport}
                      className="mt-3 px-3 py-1 bg-[#f97316] text-white rounded text-[11px] hover:bg-[#ea580c]"
                    >
                      Add Report
                    </button>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="text-[14px] font-medium mb-3">Audit Preparation</h4>
                <div className="space-y-3">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.dataAnalytics.complianceReporting.auditPreparation.enabled}
                      onChange={(e) => onNestedInputChange("dataAnalytics", "complianceReporting", {
                        ...formData.dataAnalytics.complianceReporting,
                        auditPreparation: {
                          ...formData.dataAnalytics.complianceReporting.auditPreparation,
                          enabled: e.target.checked
                        }
                      })}
                      className="rounded border-[#d1d5db] text-[#f97316] focus:ring-[#f97316]"
                    />
                    <span className="text-[14px]">Enable audit preparation tools</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
