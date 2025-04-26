"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.solarInstaller = void 0;
const zod_1 = require("zod");
const installers_1 = require("../lib/installers");
const memory_1 = require("../lib/memory");
exports.solarInstaller = {
    id: "solar-installer",
    name: "Solar Installer Matching",
    description: "Finds and connects you with top-rated solar installers in your area",
    input: zod_1.z.object({
        assessmentId: zod_1.z.string().optional(),
        address: zod_1.z.string().optional(),
        preferences: zod_1.z.object({
            maxDistance: zod_1.z.number().optional(),
            minRating: zod_1.z.number().optional(),
            preferredBrands: zod_1.z.array(zod_1.z.string()).optional(),
            requestQuotes: zod_1.z.boolean().optional()
        }).optional()
    }),
    output: zod_1.z.object({
        installers: zod_1.z.array(zod_1.z.object({
            name: zod_1.z.string(),
            rating: zod_1.z.number(),
            reviewCount: zod_1.z.number(),
            distance: zod_1.z.number(),
            contactInfo: zod_1.z.object({
                phone: zod_1.z.string(),
                email: zod_1.z.string(),
                website: zod_1.z.string()
            }),
            specialties: zod_1.z.array(zod_1.z.string()),
            certifications: zod_1.z.array(zod_1.z.string()),
            yearsInBusiness: zod_1.z.number(),
            projectsCompleted: zod_1.z.number()
        })),
        quotesRequested: zod_1.z.boolean(),
        quoteRequestId: zod_1.z.string().optional(),
        estimatedResponseTime: zod_1.z.string().optional()
    }),
    handler: async ({ assessmentId, address, preferences = {} }) => {
        console.log(`Finding solar installers for ${assessmentId || address}`);
        // Get location data
        let locationData;
        if (assessmentId) {
            const assessmentData = await (0, memory_1.getMemory)(assessmentId);
            if (!assessmentData) {
                throw new Error(`Assessment data not found for ID: ${assessmentId}`);
            }
            locationData = {
                address: assessmentData.std,
                lat: assessmentData.lat,
                lng: assessmentData.lng,
                systemSize: assessmentData.recommendedSystemSize
            };
        }
        else if (address) {
            // Import dynamically to avoid circular dependencies
            const { geocode } = await import("../lib/geo");
            const geo = await geocode(address);
            locationData = {
                address: geo.std,
                lat: geo.lat,
                lng: geo.lng,
                systemSize: 5 // Default size if no assessment
            };
        }
        else {
            throw new Error("Either assessmentId or address is required");
        }
        // Find installers
        const installers = await (0, installers_1.findLocalInstallers)({
            lat: locationData.lat,
            lng: locationData.lng,
            maxDistance: preferences.maxDistance || 50,
            minRating: preferences.minRating || 4.0,
            preferredBrands: preferences.preferredBrands,
            systemSize: locationData.systemSize
        });
        // Request quotes if specified
        let quotesRequested = false;
        let quoteRequestId;
        let estimatedResponseTime;
        if (preferences.requestQuotes && installers.length > 0) {
            // In a real implementation, this would connect to a quote request API
            quotesRequested = true;
            quoteRequestId = `quote-${Date.now()}`;
            estimatedResponseTime = "24-48 hours";
            console.log(`Quote request ${quoteRequestId} submitted to ${installers.length} installers`);
        }
        return {
            installers,
            quotesRequested,
            quoteRequestId,
            estimatedResponseTime
        };
    }
};
