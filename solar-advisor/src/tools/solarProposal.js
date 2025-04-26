"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solarProposal = void 0;
const zod_1 = require("zod");
const pdf_1 = require("../lib/pdf");
const design_1 = require("../lib/design");
const memory_1 = require("../lib/memory");
exports.solarProposal = {
    id: "solar-proposal",
    name: "Solar Proposal Generator",
    description: "Creates a professional solar proposal with system design and financials",
    input: zod_1.z.object({
        assessmentId: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        customizations: zod_1.z.object({
            includeFinancing: zod_1.z.boolean().optional(),
            includeBatteryStorage: zod_1.z.boolean().optional(),
            preferredPanelBrand: zod_1.z.string().optional()
        }).optional()
    }),
    output: zod_1.z.object({
        proposalId: zod_1.z.string(),
        proposalUrl: zod_1.z.string(),
        systemDetails: zod_1.z.object({
            capacity: zod_1.z.number(),
            panelCount: zod_1.z.number(),
            panelType: zod_1.z.string(),
            inverterType: zod_1.z.string(),
            includeBattery: zod_1.z.boolean(),
            estimatedProduction: zod_1.z.number()
        }),
        financials: zod_1.z.object({
            totalCost: zod_1.z.number(),
            netCost: zod_1.z.number(),
            monthlyPayment: zod_1.z.number().optional(),
            paybackPeriod: zod_1.z.number(),
            lifetimeSavings: zod_1.z.number()
        }),
        designImages: zod_1.z.array(zod_1.z.string())
    }),
    handler: async ({ assessmentId, address, customizations = {} }) => {
        console.log(`Generating solar proposal for ${assessmentId || address}`);
        // 1. Get assessment data from memory or run a new assessment
        let assessmentData;
        if (assessmentId) {
            assessmentData = await (0, memory_1.getMemory)(assessmentId);
            if (!assessmentData) {
                throw new Error(`Assessment data not found for ID: ${assessmentId}`);
            }
        }
        else if (address) {
            // Import dynamically to avoid circular dependencies
            const { solarAssessment } = await import("./solarAssessment");
            assessmentData = await solarAssessment.handler({ address });
        }
        else {
            throw new Error("Either assessmentId or address is required");
        }
        // 2. Generate system design with visualization
        const design = await (0, design_1.getSystemDesign)({
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
        const proposalUrl = await (0, pdf_1.generateProposalPDF)({
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
