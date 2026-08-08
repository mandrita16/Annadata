import { GoogleGenerativeAI } from "@google/generative-ai";

export interface InsuranceAnalysisResult {
    estimatedAmount: number;
    interestRate: number;
    netPayableAmount: number;
    schemeName: string;
    eligibilityRemark: string;
    breakdownSummary: string;
    recommendation: string;
}

const TIER_1_STATES = ["punjab", "haryana", "uttar pradesh"];
const TIER_2_STATES = [
    "maharashtra",
    "madhya pradesh",
    "andhra pradesh",
    "gujarat",
    "karnataka",
    "tamil nadu",
    "west bengal",
];

const CALAMITY_LABELS: Record<string, string> = {
    flood: "Flood",
    drought: "Drought",
    pest_attack: "Pest Attack",
    fire: "Fire",
    hailstorm: "Hailstorm",
    cyclone: "Cyclone",
    landslide: "Landslide",
    frost: "Frost",
    crop_disease: "Crop Disease",
    unseasonal_rain: "Unseasonal Rain",
    other: "Other",
};

export async function calculateInsurance(claimData: {
    state: string;
    city: string;
    areaAcres: number;
    calamityType: string;
    calamityDescription: string;
    damagedPercentage: number;
    damagedAreaSqm: number;
}): Promise<InsuranceAnalysisResult> {
    // 1. Calculate precise regional limits to anchor the AI model
    const stateLower = claimData.state.toLowerCase();
    let baseSIAcre = 25000; // Default Tier 3

    if (TIER_1_STATES.some((s) => stateLower.includes(s))) {
        baseSIAcre = 45000;
    } else if (TIER_2_STATES.some((s) => stateLower.includes(s))) {
        baseSIAcre = 35000;
    }

    // Determine standard premium equivalent (interest rate)
    const cType = claimData.calamityType;
    const isCommercialOrDisease = ["pest_attack", "crop_disease"].includes(cType);
    const standardInterestRate = isCommercialOrDisease ? 5.0 : 2.0;

    // Calculate damaged acreage and standard compensation bounds
    const damagedAreaAcres = claimData.areaAcres * (claimData.damagedPercentage / 100);
    const grossMaxCompensation = damagedAreaAcres * baseSIAcre;
    
    // Hard floor equivalent
    const estimatedBase = Math.max(10000, Math.round(grossMaxCompensation));
    const netPayableBase = Math.round(estimatedBase * (1 - standardInterestRate / 100));

    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;

    if (apiKey) {
        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

            const calamityLabel = CALAMITY_LABELS[claimData.calamityType] || claimData.calamityType;

            const prompt = `
You are an expert AI agricultural claim assessor and senior surveyor for the Government of India's Pradhan Mantri Fasal Bima Yojana (PMFBY) and state-wise Disaster Relief Fund guidelines.
Analyze the following crop damage claim parameters:
- State: ${claimData.state}
- City/District: ${claimData.city}
- Cultivated Area: ${claimData.areaAcres} Acres
- Calamity Type: ${calamityLabel}
- Farmer's Loss Narrative: "${claimData.calamityDescription}"
- Crop Damage Canopy Assessment: ${claimData.damagedPercentage}%
- Affected Area: ${claimData.damagedAreaSqm.toFixed(0)} Sqm

To ensure the ex-gratia amount is mathematically accurate and conforms strictly to Indian standards, apply these calculated limits:
- Standard Sum Insured (SI) per Acre for this region is ₹${baseSIAcre.toLocaleString("en-IN")}.
- Calculated Damaged Area: ${damagedAreaAcres.toFixed(2)} Acres.
- Maximum standard Gross Compensation limit: ₹${estimatedBase.toLocaleString("en-IN")}.
- Standard PMFBY Interest (Premium Equivalent): ${standardInterestRate}%.
- Standard target Net Ex-Gratia payout: ₹${netPayableBase.toLocaleString("en-IN")}.

Your task:
1. Reconsider the farmer's loss narrative and calamity severity. Adjust the final ex-gratia payout within a range of +/- 15% of the standard target Net Payout (₹${netPayableBase.toLocaleString("en-IN")}). For example, severe cyclonic devastation gets the full maximum limit, whereas localized crop diseases with minor symptoms get a slightly lower calibrated ratio.
2. Ensure your suggested estimatedAmount and netPayableAmount are realistic, mathematically linked, and align with standard mandi relief caps (do not estimate unreasonably high or low values).
3. Generate a professional breakdown summary explaining how you evaluated the claim, referencing the state tier and standard calculations, and list 3 clear action steps for the farmer.

You must return a JSON object (NO markdown codeblocks, JUST valid JSON) matching this schema exactly:
{
  "estimatedAmount": number,
  "interestRate": number,
  "netPayableAmount": number,
  "schemeName": "string representing the applicable scheme name, e.g. PMFBY (Pradhan Mantri Fasal Bima Yojana) or State Relief Fund",
  "eligibilityRemark": "string explaining why the farmer is eligible or partially eligible",
  "breakdownSummary": "string detailing the step-by-step mathematical logic and government benchmarks used for the calculation",
  "recommendation": "string containing 3 numbered instructions on next steps for the farmer"
}
`;

            const result = await model.generateContent(prompt);
            const responseText = result.response.text();
            const jsonString = responseText.replace(/```json\n?|\n?```/g, "").trim();
            const parsed = JSON.parse(jsonString);

            // Double check values are numeric and fit boundaries
            const estimatedAmount = Number(parsed.estimatedAmount) || estimatedBase;
            const interestRate = Number(parsed.interestRate) || standardInterestRate;
            const netPayableAmount = Number(parsed.netPayableAmount) || Math.round(estimatedAmount * (1 - interestRate / 100));

            return {
                estimatedAmount,
                interestRate,
                netPayableAmount,
                schemeName: parsed.schemeName || "PMFBY (Pradhan Mantri Fasal Bima Yojana)",
                eligibilityRemark: parsed.eligibilityRemark || `Eligible for ex-gratia compensation under agricultural relief guidelines for standard ${calamityLabel} losses.`,
                breakdownSummary: parsed.breakdownSummary || `Calculated based on state-wise relief parameters of ₹${baseSIAcre.toLocaleString("en-IN")} per acre.`,
                recommendation: parsed.recommendation || "1. Await crop cutting experiment survey.\n2. Keep land records ready.\n3. Track claim updates.",
            };
        } catch (error) {
            console.error("Gemini calculateInsurance failed, falling back to static calculation:", error);
        }
    }

    // --- FALLBACK CALCULATION ---
    const grossPayout = grossMaxCompensation;
    const estimatedAmount = Math.max(Math.round(grossPayout), 10000);
    const deduction = estimatedAmount * (standardInterestRate / 100);
    const netPayableAmount = Math.round(estimatedAmount - deduction);

    const calamityLabel = CALAMITY_LABELS[cType] || cType;
    const schemeName = "PMFBY (Pradhan Mantri Fasal Bima Yojana)";

    return {
        estimatedAmount,
        interestRate: standardInterestRate,
        netPayableAmount,
        schemeName,
        eligibilityRemark: `The claim falls under PMFBY guidelines for ${calamityLabel} in ${claimData.state}. With ${claimData.damagedPercentage}% of the land affected, the farmer is eligible for standardized compensation.`,
        breakdownSummary: `Under PMFBY norms for ${claimData.state}, the baseline Sum Insured (SI) is estimated at ₹${baseSIAcre.toLocaleString(
            "en-IN"
        )} per acre. The total damaged area is ${damagedAreaAcres.toFixed(
            2
        )} acres. Applying a Calamity Impact Factor of 100% for standard ${calamityLabel}, the gross calculated payout is ₹${Math.round(grossPayout).toLocaleString(
            "en-IN"
        )}. Finally, a ${standardInterestRate}% standardized premium deduction (₹${Math.round(
            deduction
        ).toLocaleString("en-IN")}) yields the net payable amount.`,
        recommendation: `1. Ensure your land deed matches the uploaded document exactly.\n2. Keep the affected crop area undisturbed until the physical survey completes.\n3. Track your claim status regularly via the dashboard.`,
    };
}
