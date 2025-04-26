import { z } from "zod";
import { generateProposalPDF } from "../lib/pdf";
import { getSystemDesign } from "../lib/design";
import { getMemory } from "../lib/memory";

export const solarProposal = {
  id: "solar-proposal",
  name: "Solar Proposal Generator",
  description: "Creates a professional solar proposal with system design and financials",
  input: z.object({ 
    assessmentId: z.string().optional(),
    address: z.string().optional(),
    customizations: z.object({
      includeFinancing: z.boolean().optional(),
      includeBatteryStorage: z.boolean().optional(),
      preferredPanelBrand: z.string().optional()
    }).optional()
  }),
  output: z.object({
    proposalId: z.string(),
    proposalUrl: z.string(),
    systemDetails: z.object({
      capacity: z.number(),
      panelCount: z.number(),
      panelType: z.string(),
      inverterType: z.string(),
      includeBattery: z.boolean(),
      estimatedProduction: z.number()
    }),
    financials: z.object({
      totalCost: z.number(),
      netCost: z.number(),
      monthlyPayment: z.number().optional(),
      paybackPeriod: z.number(),
      lifetimeSavings: z.number()
    }),
    designImages: z.array(z.string())
  }),
  handler: async ({ assessmentId, address, customizations = {} }) => {
    console.log(`Generating solar proposal for ${assessmentId || address}`);
    
    // 1. Get assessment data from memory or run a new assessment
    let assessmentData;
    if (assessmentId) {
      assessmentData = await getMemory(assessmentId);
      if (!assessmentData) {
        throw new Error(`Assessment data not found for ID: ${assessmentId}`);
      }
    } else if (address) {
      // Import dynamically to avoid circular dependencies
      const { solarAssessment } = await import("./solarAssessment");
      assessmentData = await solarAssessment.handler({ address });
    } else {
      throw new Error("Either assessmentId or address is required");
    }
    
    // 2. Generate system design with visualization
    const design = await getSystemDesign({
      address: assessmentData.std,
      lat: assessmentData.lat,
      lng: assessmentData.lng,
      systemSize: assessmentData.recommendedSystemSize,
      roofDetails: assessmentData.roofDetails,
      includeBattery: customizations.includeBatteryStorage || false,
      preferredPanelBrand: customizations.preferredPanelBrand
    });
    
    // 3. Adjust financials based on customizations
    const financials = { ...assessmentData.financials };
    if (customizations.includeBatteryStorage) {
      financials.systemCost += 10000; // Add battery cost
      financials.netCost += 7500; // After incentives
      financials.paybackYears = (financials.netCost / financials.annualSavings).toFixed(1);
    }
    
    if (customizations.includeFinancing) {
      financials.monthlyPayment = (financials.netCost / 12 / 20).toFixed(2); // Simple 20-year financing
    }
    
    // 4. Generate PDF proposal
    const proposalId = `proposal-${Date.now()}`;
    const proposalUrl = await generateProposalPDF({
      proposalId,
      customerInfo: {
        address: assessmentData.std,
        utility: assessmentData.utility.provider
      },
      systemDetails: {
        capacity: assessmentData.recommendedSystemSize,
        panelCount: assessmentData.panelCount,
        panelType: customizations.preferredPanelBrand || "Premium Monocrystalline",
        inverterType: "String Inverter with Optimizers",
        includeBattery: customizations.includeBatteryStorage || false,
        estimatedProduction: assessmentData.annualKwh
      },
      financials: {
        totalCost: financials.systemCost,
        netCost: financials.netCost,
        monthlyPayment: financials.monthlyPayment,
        paybackPeriod: financials.paybackYears,
        lifetimeSavings: financials.annualSavings * 25 // 25-year savings
      },
      designImages: design.images
    });
    
    return {
      proposalId,
      proposalUrl,
      systemDetails: {
        capacity: assessmentData.recommendedSystemSize,
        panelCount: assessmentData.panelCount,
        panelType: customizations.preferredPanelBrand || "Premium Monocrystalline",
        inverterType: "String Inverter with Optimizers",
        includeBattery: customizations.includeBatteryStorage || false,
        estimatedProduction: assessmentData.annualKwh
      },
      financials: {
        totalCost: financials.systemCost,
        netCost: financials.netCost,
        monthlyPayment: financials.monthlyPayment,
        paybackPeriod: financials.paybackYears,
        lifetimeSavings: financials.annualSavings * 25
      },
      designImages: design.images
    };
  }
};