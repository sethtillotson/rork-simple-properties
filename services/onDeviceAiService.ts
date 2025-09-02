import { generateViaGateway } from '@/services/gatewayClient';

export async function generateDocument(prompt: string): Promise<string> {
  console.log('[onDeviceAiService] generateDocument called with prompt length:', prompt?.length ?? 0);
  try {
    const text = await generateViaGateway(prompt, { feature: 'document.generate' });
    return text;
  } catch (e) {
  const msg = (e as Error)?.message || 'unknown error';
  console.warn('[onDeviceAiService] gateway call failed:', msg);
  throw new Error(msg);
  }
}
