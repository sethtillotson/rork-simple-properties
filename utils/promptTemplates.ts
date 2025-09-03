import type { Property, Tenant } from '@/types/property';
import type { DocumentTemplate } from '@/utils/documentTemplates';
import { buildDocVariables } from '@/utils/docVariables';

/**
 * Options for customizing the prompt generation
 */
export interface PromptGenerationOptions {
  /** Whether to include placeholder format with [TENANT_NAME] style or generic placeholders */
  useSpecificPlaceholders?: boolean;
  /** Whether to allow external scripts in the output requirements */
  allowExternalScripts?: boolean;
}

/**
 * Generates a complete prompt for document generation from a template and variables
 * 
 * This centralizes the prompt generation logic that was previously duplicated across
 * multiple components (documents/generate.tsx, property/[id].tsx, tenant/[id].tsx)
 */
export function generateDocumentPrompt(
  template: DocumentTemplate,
  property?: Property,
  tenant?: Tenant,
  options: PromptGenerationOptions = {}
): string {
  const { useSpecificPlaceholders = false, allowExternalScripts = false } = options;
  
  const blocks: string[] = [];
  const vars = buildDocVariables(property, tenant);
  
  // Task description
  blocks.push(getTaskPrompt());
  
  // Template section
  blocks.push(getTemplatePrompt(template));
  
  // Variables section
  blocks.push(getVariablesPrompt(vars));
  
  // Output requirements section
  blocks.push(getOutputRequirementsPrompt({ useSpecificPlaceholders, allowExternalScripts }));
  
  return blocks.join('\n\n');
}

/**
 * Gets the task description prompt
 */
function getTaskPrompt(): string {
  return `# Task\nGenerate a professional real-estate document in VALID HTML based on the selected template and variables.`;
}

/**
 * Gets the template section prompt
 */
function getTemplatePrompt(template: DocumentTemplate): string {
  const templateName = template.name || 'Unknown';
  const templateContent = template.content || '';
  return `## Template (Markdown)\nName: ${templateName}\n---\n${templateContent}`;
}

/**
 * Gets the variables section prompt
 */
function getVariablesPrompt(variables: unknown): string {
  const varsJson = stringify(variables);
  return `## Variables (JSON)\n${varsJson}`;
}

/**
 * Gets the output requirements prompt with customizable options
 */
function getOutputRequirementsPrompt(options: {
  useSpecificPlaceholders: boolean;
  allowExternalScripts: boolean;
}): string {
  const { useSpecificPlaceholders, allowExternalScripts } = options;
  
  const placeholderText = useSpecificPlaceholders 
    ? 'leave a bracketed placeholder like [TENANT_NAME]'
    : 'leave a bracketed placeholder';
    
  const scriptsText = allowExternalScripts 
    ? 'Use semantic, mobile-friendly formatting and reasonable spacing.'
    : 'No external scripts. Inline minimal CSS in <style> is allowed.\n- Mobile-friendly formatting.';
  
  return `## Output Requirements
- Return ONLY a complete HTML5 document starting with <!doctype html> and enclosing <html><head>...</head><body>...</body></html>.
- Do NOT include any explanations, prefaces, or code fences in the response. Output the HTML document only.
- Convert any Markdown in the template to styled HTML (use <h1>-<h3>, <p>, <ul>, <li>, <strong>, <em>, <table> if needed).
- Interpolate variables where appropriate; if a variable is missing, ${placeholderText}.
- ${scriptsText}`;
}

/**
 * Safe JSON stringify utility
 */
function stringify(obj: unknown): string {
  try {
    return JSON.stringify(obj ?? null, null, 2);
  } catch {
    return String(obj);
  }
}