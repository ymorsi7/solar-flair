import { z } from "zod";
import { geocode } from "../lib/geo";
import { getSolar } from "../lib/solar";
import { roofVision } from "../lib/vision";

export const solarAssessment = {
  id: "solar-assessment",
  name: "Solar Assessment",
  description: "Full solar ROI for an address",
  input: z.object({ address: z.string() }),
  output: z.object({
    std: z.string(),
    lat: z.number(),
    lng: z.number(),
    annualKwh: z.number(),
    paybackYears: z.number(),
    bestTilt: z.number(),
    bestMaterial: z.string(),
    melissaVerified: z.boolean()
  }),
  handler: async ({ address }) => {
    // 1.  Geocode
    const geo = await geocode(address);

    // 2.  Solar API / PVWatts
    const solar = await getSolar(geo);

    // 3.  Fetch Solar API roof tile and save temp.png
    // (for brevity, omitted download code. path => /tmp/roof.png )

    // 4.  Gemini Vision
    const vision = await roofVision("/tmp/roof.png");

    // 5.  Simple material & tilt heuristic
    const bestTilt   = solar.roofTiltDeg || 20;
    const bestMaterial =
         vision.shadePct < 20 ? "Monocrystalline" : "Half-cut PERC";

    // 6.  Payback calc—very rough
    const annualSavingsUsd = solar.annualKwh * 0.23;   // LA kWh 0.23$
    const costUsd          = solar.panelCapacityKw * 1500; // $/kW
    const payback          = costUsd / annualSavingsUsd;

    return {
      std: geo.std,
      lat: geo.lat,
      lng: geo.lng,
      annualKwh: solar.annualKwh,
      paybackYears: +payback.toFixed(1),
      bestTilt,
      bestMaterial,
      melissaVerified: geo.melissaVerified
    };
  }
};
