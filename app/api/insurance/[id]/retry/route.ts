import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Insurance from "@/models/Insurance";
import { calculateInsurance } from "@/lib/insurance-calculator";
import mongoose from "mongoose";

export const runtime = "nodejs";

export async function POST(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const params = await props.params;
        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Invalid claim ID" }, { status: 400 });
        }

        await connectToDatabase();

        const claim = await Insurance.findOne({
            _id: id,
            user: session.user.id,
        });

        if (!claim) {
            return NextResponse.json({ message: "Claim not found" }, { status: 404 });
        }

        if (!claim.plotSnapshot) {
            return NextResponse.json({ message: "Claim data is incomplete" }, { status: 400 });
        }

        const reanalysisCount = claim.reanalysisCount || 0;
        if (reanalysisCount >= 2) {
            return NextResponse.json(
                { message: "Reanalysis can be run only twice per claim." },
                { status: 400 }
            );
        }

        // Set status back to pending and increment reanalysis count
        await Insurance.findByIdAndUpdate(claim._id, {
            "aiAnalysis.analysisStatus": "pending",
            $inc: { reanalysisCount: 1 },
        });

        // Run the analysis synchronously
        try {
            const analysis = await calculateInsurance({
                state: claim.plotSnapshot.state,
                city: claim.plotSnapshot.city,
                areaAcres: claim.plotSnapshot.area,
                calamityType: claim.calamityType,
                calamityDescription: claim.calamityDescription,
                damagedPercentage: claim.damagedPercentage,
                damagedAreaSqm: claim.damagedAreaSqm,
            });

            const updatedClaim = await Insurance.findByIdAndUpdate(
                claim._id,
                {
                    aiAnalysis: {
                        analysisStatus: "completed",
                        ...analysis,
                        analysisCompletedAt: new Date(),
                    },
                },
                { returnDocument: "after" }
            );

            return NextResponse.json(updatedClaim, { status: 200 });
        } catch (calcError: any) {
            console.error("Reanalysis calculation failed:", calcError);
            await Insurance.findByIdAndUpdate(claim._id, {
                "aiAnalysis.analysisStatus": "failed",
            });
            return NextResponse.json(
                { message: "Calculation failed", error: calcError.message },
                { status: 500 }
            );
        }
    } catch (error: any) {
        console.error("Error retrying insurance calculation:", error);
        return NextResponse.json(
            { message: "Error retrying calculation", error: error.message },
            { status: 500 }
        );
    }
}
