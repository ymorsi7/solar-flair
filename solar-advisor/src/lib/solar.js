"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSolar = getSolar;
const node_fetch_1 = __importDefault(require("node-fetch"));
/* 1️⃣  Primary: Google Solar API */
async function solarInsights({ lat, lng }) {
    const key = process.env.GOOGLE_SOLAR_KEY;
    const url = `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${key}`;
    const r = await (0, node_fetch_1.default)(url);
    if (!r.ok)
        return null;
    const j = await r.json();
    if (!j.buildingInsights?.solarPotential)
        return null;
    const pot = j.buildingInsights.solarPotential;
    return {
        annualKwh: pot.whYearly / 1000,
        roofAzimuthDeg: pot.optimalTiltAzimuthDegrees, // API field
        roofTiltDeg: pot.optimalTiltDegrees,
        panelCapacityKw: pot.maxArrayPanelsCount * pot.panelCapacityWatts / 1000
    };
}
/* 2️⃣  Backup: NREL PVWatts V8 */
async function pvWatts({ lat, lng }) {
    const key = process.env.NREL_KEY;
    const url = `https://developer.nrel.gov/api/pvwatts/v8.json?api_key=${key}&lat=${lat}&lon=${lng}&system_capacity=5&azimuth=180&tilt=20`;
    const r = await (0, node_fetch_1.default)(url);
    const j = await r.json();
    const ac = j.outputs.ac_annual;
    return {
        annualKwh: ac,
        roofAzimuthDeg: 180,
        roofTiltDeg: 20,
        panelCapacityKw: 5
    };
}
async function getSolar(geo) {
    const primary = await solarInsights(geo);
    return primary ?? await pvWatts(geo);
}
