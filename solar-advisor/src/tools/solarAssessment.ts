import { z } from "zod";
import { geocode } from "../lib/geo";
import { getSolar } from "../lib/solar";
import { roofVision } from "../lib/vision";
import { calculateFinancials } from "../lib/financials";
import { getUtilityRates } from "../lib/utility";
import { getIncentives } from "../lib/incentives";

export const solarAssessment = {
  id: "solar-assessment",
  name: "Solar Assessment",
  description: "Full solar ROI for an address with utility rates and incentives",
  input: z.object({ 
    address: z.string(),
    // Optional parameters for more customized assessment
    monthlyBill: z.number().optional(),
    roofAge: z.number().optional(),
    homeownerType: z.enum(["owner", "renter"]).optional(),
    utilityProvider: z.string().optional()
  }),
  output: z.object({
    // Location data
    std: z.string(),
    lat: z.number(),
    lng: z.number(),
    melissaVerified: z.boolean(),
    
    // Solar potential
    annualKwh: z.number(),
    monthlyProduction: z.array(z.number()),
    
    // System details
    recommendedSystemSize: z.number(),
    panelCount: z.number(),
    bestTilt: z.number(),
    bestMaterial: z.string(),
    roofDetails: z.object({
      usableAreaM2: z.number(),
      shadePct: z.number(),
      ageYears: z.number().optional(),
      condition: z.string().optional()
    }),
    
    // Financial analysis
    financials: z.object({
      systemCost: z.number(),
      incentives: z.number(),
      netCost: z.number(),
      annualSavings: z.number(),
      paybackYears: z.number(),
      roi25Year: z.number(),
      monthlyLoanPayment: z.number().optional()
    }),
    
    // Environmental impact
    environmental: z.object({
      co2ReductionKg: z.number(),
      treesEquivalent: z.number(),
      carEquivalent: z.number()
    }),
    
    // Utility data
    utility: z.object({
      provider: z.string(),
      rate: z.number(),
      netMetering: z.boolean(),
      timeOfUseRates: z.boolean()
    }),
    
    // Next steps
    nextSteps: z.array(z.object({
      action: z.string(),
      description: z.string(),
      toolId: z.string().optional()
    }))
  }),
  handler: async ({ address, monthlyBill, roofAge, homeownerType, utilityProvider }) => {
    // Store start time for performance tracking
    const startTime = Date.now();
    console.log(`Starting solar assessment for ${address}`);
    
    // 1. Geocode with enhanced error handling
    let geo;
    try {
      geo = await geocode(address);
      console.log(`Address validated: ${geo.std}`);
    } catch (error) {
      console.error(`Geocoding error: ${error.message}`);
      throw new Error(`Unable to validate address: ${error.message}`);
    }
    
    // 2. Get utility information based on location
    const utility = await getUtilityRates(geo, utilityProvider);
    console.log(`Utility provider identified: ${utility.provider}`);
    
    // 3. Get solar potential with enhanced data
    const solar = await getSolar(geo);
    console.log(`Solar potential calculated: ${solar.annualKwh} kWh/year`);
    
    // 4. Analyze roof with vision AI
    const vision = await roofVision(solar.roofImageUrl || "/tmp/roof.png", roofAge);
    console.log(`Roof analysis complete: ${vision.usableAreaM2}m² usable, ${vision.shadePct}% shade`);
    
    // 5. Get available incentives
    const incentives = await getIncentives(geo.std, solar.panelCapacityKw);
    console.log(`Incentives calculated: $${incentives.totalValue}`);
    
    // 6. Calculate detailed financials
    const financials = calculateFinancials({
      systemSize: solar.panelCapacityKw,
      annualProduction: solar.annualKwh,
      utilityRate: utility.rate,
      incentives: incentives.totalValue,
      monthlyBill: monthlyBill || (solar.annualKwh * utility.rate / 12)
    });
    console.log(`Financial analysis complete: ${financials.paybackYears} year payback`);
    
    // 7. Calculate environmental impact
    const co2ReductionKg = solar.annualKwh * 0.7; // 0.7 kg CO2 per kWh
    const treesEquivalent = co2ReductionKg / 21.7; // 21.7 kg CO2 per tree per year
    const carEquivalent = co2ReductionKg / 4600; // 4600 kg CO2 per car per year
    
    // 8. Determine next steps based on assessment
    const nextSteps = [];
    
    if (homeownerType !== "renter") {
      nextSteps.push({
        action: "Generate Custom Proposal",
        description: "Create a detailed solar proposal with system design and financials",
        toolId: "solar-proposal"
      });
      
      nextSteps.push({
        action: "Find Local Installers",
        description: "Connect with top-rated solar installers in your area",
        toolId: "solar-installer"
      });
      
      if (financials.paybackYears < 8) {
        nextSteps.push({
          action: "Explore Financing Options",
          description: "Compare solar loans, leases, and PPAs",
          toolId: "solar-financing"
        });
      }
    } else {
      nextSteps.push({
        action: "Explore Community Solar",
        description: "Find community solar programs in your area",
        toolId: "solar-community"
      });
    }
    
    // Log performance metrics
    const endTime = Date.now();
    console.log(`Assessment completed in ${(endTime - startTime)/1000} seconds`);
    
    // Return comprehensive results
    return {
      std: geo.std,
      lat: geo.lat,
      lng: geo.lng,
      melissaVerified: geo.melissaVerified,
      
      annualKwh: solar.annualKwh,
      monthlyProduction: solar.monthlyProduction || Array(12).fill(solar.annualKwh/12),
      
      recommendedSystemSize: solar.panelCapacityKw,
      panelCount: Math.ceil(solar.panelCapacityKw * 1000 / 350), // Assuming 350W panels
      bestTilt: solar.roofTiltDeg || 20,
      bestMaterial: vision.shadePct < 20 ? "Monocrystalline" : "Half-cut PERC",
      
      roofDetails: {
        usableAreaM2: vision.usableAreaM2,
        shadePct: vision.shadePct,
        ageYears: vision.roofAge || roofAge,
        condition: vision.roofCondition
      },
      
      financials: {
        systemCost: financials.systemCost,
        incentives: financials.incentivesValue,
        netCost: financials.netCost,
        annualSavings: financials.annualSavings,
        paybackYears: financials.paybackYears,
        roi25Year: financials.roi25Year,
        monthlyLoanPayment: financials.monthlyLoanPayment
      },
      
      environmental: {
        co2ReductionKg,
        treesEquivalent: Math.round(treesEquivalent),
        carEquivalent: carEquivalent.toFixed(2)
      },
      
      utility: {
        provider: utility.provider,
        rate: utility.rate,
        netMetering: utility.netMetering,
        timeOfUseRates: utility.timeOfUseRates
      },
      
      nextSteps
    };
  }
};