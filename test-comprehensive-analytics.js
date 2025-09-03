#!/usr/bin/env node

// Use native fetch (available in Node.js >= 18.0.0). For earlier versions, use a polyfill such as 'node-fetch'.

// Comprehensive test data for enhanced portfolio analytics
const mockPortfolioData = {
  properties: [
    {
      id: "1",
      address: "123 Main St, Fargo, ND 58102",
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1800,
      yearBuilt: 2015,
      purchasePrice: 285000,
      currentValue: 320000,
      monthlyRent: 2100,
      monthlyExpenses: 450,
      purchaseDate: "2020-01-15"
    },
    {
      id: "2", 
      address: "456 Oak Ave, Bismarck, ND 58501",
      bedrooms: 2,
      bathrooms: 1,
      squareFeet: 1200,
      yearBuilt: 2010,
      purchasePrice: 195000,
      currentValue: 235000,
      monthlyRent: 1650,
      monthlyExpenses: 380,
      purchaseDate: "2019-06-01"
    },
    {
      id: "3",
      address: "789 Pine Rd, Grand Forks, ND 58201",
      bedrooms: 4,
      bathrooms: 3,
      squareFeet: 2200,
      yearBuilt: 2018,
      purchasePrice: 315000,
      currentValue: 365000,
      monthlyRent: 2400,
      monthlyExpenses: 520,
      purchaseDate: "2021-03-10"
    }
  ],
  tenants: [
    {
      id: "1",
      propertyId: "1",
      name: "John Smith",
      monthlyRent: 2100,
      leaseStart: "2024-01-01",
      leaseEnd: "2024-12-31",
      creditScore: 750
    },
    {
      id: "2",
      propertyId: "2",
      name: "Sarah Johnson",
      monthlyRent: 1650,
      leaseStart: "2024-03-01", 
      leaseEnd: "2025-02-28",
      creditScore: 720
    },
    {
      id: "3",
      propertyId: "3",
      name: "Mike Wilson",
      monthlyRent: 2400,
      leaseStart: "2024-06-01",
      leaseEnd: "2025-05-31",
      creditScore: 680
    }
  ],
  financials: [
    // Property 1 - Fargo
    {
      id: "1", propertyId: "1", type: "income", amount: 2100, 
      date: "2024-09-01", description: "Monthly rent - John Smith"
    },
    {
      id: "2", propertyId: "1", type: "expense", amount: 450, 
      date: "2024-09-01", description: "Property management and maintenance"
    },
    {
      id: "3", propertyId: "1", type: "expense", amount: 1200, 
      date: "2024-08-15", description: "HVAC repair - replaced compressor"
    },
    
    // Property 2 - Bismarck  
    {
      id: "4", propertyId: "2", type: "income", amount: 1650,
      date: "2024-09-01", description: "Monthly rent - Sarah Johnson"
    },
    {
      id: "5", propertyId: "2", type: "expense", amount: 380,
      date: "2024-09-01", description: "Property management"
    },
    {
      id: "6", propertyId: "2", type: "expense", amount: 850,
      date: "2024-07-20", description: "Roof repair - shingle replacement"
    },
    
    // Property 3 - Grand Forks
    {
      id: "7", propertyId: "3", type: "income", amount: 2400,
      date: "2024-09-01", description: "Monthly rent - Mike Wilson"
    },
    {
      id: "8", propertyId: "3", type: "expense", amount: 520,
      date: "2024-09-01", description: "Property management and utilities"
    },
    {
      id: "9", propertyId: "3", type: "expense", amount: 2100,
      date: "2024-06-10", description: "Kitchen renovation - appliances and countertops"
    }
  ]
};

