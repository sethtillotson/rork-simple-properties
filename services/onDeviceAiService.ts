import { generateViaGateway } from '@/services/gatewayClient';

function cleanGeneratedText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  
  let cleaned = text.trim();
  
  // Remove code fences and language markers
  cleaned = cleaned.replace(/^```[\w]*\n?/gm, '').replace(/\n?```$/gm, '');
  
  // Remove common AI prefixes and disclaimers
  const prefixPatterns = [
    /^Here's?\s+(a|an|the)\s+[\w\s]*?:/i,
    /^I'll\s+[\w\s]*?:/i,
    /^Based\s+on\s+[\w\s]*?,?\s*here/i,
    /^According\s+to\s+[\w\s]*?,?\s*here/i,
    /^Let\s+me\s+[\w\s]*?:/i,
    /^This\s+(is|appears\s+to\s+be)\s+[\w\s]*?:/i,
  ];
  
  for (const pattern of prefixPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Remove common AI disclaimers and notes
  const disclaimerPatterns = [
    /\*\*?Note:?\*\*?[\s\S]*$/i,
    /\*\*?Disclaimer:?\*\*?[\s\S]*$/i,
    /\*\*?Important:?\*\*?[\s\S]*$/i,
    /Please\s+(note|consult|verify)[\s\S]*$/i,
    /This\s+(document|template)\s+(is|should)[\s\S]*$/i,
  ];
  
  for (const pattern of disclaimerPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }
  
  // Clean up whitespace and formatting
  cleaned = cleaned
    .replace(/\n{3,}/g, '\n\n') // Reduce excessive line breaks
    .replace(/^\s+/gm, '') // Remove leading whitespace on lines
    .trim();
  
  return cleaned;
}

export async function generateDocument(prompt: string): Promise<string> {
  console.log('[onDeviceAiService] generateDocument called with prompt length:', prompt?.length ?? 0);
  try {
    const text = await generateViaGateway(prompt, { feature: 'document.generate' });
    const cleanedText = cleanGeneratedText(text);
    console.log('[onDeviceAiService] generated text length:', text?.length ?? 0, 'cleaned length:', cleanedText?.length ?? 0);
    return cleanedText;
  } catch (e) {
    const msg = (e as Error)?.message || 'unknown error';
    console.warn('[onDeviceAiService] gateway call failed:', msg);
    throw new Error(msg);
  }
}
