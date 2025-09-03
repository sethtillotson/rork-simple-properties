#!/usr/bin/env node

const fetch = require('node-fetch');

// Test data for our enhanced portfolio analysis
const testData = {
  type: "portfolio",
  properties: [
    {
      id: "1",
      address: "123 Main St, Fargo, ND",
      bedrooms: 3,
      bathrooms: 2,
      squareFeet: 1800,
      yearBuilt: 2015,
      purchasePrice: 285000,
      currentValue: 320000,
      monthlyRent: 2100,
      monthlyExpenses: 450
    },
    {
      id: "2", 
      address: "456 Oak Ave, Bismarck, ND",
      bedrooms: 2,
      bathrooms: 1,
      squareFeet: 1200,
      yearBuilt: 2010,
      purchasePrice: 195000,
      currentValue: 235000,
      monthlyRent: 1650,
      monthlyExpenses: 380
    }
  ],
  tenants: [
    {
      id: "1",
      propertyId: "1",
      name: "John Smith",
      monthlyRent: 2100,
      leaseStart: "2024-01-01",
      leaseEnd: "2024-12-31"
    }
  ],
  financials: [
    {
      id: "1",
      propertyId: "1", 
      type: "income",
      amount: 2100,
      date: "2024-09-01",
      description: "Monthly rent - John Smith"
    },
    {
      id: "2",
      propertyId: "1",
      type: "expense", 
      amount: 450,
      date: "2024-09-01",
      description: "Property management and maintenance"
    }
  ]
};

async function testAnalytics() {
  console.log('Testing enhanced portfolio analytics...');
  
  try {
    // Test via cluster IP
    const response = await fetch('http://10.43.101.6:8082/api/analyze-portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log('🎉 Enhanced Analytics Result:');
    console.log(JSON.stringify(result, null, 2));
    
    // Check if we're still getting Lorem ipsum placeholders
    const resultStr = JSON.stringify(result).toLowerCase();
    if (resultStr.includes('lorem ipsum') || resultStr.includes('placeholder')) {
      console.log('❌ Still getting placeholder text - enhancement not working');
    } else {
      console.log('✅ No placeholder text detected - enhancements working!');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testAnalytics();
