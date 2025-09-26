/**
 * Employee ID Generator Utility
 * Handles generation of employee IDs based on customizable format patterns
 */

export interface EmployeeIdConfig {
  format: string;
  nextSequence?: number;
  lastGenerated?: string;
  lastGeneratedDate?: string;
}

export interface EmployeeIdContext {
  year?: number;
  month?: number;
  day?: number;
  sequence?: number;
  department?: string;
  location?: string;
  employeeType?: string;
}

/**
 * Available format variables and their replacements
 */
const FORMAT_VARIABLES = {
  '{YYYY}': (date: Date) => date.getFullYear().toString(),
  '{YY}': (date: Date) => date.getFullYear().toString().slice(-2),
  '{MM}': (date: Date) => (date.getMonth() + 1).toString().padStart(2, '0'),
  '{DD}': (date: Date) => date.getDate().toString().padStart(2, '0'),
  '{###}': (context: EmployeeIdContext) => (context.sequence || 1).toString().padStart(3, '0'),
  '{####}': (context: EmployeeIdContext) => (context.sequence || 1).toString().padStart(4, '0'),
  '{DEPT}': (context: EmployeeIdContext) => (context.department || '').toUpperCase().slice(0, 3),
  '{LOC}': (context: EmployeeIdContext) => (context.location || '').toUpperCase().slice(0, 2),
  '{TYPE}': (context: EmployeeIdContext) => (context.employeeType || 'EMP').toUpperCase().slice(0, 3),
};

/**
 * Validate employee ID format pattern
 */
export function validateEmployeeIdFormat(format: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!format || format.trim().length === 0) {
    errors.push('Format cannot be empty');
    return { valid: false, errors };
  }
  
  // Check for required sequence placeholder
  if (!format.includes('{###}') && !format.includes('{####}')) {
    errors.push('Format must include at least one sequence placeholder ({###} or {####})');
  }
  
  // Check for valid placeholders
  const validPlaceholders = Object.keys(FORMAT_VARIABLES);
  const placeholders = format.match(/\{[^}]+\}/g) || [];
  
  for (const placeholder of placeholders) {
    if (!validPlaceholders.includes(placeholder)) {
      errors.push(`Invalid placeholder: ${placeholder}. Valid placeholders are: ${validPlaceholders.join(', ')}`);
    }
  }
  
  // Check for balanced braces
  const openBraces = (format.match(/\{/g) || []).length;
  const closeBraces = (format.match(/\}/g) || []).length;
  
  if (openBraces !== closeBraces) {
    errors.push('Unbalanced braces in format');
  }
  
  return { valid: errors.length === 0, errors };
}

/**
 * Generate employee ID based on format and context
 */
export function generateEmployeeId(
  format: string, 
  context: EmployeeIdContext = {}
): string {
  const validation = validateEmployeeIdFormat(format);
  if (!validation.valid) {
    throw new Error(`Invalid format: ${validation.errors.join(', ')}`);
  }
  
  const date = new Date();
  let generatedId = format;
  
  // Replace date-based variables
  for (const [placeholder, replacer] of Object.entries(FORMAT_VARIABLES)) {
    if (generatedId.includes(placeholder)) {
      if (typeof replacer === 'function') {
        // Check if it's a date-based or context-based replacer
        if (placeholder.startsWith('{Y') || placeholder.startsWith('{M') || placeholder.startsWith('{D')) {
          generatedId = generatedId.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacer(date));
        } else {
          generatedId = generatedId.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacer(context as Date & EmployeeIdContext));
        }
      }
    }
  }
  
  return generatedId;
}

/**
 * Generate preview of employee ID format
 */
export function previewEmployeeIdFormat(format: string): string {
  const sampleContext: EmployeeIdContext = {
    sequence: 1,
    department: 'HR',
    location: 'NY',
    employeeType: 'EMP'
  };
  
  try {
    return generateEmployeeId(format, sampleContext);
  } catch {
    return 'Invalid format';
  }
}

/**
 * Get next sequence number for employee ID generation
 */
