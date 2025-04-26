"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.roofVision = roofVision;
const promises_1 = __importDefault(require("fs/promises"));
const generative_ai_1 = __importDefault(require("@google/generative-ai"));
const model = generative_ai_1.default.getGenerativeModel({ model: "gemini-1.5-pro-vision" });
async function roofVision(pngPath) {
    const bytes = await promises_1.default.readFile(pngPath);
    const base64 = bytes.toString("base64");
    const res = await model.generateContent({
        contents: [{
                role: "user",
                parts: [
                    { inlineData: { mimeType: "image/png", data: base64 } },
                    { text: "Return JSON {usable_area_m2, shade_pct} for solar panel placement" }
                ]
            }],
        tools: [{
                functionDeclaration: {
                    name: "roofReport",
                    parameters: { type: "object",
                        properties: {
                            usable_area_m2: { type: "number" },
                            shade_pct: { type: "number" }
                        },
                        required: ["usable_area_m2", "shade_pct"]
                    }
                }
            }]
    });
    return JSON.parse(res.candidates[0].content.parts[0].text);
}
