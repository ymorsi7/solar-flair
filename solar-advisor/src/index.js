"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const service_1 = require("@dain/service");
const solarAssessment_1 = require("./tools/solarAssessment");
const solarProposal_1 = require("./tools/solarProposal");
const solarInstaller_1 = require("./tools/solarInstaller");
const solarFinancing_1 = require("./tools/solarFinancing");
const solarMonitoring_1 = require("./tools/solarMonitoring");
// Create a complete solar agent service
const service = (0, service_1.createService)({
    name: "SolarSage AI Agent",
    description: "Complete solar advisory service from assessment to installation and monitoring",
    // Register all tools in the solar workflow
    tools: [
        solarAssessment_1.solarAssessment,
        solarProposal_1.solarProposal,
        solarInstaller_1.solarInstaller,
        solarFinancing_1.solarFinancing,
        solarMonitoring_1.solarMonitoring
    ],
    // Add monetization options
    pricing: {
        free: {
            description: "Basic solar assessment",
            tools: ["solar-assessment"],
            limits: {
                requests: { count: 3, period: "month" }
            }
        },
        premium: {
            price: 9.99,
            period: "month",
            description: "Full solar advisory with proposal generation and installer matching",
            tools: ["solar-assessment", "solar-proposal", "solar-installer"]
        },
        business: {
            price: 49.99,
            period: "month",
            description: "Complete solar solution with financing and monitoring",
            tools: ["solar-assessment", "solar-proposal", "solar-installer", "solar-financing", "solar-monitoring"]
        }
    },
    // Add memory and context
    memory: {
        enabled: true,
        ttl: 60 * 60 * 24 * 30 // 30 days
    }
});
service.start();