export function getNextSequenceNumber(
  format: string, 
  existingEmployeeIds: string[], 
  date: Date = new Date()
): number {
  // Extract sequence placeholder from format
  const hasThreeDigits = format.includes('{###}');
  const hasFourDigits = format.includes('{####}');
  
  if (!hasThreeDigits && !hasFourDigits) {
    return 1; // Default sequence
  }
  
  // Generate pattern to match existing IDs for the same period
  let searchPattern = format;
  
  // Replace date placeholders with actual values
  searchPattern = searchPattern.replace(/\{YYYY\}/g, date.getFullYear().toString());
  searchPattern = searchPattern.replace(/\{YY\}/g, date.getFullYear().toString().slice(-2));
  searchPattern = searchPattern.replace(/\{MM\}/g, (date.getMonth() + 1).toString().padStart(2, '0'));
  searchPattern = searchPattern.replace(/\{DD\}/g, date.getDate().toString().padStart(2, '0'));
  
  // Replace other placeholders with wildcards
  searchPattern = searchPattern.replace(/\{[^}]+\}/g, '\\d+');
  
  // Create regex pattern
  const regex = new RegExp('^' + searchPattern.replace(/\{###\}/g, '(\\d{3})').replace(/\{####\}/g, '(\\d{4})') + '$');
  
  let maxSequence = 0;
  
  // Find matching employee IDs and extract sequence numbers
  for (const employeeId of existingEmployeeIds) {
    const match = employeeId.match(regex);
    if (match) {
      const sequence = parseInt(match[1] || '0', 10);
      maxSequence = Math.max(maxSequence, sequence);
    }
  }
  
  return maxSequence + 1;
}

/**
 * Generate multiple employee ID previews
 */
export function generateEmployeeIdPreview(format: string, count: number = 5): string[] {
  const previews: string[] = [];
  
  for (let i = 1; i <= count; i++) {
    const context: EmployeeIdContext = {
      sequence: i,
      department: 'HR',
      location: 'NY',
      employeeType: 'EMP'
    };
    
    try {
      previews.push(generateEmployeeId(format, context));
    } catch {
      previews.push('Invalid format');
    }
  }
  
  return previews;
}

/**
 * Parse employee ID to extract information
 */
export function parseEmployeeId(employeeId: string, format: string): Partial<EmployeeIdContext> {
  const result: Partial<EmployeeIdContext> = {};
  
  try {
    // Create regex pattern from format
    const regexPattern = format
      .replace(/\{YYYY\}/g, '(\\d{4})')
      .replace(/\{YY\}/g, '(\\d{2})')
      .replace(/\{MM\}/g, '(\\d{2})')
      .replace(/\{DD\}/g, '(\\d{2})')
      .replace(/\{###\}/g, '(\\d{3})')
      .replace(/\{####\}/g, '(\\d{4})')
      .replace(/\{[^}]+\}/g, '([^\\-\\s]+)');
    
    const regex = new RegExp('^' + regexPattern + '$');
    const match = employeeId.match(regex);
    
    if (match) {
      const groups = match.slice(1);
      let groupIndex = 0;
      
      // Map groups back to context based on format
      if (format.includes('{YYYY}')) {
        result.year = parseInt(groups[groupIndex++] || '0', 10);
      }
      if (format.includes('{YY}')) {
        result.year = 2000 + parseInt(groups[groupIndex++] || '0', 10);
      }
      if (format.includes('{MM}')) {
        result.month = parseInt(groups[groupIndex++] || '0', 10);
      }
      if (format.includes('{DD}')) {
        result.day = parseInt(groups[groupIndex++] || '0', 10);
      }
      if (format.includes('{###}') || format.includes('{####}')) {
        result.sequence = parseInt(groups[groupIndex++] || '0', 10);
      }
    }
  } catch (error) {
    console.error('Error parsing employee ID:', error);
  }
  
  return result;
}

/**
 * Get format variables help text
 */
export function getFormatVariablesHelp(): Array<{ placeholder: string; description: string; example: string }> {
  return [
    { placeholder: '{YYYY}', description: 'Full year (4 digits)', example: '2024' },
    { placeholder: '{YY}', description: 'Short year (2 digits)', example: '24' },
    { placeholder: '{MM}', description: 'Month (01-12)', example: '01' },
    { placeholder: '{DD}', description: 'Day (01-31)', example: '15' },
    { placeholder: '{###}', description: 'Sequential number (3 digits)', example: '001' },
    { placeholder: '{####}', description: 'Sequential number (4 digits)', example: '0001' },
    { placeholder: '{DEPT}', description: 'Department code (3 chars)', example: 'HR' },
    { placeholder: '{LOC}', description: 'Location code (2 chars)', example: 'NY' },
    { placeholder: '{TYPE}', description: 'Employee type (3 chars)', example: 'EMP' },
  ];
}
