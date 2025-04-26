import { z } from "zod";
import { geocode } from "../lib/geo";

export const solarAssessment = {
  id: "solar-assessment",
  name: "Solar Assessment – Geo stage",
  description: "Returns latitude/longitude for a given address.",
  input: z.object({ address: z.string() }),
  output: z.object({
    lat: z.number(),
    lng: z.number(),
    std: z.string(),
    melissaVerified: z.boolean()  // Added this field
  }),
  handler: async ({ address }) => {
    return await geocode(address);
  }
};