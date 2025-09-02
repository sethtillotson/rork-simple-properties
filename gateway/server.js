import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8082;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://ollama-gpu.default.svc.cluster.local:11434';
const DEMO_MODE = String(process.env.DEMO_MODE || 'false').toLowerCase() === 'true';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Minimal LLM generate endpoint.
// Request: { prompt: string, context?: object }
// Response: { text: string }
app.post('/ai/generate', async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt is required' });
    }

    if (DEMO_MODE) {
      // Lightweight demo output so client can render something while LLM is offline
      const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>
      <title>Generated Document (Demo)</title>
      <style>body{font-family: -apple-system, Segoe UI, Roboto, sans-serif; padding:16px; line-height:1.5} h1{margin:0 0 8px} .muted{color:#6b7280}</style>
      </head><body>
        <h1>Generated Document (Demo)</h1>
        <p class="muted">This is demo output from the gateway while the AI backend is offline.</p>
        <h3>Prompt</h3>
        <pre style="white-space:pre-wrap; background:#f9fafb; border:1px solid #eee; padding:12px; border-radius:8px;">${prompt.replace(/[<>&]/g, s => ({'<':'&lt;','>':'&gt;','&':'&amp;'}[s] || s))}</pre>
        <h3>Content</h3>
        <p>Use Settings → Gateway URL when you switch to the real backend. Once Ollama is reachable, disable DEMO_MODE to get real AI output.</p>
      </body></html>`;
      return res.json({ text: html });
    }

    // Try Ollama first
    try {
      const rsp = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.LLM_MODEL || 'llama3.1:8b-instruct-q4_K_M',
          prompt,
          stream: false,
          options: { temperature: 0.4 },
        }),
      });
      if (!rsp.ok) throw new Error(`ollama error ${rsp.status}`);
      const data = await rsp.json();
      // Ollama returns { response: string, ... }
      const text = data?.response ?? JSON.stringify(data);
      return res.json({ text });
    } catch (e) {
      console.error('[gateway] ollama unreachable or failed:', e);
      return res.status(502).json({ error: 'ollama_unreachable', detail: (e && e.message) || 'unreachable' });
    }
  } catch (e) {
    console.error('generate error', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Investment Analysis endpoint
// Request: { properties: Property[], transactions: Transaction[], maintenanceRequests: MaintenanceRequest[] }
// Response: { analysis: PortfolioAnalysis }
app.post('/ai/analyze-portfolio', async (req, res) => {
  try {
    const { properties, transactions, maintenanceRequests } = req.body || {};
    
    if (!properties || !Array.isArray(properties)) {
      return res.status(400).json({ error: 'properties array is required' });
    }

    if (DEMO_MODE) {
      // Demo response with realistic data
      const demoAnalysis = {
        totalValue: properties.reduce((sum, p) => sum + (p.purchasePrice || 250000), 0),
        totalCashFlow: properties.reduce((sum, p) => sum + ((p.monthlyRent || 1500) - 800), 0),
        averageROI: 0.08,
        riskScore: 0.35,
        insights: [
          {
            id: 'demo-1',
            type: 'cash_flow',
            title: 'Optimize Rent Pricing',
            description: 'Based on your portfolio analysis, 2 properties are priced below market rate. Consider gradual rent increases.',
            priority: 'medium',
            actionItems: [
              'Research comparable properties in your area',
              'Schedule property improvements to justify rent increase',
              'Prepare 60-day notice for tenants'
            ],
            estimatedImpact: {
              financial: 2400,
              timeframe: '3-6 months'
            },
            confidence: 0.85,
            createdAt: new Date().toISOString()
          },
          {
            id: 'demo-2',
            type: 'maintenance',
            title: 'Preventive HVAC Maintenance',
            description: 'Your properties averaging 15+ years old are due for HVAC system checks to avoid costly emergency repairs.',
            priority: 'high',
            actionItems: [
              'Schedule HVAC inspections for all properties',
              'Budget $800-1200 per property for maintenance',
              'Consider upgrading to energy-efficient systems for tax benefits'
            ],
            estimatedImpact: {
              financial: -3600,
              timeframe: '1-2 months'
            },
            confidence: 0.92,
            createdAt: new Date().toISOString()
          },
          {
            id: 'demo-3',
            type: 'market',
            title: 'Market Expansion Opportunity',
            description: 'Current market conditions favor expansion. Your portfolio shows strong performance indicators for scaling.',
            priority: 'low',
            actionItems: [
              'Secure pre-approval for additional financing',
              'Target properties in similar neighborhoods',
              'Maintain 6-month operating expense reserve'
            ],
            estimatedImpact: {
              financial: 15000,
              timeframe: '12-18 months'
            },
            confidence: 0.72,
            createdAt: new Date().toISOString()
          }
        ],
        recommendations: {
          buy: [
            'Single-family homes in established neighborhoods with good schools',
            'Properties with 1% rule potential (monthly rent >= 1% of purchase price)',
            'Fixer-uppers with 20-30% equity upside after improvements'
          ],
          sell: [
            'Consider divesting properties with consistent negative cash flow',
            'Evaluate selling properties in declining neighborhoods'
          ],
          improve: [
            'Add in-unit laundry to increase rent by $50-100/month',
            'Update kitchens and bathrooms for higher tenant retention',
            'Improve energy efficiency for lower operating costs'
          ]
        }
      };
      return res.json({ analysis: demoAnalysis });
    }

    // Build comprehensive analysis prompt
    const totalRevenue = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;
    
    const analysisPrompt = `
You are an expert real estate investment advisor. Analyze this property portfolio and provide actionable insights in JSON format.

PORTFOLIO DATA:
Properties: ${properties.length}
Total Revenue (YTD): $${totalRevenue}
Total Expenses (YTD): $${totalExpenses}
Net Income: $${totalRevenue - totalExpenses}

PROPERTIES DETAIL:
${properties.map(p => `
- ${p.address}: $${p.monthlyRent || 0}/month, ${p.bedrooms}BR/${p.bathrooms}BA
  Purchase: $${p.purchasePrice || 'N/A'}, Cash Invested: $${p.cashInvested || 'N/A'}
  Occupied: ${p.isOccupied ? 'Yes' : 'No'}
  Loans: ${(p.loans || []).length} totaling $${(p.loans || []).reduce((sum, l) => sum + (l.monthlyPayment * 12), 0)}/year
`).join('')}

RECENT TRANSACTIONS:
${(transactions || []).slice(0, 15).map(t => 
  `${t.date}: ${t.type === 'income' ? '+' : '-'}$${t.amount} - ${t.description}`
).join('\n')}

MAINTENANCE ISSUES:
${(maintenanceRequests || []).slice(0, 10).map(req => 
  `${req.createdAt}: ${req.title} (${req.priority}) - ${req.status}`
).join('\n')}

Provide response in this exact JSON format:
{
  "totalValue": number,
  "totalCashFlow": number,
  "averageROI": number,
  "riskScore": number,
  "insights": [
    {
      "id": "string",
      "type": "cash_flow|maintenance|tenant|market|risk",
      "title": "string",
      "description": "string",
      "priority": "low|medium|high",
      "actionItems": ["string"],
      "estimatedImpact": {
        "financial": number,
        "timeframe": "string"
      },
      "confidence": number,
      "createdAt": "ISO_DATE"
    }
  ],
  "recommendations": {
    "buy": ["string"],
    "sell": ["string"],
    "improve": ["string"]
  }
}

Focus on actionable, data-driven insights with specific financial impacts and timelines.`;

    try {
      const rsp = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.LLM_MODEL || 'llama3.1:8b-instruct-q4_K_M',
          prompt: analysisPrompt,
          stream: false,
          options: { temperature: 0.3, top_p: 0.9 },
        }),
      });
      
      if (!rsp.ok) throw new Error(`ollama error ${rsp.status}`);
      const data = await rsp.json();
      let analysisText = data?.response || '';
      
      // Clean and parse JSON response
      try {
        // Remove code blocks and extra text
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisText = jsonMatch[0];
        }
        
        const analysis = JSON.parse(analysisText);
        return res.json({ analysis });
      } catch (parseError) {
        console.error('[gateway] JSON parse error:', parseError);
        return res.status(500).json({ error: 'failed_to_parse_analysis', detail: analysisText.substring(0, 200) });
      }
      
    } catch (e) {
      console.error('[gateway] portfolio analysis failed:', e);
      return res.status(502).json({ error: 'ollama_unreachable', detail: (e && e.message) || 'unreachable' });
    }
    
  } catch (e) {
    console.error('portfolio analysis error', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

// Maintenance Prediction endpoint
app.post('/ai/predict-maintenance', async (req, res) => {
  try {
    const { property, maintenanceHistory, transactions } = req.body || {};
    
    if (!property) {
      return res.status(400).json({ error: 'property is required' });
    }

    if (DEMO_MODE) {
      const demoInsights = [
        {
          id: 'demo-maint-1',
          type: 'maintenance',
          title: 'HVAC System Service Due',
          description: `Based on the age and usage patterns of ${property.address}, the HVAC system is due for preventive maintenance. Regular service can extend system life by 5-7 years.`,
          priority: 'medium',
          actionItems: [
            'Schedule HVAC inspection within 30 days',
            'Replace air filters (every 3 months)',
            'Check refrigerant levels and ductwork',
            'Budget $300-500 for routine maintenance'
          ],
          estimatedImpact: {
            financial: -400,
            timeframe: '1-2 months'
          },
          confidence: 0.78,
          createdAt: new Date().toISOString()
        }
      ];
      return res.json({ insights: demoInsights });
    }

    // Build maintenance prediction prompt
    const maintenanceTransactions = (transactions || []).filter(t => 
      t.type === 'expense' && t.propertyId === property.id && 
      (t.description.toLowerCase().includes('repair') || 
       t.description.toLowerCase().includes('maintenance') ||
       t.description.toLowerCase().includes('hvac') ||
       t.description.toLowerCase().includes('plumbing'))
    );

    const maintenancePredictionPrompt = `
Analyze maintenance patterns for this property and predict future needs. Return a JSON array of maintenance insights.

Property: ${property.address}
Type: ${property.bedrooms || 'N/A'}BR/${property.bathrooms || 'N/A'}BA, ${property.squareFeet || 'N/A'} sq ft

Recent Maintenance History:
${(maintenanceHistory || []).slice(0, 10).map(req => 
  `- ${req.createdAt}: ${req.title} (${req.priority} priority) - ${req.description}`
).join('\n')}

Maintenance Expenses (Recent):
${maintenanceTransactions.slice(0, 15).map(t => 
  `- ${t.date}: $${t.amount} - ${t.description}`
).join('\n')}

Based on property age, past maintenance patterns, and typical system lifecycles, predict upcoming maintenance needs.

Respond with JSON array in this format:
[
  {
    "id": "unique-id",
    "type": "maintenance",
    "title": "Specific maintenance prediction",
    "description": "Detailed explanation with reasoning",
    "priority": "low|medium|high",
    "actionItems": ["specific action 1", "specific action 2"],
    "estimatedImpact": {
      "financial": estimated_cost_number,
      "timeframe": "time period"
    },
    "confidence": 0.0-1.0,
    "createdAt": "${new Date().toISOString()}"
  }
]

Focus on predictive insights based on maintenance cycles, property age, and past issues.`;

    try {
      const rsp = await fetch(`${OLLAMA_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.LLM_MODEL || 'llama3.1:8b-instruct-q4_K_M',
          prompt: maintenancePredictionPrompt,
          stream: false,
          options: { temperature: 0.3, top_p: 0.9 },
        }),
      });
      
      if (!rsp.ok) throw new Error(`ollama error ${rsp.status}`);
      const data = await rsp.json();
      let responseText = data?.response || '';
      
      try {
        const jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          responseText = jsonMatch[0];
        }
        
        const insights = JSON.parse(responseText);
        return res.json({ insights: Array.isArray(insights) ? insights : [] });
      } catch (parseError) {
        console.error('[gateway] Maintenance prediction parse error:', parseError);
        return res.status(500).json({ error: 'failed_to_parse_maintenance_prediction', detail: responseText.substring(0, 200) });
      }
      
    } catch (e) {
      console.error('[gateway] maintenance prediction failed:', e);
      return res.status(502).json({ error: 'ollama_unreachable', detail: (e && e.message) || 'unreachable' });
    }
    
  } catch (e) {
    console.error('maintenance prediction error', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.listen(PORT, () => {
  console.log(`[gateway] listening on ${PORT}`);
});
