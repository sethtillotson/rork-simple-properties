export interface ChecklistTemplateItem {
  id: string;
  text: string;
}

export interface ChecklistTemplate {
  name: string;
  items: ChecklistTemplateItem[];
}

export const checklistTemplates: ChecklistTemplate[] = [
  {
    name: 'Due Diligence',
    items: [
      { id: 'dd-1', text: 'Verify employment' },
      { id: 'dd-2', text: 'Run background check' },
      { id: 'dd-3', text: 'Verify income and bank statements' },
      { id: 'dd-4', text: 'Check rental history and references' },
    ],
  },
  {
    name: 'New Property Purchase',
    items: [
      { id: 'npp-1', text: 'Finalize insurance' },
      { id: 'npp-2', text: 'Transfer utilities' },
      { id: 'npp-3', text: 'Schedule inspection' },
      { id: 'npp-4', text: 'Record deed and closing docs' },
    ],
  },
];
