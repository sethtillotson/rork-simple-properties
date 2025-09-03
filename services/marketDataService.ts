import { Property } from '@/types/property';

export interface MarketData {
  medianRentByBedrooms: Record<string, number>;
  averageRentPerSqFt: number;
  vacancyRate: number;
  appreciationRate: number;
  medianHomePrice: number;
  rentGrowthRate: number;
  marketTrends: {
    supply: 'increasing' | 'stable' | 'decreasing';
    demand: 'high' | 'moderate' | 'low';
    forecast: 'bullish' | 'neutral' | 'bearish';
  };
  demographics: {
    medianIncome: number;
    populationGrowth: number;
    employmentRate: number;
  };
  comparables: {
    address: string;
    rent: number;
    bedrooms: number;
    bathrooms: number;
    sqft: number;
    distance: string;
  }[];
}

export interface PropertyAnalytics {
  capRate: number;
  cashOnCashReturn: number;
  grossYield: number;
  netYield: number;
  monthsToBreakEven: number;
  rentToValueRatio: number;
  cashFlow: {
    monthly: number;
    annual: number;
  };
  expenses: {
    mortgage: number;
    taxes: number;
    insurance: number;
    maintenance: number;
    management: number;
    vacancy: number;
    total: number;
  };
  marketPosition: {
    rentVsMarket: number; // percentage above/below market
    valueVsMarket: number;
    competitiveness: 'excellent' | 'good' | 'average' | 'below-average' | 'poor';
  };
}

// Market data service - in a real app, this would call external APIs
export class MarketDataService {
  private static readonly MARKET_DATA_CACHE: Record<string, MarketData> = {
    'fargo-nd': {
      medianRentByBedrooms: {
        '1': 650,
        '2': 850,
        '3': 1200,
        '4': 1500,
        '5+': 1800
      },
      averageRentPerSqFt: 0.72,
      vacancyRate: 0.08,
      appreciationRate: 0.045,
      medianHomePrice: 215000,
      rentGrowthRate: 0.035,
      marketTrends: {
        supply: 'stable',
        demand: 'moderate',
        forecast: 'neutral'
      },
      demographics: {
        medianIncome: 54000,
        populationGrowth: 0.012,
        employmentRate: 0.95
      },
      comparables: [
        { address: '125 Main St', rent: 1400, bedrooms: 3, bathrooms: 2, sqft: 1800, distance: '0.2 mi' },
        { address: '130 1st Ave N', rent: 1500, bedrooms: 3, bathrooms: 2, sqft: 1900, distance: '0.4 mi' },
        { address: '145 2nd St', rent: 1350, bedrooms: 3, bathrooms: 2, sqft: 1750, distance: '0.6 mi' }
      ]
    },
    'bismarck-nd': {
      medianRentByBedrooms: {
        '1': 700,
        '2': 950,
        '3': 1350,
        '4': 1650,
        '5+': 2000
      },
      averageRentPerSqFt: 0.78,
      vacancyRate: 0.06,
      appreciationRate: 0.052,
      medianHomePrice: 245000,
      rentGrowthRate: 0.041,
      marketTrends: {
        supply: 'decreasing',
        demand: 'high',
        forecast: 'bullish'
      },
      demographics: {
        medianIncome: 62000,
        populationGrowth: 0.018,
        employmentRate: 0.97
      },
      comparables: [
        { address: '458 Prairie Ave', rent: 1700, bedrooms: 4, bathrooms: 2.5, sqft: 2150, distance: '0.3 mi' },
        { address: '460 State St', rent: 1800, bedrooms: 4, bathrooms: 3, sqft: 2300, distance: '0.5 mi' },
        { address: '465 Capitol Way', rent: 1650, bedrooms: 4, bathrooms: 2, sqft: 2100, distance: '0.7 mi' }
      ]
    },
    'grand-forks-nd': {
      medianRentByBedrooms: {
        '1': 550,
        '2': 750,
        '3': 1050,
        '4': 1300,
        '5+': 1600
      },
      averageRentPerSqFt: 0.68,
      vacancyRate: 0.12,
      appreciationRate: 0.032,
      medianHomePrice: 185000,
      rentGrowthRate: 0.025,
      marketTrends: {
        supply: 'stable',
        demand: 'moderate',
        forecast: 'neutral'
      },
      demographics: {
        medianIncome: 48000,
        populationGrowth: 0.008,
        employmentRate: 0.93
      },
      comparables: [
        { address: '791 University Ave', rent: 925, bedrooms: 2, bathrooms: 1, sqft: 1150, distance: '0.4 mi' },
        { address: '795 Red River Rd', rent: 975, bedrooms: 2, bathrooms: 1, sqft: 1250, distance: '0.6 mi' },
        { address: '800 Gateway Dr', rent: 900, bedrooms: 2, bathrooms: 1, sqft: 1200, distance: '0.8 mi' }
      ]
    },
    'minot-nd': {
      medianRentByBedrooms: {
        '1': 600,
        '2': 800,
        '3': 1150,
        '4': 1400,
        '5+': 1750
      },
      averageRentPerSqFt: 0.75,
      vacancyRate: 0.10,
      appreciationRate: 0.038,
      medianHomePrice: 205000,
      rentGrowthRate: 0.030,
      marketTrends: {
        supply: 'increasing',
        demand: 'moderate',
        forecast: 'neutral'
      },
      demographics: {
        medianIncome: 56000,
        populationGrowth: 0.015,
        employmentRate: 0.94
      },
      comparables: [
        { address: '323 Oak St', rent: 1200, bedrooms: 3, bathrooms: 1.5, sqft: 1550, distance: '0.3 mi' },
        { address: '325 Elm Ave', rent: 1300, bedrooms: 3, bathrooms: 2, sqft: 1650, distance: '0.5 mi' },
        { address: '330 Main St', rent: 1225, bedrooms: 3, bathrooms: 1.5, sqft: 1600, distance: '0.7 mi' }
      ]
    }
  };

