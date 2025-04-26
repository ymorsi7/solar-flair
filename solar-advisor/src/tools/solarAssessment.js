"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solarAssessment = void 0;
const zod_1 = require("zod");
const geo_1 = require("../lib/geo");
const solar_1 = require("../lib/solar");
const vision_1 = require("../lib/vision");
const financials_1 = require("../lib/financials");
const utility_1 = require("../lib/utility");
const incentives_1 = require("../lib/incentives");
exports.solarAssessment = {
    id: "solar-assessment",
    name: "Solar Assessment",
    description: "Full solar ROI for an address with utility rates and incentives",
    input: zod_1.z.object({
        address: zod_1.z.string(),
        // Optional parameters for more customized assessment
        monthlyBill: zod_1.z.number().optional(),
        roofAge: zod_1.z.number().optional(),
        homeownerType: zod_1.z.enum(["owner", "renter"]).optional(),
        utilityProvider: zod_1.z.string().optional()
    }),
    output: zod_1.z.object({
        // Location data
        std: zod_1.z.string(),
        lat: zod_1.z.number(),
        lng: zod_1.z.number(),
        melissaVerified: zod_1.z.boolean(),
        // Solar potential
        annualKwh: zod_1.z.number(),
        monthlyProduction: zod_1.z.array(zod_1.z.number()),
        // System details
        recommendedSystemSize: zod_1.z.number(),
        panelCount: zod_1.z.number(),
        bestTilt: zod_1.z.number(),
        bestMaterial: zod_1.z.string(),
        roofDetails: zod_1.z.object({
            usableAreaM2: zod_1.z.number(),
            shadePct: zod_1.z.number(),
            ageYears: zod_1.z.number().optional(),
            condition: zod_1.z.string().optional()
        }),
        // Financial analysis
        financials: zod_1.z.object({
            systemCost: zod_1.z.number(),
            incentives: zod_1.z.number(),
            netCost: zod_1.z.number(),
            annualSavings: zod_1.z.number(),
            paybackYears: zod_1.z.number(),
            roi25Year: zod_1.z.number(),
            monthlyLoanPayment: zod_1.z.number().optional()
        }),
        // Environmental impact
        environmental: zod_1.z.object({
            co2ReductionKg: zod_1.z.number(),
            treesEquivalent: zod_1.z.number(),
            carEquivalent: zod_1.z.number()
        }),
        // Utility data
        utility: zod_1.z.object({
            provider: zod_1.z.string(),
            rate: zod_1.z.number(),
            netMetering: zod_1.z.boolean(),
            timeOfUseRates: zod_1.z.boolean()
        }),
        // Next steps
        nextSteps: zod_1.z.array(zod_1.z.object({
            action: zod_1.z.string(),
            description: zod_1.z.string(),
            toolId: zod_1.z.string().optional()
        }))
    }),
    handler: async ({ address, monthlyBill, roofAge, homeownerType, utilityProvider }) => {
        // Store start time for performance tracking
        const startTime = Date.now();
        console.log(`Starting solar assessment for ${address}`);
        // 1. Geocode with enhanced error handling
        let geo;
        try {
            geo = await (0, geo_1.geocode)(address);
            console.log(`Address validated: ${geo.std}`);
        }
        catch (error) {
            console.error(`Geocoding error: ${error.message}`);
            throw new Error(`Unable to validate address: ${error.message}`);
        }
        // 2. Get utility information based on location
        const utility = await (0, utility_1.getUtilityRates)(geo, utilityProvider);
        console.log(`Utility provider identified: ${utility.provider}`);
        // 3. Get solar potential with enhanced data
        const solar = await (0, solar_1.getSolar)(geo);
        console.log(`Solar potential calculated: ${solar.annualKwh} kWh/year`);
        // 4. Analyze roof with vision AI
        const vision = await (0, vision_1.roofVision)(solar.roofImageUrl || "/tmp/roof.png", roofAge);
        console.log(`Roof analysis complete: ${vision.usableAreaM2}m² usable, ${vision.shadePct}% shade`);
        // 5. Get available incentives
        const incentives = await (0, incentives_1.getIncentives)(geo.std, solar.panelCapacityKw);
        console.log(`Incentives calculated: $${incentives.totalValue}`);
        // 6. Calculate detailed financials
        const financials = (0, financials_1.calculateFinancials)({
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
        }
        else {
            nextSteps.push({
                action: "Explore Community Solar",
                description: "Find community solar programs in your area",
                toolId: "solar-community"
            });
        }
        // Log performance metrics
        const endTime = Date.now();
        console.log(`Assessment completed in ${(endTime - startTime) / 1000} seconds`);
        // Return comprehensive results
        return {
            std: geo.std,
            lat: geo.lat,
            lng: geo.lng,
            melissaVerified: geo.melissaVerified,
            annualKwh: solar.annualKwh,
            monthlyProduction: solar.monthlyProduction || Array(12).fill(solar.annualKwh / 12),
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
