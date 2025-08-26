export type DocumentTemplate = { name: string; content: string };

export const documentTemplates: DocumentTemplate[] = [
  { name: 'Lease Agreement Summary', content: 'Summarize key lease terms, parties, dates, rent, and obligations.' },
  { name: 'Maintenance Work Order', content: 'Generate a clear work order with issue description, access details, and preferred times.' },
  { name: 'Move-in Checklist', content: 'Checklist for tenant move-in: condition, keys, meters, photos, notes.' },
  { name: 'Move-out Checklist', content: 'Checklist for tenant move-out: cleaning, damages, keys returned, readings.' },
  { name: 'Rent Increase Notice', content: 'Draft a polite notice with new rent, effective date, and legal compliance.' },
  { name: 'Late Rent Notice', content: 'Formal notice outlining outstanding amount, late fees, and payment deadline.' },
  { name: 'Property Listing Description', content: 'Create a compelling listing description highlighting features and neighborhood.' },
  { name: 'Insurance Claim Summary', content: 'Summarize incident, damages, dates, and policy details for claim submission.' },
  { name: 'Utility Account Setup Letter', content: 'Letter to utility provider including account details and contact information.' },
  { name: 'Loan Refinance Inquiry', content: 'Inquiry to lender including property, current terms, and refinance goals.' },
  { name: 'Annual Tax Prep Summary', content: 'Summarize annual income, expenses, and documents needed for tax filing.' },
  { name: 'Vendor Agreement Outline', content: 'Outline scope, pricing, timelines, and terms for vendor services.' },
];
