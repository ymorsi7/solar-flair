interface FinancialInputs {
    systemSize: number;
    annualProduction: number;
    utilityRate: number;
    incentives: number;
    monthlyBill?: number;
  }
  
  interface FinancialResults {
    systemCost: number;
    incentivesValue: number;
    netCost: number;
    annualSavings: number;
    paybackYears: number;
    roi25Year: number;
    monthlyLoanPayment?: number;
  }
  
  export function calculateFinancials(inputs: FinancialInputs): FinancialResults {
    // Calculate system cost based on size and current market rates
    // National average is $2.95/watt before incentives
    const costPerWatt = 2.95;
    const systemCost = inputs.systemSize * 1000 * costPerWatt;
    
    // Calculate incentives
    const incentivesValue = inputs.incentives || systemCost * 0.3; // Default to 30% federal tax credit
    
    // Net cost after incentives
    const netCost = systemCost - incentivesValue;
    
    // Annual savings
    const annualSavings = inputs.annualProduction * inputs.utilityRate;
    
    // Payback period
    const paybackYears = parseFloat((netCost / annualSavings).toFixed(1));
    
    // 25-year ROI
    const lifetimeSavings = annualSavings * 25; // 25-year system life
    const roi25Year = parseFloat(((lifetimeSavings - netCost) / netCost * 100).toFixed(1));
    
    // Calculate monthly loan payment (optional)
    // Simple calculation for a 20-year loan at 5.5% interest
    const monthlyLoanPayment = parseFloat((netCost * 0.0069).toFixed(2)); // Approximation for 5.5%, 20 years
    
    return {
      systemCost,
      incentivesValue,
      netCost,
      annualSavings,
      paybackYears,
      roi25Year,
      monthlyLoanPayment
    };
  }