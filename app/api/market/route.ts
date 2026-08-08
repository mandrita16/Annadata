import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Mathematical coefficients (Proportional impact)
const LAMBDA = 0.05; // 5% Temperature trend impact
const MU = 0.15;     // 15% Market demand impact
const GAMMA = 0.10;  // 10% Rainfall impact
const DELTA = 0.02;  // 2% Crop index impact

const CROP_INDEX_MAP: Record<string, number> = {
  "Rice (Paddy)": 10,
  "Wheat": 12,
  "Maize (Corn)": 8,
  "Cotton": 20,
  "Sugarcane": 15,
  "Soybean": 14,
  "Potato": 9,
  "Tomato": 11,
  "Onion": 13,
  "Groundnut": 16,
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      cropName,
      estimatedYield,
      totalCost,
      targetMarketCity,
      farmAreaM2,
    } = body;

    // 1. Initialize Gemini 2.5 Flash
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

    // 2. Prompt Gemini for real-time market data
    const prompt = `
You are an expert agricultural economist and AI data agent for the "Tatva" precision agriculture platform in India.
I need current approximate real-time data for the crop "${cropName}" in the wholesale market of "${targetMarketCity}".

Provide sensible, realistic real-time estimates for the following parameters in a strictly formatted JSON object (NO markdown, NO codeblocks, JUST valid JSON).

{
  "basePrice": <Current average wholesale price in INR per kg as a number>,
  "marketDemand": <Number: 1 for High Demand, 0 for Normal, -1 for Low Demand>,
  "rainfall": <Number: 1 for High/Excess, 0 for Normal, -1 for Low/Deficit>,
  "temperatureTrend": <Float between -1.0 (cooling) and 1.0 (warming)>,
  "summary": "A 1-2 sentence high-level market outlook for ${cropName} in ${targetMarketCity}.",
  "marketInsight": "A brief explanation of why the price is trending this way (demand, weather, transport)."
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Parse the JSON output from Gemini
    const jsonString = responseText.replace(/```json\n?|\n?```/g, "").trim();
    const aiData = JSON.parse(jsonString);

    // Provide fallbacks in case AI misses something
    const avgPrice = Number(aiData.basePrice) || 20;
    const Ts = Number(aiData.temperatureTrend) || 0;
    const Md = Number(aiData.marketDemand) || 0;
    const Rf = Number(aiData.rainfall) || 0;
    const Ci = CROP_INDEX_MAP[cropName] || 10;

    // 3. Mathematical Equations
    // P_future = P_avg * (1 + lambda*Ts + mu*Md + gamma*Rf + delta*(Ci/10))
    const predictedPrice =
      avgPrice *
      (1 +
        LAMBDA * Ts +
        MU * Md +
        GAMMA * Rf +
        DELTA * (Ci / 10));

    // Equation 2: Profitability
    // Pi = (P_future * Y_pred) - C_total
    const profitability = predictedPrice * Number(estimatedYield) - Number(totalCost);

    // Equation 3: Risk-Adjusted Profit
    // R_a = Pi / sigma_m
    const sigma_m = Md > 0 ? 1.5 : Md < 0 ? 2.5 : 1.2;
    const riskAdjustedProfit = profitability / sigma_m;

    // Determine if the crop is sellable
    let sellableStatus = "Yes";
    if (profitability <= 0 || Md < 0) {
      sellableStatus = "No (Hold)";
    } else if (profitability > 20000 && Md > 0) {
      sellableStatus = "Highly Sellable";
    }

    return NextResponse.json({
      success: true,
      data: {
        predictedPrice,
        profitability,
        riskAdjustedProfit,
        sellableStatus,
        summary: aiData.summary || "Market conditions are average.",
        marketInsight: aiData.marketInsight || "No specific insights available at the moment.",
        aiFactors: {
          basePrice: avgPrice,
          marketDemand: Md,
          rainfall: Rf,
          temperatureTrend: Ts
        }
      },
    });
  } catch (error: any) {
    console.error("Market API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to predict market dynamics" },
      { status: 500 }
    );
  }
}
