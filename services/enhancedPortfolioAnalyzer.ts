import { Property, MaintenanceRequest } from '@/types/property';
import { Transaction } from '@/services/investmentAdvisorService';
import { MarketDataService, MarketData, PropertyAnalytics } from './marketDataService';

export interface PortfolioInsights {
  diversification: {
    geographicSpread: number;
    propertyTypeSpread: number;
    riskDistribution: 'well-balanced' | 'concentrated' | 'high-risk';
  };
  performance: {
    portfolioCapRate: number;
    portfolioCashFlow: number;
    totalValue: number;
    totalEquity: number;
    leverageRatio: number;
    debtToEquityRatio: number;
  };
  opportunities: {
    underperformingProperties: string[];
    refinancingCandidates: string[];
    rentOptimizationTargets: string[];
    marketExpansionAreas: string[];
  };
  risks: {
    vacancyExposure: number;
    maintenanceBacklog: number;
    marketConcentration: number;
    cashFlowVolatility: number;
  };
}

export interface EnhancedRecommendation {
  id: string;
  type: 'acquisition' | 'disposition' | 'optimization' | 'financing';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timeframe: string;
  estimatedImpact: {
    roi: number;
    cashFlow: number;
    equity: number;
  };
  actionItems: string[];
  riskLevel: 'low' | 'medium' | 'high';
  confidence: number;
  marketContext: string;
}

