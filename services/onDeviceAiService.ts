export async function generateDocument(prompt: string): Promise<string> {
  console.log('[onDeviceAiService] generateDocument called with prompt length:', prompt?.length ?? 0);
  const delayMs = 3000 + Math.floor(Math.random() * 2000);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  const sample = `# Generated Document\n\nPrompt Summary (first 300 chars):\n${(prompt ?? '').slice(0, 300)}\n\n---\n\nThis is a mock on-device AI generated document.\nIt includes structured sections, placeholders, and helpful formatting.\n\n## Overview\n- This document was generated locally using a simulated model call.\n- Replace this mock with an actual on-device model via onnxruntime-react-native when available.\n\n## Details\n- Include key facts, dates, parties, addresses, and numbers.\n- Keep language clear, concise, and professional.\n\n## Next Steps\n- Review and edit as needed.\n- Copy or share this text directly from the app.\n`;
  console.log('[onDeviceAiService] generation complete after', delayMs, 'ms');
  return sample;
}