async function testPortfolioAnalytics() {
  console.log('🔍 Testing Enhanced Portfolio Analytics...\n');
  
  try {
    const response = await fetch('http://localhost:8082/api/analyze-portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockPortfolioData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('📊 Portfolio Analysis Results:');
    console.log('=====================================');
    
    // Check if this is a fallback message or real analysis
    if (result.analysis.message) {
      console.log('📝 Fallback Message Received:');
      console.log(`   ${result.analysis.message}`);
      if (result.analysis.status) {
        console.log(`   Status: ${result.analysis.status}`);
      }
      console.log('\n📋 Required Details for AI Analysis:');
      result.analysis.requiredDetails.forEach(detail => {
        console.log(`   • ${detail}`);
      });
      console.log(`\n💡 Note: ${result.analysis.note}`);
      console.log('\n✅ Fallback message working correctly - no mock data provided');
    } else {
      // Handle real AI analysis response
      console.log(`Total Portfolio Value: $${result.analysis.totalValue?.toLocaleString() || 'N/A'}`);
      console.log(`Monthly Cash Flow: $${result.analysis.totalCashFlow?.toLocaleString() || 'N/A'}`);
      console.log(`Average ROI: ${result.analysis.averageROI ? (result.analysis.averageROI * 100).toFixed(2) + '%' : 'N/A'}`);
      console.log(`Risk Score: ${result.analysis.riskScore ? (result.analysis.riskScore * 100).toFixed(1) + '/100' : 'N/A'}`);
      
      console.log('\n💡 AI-Generated Insights:');
      console.log('=====================================');
      if (result.analysis.insights) {
        result.analysis.insights.forEach((insight, index) => {
          console.log(`${index + 1}. ${insight.title} (${insight.type})`);
          console.log(`   Priority: ${insight.priority?.toUpperCase() || 'N/A'}`);
          console.log(`   ${insight.description}`);
          if (insight.estimatedImpact?.financial) {
            console.log(`   💰 Financial Impact: $${insight.estimatedImpact.financial.toLocaleString()}`);
          }
          if (insight.estimatedImpact?.timeframe) {
            console.log(`   ⏱️ Timeframe: ${insight.estimatedImpact.timeframe}`);
          }
          if (insight.confidence) {
            console.log(`   🎯 Confidence: ${(insight.confidence * 100).toFixed(1)}%`);
          }
          
          if (insight.actionItems && insight.actionItems.length > 0) {
            console.log('   📋 Action Items:');
            insight.actionItems.forEach(action => console.log(`      • ${action}`));
          }
          console.log('');
        });
      }
    }
    
    // Only show recommendations if this is real AI analysis (not a fallback message)
    if (!result.analysis.message && result.analysis.recommendations) {
      console.log('🎯 Recommendations:');
      console.log('=====================================');
      if (result.analysis.recommendations.buy && result.analysis.recommendations.buy.length > 0) {
        console.log('🟢 BUY Opportunities:');
        result.analysis.recommendations.buy.forEach(rec => console.log(`   • ${rec}`));
      }
      if (result.analysis.recommendations.sell && result.analysis.recommendations.sell.length > 0) {
        console.log('🔴 SELL Considerations:');
        result.analysis.recommendations.sell.forEach(rec => console.log(`   • ${rec}`));
      }
      if (result.analysis.recommendations.improve && result.analysis.recommendations.improve.length > 0) {
        console.log('🔧 IMPROVE Opportunities:');
        result.analysis.recommendations.improve.forEach(rec => console.log(`   • ${rec}`));
      }
    }
    
    // Check for quality indicators only if real analysis
    if (!result.analysis.message) {
      const resultStr = JSON.stringify(result).toLowerCase();
      if (resultStr.includes('lorem ipsum') || resultStr.includes('placeholder')) {
        console.log('\n❌ Quality Check: Still contains placeholder text');
      } else {
        console.log('\n✅ Quality Check: No placeholder text detected - enhanced analytics working!');
      }
      
      // Check for sophisticated insights
      if (result.analysis.insights && result.analysis.insights.length > 1 && 
          result.analysis.insights.some(i => i.type !== 'cash_flow')) {
        console.log('✅ Diversity Check: Multiple insight types generated');
      }
      
      if (result.analysis.insights && result.analysis.insights.some(i => i.actionItems && i.actionItems.length > 1)) {
        console.log('✅ Depth Check: Detailed action items provided');
      }
    } else {
      console.log('\n✅ Fallback Check: No mock data returned - proper fallback message provided');
    }
    
  } catch (error) {
    console.error('❌ Analytics Test Failed:', error.message);
  }
}

async function testMaintenancePrediction() {
  console.log('\n🔧 Testing Enhanced Maintenance Prediction...\n');
  
  const maintenanceData = {
    property: mockPortfolioData.properties[0], // Fargo property
    maintenanceHistory: [
      {
        id: "m1",
        createdAt: "2024-08-15",
        title: "HVAC Compressor Replacement", 
        priority: "high",
        description: "Emergency replacement of failed AC compressor during heat wave"
      },
      {
        id: "m2",
        createdAt: "2024-06-20",
        title: "Plumbing Leak Repair",
        priority: "medium", 
        description: "Fixed leak in master bathroom toilet supply line"
      },
      {
        id: "m3",
        createdAt: "2024-04-10",
        title: "Seasonal HVAC Maintenance",
        priority: "low",
        description: "Annual system inspection and filter replacement"
      }
    ],
    transactions: mockPortfolioData.financials.filter(t => t.propertyId === "1")
  };
  
  try {
    const response = await fetch('http://localhost:8082/api/predict-maintenance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(maintenanceData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    console.log('🔮 Maintenance Predictions:');
    console.log('=====================================');
    
    result.insights.forEach((prediction, index) => {
      // Check if this is a fallback message
      if (prediction.message) {
        console.log(`📝 Fallback Message Received:`);
        console.log(`   ${prediction.message}`);
        if (prediction.status) {
          console.log(`   Status: ${prediction.status}`);
        }
        console.log('\n📋 Required Details for AI Analysis:');
        prediction.requiredDetails.forEach(detail => {
          console.log(`   • ${detail}`);
        });
        console.log(`\n💡 Note: ${prediction.note}`);
        console.log('\n✅ Fallback message working correctly - no mock data provided');
      } else {
        // Handle real AI prediction response
        console.log(`${index + 1}. ${prediction.title || 'N/A'}`);
        if (prediction.priority) {
          console.log(`   Priority: ${prediction.priority.toUpperCase()}`);
        }
        console.log(`   ${prediction.description || 'N/A'}`);
        if (prediction.estimatedImpact?.financial) {
          console.log(`   💰 Cost Estimate: $${Math.abs(prediction.estimatedImpact.financial).toLocaleString()}`);
        }
        if (prediction.estimatedImpact?.timeframe) {
          console.log(`   ⏱️ Timeframe: ${prediction.estimatedImpact.timeframe}`);
        }
        if (prediction.confidence) {
          console.log(`   🎯 Confidence: ${(prediction.confidence * 100).toFixed(1)}%`);
        }
        
        if (prediction.actionItems && prediction.actionItems.length > 0) {
          console.log('   📋 Action Items:');
          prediction.actionItems.forEach(action => console.log(`      • ${action}`));
        }
        console.log('');
      }
    });
    
    console.log('✅ Maintenance prediction test completed!');
    
  } catch (error) {
    console.error('❌ Maintenance Prediction Failed:', error.message);
  }
}

// Run comprehensive analytics tests
async function runTests() {
  console.log('🚀 Starting Comprehensive Analytics Testing');
  console.log('='.repeat(50));
  
  await testPortfolioAnalytics();
  await testMaintenancePrediction();
  
  console.log('\n🎉 All analytics tests completed!');
}

runTests();
