import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Plot from "@/models/Plot";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { plotId, flowerType } = await req.json();

    if (!plotId || !flowerType) {
      return NextResponse.json({ error: "Missing plotId or flowerType" }, { status: 400 });
    }

    await connectToDatabase();

    // Fetch the plot and ensure it belongs to the user
    const plot = await Plot.findOne({ _id: plotId, user: session.user.id });
    if (!plot) {
      return NextResponse.json({ error: "Plot not found" }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Google API Key is not configured." }, { status: 500 });
    }

    const systemPrompt = `
You are an expert Indian floriculture and horticultural planning consultant for the "Tatva" smart farming platform.
Evaluate if the flower "${flowerType}" is suitable to be cultivated on the following plot:
- Plot Location: ${plot.city}, ${plot.state}, India (Pincode: ${plot.pincode})
- Plot Area: ${plot.area} Acres
- Soil Moisture: ${plot.soilData?.moisture ? plot.soilData.moisture.toFixed(0) + "%" : "Not measured"}
- Soil Temperature: ${plot.soilData?.temperature ? plot.soilData.temperature.toFixed(0) + "°C" : "Not measured"}
- Landmark Geolocation: Lat ${plot.landmark?.lat ?? "N/A"}, Lng ${plot.landmark?.lng ?? "N/A"}

Perform a suitability analysis for growing "${flowerType}" considering typical seasonal weather, soil, and water availability in ${plot.city}, ${plot.state}, India.

Rules:
1. Present the analysis in a highly simplified, practical, farmer-friendly manner.
2. DO NOT use technical terminology, scientific metrics, mathematical formulas, or complex agricultural jargon.
3. The suitability score MUST be a number between 0 and 100, constrained strictly to intervals of 10 (e.g. 0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100).
4. Categorize the score:
   - 0-39: recommendationText is "Not Recommended". Score indicates high risk.
   - 40-69: recommendationText is "Can Be Cultivated with Some Improvements" or "Can Be Cultivated with Proper Care". Score indicates moderate success chance.
   - 70-100: recommendationText is "Highly Recommended". Score indicates excellent growth conditions.
5. All text fields in the report must be written in very simple, plain English (Hinglish-friendly/farmer-friendly) language.

You must return a valid JSON object matching this schema exactly (NO markdown codeblocks, JUST valid JSON):
{
  "score": number,
  "recommendationText": "Highly Recommended" | "Can Be Cultivated with Some Improvements" | "Not Recommended",
  "explanation": "string: a concise explanation in simple words",
  "suitabilityWhy": "string: why this flower is suitable or not suitable",
  "beforePlanting": "string: what the farmer should do before planting",
  "careWarnings": "string: things to be careful about",
  "wateringAdvice": "string: simple watering advice",
  "fertilizerAdvice": "string: basic fertilizer recommendations",
  "growingDuration": "string: expected growing duration",
  "floweringPeriod": "string: approximate flowering period",
  "profitPotential": "string: expected profit potential",
  "marketDemand": "string: expected market demand",
  "finalRecommendation": "string: final recommendation"
}
`;

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    const result = await model.generateContent(systemPrompt);
    const responseText = result.response.text();
    const jsonString = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const parsed = JSON.parse(jsonString);

    return NextResponse.json(parsed);
  } catch (err: any) {
    console.error("Floriculture API error:", err);
    return NextResponse.json({ error: err.message || "Failed to analyze suitability." }, { status: 500 });
  }
}
