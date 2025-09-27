// Utility functions for template processing
import { marked } from 'marked';

export interface EmployeeData {
  employeeName: string;
  designation: string;
  department: string;
  employmentType: string;
  employeeId: string;
  dateOfJoining: string;
  currentSalary: string;
  companyName: string;
  companyStreet: string;
  companyCity: string;
  companyState: string;
  companyZip: string;
  companyCountry: string;
  issueDate: string;
  hrName: string;
  hrTitle: string;
  hrEmail: string;
  hrWebsite: string;
}

export interface AvailableField {
  key: string;
  label: string;
  description: string;
  category: 'employee' | 'company' | 'hr' | 'system';
}

// Available fields for placeholder insertion
export const AVAILABLE_FIELDS: AvailableField[] = [
  // Employee fields
  {
    key: 'employeeName',
    label: 'Employee Name',
    description: 'Full name of the employee',
    category: 'employee'
  },
  {
    key: 'employeeId',
    label: 'Employee ID',
    description: 'Unique employee identifier',
    category: 'employee'
  },
  {
    key: 'designation',
    label: 'Designation',
    description: 'Job title/position',
    category: 'employee'
  },
  {
    key: 'department',
    label: 'Department',
    description: 'Department name',
    category: 'employee'
  },
  {
    key: 'employmentType',
    label: 'Employment Type',
    description: 'Full-time, Part-time, etc.',
    category: 'employee'
  },
  {
    key: 'dateOfJoining',
    label: 'Date of Joining',
    description: 'Employment start date',
    category: 'employee'
  },
  {
    key: 'currentSalary',
    label: 'Current Salary',
    description: 'Current compensation',
    category: 'employee'
  },
  // Company fields
  {
    key: 'companyName',
    label: 'Company Name',
    description: 'Organization name',
    category: 'company'
  },
  {
    key: 'companyStreet',
    label: 'Company Street',
    description: 'Street address',
    category: 'company'
  },
  {
    key: 'companyCity',
    label: 'Company City',
    description: 'City name',
    category: 'company'
  },
  {
    key: 'companyState',
    label: 'Company State',
    description: 'State/Province',
    category: 'company'
  },
  {
    key: 'companyZip',
    label: 'Company ZIP',
    description: 'Postal/ZIP code',
    category: 'company'
  },
  {
    key: 'companyCountry',
    label: 'Company Country',
    description: 'Country name',
    category: 'company'
  },
  // HR fields
  {
    key: 'hrName',
    label: 'HR Name',
    description: 'HR contact person name',
    category: 'hr'
  },
  {
    key: 'hrTitle',
    label: 'HR Title',
    description: 'HR person job title',
    category: 'hr'
  },
  {
    key: 'hrEmail',
    label: 'HR Email',
    description: 'HR contact email',
    category: 'hr'
  },
  {
    key: 'hrWebsite',
    label: 'HR Website',
    description: 'Company website',
    category: 'hr'
  },
  // System fields
  {
    key: 'issueDate',
    label: 'Issue Date',
    description: 'Letter issue date',
    category: 'system'
  },
  {
    key: 'currentDate',
    label: 'Current Date',
    description: 'Today\'s date',
    category: 'system'
  },
  {
    key: 'currentTime',
    label: 'Current Time',
    description: 'Current time',
    category: 'system'
  }
];

// Default letter template with Markdown formatting support
export const DEFAULT_LETTER_TEMPLATE = `
This letter is to confirm that **{{employeeName}}** is employed with **{{companyName}}** as a **{{designation}}** in the **{{department}}** department since {{dateOfJoining}}. The nature of employment is {{employmentType}} and the current compensation is {{currentSalary}}.

This letter is issued upon request of the employee for whatever purpose it may serve. For additional verification, please contact {{hrName}} ({{hrTitle}}) at {{hrEmail}} or visit {{hrWebsite}}.
`;

/**
 * Process template content by replacing placeholders with actual data
 */
export function processTemplate(template: string, data: EmployeeData): string {
  let processed = template;
  
  // Replace all placeholders with actual values
  Object.entries(data).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    const replacement = value || `[${key}]`;
    processed = processed.replace(new RegExp(placeholder, 'g'), replacement);
  });
  
  // Handle special date formatting
  processed = processed.replace(
    /{{dateOfJoining}}/g, 
    formatLongDate(data.dateOfJoining) || '[Date of Joining]'
  );
  processed = processed.replace(
    /{{issueDate}}/g, 
    formatLongDate(data.issueDate) || '[Issue Date]'
  );
  
  // Handle system fields
  processed = processed.replace(
    /{{currentDate}}/g, 
    formatLongDate(new Date().toISOString().slice(0, 10))
  );
  processed = processed.replace(
    /{{currentTime}}/g, 
    new Date().toLocaleTimeString()
  );
  
  return processed;
}

/**
 * Process template content and convert Markdown to HTML
 */
export function processTemplateToHtml(template: string, data: EmployeeData): string {
  const processed = processTemplate(template, data);
  const result = marked(processed, { breaks: true });
  return typeof result === 'string' ? result : result.toString();
}

/**
 * Format date to long format
 */
export function formatLongDate(input: string): string {
  if (!input) return '';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Extract placeholders from template content
 */
export function extractPlaceholders(template: string): string[] {
  const matches = template.match(/\{\{([^}]+)\}\}/g);
  if (!matches) return [];
  return matches.map(match => match.slice(2, -2)); // Remove {{ and }}
}

/**
 * Validate template content
 */
export function validateTemplate(template: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for unclosed placeholders
  const unclosedMatches = template.match(/\{\{[^}]*$/g);
  if (unclosedMatches) {
    errors.push('Unclosed placeholders found');
  }
  
  // Check for invalid placeholder syntax
  const invalidMatches = template.match(/\{[^{]|[^}]+\}/g);
  if (invalidMatches) {
    errors.push('Invalid placeholder syntax found');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
