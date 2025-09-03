import { generateViaGateway, analyzePortfolioViaGateway, predictMaintenanceViaGateway } from '@/services/gatewayClient';
import { Property, MaintenanceRequest } from '@/types/property';
import { MarketDataService } from '@/services/marketDataService';
import { EnhancedPortfolioAnalyzer } from '@/services/enhancedPortfolioAnalyzer';

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  propertyId: string;
  type: 'income' | 'expense';
}

export interface InvestmentInsight {
  id: string;
  type: 'cash_flow' | 'maintenance' | 'tenant' | 'market' | 'risk';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionItems: string[];
  estimatedImpact: {
    financial?: number;
    timeframe?: string;
  };
  confidence: number; // 0-1 scale
  createdAt: string;
}

export interface PortfolioAnalysis {
  totalValue: number;
  totalCashFlow: number;
  averageROI: number;
  riskScore: number;
  insights: InvestmentInsight[];
  recommendations: {
    buy: string[];
    sell: string[];
    improve: string[];
  };
}

export class InvestmentAdvisorService {
  
  /**
   * Analyzes the entire property portfolio and generates AI-powered insights
   */
  async analyzePortfolio(
    properties: Property[],
    transactions: Transaction[],
    maintenanceRequests: MaintenanceRequest[]
  ): Promise<PortfolioAnalysis> {
    
    try {
      // Get AI-powered analysis from gateway (this is the main analysis)
      const gatewayAnalysis = await analyzePortfolioViaGateway(properties, transactions, maintenanceRequests);
      
      // Enhance with market data insights (for additional context)
      try {
        const enhancedInsights = EnhancedPortfolioAnalyzer.analyzePortfolio(
          properties,
          transactions,
          maintenanceRequests
        );
        
        const enhancedRecommendations = EnhancedPortfolioAnalyzer.generateRecommendations(
          properties,
          enhancedInsights,
          transactions
        );
        
        // Add market-based insights to the analysis
        if (enhancedRecommendations.length > 0) {
          const marketInsights = enhancedRecommendations.slice(0, 3).map(rec => ({
            id: rec.id,
            type: rec.type as 'cash_flow' | 'maintenance' | 'tenant' | 'market' | 'risk',
            title: rec.title,
            description: rec.description,
            priority: rec.priority as 'low' | 'medium' | 'high',
            actionItems: rec.actionItems,
            estimatedImpact: {
              financial: rec.estimatedImpact?.cashFlow || 0,
              timeframe: rec.timeframe
            },
            confidence: rec.confidence,
            createdAt: new Date().toISOString()
          }));
          
          // Merge market insights with gateway analysis
          gatewayAnalysis.insights = [
            ...marketInsights,
            ...gatewayAnalysis.insights
          ].slice(0, 10);
        }
      } catch (enhanceError) {
        console.log('[InvestmentAdvisor] Enhanced analytics failed, using gateway only:', enhanceError);
      }
      
      return this.validateAndNormalizeAnalysis(gatewayAnalysis);
    } catch (error) {
      console.error('[InvestmentAdvisor] Enhanced analysis failed, falling back to basic:', error);
      
      // Fallback to gateway-only analysis
      try {
        const analysis = await analyzePortfolioViaGateway(properties, transactions, maintenanceRequests);
        return this.validateAndNormalizeAnalysis(analysis);
      } catch (fallbackError) {
        console.error('[InvestmentAdvisor] All analysis methods failed:', fallbackError);
        throw new Error('Failed to generate portfolio analysis');
      }
    }
  }

  /**
   * Generates predictive maintenance recommendations for a specific property
   */
  async predictMaintenance(
    property: Property,
    maintenanceHistory: MaintenanceRequest[],
    transactions: Transaction[]
  ): Promise<InvestmentInsight[]> {
    
    try {
      const insights = await predictMaintenanceViaGateway(property, maintenanceHistory, transactions);
      return insights.map((insight: any) => ({
        id: insight.id || Math.random().toString(36).slice(2),
        type: 'maintenance',
        title: insight.title || 'Maintenance Prediction',
        description: insight.description || '',
        priority: insight.priority || 'medium',
        actionItems: insight.actionItems || [],
        estimatedImpact: insight.estimatedImpact || {},
        confidence: insight.confidence || 0.7,
        createdAt: insight.createdAt || new Date().toISOString()
      }));
    } catch (error) {
      console.error('[InvestmentAdvisor] Maintenance prediction failed:', error);
      return [];
    }
  }

