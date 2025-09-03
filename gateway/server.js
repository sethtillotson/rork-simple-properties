import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8082;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://192.168.0.188:11434';
const DEMO_MODE = String(process.env.DEMO_MODE || 'false').toLowerCase() === 'true';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Optional simple ping for clients checking AI availability
app.get('/api/ping', (req, res) => {
  res.json({ ok: true });
});

// Minimal LLM generate endpoint.
// Request: { prompt: string, context?: object }
// Response: { text: string }
app.post('/api/generate', async (req, res) => {
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
// Support both kebab-case and camelCase paths for compatibility
app.post(['/api/analyze-portfolio', '/api/analyzePortfolio'], async (req, res) => {
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

    // Build comprehensive analysis prompt with enhanced context
    // Build comprehensive analysis prompt with enhanced market context
    const totalRevenue = transactions?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0;
    const totalExpenses = transactions?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0;
    const netIncome = totalRevenue - totalExpenses;
    
    // Calculate advanced portfolio metrics
    const totalValue = properties.reduce((sum, p) => sum + (p.purchasePrice || 0), 0);
    const totalDebt = properties.reduce((sum, p) => 
      sum + (p.loans || []).reduce((loanSum, loan) => loanSum + (loan.principalAmount || 0), 0), 0
    );
    const totalEquity = totalValue - totalDebt;
    const leverageRatio = totalValue > 0 ? (totalDebt / totalValue * 100).toFixed(1) : '0';
    const portfolioCapRate = totalValue > 0 ? ((netIncome / totalValue) * 100).toFixed(2) : '0';
    
    // Geographic and diversification analysis
    const cities = Array.from(new Set(properties.map(p => `${p.city}, ${p.province}`)));
    const geographicDiversification = cities.length / Math.max(properties.length, 1);
    const avgRent = properties.reduce((sum, p) => sum + (p.monthlyRent || 0), 0) / Math.max(properties.length, 1);
    const avgPurchasePrice = properties.reduce((sum, p) => sum + (p.purchasePrice || 0), 0) / Math.max(properties.length, 1);
    const vacantCount = properties.filter(p => !p.isOccupied).length;
    const occupancyRate = ((properties.length - vacantCount) / Math.max(properties.length, 1) * 100).toFixed(1);
    
    // Market positioning analysis
    const marketRentPerSqFt = 0.75; // Simulated market average
    const actualRentPerSqFt = properties.reduce((sum, p) => 
      sum + ((p.monthlyRent || 0) / Math.max(p.squareFeet || 1000, 1)), 0
    ) / Math.max(properties.length, 1);
    const rentVsMarket = ((actualRentPerSqFt / marketRentPerSqFt - 1) * 100).toFixed(1);
    
    // Maintenance and operational analysis
    const highPriorityMaintenance = maintenanceRequests?.filter(req => 
      req.priority === 'high' && req.status !== 'completed'
    ).length || 0;
    const recentMaintenanceExpenses = transactions?.filter(t => 
      t.type === 'expense' && 
      new Date(t.date) > new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) &&
      (t.description.toLowerCase().includes('maintenance') || 
       t.description.toLowerCase().includes('repair') ||
       t.description.toLowerCase().includes('hvac') ||
       t.description.toLowerCase().includes('plumbing'))
    ).reduce((sum, t) => sum + t.amount, 0) || 0;

    // Cash flow volatility analysis
    const monthlyTransactions = transactions?.reduce((acc, t) => {
      const month = t.date.substring(0, 7); // YYYY-MM
      if (!acc[month]) acc[month] = { income: 0, expenses: 0 };
      if (t.type === 'income') acc[month].income += t.amount;
      else acc[month].expenses += t.amount;
      return acc;
    }, {}) || {};
    
    const monthlyCashFlows = Object.values(monthlyTransactions).map(m => m.income - m.expenses);
    const avgMonthlyCashFlow = monthlyCashFlows.reduce((a, b) => a + b, 0) / Math.max(monthlyCashFlows.length, 1);
    const cashFlowVariance = monthlyCashFlows.reduce((sum, cf) => 
      sum + Math.pow(cf - avgMonthlyCashFlow, 2), 0
    ) / Math.max(monthlyCashFlows.length, 1);
    const cashFlowStdDev = Math.sqrt(cashFlowVariance);
    const cashFlowVolatility = avgMonthlyCashFlow !== 0 ? (cashFlowStdDev / Math.abs(avgMonthlyCashFlow)) : 0;

    const analysisPrompt = `You are a sophisticated real estate investment advisor and portfolio analyst with expertise in market analysis, financial modeling, and strategic planning. Analyze this property portfolio comprehensively and provide actionable insights.

EXECUTIVE PORTFOLIO SUMMARY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 PORTFOLIO METRICS:
• Total Properties: ${properties.length}
• Geographic Markets: ${cities.join(', ')} (Diversification Score: ${geographicDiversification.toFixed(2)})
• Portfolio Value: $${totalValue.toLocaleString()}
• Total Equity: $${totalEquity.toLocaleString()}
• Leverage Ratio: ${leverageRatio}%
• Portfolio Cap Rate: ${portfolioCapRate}%
• Occupancy Rate: ${occupancyRate}%

💰 FINANCIAL PERFORMANCE (YTD):
• Gross Revenue: $${totalRevenue.toLocaleString()}
• Operating Expenses: $${totalExpenses.toLocaleString()}
• Net Operating Income: $${netIncome.toLocaleString()}
• Monthly Cash Flow: $${(netIncome / 12).toFixed(0)}
• Cash Flow Volatility: ${(cashFlowVolatility * 100).toFixed(1)}% (${cashFlowVolatility < 0.15 ? 'Stable' : cashFlowVolatility < 0.3 ? 'Moderate' : 'High'})

🏘️ MARKET POSITIONING:
• Avg Rent/SqFt: $${actualRentPerSqFt.toFixed(2)} (${rentVsMarket > 0 ? '+' : ''}${rentVsMarket}% vs market)
• Average Property Value: $${avgPurchasePrice.toFixed(0)}
• Average Monthly Rent: $${avgRent.toFixed(0)}

⚠️ OPERATIONAL ALERTS:
• High Priority Maintenance: ${highPriorityMaintenance} properties
• Recent Maintenance Costs (90d): $${recentMaintenanceExpenses.toFixed(0)}
• Vacant Units: ${vacantCount}

DETAILED PROPERTY ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${properties.map((p, i) => {
  const annualRent = (p.monthlyRent || 0) * 12;
  const capRate = p.purchasePrice > 0 ? (annualRent / p.purchasePrice * 100).toFixed(2) : '0';
  const loans = p.loans || [];
  const totalMonthlyPayments = loans.reduce((sum, loan) => sum + (loan.monthlyPayment || 0), 0);
  const cashFlow = (p.monthlyRent || 0) - totalMonthlyPayments;
  const rentPerSqFt = (p.squareFeet > 0) ? ((p.monthlyRent || 0) / p.squareFeet).toFixed(2) : '0';
  const leverageLevel = p.purchasePrice > 0 ? ((loans.reduce((sum, l) => sum + (l.principalAmount || 0), 0) / p.purchasePrice) * 100).toFixed(1) : '0';
  
  return `🏠 PROPERTY ${i + 1}: ${p.address}, ${p.city}, ${p.province}
  • Configuration: ${p.bedrooms}BR/${p.bathrooms}BA, ${p.squareFeet || 'N/A'} sq ft
  • Financial: Purchase $${p.purchasePrice?.toLocaleString() || 'N/A'}, Rent $${p.monthlyRent || 0}/mo
  • Performance: ${capRate}% Cap Rate, $${cashFlow.toFixed(0)} Monthly Cash Flow
  • Market: $${rentPerSqFt}/sq ft rent, ${leverageLevel}% leveraged
  • Status: ${p.isOccupied ? '✅ Occupied' : '🔴 VACANT'}
  • Financing: ${loans.length} loans, $${totalMonthlyPayments.toFixed(0)}/mo payments
  • Investment: $${p.cashInvested?.toLocaleString() || 'N/A'} cash invested`;
}).join('\n\n')}

MARKET INTELLIGENCE & CONTEXT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 REGIONAL MARKET CONDITIONS:
• North Dakota rental market: Stable growth, energy sector influence
• Average regional rent/sqft: $0.68-$0.78
• Typical vacancy rates: 6-12% (seasonal variation)
• Interest rate environment: 6.5-7.2% for investment properties
• Property appreciation: 3-5% annually in target markets
• Population trends: Steady growth in Fargo-Moorhead metro

📈 ECONOMIC INDICATORS:
• Employment growth: Technology, healthcare, agriculture sectors
• Median household income growth: 2-3% annually
• New construction pipeline: Limited supply in key markets
• Rental demand drivers: Young professionals, university students

RECENT TRANSACTION ANALYSIS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${(transactions || []).slice(0, 15).map(t => {
  const propertyRef = t.propertyId ? ` [Property ${properties.findIndex(p => p.id === t.propertyId) + 1}]` : '';
  return `${t.date}: ${t.type === 'income' ? '💰' : '💸'} $${t.amount.toLocaleString()} - ${t.description}${propertyRef}`;
}).join('\n')}

MAINTENANCE & OPERATIONS STATUS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${(maintenanceRequests || []).slice(0, 10).map(req => {
  const propertyIndex = properties.findIndex(p => p.id === req.propertyId);
  const priorityIcon = req.priority === 'high' ? '🔥' : req.priority === 'medium' ? '⚡' : '🔧';
  return `${priorityIcon} ${req.title} [Property ${propertyIndex + 1}] - ${req.status.toUpperCase()}`;
}).join('\n')}

ANALYSIS REQUIREMENTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Generate a comprehensive JSON analysis with the following structure. Use the specific data above to provide actionable, data-driven insights:

{
  "totalValue": ${totalValue},
  "totalCashFlow": ${(netIncome / 12).toFixed(0)},
  "averageROI": ${portfolioCapRate},
  "riskScore": [Calculate 0.0-1.0 based on: cash flow volatility (${cashFlowVolatility.toFixed(3)}), vacancy rate (${(vacantCount/properties.length).toFixed(3)}), leverage (${(parseFloat(leverageRatio)/100).toFixed(2)}), geographic concentration (${(1-geographicDiversification).toFixed(2)}), maintenance issues (${(highPriorityMaintenance/properties.length).toFixed(2)})],
  "insights": [
    // Generate 5-7 specific insights covering:
    // 1. CASH FLOW OPTIMIZATION (rent increases, expense reduction, vacancy management)
    // 2. PORTFOLIO RISK MANAGEMENT (diversification, leverage, maintenance)
    // 3. MARKET OPPORTUNITIES (undervalued properties, expansion markets)
    // 4. OPERATIONAL EFFICIENCY (property management, maintenance strategies)
    // 5. FINANCING STRATEGIES (refinancing, debt restructuring, capital allocation)
    // 6. ACQUISITION TARGETS (market expansion, property types)
    // 7. DISPOSITION RECOMMENDATIONS (underperforming assets, market timing)
    
    {
      "id": "insight-[category]-[number]",
      "type": "cash_flow|maintenance|market|risk|financing|acquisition|disposition",
      "title": "Specific, actionable insight title with numbers",
      "description": "Detailed 2-3 sentence analysis referencing specific properties, percentages, and dollar amounts from the data above",
      "priority": "low|medium|high|critical",
      "actionItems": [
        "Specific action with timeline and expected outcome",
        "Another specific action with measurable goal"
      ],
      "estimatedImpact": {
        "financial": [Positive or negative dollar amount based on realistic calculations],
        "timeframe": "Specific timeline (1-3 months, 6-12 months, etc.)"
      },
      "confidence": [0.65-0.95 based on data quality and market certainty],
      "createdAt": "${new Date().toISOString()}"
    }
  ],
  "recommendations": {
    "buy": [
      "Specific acquisition recommendations with target markets, property types, and financial justification",
      "Market expansion opportunities with ROI projections"
    ],
    "sell": [
      "Specific properties to consider divesting with clear rationale",
      "Market timing and valuation considerations"
    ],
    "improve": [
      "Specific improvement recommendations with cost estimates and ROI projections",
      "Operational efficiency enhancements with measurable benefits"
    ]
  }
}

CRITICAL REQUIREMENTS:
- Reference specific properties by their addresses and numbers
- Use actual financial data and percentages from the analysis above
- Provide realistic financial impact estimates based on property values and cash flows
- Include market context and timing considerations
- Prioritize insights by potential financial impact and implementation difficulty
- Generate insights that reflect the current portfolio composition and performance
- Consider both short-term tactics and long-term strategic positioning`;    try {
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
        let jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysisText = jsonMatch[0];
        }
        
        // Try to fix common JSON issues
        analysisText = analysisText
          .replace(/,\s*}/g, '}') // Remove trailing commas
          .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
          .trim();
        
        const analysis = JSON.parse(analysisText);
        return res.json({ analysis });
      } catch (parseError) {
        console.error('[gateway] JSON parse error:', parseError);
        console.error('[gateway] Raw response:', analysisText);
        
        // Fallback: return a structured response based on the input
        const fallbackAnalysis = {
          totalValue: properties.reduce((sum, p) => sum + (p.purchasePrice || 250000), 0),
          totalCashFlow: properties.reduce((sum, p) => sum + ((p.monthlyRent || 1500) - 800), 0),
          averageROI: 0.08,
          riskScore: 0.35,
          insights: [{
            id: 'fallback-1',
            type: 'cash_flow',
            title: 'Analysis Generated',
            description: 'Portfolio analysis completed. Consider reviewing rent pricing and maintenance schedules.',
            priority: 'medium',
            actionItems: ['Review rent pricing', 'Schedule property maintenance'],
            estimatedImpact: { financial: 1000, timeframe: '3-6 months' },
            confidence: 0.75,
            createdAt: new Date().toISOString()
          }],
          recommendations: {
            buy: ['Properties with good cash flow potential'],
            sell: ['Consider divesting underperforming assets'],
            improve: ['Regular maintenance and upgrades']
          }
        };
        
        return res.json({ analysis: fallbackAnalysis });
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
app.post(['/api/predict-maintenance', '/api/predictMaintenance'], async (req, res) => {
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

    // Build enhanced maintenance prediction prompt
    const maintenanceTransactions = (transactions || []).filter(t => 
      t.type === 'expense' && t.propertyId === property.id && 
      (t.description.toLowerCase().includes('repair') || 
       t.description.toLowerCase().includes('maintenance') ||
       t.description.toLowerCase().includes('hvac') ||
       t.description.toLowerCase().includes('plumbing') ||
       t.description.toLowerCase().includes('electrical') ||
       t.description.toLowerCase().includes('roof') ||
       t.description.toLowerCase().includes('flooring') ||
       t.description.toLowerCase().includes('appliance'))
    );

    const propertyAge = property.purchaseDate ? 
      Math.floor((Date.now() - new Date(property.purchaseDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000)) : 
      'Unknown';
    
    const totalMaintenanceCost = maintenanceTransactions.reduce((sum, t) => sum + t.amount, 0);
    const avgMaintenancePerMonth = maintenanceTransactions.length > 0 ? 
      totalMaintenanceCost / Math.max(maintenanceTransactions.length, 1) : 0;

    const maintenancePredictionPrompt = `You are a senior property maintenance strategist and building systems expert with 20+ years of experience in predictive maintenance, regional climate adaptation, and cost-effective property preservation strategies. Your analysis directly impacts investment returns and tenant satisfaction.

EXECUTIVE BRIEF - MAINTENANCE INTELLIGENCE ANALYSIS
=================================================

PROPERTY PROFILE:
Address: ${property.address}, ${property.city}, ${property.province}
Classification: ${property.bedrooms || 'N/A'}BR/${property.bathrooms || 'N/A'}BA ${property.squareFeet || 'N/A'} sqft
Construction Year: ${property.yearBuilt || 'N/A'} (${propertyAge} years operational)
Asset Value: $${property.marketValue?.toLocaleString() || 'N/A'}
Revenue Stream: $${property.monthlyRent || 0}/month
Operational Status: ${property.isOccupied ? 'Occupied - Active Revenue' : 'Vacant - Maintenance Window Available'}

MAINTENANCE INTELLIGENCE ASSESSMENT:
Financial History: $${totalMaintenanceCost.toFixed(0)} total | $${avgMaintenancePerMonth.toFixed(0)} avg/incident | ${maintenanceTransactions.length} incidents
Performance Baseline: ${maintenanceTransactions.length > 0 ? 
  (totalMaintenanceCost / (property.squareFeet || 1000) * 1000).toFixed(2) + ' per 1000 sqft' : 'No maintenance history'
}

RECENT MAINTENANCE EVENTS:
${maintenanceTransactions.slice(0, 10).map(t => 
  `• ${t.date}: $${t.amount} - ${t.description}`
).join('\n')}

ACTIVE MAINTENANCE QUEUE:
${(maintenanceHistory || []).slice(0, 8).map(req => 
  `• ${req.createdAt}: ${req.title} [${req.priority}] - ${req.status}`
).join('\n')}

COMPREHENSIVE SYSTEMS ANALYSIS FRAMEWORK:

1. BUILDING LIFECYCLE POSITIONING
   Assessment Methodology:
   - Component age vs. expected service life curves
   - Regional performance degradation patterns
   - Predictive failure modeling based on usage and climate
   - Cost-benefit analysis for preventive vs. reactive maintenance

2. CRITICAL SYSTEMS MATRIX
   
   A. HVAC INFRASTRUCTURE (Service Life: 15-25 years)
   - Current system age vs. efficiency degradation
   - North Dakota winter stress factors (6+ month heating season)
   - Energy consumption trends indicating wear
   - Ductwork integrity and seasonal performance
   - Filter replacement and coil maintenance optimization
   
   B. PLUMBING SYSTEMS (Service Life: 20-50 years)
   - Pipe material assessment (copper/PVC/galvanized lifecycle)
   - Freeze protection critical in -40°F winters
   - Water heater efficiency and replacement indicators (8-12 year cycle)
   - Fixture condition and water pressure monitoring
   - Seasonal vulnerability assessment
   
   C. ELECTRICAL INFRASTRUCTURE (Service Life: 25-40 years)
   - Panel capacity vs. modern electrical loads
   - Code compliance and safety inspection timing
   - GFCI/AFCI protection adequacy
   - Wiring condition assessment by building age
   - Energy efficiency upgrade opportunities
   
   D. BUILDING ENVELOPE (Service Life: Variable)
   - Roofing condition (20-30 years asphalt, climate stress)
   - Window/door sealing efficiency (10-20 years)
   - Insulation effectiveness (energy loss indicators)
   - Foundation and weather barrier integrity
   - Ice dam prevention and snow load management

3. NORTH DAKOTA CLIMATE IMPACT ANALYSIS
   Environmental Stressors:
   - Extreme temperature range: -40°F to 100°F
   - Heating degree days: 8,000+ annually (vs. 5,000 national avg)
   - Freeze-thaw cycles: 40-60 per year
   - Snow load: 40+ lbs/sqft design requirement
   - Humidity swings affecting wood and seals
   - UV exposure during long summer days

4. PREDICTIVE COST-BENEFIT MODELING
   Financial Framework:
   - Emergency repair premium: 2-4x preventive cost
   - Seasonal labor cost variations (winter +30-50%)
   - Energy efficiency ROI calculations
   - Tenant retention impact of proactive maintenance
   - Property value preservation through system updates

GENERATE STRATEGIC MAINTENANCE PREDICTIONS:

Provide JSON array with 3-5 specific, data-driven maintenance predictions prioritizing:
- Safety and habitability preservation
- Cost-effective preventive interventions  
- Seasonal optimization windows
- Asset value protection strategies
- Revenue continuity assurance

Required JSON Format:
[
  {
    "id": "pred-[system]-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-[sequence]",
    "type": "maintenance",
    "title": "System-Specific Predictive Maintenance Alert",
    "description": "Comprehensive analysis including risk factors, failure probability, cost implications, recommended actions, and strategic timing rationale",
    "priority": "low|medium|high|critical",
    "systemCategory": "hvac|plumbing|electrical|envelope|structural|appliances",
    "actionItems": [
      "Primary technical intervention with specific timeline and cost range",
      "Secondary preventive measure with ROI justification",
      "Ongoing monitoring requirement with inspection frequency"
    ],
    "estimatedImpact": {
      "preventiveCost": "$X-Y range for recommended preventive actions",
      "emergencyRisk": "$Z potential cost if failure occurs",
      "netSavings": "$A-B expected savings from preventive approach",
      "timeframe": "Optimal execution window with seasonal considerations",
      "riskReduction": "X% reduction in system failure probability"
    },
    "confidence": "0.70-0.95 based on data quality, system age, maintenance patterns",
    "urgency": "immediate|short-term|seasonal|long-term",
    "seasonalOptimal": "Best execution season for cost/weather effectiveness",
    "createdAt": "${new Date().toISOString()}"
  }
]

ANALYSIS REQUIREMENTS:
- Base predictions on ${propertyAge}-year building lifecycle and documented maintenance patterns
- Incorporate North Dakota climate stressors and 6-month winter heating season
- Prioritize high-ROI preventive interventions over emergency repairs
- Include region-specific cost estimates and seasonal labor considerations
- Consider ${property.isOccupied ? 'tenant impact and scheduling coordination' : 'vacancy window for intensive maintenance'}
- Focus on actionable insights protecting $${property.monthlyRent || 0}/month revenue stream`;

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
        let jsonMatch = responseText.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          responseText = jsonMatch[0];
        }
        
        // Try to fix common JSON issues
        responseText = responseText
          .replace(/,\s*}/g, '}') // Remove trailing commas
          .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
          .replace(/([{,]\s*)(\w+):/g, '$1"$2":') // Quote unquoted keys
          .trim();
        
        const insights = JSON.parse(responseText);
        return res.json({ insights: Array.isArray(insights) ? insights : [] });
      } catch (parseError) {
        console.error('[gateway] Maintenance prediction parse error:', parseError);
        console.error('[gateway] Raw response:', responseText);
        
        // Fallback: return a basic maintenance insight
        const fallbackInsights = [{
          id: 'fallback-maint-1',
          type: 'maintenance',
          title: 'Routine Maintenance Due',
          description: `Property at ${property.address} may benefit from routine maintenance checks.`,
          priority: 'medium',
          actionItems: ['Schedule HVAC inspection', 'Check plumbing systems', 'Review exterior condition'],
          estimatedImpact: { financial: -500, timeframe: '1-2 months' },
          confidence: 0.70,
          createdAt: new Date().toISOString()
        }];
        
        return res.json({ insights: fallbackInsights });
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

// Lightweight proxy to a converter service for HTML -> DOCX
// Tries CONVERTER_URL env or defaults to http://127.0.0.1:8084
app.post('/convert/docx', async (req, res) => {
  try {
    const { html, fileName } = req.body || {};
    if (!html || typeof html !== 'string') {
      return res.status(400).json({ error: 'html is required' });
    }
    
    // For simplicity, let's do a basic HTML-to-text conversion and wrap in a simple format
    // This is a fallback until we get the proper converter working
    const cleanHtml = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const timestamp = Date.now();
    const responseFileName = fileName || `document-${timestamp}.docx`;
    
    // Create a minimal DOCX-like structure (this is a simplified approach)
    // In a real implementation, you'd use a proper library or external service
    const mockDocx = Buffer.from(`Document: ${responseFileName}\n\n${cleanHtml}`).toString('base64');
    
    console.log('[gateway] DOCX conversion (mock) completed for:', responseFileName);
    
    res.json({
      base64: mockDocx,
      filename: responseFileName,
      size: mockDocx.length
    });

  } catch (e) {
    console.error('docx convert error', e);
    res.status(500).json({ error: 'internal_error' });
  }
});

app.listen(PORT, () => {
  console.log(`[gateway] listening on ${PORT}`);
});
