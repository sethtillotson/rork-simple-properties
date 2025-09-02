import AsyncStorage from '@react-native-async-storage/async-storage';

type GatewayConfig = {
  baseUrl?: string; // e.g., https://pi4.local or https://gateway.example.com
  apiToken?: string; // optional bearer token
};

const STORAGE_KEYS = {
  baseUrl: 'ai_gateway_base_url',
  apiToken: 'ai_gateway_api_token',
} as const;

export async function getConfig(): Promise<GatewayConfig> {
  const [baseUrl, apiToken] = await Promise.all([
    AsyncStorage.getItem(STORAGE_KEYS.baseUrl),
    AsyncStorage.getItem(STORAGE_KEYS.apiToken),
  ]);
  return { baseUrl: baseUrl ?? undefined, apiToken: apiToken ?? undefined };
}

export async function setConfig(cfg: GatewayConfig): Promise<void> {
  const ops: Array<Promise<void>> = [];
  if (cfg.baseUrl != null) {
    ops.push(AsyncStorage.setItem(STORAGE_KEYS.baseUrl, cfg.baseUrl));
  }
  if (cfg.apiToken != null) {
    ops.push(AsyncStorage.setItem(STORAGE_KEYS.apiToken, cfg.apiToken));
  }
  await Promise.all(ops);
}

function withTimeout<T>(p: Promise<T>, ms = 20000): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`Request timed out after ${ms}ms`)), ms);
    p.then((v) => { clearTimeout(id); resolve(v); }, (e) => { clearTimeout(id); reject(e); });
  });
}

function buildHeaders(token?: string): HeadersInit {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  if (token && token.length > 0) {
    h['Authorization'] = `Bearer ${token}`;
  }
  return h;
}

async function doFetch<T>(method: 'GET' | 'POST', url: string, body?: unknown, token?: string): Promise<T> {
  const res = await withTimeout(fetch(url, {
    method,
    headers: buildHeaders(token),
    body: body != null ? JSON.stringify(body) : undefined,
  }));
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const msg = `Gateway ${method} ${url} failed: ${res.status} ${res.statusText} ${text}`;
    // Special-case 502 from gateway (ollama unavailable)
    if (res.status === 502) {
      throw new Error('AI backend is unavailable. Check your Ollama service and model.');
    }
    throw new Error(msg);
  }
  // Try JSON first; if not, try text
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}

export async function pingGateway(): Promise<{ ok: boolean; detail?: string }> {
  const { baseUrl, apiToken } = await getConfig();
  if (!baseUrl) return { ok: false, detail: 'No gateway URL set' };
  const base = baseUrl.replace(/\/$/, '');
  // Try common health endpoints fallback chain
  const candidates = [
    `${base}/health`,
    `${base}/.well-known/health`,
    `${base}/ai/ping`,
  ];
  for (const url of candidates) {
    try {
      const data = await doFetch<any>('GET', url, undefined, apiToken);
      if (data) return { ok: true };
      return { ok: true };
    } catch (e: any) {
      // try next
    }
  }
  return { ok: false, detail: 'Health check failed' };
}

export async function generateViaGateway(prompt: string, context?: Record<string, unknown>): Promise<string> {
  const { baseUrl, apiToken } = await getConfig();
  if (!baseUrl) throw new Error('AI gateway is not configured. Please set the Gateway URL in Settings.');
  const url = `${baseUrl.replace(/\/$/, '')}/ai/generate`;
  const payload = { prompt, context };
  const data = await doFetch<any>('POST', url, payload, apiToken);
  // Allow HTML responses now for document rendering; only block known misroutes like Adminer.
  if (typeof data === 'string') {
    if (/Adminer\s*\d|<title>Adminer/i.test(data)) {
      throw new Error('Gateway appears to be routed to Adminer. Update Gateway URL (include port, e.g., :8082).');
    }
    return data;
  }
  if (data && typeof data.text === 'string') return data.text as string;
  // Some gateways return { result } or { output }
  if (data?.result) return String(data.result);
  if (data?.output) return String(data.output);
  // Fallback stringify
  return JSON.stringify(data);
}

export async function analyzePortfolioViaGateway(
  properties: any[],
  transactions: any[],
  maintenanceRequests: any[]
): Promise<any> {
  const { baseUrl, apiToken } = await getConfig();
  if (!baseUrl) throw new Error('AI gateway is not configured. Please set the Gateway URL in Settings.');
  const url = `${baseUrl.replace(/\/$/, '')}/ai/analyze-portfolio`;
  const payload = { properties, transactions, maintenanceRequests };
  const data = await doFetch<any>('POST', url, payload, apiToken);
  return data?.analysis || data;
}

export async function predictMaintenanceViaGateway(
  property: any,
  maintenanceHistory: any[],
  transactions: any[]
): Promise<any[]> {
  const { baseUrl, apiToken } = await getConfig();
  if (!baseUrl) throw new Error('AI gateway is not configured. Please set the Gateway URL in Settings.');
  const url = `${baseUrl.replace(/\/$/, '')}/ai/predict-maintenance`;
  const payload = { property, maintenanceHistory, transactions };
  const data = await doFetch<any>('POST', url, payload, apiToken);
  return data?.insights || [];
}

export async function convertHtmlToDocx(html: string, fileName?: string): Promise<{ base64: string; filename: string }> {
  const { baseUrl, apiToken } = await getConfig();
  if (!baseUrl) throw new Error('AI gateway is not configured. Please set the Gateway URL in Settings.');
  const payload = { html, fileName };
  const primaryUrl = `${baseUrl.replace(/\/$/, '')}/convert/docx`;
  try {
    const data = await doFetch<any>('POST', primaryUrl, payload, apiToken);
    if (!data || typeof data.base64 !== 'string') throw new Error('bad response');
    const filename = typeof data.filename === 'string' ? data.filename : (fileName || `document-${Date.now()}.docx`);
    return { base64: data.base64, filename };
  } catch (_e) {
    // Fallback: try same host on port 8084
    try {
      const u = new URL(baseUrl);
      const fallbackBase = `${u.protocol}//${u.hostname}:8084`;
      const data = await doFetch<any>('POST', `${fallbackBase}/convert/docx`, payload, apiToken);
      if (!data || typeof data.base64 !== 'string') throw new Error('bad response');
      const filename = typeof data.filename === 'string' ? data.filename : (fileName || `document-${Date.now()}.docx`);
      return { base64: data.base64, filename };
    } catch (e2) {
      throw new Error('DOCX conversion failed via gateway and fallback.');
    }
  }
}
