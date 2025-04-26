import fetch from "node-fetch";
import { GeoOut } from "./geo";

interface SolarOut {
  annualKwh: number;          // AC energy first-year
  roofAzimuthDeg: number;     // Solar API returns this
  roofTiltDeg: number;
  panelCapacityKw: number;    // suggested system size
}

/* 1️⃣  Primary: Google Solar API */
async function solarInsights({ lat, lng }: GeoOut): Promise<SolarOut|null>{
  const key = process.env.GOOGLE_SOLAR_KEY!;
  const url =
    `https://solar.googleapis.com/v1/buildingInsights:findClosest?location.latitude=${lat}&location.longitude=${lng}&key=${key}`;
  const r   = await fetch(url);
  if (!r.ok) return null;
  const j = await r.json();
  if (!j.buildingInsights?.solarPotential) return null;

  const pot = j.buildingInsights.solarPotential;
  return {
    annualKwh:       pot.whYearly / 1000,
    roofAzimuthDeg:  pot.optimalTiltAzimuthDegrees,   // API field
    roofTiltDeg:     pot.optimalTiltDegrees,
    panelCapacityKw: pot.maxArrayPanelsCount * pot.panelCapacityWatts / 1000
  };
}

/* 2️⃣  Backup: NREL PVWatts V8 */
async function pvWatts({ lat, lng }: GeoOut): Promise<SolarOut>{
  const key = process.env.NREL_KEY!;
  const url = `https://developer.nrel.gov/api/pvwatts/v8.json?api_key=${key}&lat=${lat}&lon=${lng}&system_capacity=5&azimuth=180&tilt=20`;
  const r   = await fetch(url);
  const j   = await r.json();
  const ac  = j.outputs.ac_annual;
  return {
    annualKwh: ac,
    roofAzimuthDeg: 180,
    roofTiltDeg: 20,
    panelCapacityKw: 5
  };
}

export async function getSolar(geo: GeoOut): Promise<SolarOut>{
  const primary = await solarInsights(geo);
  return primary ?? await pvWatts(geo);
}