  static getMarketKey(city: string, province: string): string {
    return `${city.toLowerCase()}-${province.toLowerCase()}`;
  }

  static getMarketData(city: string, province: string): MarketData | null {
    const key = this.getMarketKey(city, province);
    return this.MARKET_DATA_CACHE[key] || null;
  }

  static calculatePropertyAnalytics(property: Property, marketData: MarketData): PropertyAnalytics {
    const annualRent = (property.monthlyRent || 0) * 12;
    const purchasePrice = property.purchasePrice || 0;
    const cashInvested = property.cashInvested || purchasePrice;

    // Calculate expenses
    const annualMortgage = (property.loans || []).reduce((sum, loan) => sum + (loan.monthlyPayment * 12), 0);
    const annualTaxes = (property.taxes || []).reduce((sum, tax) => sum + tax.amount, 0);
    const annualInsurance = (property.insurances || []).reduce((sum, ins) => sum + ins.annualCost, 0);
    const estimatedMaintenance = annualRent * 0.08; // 8% of rent for maintenance
    const estimatedManagement = annualRent * 0.06; // 6% for property management
    const estimatedVacancy = annualRent * marketData.vacancyRate;

    const totalExpenses = annualMortgage + annualTaxes + annualInsurance + estimatedMaintenance + estimatedManagement + estimatedVacancy;
    const netIncome = annualRent - totalExpenses;
    const monthlyCashFlow = netIncome / 12;

    // Calculate metrics
    const capRate = purchasePrice > 0 ? netIncome / purchasePrice : 0;
    const cashOnCashReturn = cashInvested > 0 ? netIncome / cashInvested : 0;
    const grossYield = purchasePrice > 0 ? annualRent / purchasePrice : 0;
    const netYield = purchasePrice > 0 ? netIncome / purchasePrice : 0;

    // Market position analysis
    const bedroomKey = String(property.bedrooms || 2);
    const marketRent = marketData.medianRentByBedrooms[bedroomKey] || marketData.medianRentByBedrooms['2'];
    const rentVsMarket = marketRent > 0 ? ((property.monthlyRent || 0) / marketRent - 1) * 100 : 0;
    const valueVsMarket = marketData.medianHomePrice > 0 ? ((purchasePrice || 0) / marketData.medianHomePrice - 1) * 100 : 0;

    let competitiveness: PropertyAnalytics['marketPosition']['competitiveness'] = 'average';
    if (rentVsMarket >= 15 && capRate >= 0.08) competitiveness = 'excellent';
    else if (rentVsMarket >= 5 && capRate >= 0.06) competitiveness = 'good';
    else if (rentVsMarket >= -5 && capRate >= 0.04) competitiveness = 'average';
    else if (rentVsMarket >= -15 && capRate >= 0.02) competitiveness = 'below-average';
    else competitiveness = 'poor';

    return {
      capRate,
      cashOnCashReturn,
      grossYield,
      netYield,
      monthsToBreakEven: monthlyCashFlow > 0 ? Math.ceil(cashInvested / (monthlyCashFlow * 12)) : -1,
      rentToValueRatio: (property.monthlyRent || 0) / (purchasePrice / 1000), // rent-to-price ratio per $1000
      cashFlow: {
        monthly: monthlyCashFlow,
        annual: netIncome
      },
      expenses: {
        mortgage: annualMortgage,
        taxes: annualTaxes,
        insurance: annualInsurance,
        maintenance: estimatedMaintenance,
        management: estimatedManagement,
        vacancy: estimatedVacancy,
        total: totalExpenses
      },
      marketPosition: {
        rentVsMarket,
        valueVsMarket,
        competitiveness
      }
    };
  }
}
