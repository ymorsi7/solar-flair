"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findLocalInstallers = findLocalInstallers;
// Mock database of installers
const mockInstallers = [
    {
        name: "SunPower Elite Dealer",
        rating: 4.9,
        reviewCount: 342,
        distance: 5.2,
        contactInfo: {
            phone: "800-555-1234",
            email: "info@sunpowerelite.example.com",
            website: "https://www.sunpowerelite.example.com"
        },
        specialties: ["Residential", "Premium Panels", "Battery Storage"],
        certifications: ["NABCEP", "SunPower Elite"],
        yearsInBusiness: 15,
        projectsCompleted: 2500
    },
    {
        name: "Local Solar Solutions",
        rating: 4.7,
        reviewCount: 187,
        distance: 3.8,
        contactInfo: {
            phone: "800-555-2345",
            email: "sales@localsolar.example.com",
            website: "https://www.localsolar.example.com"
        },
        specialties: ["Residential", "Commercial", "Ground Mount"],
        certifications: ["NABCEP", "Tesla Certified"],
        yearsInBusiness: 8,
        projectsCompleted: 950
    },
    {
        name: "Green Energy Experts",
        rating: 4.5,
        reviewCount: 263,
        distance: 7.1,
        contactInfo: {
            phone: "800-555-3456",
            email: "info@greenexperts.example.com",
            website: "https://www.greenexperts.example.com"
        },
        specialties: ["Residential", "Off-Grid", "Battery Storage"],
        certifications: ["NABCEP", "LG Certified"],
        yearsInBusiness: 12,
        projectsCompleted: 1800
    }
];
async function findLocalInstallers(params) {
    console.log(`Finding installers near ${params.lat}, ${params.lng}`);
    // Filter installers by rating and distance
    let filteredInstallers = mockInstallers.filter(installer => installer.rating >= params.minRating &&
        installer.distance <= params.maxDistance);
    // Filter by preferred brands if specified
    if (params.preferredBrands && params.preferredBrands.length > 0) {
        filteredInstallers = filteredInstallers.filter(installer => installer.specialties.some(specialty => params.preferredBrands.some(brand => specialty.toLowerCase().includes(brand.toLowerCase()))) ||
            installer.certifications.some(cert => params.preferredBrands.some(brand => cert.toLowerCase().includes(brand.toLowerCase()))));
    }
    // Sort by distance
    filteredInstallers.sort((a, b) => a.distance - b.distance);
    return filteredInstallers;
}
