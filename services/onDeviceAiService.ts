export async function generateDocument(prompt: string): Promise<string> {
  console.log('[onDeviceAiService] generateDocument called with prompt length:', prompt?.length ?? 0);
  const delayMs = 3000 + Math.floor(Math.random() * 2000);
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  const sample = 'AI response will appear here.';
  console.log('[onDeviceAiService] generation complete after', delayMs, 'ms');
  return sample;
}
