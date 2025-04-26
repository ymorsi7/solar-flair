"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSystemDesign = getSystemDesign;
async function getSystemDesign(params) {
    console.log(`Generating system design for ${params.address}`);
    // Calculate panel count based on system size (assuming 350W panels)
    const panelCount = Math.ceil(params.systemSize * 1000 / 350);
    // Determine panel layout based on roof details
    const panelLayout = params.roofDetails.shadePct > 20
        ? "Optimized for Shade"
        : "Maximum Production";
    // Determine inverter type
    const inverterType = params.roofDetails.shadePct > 15
        ? "Microinverters"
        : "String Inverter with Optimizers";
    // Battery system if requested
    const batterySystem = params.includeBattery
        ? {
            capacity: 13.5, // kWh
            brand: "Tesla Powerwall",
            backupCapability: true
        }
        : undefined;
    // Generate mock image URLs
    // In a real implementation, these would be actual design renderings
    const designId = `design-${Date.now()}`;
    const images = [
        `https://example.com/designs/${designId}/aerial.jpg`,
        `https://example.com/designs/${designId}/roof-layout.jpg`,
        `https://example.com/designs/${designId}/production-chart.jpg`
    ];
    return {
        designId,
        images,
        panelCount,
        panelLayout,
        inverterType,
        batterySystem
    };
}