  /**
   * Evaluates investment potential of a new property
   */
  async evaluateInvestment(
    targetProperty: {
      address: string;
      price: number;
      rent: number;
      bedrooms: number;
      bathrooms: number;
      squareFeet: number;
    },
    portfolioContext: {
      properties: Property[];
      averageROI: number;
      marketArea: string;
    }
  ): Promise<InvestmentInsight[]> {
    
    const prompt = `
    Evaluate this potential investment property against the existing portfolio. Return a JSON array of investment insights.
    
    Target Property:
    - Address: ${targetProperty.address}
    - Price: $${targetProperty.price}
    - Expected Rent: $${targetProperty.rent}/month
    - Size: ${targetProperty.bedrooms}BR/${targetProperty.bathrooms}BA, ${targetProperty.squareFeet} sq ft
    
    Portfolio Context:
    - Current properties: ${portfolioContext.properties.length}
    - Average ROI: ${(portfolioContext.averageROI * 100).toFixed(1)}%
    - Market area: ${portfolioContext.marketArea}
    
    Portfolio comparison properties:
    ${portfolioContext.properties.slice(0, 5).map(p => 
      `- ${p.address}: $${p.monthlyRent || 0}/month, ${p.bedrooms || 'N/A'}BR/${p.bathrooms || 'N/A'}BA`
    ).join('\n')}
    
    Provide detailed investment analysis as a JSON array:
    [
      {
        "id": "unique-id",
        "type": "market",
        "title": "Investment evaluation title",
        "description": "Detailed analysis",
        "priority": "low|medium|high",
        "actionItems": ["specific recommendation 1", "specific recommendation 2"],
        "estimatedImpact": {
          "financial": estimated_annual_return,
          "timeframe": "expected timeframe"
        },
        "confidence": 0.0-1.0,
        "createdAt": "${new Date().toISOString()}"
      }
    ]
    
    Analyze ROI potential, cash flow, market positioning, risks, and financing options.
    `;

    try {
      const response = await generateViaGateway(prompt, { feature: 'investment.evaluation' });
      return this.parseInvestmentInsights(response);
    } catch (error) {
      console.error('[InvestmentAdvisor] Investment evaluation failed:', error);
      return [];
    }
  }

  private parseInvestmentInsights(response: string): InvestmentInsight[] {
    try {
      let jsonText = response.trim();
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        jsonText = jsonMatch[0];
      }
      
      const insights = JSON.parse(jsonText);
      if (Array.isArray(insights)) {
        return insights.map((insight: any) => ({
          id: insight.id || Math.random().toString(36).slice(2),
          type: insight.type || 'market',
          title: insight.title || 'Investment Analysis',
          description: insight.description || '',
          priority: insight.priority || 'medium',
          actionItems: insight.actionItems || [],
          estimatedImpact: insight.estimatedImpact || {},
          confidence: insight.confidence || 0.7,
          createdAt: insight.createdAt || new Date().toISOString()
        }));
      }
      return [];
    } catch (error) {
      console.error('[InvestmentAdvisor] Failed to parse investment insights:', error);
      return [];
    }
  }

  private validateAndNormalizeAnalysis(analysis: any): PortfolioAnalysis {
    return {
      totalValue: analysis.totalValue || 0,
      totalCashFlow: analysis.totalCashFlow || 0,
      averageROI: analysis.averageROI || 0,
      riskScore: analysis.riskScore || 0.5,
      insights: (analysis.insights || []).map((insight: any) => ({
        id: insight.id || Math.random().toString(36).slice(2),
        type: insight.type || 'market',
        title: insight.title || 'Insight',
        description: insight.description || '',
        priority: insight.priority || 'medium',
        actionItems: insight.actionItems || [],
        estimatedImpact: insight.estimatedImpact || {},
        confidence: insight.confidence || 0.7,
        createdAt: insight.createdAt || new Date().toISOString()
      })),
      recommendations: analysis.recommendations || { buy: [], sell: [], improve: [] }
    };
  }

}

export const investmentAdvisor = new InvestmentAdvisorService();
