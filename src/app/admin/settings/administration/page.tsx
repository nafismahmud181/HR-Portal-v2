"use client";

import { useState, useEffect, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { collectionGroup, getDocs, query, where, doc, getDoc, setDoc } from "firebase/firestore";
import UserManagementSection from "./UserManagementSection";
import SystemConfigSection from "./SystemConfigSection";
import SecurityAuditSection from "./SecurityAuditSection";
import WorkflowAutomationSection from "./WorkflowAutomationSection";
import AnalyticsReportingSection from "./AnalyticsReportingSection";
import FeatureManagementSection from "./FeatureManagementSection";
import OnboardingFieldConfigSection from "./OnboardingFieldConfigSection";

interface AdministrationSettings {
  // User Management
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

  // System Configuration
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

  // Security & Audit Settings
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

  // Workflow & Automation Settings
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

  // Analytics & Reporting Settings
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

  // Feature Management Settings
  moduleConfiguration: {
    enabledModules: {
      hrManagement: boolean;
      payroll: boolean;
      performanceManagement: boolean;
      timeAttendance: boolean;
      benefitsAdministration: boolean;
      recruitment: boolean;
      learningDevelopment: boolean;
      complianceReporting: boolean;
    };
    moduleSettings: Array<{
      module: string;
      enabled: boolean;
      features: string[];
      permissions: string[];
      customizations: string[];
    }>;
  };
  featureFlags: {
    betaFeatures: {
      enabled: boolean;
      features: Array<{
        id: string;
        name: string;
        description: string;
        enabled: boolean;
        targetUsers: string[];
        rolloutPercentage: number;
      }>;
    };
    experimentalFeatures: {
      enabled: boolean;
      features: Array<{
        id: string;
        name: string;
        description: string;
        enabled: boolean;
        riskLevel: string;
        testingGroup: string[];
      }>;
    };
    customFeatureToggles: Array<{
      id: string;
      name: string;
      description: string;
      enabled: boolean;
      conditions: string[];
      targetRoles: string[];
    }>;
  };
  customizationOptions: {
    fieldCustomization: {
      enabled: boolean;
      customFields: Array<{
        id: string;
        name: string;
        type: string;
        module: string;
        required: boolean;
        visible: boolean;
        validation: string;
      }>;
      fieldPermissions: Array<{
        field: string;
        roles: string[];
        permissions: string[];
      }>;
    };
    workflowCustomization: {
      enabled: boolean;
      customWorkflows: Array<{
        id: string;
        name: string;
        type: string;
        steps: Array<{
          step: number;
          name: string;
          assignee: string;
          required: boolean;
        }>;
        conditions: string[];
      }>;
      workflowTemplates: Array<{
        name: string;
        type: string;
        description: string;
        steps: number;
        estimatedDuration: number;
      }>;
    };
    uiCustomization: {
      enabled: boolean;
      themes: Array<{
        id: string;
        name: string;
        primaryColor: string;
        secondaryColor: string;
        fontFamily: string;
        active: boolean;
      }>;
      layoutOptions: {
        sidebarPosition: string;
        headerStyle: string;
        dashboardLayout: string;
        mobileOptimization: boolean;
      };
      branding: {
        logoUrl: string;
        faviconUrl: string;
        companyColors: string[];
        customCss: string;
      };
    };
  };
  // Onboarding Field Configuration
  onboardingFieldConfig: {
    personalInformation: {
      personalEmail: { enabled: boolean; required: boolean; label: string };
      personalPhone: { enabled: boolean; required: boolean; label: string };
      dateOfBirth: { enabled: boolean; required: boolean; label: string };
      gender: { enabled: boolean; required: boolean; label: string };
      maritalStatus: { enabled: boolean; required: boolean; label: string };
      nationality: { enabled: boolean; required: boolean; label: string };
      profilePhoto: { enabled: boolean; required: boolean; label: string };
    };
    addressInformation: {
      currentAddress: { enabled: boolean; required: boolean; label: string };
      permanentAddress: { enabled: boolean; required: boolean; label: string };
      sameAsCurrent: { enabled: boolean; required: boolean; label: string };
    };
    emergencyContacts: {
      primaryEmergencyContact: { enabled: boolean; required: boolean; label: string };
      secondaryEmergencyContact: { enabled: boolean; required: boolean; label: string };
    };
    bankingTaxInfo: {
      bankDetails: { enabled: boolean; required: boolean; label: string };
      taxInformation: { enabled: boolean; required: boolean; label: string };
    };
    documents: {
      governmentId: { enabled: boolean; required: boolean; label: string };
      socialSecurityCard: { enabled: boolean; required: boolean; label: string };
      i9Documents: { enabled: boolean; required: boolean; label: string };
      directDepositForm: { enabled: boolean; required: boolean; label: string };
      resume: { enabled: boolean; required: boolean; label: string };
      certifications: { enabled: boolean; required: boolean; label: string };
      transcripts: { enabled: boolean; required: boolean; label: string };
    };
  };
  [key: string]: unknown;
}

export default function AdministrationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("user-management");
  const [modal, setModal] = useState<{
    isOpen: boolean;
    type: "success" | "error";
    title: string;
    data: string;
  }>({
    isOpen: false,
    type: "success",
    title: "",
    data: ""
  });
  const [orgId, setOrgId] = useState<string | null>(null);
  const [formData, setFormData] = useState<AdministrationSettings>({
    // Analytics & Reporting Defaults
    reportConfiguration: {
      standardReports: {
        enabled: true,
        reports: [
          {
            id: "1",
            name: "Monthly Employee Report",
            type: "Employee Report",
            schedule: "monthly",
            recipients: ["hrAdmin"],
            format: "PDF",
            autoGenerate: true
          }
        ],
        defaultFormats: ["PDF", "Excel"],
        recipientGroups: [
          {
            name: "HR Team",
            members: ["hrAdmin"],
            emailList: ["hr@company.com"]
          }
        ]
      },
      customReports: {
        enabled: true,
        reportBuilder: {
          enabled: true,
          dataSources: ["Employee Database", "Payroll System"],
          maxFields: 20,
          allowedVisualizations: ["Bar Chart", "Line Chart", "Table"]
        },
        dataSourceConnections: [],
        visualizationOptions: {
          chartTypes: ["Bar", "Line", "Pie"],
          colorSchemes: ["Default", "Corporate"],
          exportFormats: ["PDF", "Excel", "CSV"]
        }
      },
      dashboardConfiguration: {
        enabled: true,
        widgets: [],
        roleBasedDashboards: [],
        refreshIntervals: {
          default: 15,
          realTime: false,
          maxInterval: 60
        }
      }
    },
    dataAnalytics: {
      performanceMetrics: {
        enabled: true,
        kpiDefinitions: [
          {
            id: "1",
            name: "Employee Turnover Rate",
            category: "HR Metrics",
            calculation: "(Terminations / Average Headcount) * 100",
            target: 10,
            unit: "%",
            frequency: "monthly"
          }
        ],
        benchmarkSettings: {
          enabled: true,
          industryBenchmarks: [],
          internalBenchmarks: []
        },
        trendAnalysis: {
          enabled: true,
          timePeriods: ["monthly", "quarterly", "annually"],
          analysisTypes: ["trend", "comparison", "forecast"],
          alertThresholds: []
        }
      },
      complianceReporting: {
        enabled: true,
        regulatoryReports: [
          {
            id: "1",
            name: "EEO-1 Report",
            jurisdiction: "US",
            format: "PDF",
            schedule: "annually",
            requirements: ["EEO-1"],
            autoGenerate: true
          }
        ],
        submissionSchedules: [],
        auditPreparation: {
          enabled: true,
          auditTrails: [],
          complianceChecks: []
        }
      }
    },

    // Feature Management Defaults
    moduleConfiguration: {
      enabledModules: {
        hrManagement: true,
        payroll: true,
        performanceManagement: true,
        timeAttendance: true,
        benefitsAdministration: true,
        recruitment: true,
        learningDevelopment: true,
        complianceReporting: true
      },
      moduleSettings: [
        {
          module: "HR Management",
          enabled: true,
          features: ["employee_data", "org_chart", "documents"],
          permissions: ["view", "edit", "delete"],
          customizations: ["fields", "workflows"]
        }
      ]
    },
    featureFlags: {
      betaFeatures: {
        enabled: true,
        features: [
          {
            id: "1",
            name: "AI-Powered Insights",
            description: "Advanced analytics with AI recommendations",
            enabled: false,
            targetUsers: ["hrAdmin"],
            rolloutPercentage: 0
          }
        ]
      },
      experimentalFeatures: {
        enabled: false,
        features: [
          {
            id: "1",
            name: "Voice Commands",
            description: "Voice-activated system controls",
            enabled: false,
            riskLevel: "High",
            testingGroup: ["superAdmin"]
          }
        ]
      },
      customFeatureToggles: [
        {
          id: "1",
          name: "Advanced Reporting",
          description: "Enable advanced reporting features",
          enabled: true,
          conditions: ["premium_plan"],
          targetRoles: ["hrAdmin", "superAdmin"]
        }
      ]
    },
    customizationOptions: {
      fieldCustomization: {
        enabled: true,
        customFields: [
          {
            id: "1",
            name: "Emergency Contact",
            type: "text",
            module: "HR Management",
            required: true,
            visible: true,
            validation: "required"
          }
        ],
        fieldPermissions: []
      },
      workflowCustomization: {
        enabled: true,
        customWorkflows: [
          {
            id: "1",
            name: "Employee Onboarding",
            type: "Approval",
            steps: [
              {
                step: 1,
                name: "HR Review",
                assignee: "hrAdmin",
                required: true
              }
            ],
            conditions: ["new_employee"]
          }
        ],
        workflowTemplates: [
          {
            name: "Standard Approval",
            type: "Approval",
            description: "Basic approval workflow",
            steps: 3,
            estimatedDuration: 2
          }
        ]
      },
      uiCustomization: {
        enabled: true,
        themes: [
          {
            id: "1",
            name: "Default",
            primaryColor: "#f97316",
            secondaryColor: "#ea580c",
            fontFamily: "Inter",
            active: true
          },
          {
            id: "2",
            name: "Dark",
            primaryColor: "#1f2937",
            secondaryColor: "#374151",
            fontFamily: "Inter",
            active: false
          }
        ],
        layoutOptions: {
          sidebarPosition: "left",
          headerStyle: "standard",
          dashboardLayout: "grid",
          mobileOptimization: true
        },
        branding: {
          logoUrl: "",
          faviconUrl: "",
          companyColors: ["#f97316", "#ea580c"],
          customCss: ""
        }
      }
    },

    // User Management Defaults
    userRoles: {
      superAdmin: {
        permissions: ["all"],
        description: "Full system access with all permissions"
      },
      hrAdmin: {
        permissions: ["hr_management", "employee_data", "payroll", "reports"],
        description: "HR management and employee data access"
      },
      manager: {
        permissions: ["team_management", "employee_data", "performance", "leave_approval"],
        description: "Team management and employee oversight"
      },
      employee: {
        permissions: ["self_service", "leave_request", "profile_update"],
        description: "Basic employee self-service access"
      },
      customRoles: []
    },
    permissionMatrix: {
      modules: ["hr_management", "payroll", "performance", "leave_management", "recruitment", "reports"],
      features: ["employee_data", "payroll_processing", "performance_reviews", "leave_approval", "recruitment", "reporting"],
      dataVisibility: {
        employeeData: ["own", "team", "department", "all"],
        payrollData: ["own", "team", "department", "all"],
        performanceData: ["own", "team", "department", "all"]
      }
    },
    roleAssignmentRules: {
      autoAssignment: {
        enabled: false,
        jobTitleMapping: [],
        departmentMapping: []
      },
      approvalHierarchy: {
        enabled: true,
        levels: 3,
        skipLevelApproval: false
      }
    },
    passwordPolicy: {
      minimumLength: 8,
      complexityRequired: true,
      expirationPeriod: 90,
      historyCount: 5,
      specialCharactersRequired: true,
      numbersRequired: true,
      uppercaseRequired: true,
      lowercaseRequired: true
    },
    accountSecurity: {
      mfaEnabled: false,
      sessionTimeout: 30,
      failedLoginLimit: 5,
      accountLockoutDuration: 30,
      passwordResetRequired: true
    },
    ssoSettings: {
      enabled: false,
      provider: "",
      domainAutoLogin: false,
      userProvisioning: {
        enabled: false,
        autoCreateAccounts: false,
        defaultRole: "employee"
      }
    },

    // System Configuration Defaults
    databaseSettings: {
      backupSchedule: {
        enabled: true,
        frequency: "daily",
        time: "02:00",
        retentionPeriod: 30
      },
      backupVerification: {
        enabled: true,
        verificationMethod: "checksum"
      }
    },
    storageSettings: {
      fileUploadLimits: {
        maxFileSize: 10,
        allowedFileTypes: ["pdf", "doc", "docx", "jpg", "png", "xlsx"],
        maxFilesPerUpload: 5
      },
      documentStorage: {
        retentionPeriod: 2555,
        archiveAfterDays: 365,
        compressionEnabled: true
      },
      archiveSettings: {
        enabled: true,
        archiveAfterDays: 365,
        compressionLevel: "medium"
      }
    },
    dataImportExport: {
      bulkImportTemplates: [
        {
          name: "Employee Import",
          type: "employee",
          fields: ["firstName", "lastName", "email", "department", "jobTitle"]
        }
      ],
      exportFormats: ["csv", "xlsx", "pdf"],
      migrationTools: {
        enabled: true,
        supportedFormats: ["csv", "xlsx", "json"]
      }
    },
    apiConfiguration: {
      apiKeys: [],
      rateLimiting: {
        enabled: true,
        requestsPerMinute: 100,
        burstLimit: 200
      },
      webhooks: []
    },
    thirdPartyIntegrations: {
      payrollProviders: [],
      accountingSoftware: [],
      backgroundCheckServices: [],
      benefitsPlatforms: []
    },
    emailServiceProvider: {
      smtpConfiguration: {
        host: "",
        port: 587,
        username: "",
        password: "",
        encryption: "tls"
      },
      deliverySettings: {
        retryAttempts: 3,
        retryDelay: 300,
        bounceHandling: true
      },
      bounceHandling: {
        enabled: true,
        bounceThreshold: 5,
        autoUnsubscribe: false
      }
    },

    // Security & Audit Defaults
    accessControl: {
      ipRestrictions: {
        enabled: false,
        allowedIPs: [],
        blockedIPs: []
      },
      geographicLimitations: {
        enabled: false,
        allowedCountries: [],
        blockedCountries: []
      },
      vpnRequirements: {
        enabled: false,
        requiredForAdmin: false,
        requiredForHR: false
      }
    },
    dataEncryption: {
      encryptionAtRest: {
        enabled: true,
        algorithm: "AES-256",
        keyRotationPeriod: 90
      },
      dataInTransit: {
        enabled: true,
        protocol: "TLS 1.3",
        certificateValidation: true
      },
      keyManagement: {
        provider: "AWS KMS",
        backupEnabled: true,
        keyVersioning: true
      }
    },
    privacySettings: {
      employeeDataVisibility: {
        selfViewOnly: true,
        managerViewTeam: true,
        hrViewAll: true
      },
      managerAccessLimitations: {
        restrictedDepartments: [],
        viewOnlyMode: false,
        approvalRequired: false
      },
      hrDataSegregation: {
        enabled: true,
        sensitiveDataAccess: ["hrAdmin", "superAdmin"],
        auditRequired: true
      }
    },
    auditTrail: {
      activityLogging: {
        enabled: true,
        logLevel: "info",
        includeUserActions: true,
        includeSystemEvents: true
      },
      logRetention: {
        period: 2555,
        archiveAfterDays: 365,
        compressionEnabled: true
      },
      auditReports: {
        autoGeneration: true,
        frequency: "monthly",
        recipients: ["hrAdmin", "superAdmin"]
      }
    },
    complianceMonitoring: {
      regulatoryTracking: {
        enabled: true,
        jurisdictions: ["US"],
        requirements: ["GDPR", "CCPA", "SOX"]
      },
      policyCompliance: {
        enabled: true,
        checkFrequency: "weekly",
        violationThreshold: 5
      },
      violationReporting: {
        enabled: true,
        notificationChannels: ["email"],
        escalationLevels: 3
      }
    },
    dataRightsManagement: {
      employeeDataAccess: {
        selfServiceEnabled: true,
        dataPortability: true,
        accessLogging: true
      },
      dataCorrectionWorkflows: {
        enabled: true,
        approvalRequired: false,
        notificationRequired: true
      },
      dataDeletionProcedures: {
        enabled: true,
        retentionPeriod: 2555,
        secureDeletion: true
      }
    },

    // Workflow & Automation Defaults
    approvalWorkflows: {
      leaveRequestWorkflow: {
        enabled: true,
        approvalChain: [
          {
            level: 1,
            role: "manager",
            autoApprovalThreshold: 0,
            escalationHours: 24
          }
        ],
        escalationRules: {
          enabled: true,
          escalationAfterHours: 48,
          notifyManager: true,
          notifyHR: true
        }
      },
      expenseApprovalWorkflow: {
        enabled: true,
        amountBasedLevels: [
          {
            minAmount: 0,
            maxAmount: 100,
            approverRole: "manager",
            autoApproval: true
          },
          {
            minAmount: 101,
            maxAmount: 1000,
            approverRole: "hrAdmin",
            autoApproval: false
          }
        ],
        departmentSpecific: []
      },
      documentApprovalWorkflow: {
        enabled: true,
        reviewChain: [
          {
            documentType: "Contract",
            reviewerRole: "hrAdmin",
            required: true,
            versionControl: true
          }
        ],
        versionControl: {
          enabled: true,
          maxVersions: 10,
          autoArchive: true
        }
      }
    },
    automationRules: {
      employeeLifecycleAutomation: {
        onboardingTasks: {
          enabled: true,
          tasks: [
            {
              name: "Complete paperwork",
              assignee: "hrAdmin",
              dueDays: 3,
              required: true
            },
            {
              name: "IT setup",
              assignee: "manager",
              dueDays: 1,
              required: true
            }
          ],
          autoAssign: true
        },
        offboardingWorkflows: {
          enabled: true,
          steps: [
            {
              name: "Return equipment",
              assignee: "manager",
              dueDays: 1,
              required: true
            },
            {
              name: "Exit interview",
              assignee: "hrAdmin",
              dueDays: 3,
              required: true
            }
          ],
          autoTrigger: true
        },
        statusChangeTriggers: {
          enabled: true,
          triggers: [
            {
              fromStatus: "active",
              toStatus: "terminated",
              actions: ["disable_access", "send_notification"],
              notifyRoles: ["hrAdmin", "manager"]
            }
          ]
        }
      },
      documentGenerationAutomation: {
        automaticCreation: {
          enabled: true,
          triggers: [
            {
              event: "employee_hired",
              documentType: "Contract",
              template: "standard_contract",
              recipients: ["employee", "hrAdmin"]
            }
          ]
        },
        scheduledGeneration: {
          enabled: true,
          schedules: [
            {
              name: "Monthly Reports",
              documentType: "Report",
              frequency: "monthly",
              recipients: ["hrAdmin", "superAdmin"]
            }
          ]
        },
        bulkProcessing: {
          enabled: true,
          batchSize: 50,
          processingTime: "02:00",
          retryAttempts: 3
        }
      },
      notificationAutomation: {
        eventBasedNotifications: {
          enabled: true,
          events: [
            {
              eventType: "leave_requested",
              recipients: ["manager", "hrAdmin"],
              channels: ["email"],
              template: "leave_request_notification"
            }
          ]
        },
        reminderSchedules: {
          enabled: true,
          reminders: [
            {
              name: "Performance Review Reminder",
              frequency: "monthly",
              recipients: ["manager"],
              message: "Time to schedule performance reviews"
            }
          ]
        },
        escalationNotifications: {
          enabled: true,
          escalationLevels: 3,
          notifyChain: ["manager", "hrAdmin", "superAdmin"],
          escalationDelay: 24
        }
      }
    },
    // Onboarding Field Configuration Defaults
    onboardingFieldConfig: {
      personalInformation: {
        personalEmail: { enabled: true, required: true, label: "Personal Email" },
        personalPhone: { enabled: true, required: true, label: "Personal Phone Number" },
        dateOfBirth: { enabled: true, required: true, label: "Date of Birth" },
        gender: { enabled: true, required: false, label: "Gender" },
        maritalStatus: { enabled: true, required: false, label: "Marital Status" },
        nationality: { enabled: true, required: true, label: "Nationality" },
        profilePhoto: { enabled: true, required: false, label: "Profile Photo" }
      },
      addressInformation: {
        currentAddress: { enabled: true, required: true, label: "Current Address" },
        permanentAddress: { enabled: true, required: true, label: "Permanent Address" },
        sameAsCurrent: { enabled: true, required: false, label: "Same as Current Address" }
      },
      emergencyContacts: {
        primaryEmergencyContact: { enabled: true, required: true, label: "Primary Emergency Contact" },
        secondaryEmergencyContact: { enabled: true, required: false, label: "Secondary Emergency Contact" }
      },
      bankingTaxInfo: {
        bankDetails: { enabled: true, required: true, label: "Banking Information" },
        taxInformation: { enabled: true, required: true, label: "Tax Information" }
      },
      documents: {
        governmentId: { enabled: true, required: true, label: "Government ID" },
        socialSecurityCard: { enabled: true, required: true, label: "Social Security Card" },
        i9Documents: { enabled: true, required: true, label: "I-9 Verification Documents" },
        directDepositForm: { enabled: true, required: true, label: "Direct Deposit Form" },
        resume: { enabled: true, required: false, label: "Resume/CV" },
        certifications: { enabled: true, required: false, label: "Certifications" },
        transcripts: { enabled: true, required: false, label: "Education Transcripts" }
      }
    }
  });

  const tabs = [
    { id: "user-management", label: "User Management", icon: "👥" },
    { id: "system-config", label: "System Configuration", icon: "⚙️" },
    { id: "security-audit", label: "Security & Audit", icon: "🔒" },
    { id: "workflow-automation", label: "Workflow & Automation", icon: "🔄" },
    { id: "analytics-reporting", label: "Analytics & Reporting", icon: "📊" },
    { id: "feature-management", label: "Feature Management", icon: "🎛️" },
    { id: "onboarding-config", label: "Onboarding Configuration", icon: "📝" }
  ];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      try {
        // Get organization ID
        const cg = collectionGroup(db, "users");
        const q = query(cg, where("uid", "==", user.uid));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const membershipRef = snap.docs[0].ref;
          const parentOrg = membershipRef.parent.parent;
          const foundOrgId = parentOrg ? parentOrg.id : null;
          setOrgId(foundOrgId);
          
          // Load existing settings if available
          if (foundOrgId) {
            const settingsRef = doc(db, "organizations", foundOrgId, "settings", "administration");
            const settingsSnap = await getDoc(settingsRef);
            if (settingsSnap.exists()) {
              const existingData = settingsSnap.data() as AdministrationSettings;
              setFormData(existingData);
            }
          }
        }
      } catch (error) {
        console.error("Error loading settings:", error);
      } finally {
        setLoading(false);
      }
    });
    
    return () => unsub();
  }, []);

  const handleInputChange = (field: string, value: unknown) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedInputChange = useCallback((parent: string, field: string, value: unknown) => {
    setFormData(prev => {
      // Create a deep copy of the formData
      const newData = JSON.parse(JSON.stringify(prev));
      
      // Handle deeply nested objects like "onboardingFieldConfig.personalInformation.personalEmail.enabled"
      const fieldParts = field.split('.');
      
      if (fieldParts.length === 3) {
        // Handle: parent.field1.field2.field3
        const [section, fieldName, property] = fieldParts;
        
        if (!newData[parent]) {
          newData[parent] = {};
        }
        if (!newData[parent][section]) {
          newData[parent][section] = {};
        }
        if (!newData[parent][section][fieldName]) {
          newData[parent][section][fieldName] = {};
        }
        
        newData[parent][section][fieldName][property] = value;
      } else {
        // Handle simple nested objects
        if (!newData[parent]) {
          newData[parent] = {};
        }
        newData[parent][field] = value;
      }
      
      return newData;
    });
  }, []);

  const handleSave = async () => {
    if (!orgId) {
      setModal({
        isOpen: true,
        type: "error",
        title: "Error",
        data: "Organization not found. Please refresh the page."
      });
      return;
    }

    setSaving(true);
    try {
      const settingsRef = doc(db, "organizations", orgId, "settings", "administration");
      await setDoc(settingsRef, formData, { merge: true });
      
      setModal({
        isOpen: true,
        type: "success",
        title: "Settings Saved",
        data: "Administration settings have been saved successfully."
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      setModal({
        isOpen: true,
        type: "error",
        title: "Save Failed",
        data: error instanceof Error ? error.message : "Failed to save settings. Please try again."
      });
    } finally {
      setSaving(false);
    }
  };

  const closeModal = () => {
    setModal(prev => ({ ...prev, isOpen: false }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ffffff] text-[#1a1a1a] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f97316] mx-auto"></div>
          <p className="mt-4 text-[14px] text-[#6b7280]">Loading administration settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#ffffff] text-[#1a1a1a]">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[28px] font-semibold">Administration Settings</h1>
            <p className="mt-2 text-[14px] text-[#6b7280]">
              Manage user roles, permissions, system configuration, and integrations.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? "Saving..." : "Save Settings"}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-[#e5e7eb] mb-8">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-[14px] transition-colors ${
                  activeTab === tab.id
                    ? "border-[#f97316] text-[#f97316]"
                    : "border-transparent text-[#6b7280] hover:text-[#374151] hover:border-[#d1d5db]"
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === "user-management" && (
            <UserManagementSection 
              formData={formData} 
              onInputChange={handleInputChange} 
              onNestedInputChange={handleNestedInputChange} 
            />
          )}
          {activeTab === "system-config" && (
            <SystemConfigSection 
              formData={formData} 
              onInputChange={handleInputChange} 
              onNestedInputChange={handleNestedInputChange} 
            />
          )}
          {activeTab === "security-audit" && (
            <SecurityAuditSection 
              formData={formData} 
              onInputChange={handleInputChange} 
              onNestedInputChange={handleNestedInputChange} 
            />
          )}
          {activeTab === "workflow-automation" && (
            <WorkflowAutomationSection 
              formData={formData} 
              onInputChange={handleInputChange} 
              onNestedInputChange={handleNestedInputChange} 
            />
          )}
          {activeTab === "analytics-reporting" && (
            <AnalyticsReportingSection 
              formData={formData} 
              onInputChange={handleInputChange} 
              onNestedInputChange={handleNestedInputChange} 
            />
          )}
          {activeTab === "feature-management" && (
            <FeatureManagementSection 
              formData={formData} 
              onInputChange={handleInputChange} 
              onNestedInputChange={handleNestedInputChange} 
            />
          )}
          {activeTab === "onboarding-config" && (
            <OnboardingFieldConfigSection 
              formData={formData} 
              onInputChange={handleInputChange} 
              onNestedInputChange={handleNestedInputChange} 
            />
          )}
        </div>

        {/* Modal */}
        {modal.isOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  modal.type === "success" ? "bg-green-100" : "bg-red-100"
                }`}>
                  <span className={`text-lg ${
                    modal.type === "success" ? "text-green-600" : "text-red-600"
                  }`}>
                    {modal.type === "success" ? "✓" : "✗"}
                  </span>
                </div>
                <h3 className="text-[16px] font-semibold">{modal.title}</h3>
              </div>
              <p className="text-[14px] text-[#6b7280] mb-6">{modal.data as string}</p>
              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-[#f97316] text-white rounded-lg hover:bg-[#ea580c] transition-colors"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
