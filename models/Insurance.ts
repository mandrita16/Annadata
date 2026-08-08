import mongoose from "mongoose";
import { getStateAbbreviation, getCityAbbreviation } from "@/lib/abbreviations";

const InsuranceSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        plot: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Plot",
            required: true,
        },
        claimId: {
            type: String,
            unique: true,
        },
        plotSnapshot: {
            name: { type: String, required: true },
            state: { type: String, required: true },
            city: { type: String, required: true },
            area: { type: Number, required: true }, // in acres
            landmark: {
                name: { type: String },
                address: { type: String },
                lat: { type: Number },
                lng: { type: Number },
            },
        },
        calamityType: {
            type: String,
            required: true,
            enum: [
                "flood",
                "drought",
                "pest_attack",
                "fire",
                "hailstorm",
                "cyclone",
                "landslide",
                "frost",
                "crop_disease",
                "unseasonal_rain",
                "other",
            ],
        },
        calamityDescription: {
            type: String,
            required: true,
        },
        damagedPercentage: {
            type: Number,
            required: true,
            min: 1,
            max: 100,
        },
        damagedAreaSqm: {
            type: Number,
            required: true,
        },
        images: {
            selfie: { type: String, required: true },
            landDocument: { type: String, required: true },
            affectedCrop: { type: String, required: true },
            fullLandView: { type: String, required: true },
            landmark: { type: String, required: true },
        },
        status: {
            type: String,
            enum: ["pending", "under_review", "field_verification", "approved", "rejected", "cancelled"],
            default: "pending",
        },
        aiAnalysis: {
            analysisStatus: { 
                type: String, 
                enum: ["pending", "completed", "failed"], 
                default: "pending" 
            },
            estimatedAmount: { type: Number, default: null },
            interestRate: { type: Number, default: null },
            netPayableAmount: { type: Number, default: null },
            schemeName: { type: String, default: null },
            eligibilityRemark: { type: String, default: null },
            breakdownSummary: { type: String, default: null },
            recommendation: { type: String, default: null },
            analysisCompletedAt: { type: Date, default: null },
        },
        reanalysisCount: { type: Number, default: 0 },
    },
    {
        timestamps: true,
    }
);

InsuranceSchema.pre("save", function () {
    if (!this.claimId) {
        const stateAbbr = getStateAbbreviation(this.plotSnapshot?.state || "");
        const cityAbbr = getCityAbbreviation(this.plotSnapshot?.city || "");
        
        // Generate 4 random digits
        let randomDigits = "";
        for (let i = 0; i < 4; i++) {
            randomDigits += Math.floor(Math.random() * 10).toString();
        }
        
        this.claimId = `${stateAbbr}${cityAbbr}${randomDigits}`;
    }
});

if (mongoose.models.Insurance) {
    delete mongoose.models.Insurance;
}

const Insurance = mongoose.model("Insurance", InsuranceSchema);

export default Insurance;
