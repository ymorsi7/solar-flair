import { z } from "zod";
import { findLocalInstallers } from "../lib/installers";
import { getMemory } from "../lib/memory";

export const solarInstaller = {
  id: "solar-installer",
  name: "Solar Installer Matching",
  description: "Finds and connects you with top-rated solar installers in your area",
  input: z.object({ 
    assessmentId: z.string().optional(),
    address: z.string().optional(),
    preferences: z.object({
      maxDistance: z.number().optional(),
      minRating: z.number().optional(),
      preferredBrands: z.array(z.string()).optional(),
      requestQuotes: z.boolean().optional()
    }).optional()
  }),
  output: z.object({
    installers: z.array(z.object({
      name: z.string(),
      rating: z.number(),
      reviewCount: z.number(),
      distance: z.number(),
      contactInfo: z.object({
        phone: z.string(),
        email: z.string(),
        website: z.string()
      }),
      specialties: z.array(z.string()),
      certifications: z.array(z.string()),
      yearsInBusiness: z.number(),
      projectsCompleted: z.number()
    })),
    quotesRequested: z.boolean(),
    quoteRequestId: z.string().optional(),
    estimatedResponseTime: z.string().optional()
  }),
  handler: async ({ assessmentId, address, preferences = {} }) => {
    console.log(`Finding solar installers for ${assessmentId || address}`);
    
    // Get location data
    let locationData;
    if (assessmentId) {
      const assessmentData = await getMemory(assessmentId);
      if (!assessmentData) {
        throw new Error(`Assessment data not found for ID: ${assessmentId}`);
      }
      locationData = {
        address: assessmentData.std,
        lat: assessmentData.lat,
        lng: assessmentData.lng,
        systemSize: assessmentData.recommendedSystemSize
      };
    } else if (address) {
      // Import dynamically to avoid circular dependencies
      const { geocode } = await import("../lib/geo");
      const geo = await geocode(address);
      locationData = {
        address: geo.std,
        lat: geo.lat,
        lng: geo.lng,
        systemSize: 5 // Default size if no assessment
      };
    } else {
      throw new Error("Either assessmentId or address is required");
    }
    
    // Find installers
    const installers = await findLocalInstallers({
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