export class EnhancedPortfolioAnalyzer {
  static analyzePortfolio(
    properties: Property[],
    transactions: Transaction[],
    maintenanceRequests: MaintenanceRequest[]
  ): PortfolioInsights {
    const propertyAnalytics = properties.map(property => {
      const marketData = MarketDataService.getMarketData(property.city, property.province);
      return {
        property,
        marketData,
        analytics: marketData ? MarketDataService.calculatePropertyAnalytics(property, marketData) : null
      };
    });

    // Calculate portfolio-level metrics
    const totalValue = properties.reduce((sum, p) => sum + (p.purchasePrice || 0), 0);
    const totalDebt = properties.reduce((sum, p) => 
      sum + (p.loans || []).reduce((loanSum, loan) => loanSum + (loan.principalAmount || 0), 0), 0
    );
    const totalEquity = totalValue - totalDebt;
    const leverageRatio = totalValue > 0 ? totalDebt / totalValue : 0;
    const debtToEquityRatio = totalEquity > 0 ? totalDebt / totalEquity : 0;

    const portfolioCashFlow = propertyAnalytics.reduce((sum, pa) => 
      sum + (pa.analytics?.cashFlow.annual || 0), 0
    );
    const portfolioCapRate = totalValue > 0 ? portfolioCashFlow / totalValue : 0;

    // Geographic diversification
    const citiesSet = new Set(properties.map(p => `${p.city}, ${p.province}`));
    const cities = Array.from(citiesSet);
    const geographicSpread = cities.length / Math.max(properties.length, 1);

    // Property type diversification (based on bedrooms as proxy)
    const bedroomCountsSet = new Set(properties.map(p => p.bedrooms || 2));
    const bedroomCounts = Array.from(bedroomCountsSet);
    const propertyTypeSpread = bedroomCounts.length / Math.max(properties.length, 1);

    // Risk analysis
    const vacantProperties = properties.filter(p => !p.isOccupied).length;
    const vacancyExposure = vacantProperties / Math.max(properties.length, 1);

    const highMaintenanceProps = maintenanceRequests
      .filter(req => req.status !== 'completed' && req.priority === 'high')
      .map(req => req.propertyId);
    const uniqueMaintenanceProps = Array.from(new Set(highMaintenanceProps));
    const maintenanceBacklog = uniqueMaintenanceProps.length / Math.max(properties.length, 1);

    const marketConcentration = 1 - geographicSpread; // Higher concentration = higher risk

    // Cash flow volatility (simplified)
    const monthlyIncomes = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => {
        const month = t.date.substring(0, 7); // YYYY-MM
        acc[month] = (acc[month] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);
    const incomeValues = Object.values(monthlyIncomes);
    const avgIncome = incomeValues.reduce((sum, val) => sum + val, 0) / Math.max(incomeValues.length, 1);
    const variance = incomeValues.reduce((sum, val) => sum + Math.pow(val - avgIncome, 2), 0) / Math.max(incomeValues.length, 1);
    const cashFlowVolatility = avgIncome > 0 ? Math.sqrt(variance) / avgIncome : 0;

    // Identify opportunities
    const underperformingProperties = propertyAnalytics
      .filter(pa => pa.analytics && pa.analytics.capRate < 0.04)
      .map(pa => pa.property.address);

    const refinancingCandidates = properties
      .filter(p => (p.loans || []).some(loan => loan.interestRate > 0.06))
      .map(p => p.address);

    const rentOptimizationTargets = propertyAnalytics
      .filter(pa => pa.analytics && pa.analytics.marketPosition.rentVsMarket < -10)
      .map(pa => pa.property.address);

    // Market expansion areas (cities with good metrics but no properties)
    const portfolioCities = new Set(properties.map(p => MarketDataService.getMarketKey(p.city, p.province)));
    const allMarkets = ['fargo-nd', 'bismarck-nd', 'grand-forks-nd', 'minot-nd'];
    const marketExpansionAreas = allMarkets
      .filter(market => !portfolioCities.has(market))
      .map(market => market.replace('-', ', ').toUpperCase());

    // Risk distribution assessment
    let riskDistribution: PortfolioInsights['diversification']['riskDistribution'] = 'well-balanced';
    if (marketConcentration > 0.7 || vacancyExposure > 0.3 || cashFlowVolatility > 0.4) {
      riskDistribution = 'high-risk';
    } else if (marketConcentration > 0.5 || vacancyExposure > 0.15 || cashFlowVolatility > 0.25) {
      riskDistribution = 'concentrated';
    }

    return {
      diversification: {
        geographicSpread,
        propertyTypeSpread,
        riskDistribution
      },
      performance: {
        portfolioCapRate,
        portfolioCashFlow,
        totalValue,
        totalEquity,
        leverageRatio,
        debtToEquityRatio
      },
      opportunities: {
        underperformingProperties,
        refinancingCandidates,
        rentOptimizationTargets,
        marketExpansionAreas
      },
      risks: {
        vacancyExposure,
        maintenanceBacklog,
        marketConcentration,
        cashFlowVolatility
      }
    };
  }

  static generateRecommendations(
    properties: Property[],
    portfolioInsights: PortfolioInsights,
    transactions: Transaction[]
  ): EnhancedRecommendation[] {
    const recommendations: EnhancedRecommendation[] = [];

    // High-priority vacancy recommendation
    if (portfolioInsights.risks.vacancyExposure > 0.2) {
      recommendations.push({
        id: 'vacancy-critical',
        type: 'optimization',
        title: 'Address High Vacancy Rate',
        description: `${Math.round(portfolioInsights.risks.vacancyExposure * 100)}% of your properties are vacant, significantly impacting cash flow. Immediate action needed to reduce vacancy exposure.`,
        priority: 'critical',
        timeframe: '30-60 days',
        estimatedImpact: {
          roi: 0.12,
          cashFlow: portfolioInsights.performance.portfolioCashFlow * 0.25,
          equity: 0
        },
        actionItems: [
          'Review and adjust rent pricing for vacant properties',
          'Enhance marketing and listing visibility',
          'Consider offering move-in incentives',
          'Inspect vacant properties for needed improvements'
        ],
        riskLevel: 'low',
        confidence: 0.95,
        marketContext: 'High vacancy rates are severely impacting portfolio returns'
      });
    }

    // Rent optimization opportunities
    if (portfolioInsights.opportunities.rentOptimizationTargets.length > 0) {
      const potentialIncrease = portfolioInsights.opportunities.rentOptimizationTargets.length * 100; // $100/month estimate
      recommendations.push({
        id: 'rent-optimization',
        type: 'optimization',
        title: 'Optimize Below-Market Rent Properties',
        description: `${portfolioInsights.opportunities.rentOptimizationTargets.length} properties are priced significantly below market rates. Gradual increases could boost annual income.`,
        priority: 'high',
        timeframe: '90-120 days',
        estimatedImpact: {
          roi: 0.08,
          cashFlow: potentialIncrease * 12,
          equity: potentialIncrease * 12 * 15 // 15x multiplier for property value
        },
        actionItems: [
          'Conduct comprehensive market analysis for each property',
          'Plan phased rent increases within legal limits',
          'Justify increases with property improvements',
          'Communicate value propositions to tenants'
        ],
        riskLevel: 'medium',
        confidence: 0.82,
        marketContext: 'Current market conditions support moderate rent increases'
      });
    }

    // Refinancing opportunities
    if (portfolioInsights.opportunities.refinancingCandidates.length > 0) {
      recommendations.push({
        id: 'refinancing-opportunity',
        type: 'financing',
        title: 'Refinance High-Interest Loans',
        description: `${portfolioInsights.opportunities.refinancingCandidates.length} properties have loans above 6% interest rate. Current market rates could reduce monthly payments.`,
        priority: 'medium',
        timeframe: '60-90 days',
        estimatedImpact: {
          roi: 0.15,
          cashFlow: 200 * portfolioInsights.opportunities.refinancingCandidates.length * 12, // $200/month savings estimate
          equity: 0
        },
        actionItems: [
          'Get current rate quotes from multiple lenders',
          'Calculate break-even points including closing costs',
          'Review credit score and debt-to-income ratios',
          'Prepare financial documentation for applications'
        ],
        riskLevel: 'low',
        confidence: 0.75,
        marketContext: 'Interest rates remain favorable for refinancing'
      });
    }

    // Portfolio diversification
    if (portfolioInsights.diversification.riskDistribution === 'concentrated') {
      recommendations.push({
        id: 'diversification-expansion',
        type: 'acquisition',
        title: 'Expand Geographic Diversification',
        description: 'Portfolio is concentrated in too few markets. Consider expanding to reduce location-specific risks.',
        priority: 'medium',
        timeframe: '6-12 months',
        estimatedImpact: {
          roi: 0.06,
          cashFlow: 500 * 12, // Estimate for new property
          equity: 50000
        },
        actionItems: [
          'Research emerging markets with strong fundamentals',
          'Analyze cap rates and cash flow potential in target areas',
          'Build relationships with local real estate professionals',
          'Start with smaller test investments in new markets'
        ],
        riskLevel: 'medium',
        confidence: 0.68,
        marketContext: `Consider expanding to: ${portfolioInsights.opportunities.marketExpansionAreas.join(', ')}`
      });
    }

    // Cash flow improvement for underperforming properties
    if (portfolioInsights.opportunities.underperformingProperties.length > 0) {
      recommendations.push({
        id: 'underperformer-optimization',
        type: 'optimization',
        title: 'Optimize Underperforming Properties',
        description: `${portfolioInsights.opportunities.underperformingProperties.length} properties are generating below-average returns. Analysis needed to determine optimal strategy.`,
        priority: 'high',
        timeframe: '30-90 days',
        estimatedImpact: {
          roi: 0.10,
          cashFlow: 300 * portfolioInsights.opportunities.underperformingProperties.length * 12,
          equity: 0
        },
        actionItems: [
          'Conduct detailed financial analysis for each property',
          'Identify specific performance bottlenecks',
          'Evaluate renovation vs. disposition options',
          'Consider property management improvements'
        ],
        riskLevel: 'medium',
        confidence: 0.78,
        marketContext: 'Market conditions support value-add improvements'
      });
    }

    // High leverage warning
    if (portfolioInsights.performance.leverageRatio > 0.8) {
      recommendations.push({
        id: 'leverage-reduction',
        type: 'financing',
        title: 'Reduce Portfolio Leverage Risk',
        description: `Portfolio leverage ratio of ${Math.round(portfolioInsights.performance.leverageRatio * 100)}% is above recommended levels. Consider debt reduction strategies.`,
        priority: 'medium',
        timeframe: '12-24 months',
        estimatedImpact: {
          roi: 0.04,
          cashFlow: -100, // Temporary reduction due to debt payments
          equity: 25000
        },
        actionItems: [
          'Prioritize additional principal payments on highest-rate loans',
          'Consider selling one underperforming property to reduce debt',
          'Explore debt consolidation opportunities',
          'Build larger cash reserves for debt reduction'
        ],
        riskLevel: 'low',
        confidence: 0.85,
        marketContext: 'Reducing leverage improves portfolio stability during market downturns'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}
