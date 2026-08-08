import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Insurance from "@/models/Insurance";
import Plot from "@/models/Plot";
import { calculateInsurance } from "@/lib/insurance-calculator";
import User from "@/models/User";
import { sendInsuranceSubmissionEmail } from "@/lib/email";

export const runtime = "nodejs";

// ---------- POST — Create Claim ----------
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        const body = await req.json();
        const {
            plotId,
            calamityType,
            calamityDescription,
            damagedPercentage,
            images,
        } = body;

        // Validate required fields
        if (
            !plotId ||
            !calamityType ||
            !calamityDescription ||
            !damagedPercentage ||
            !images?.selfie ||
            !images?.landDocument ||
            !images?.affectedCrop ||
            !images?.fullLandView ||
            !images?.landmark
        ) {
            return NextResponse.json(
                { message: "Missing required fields" },
                { status: 400 }
            );
        }

        await connectToDatabase();

        // Fetch plot
        const plot = await Plot.findOne({
            _id: plotId,
            user: session.user.id,
        });
        if (!plot) {
            return NextResponse.json(
                { message: "Plot not found" },
                { status: 404 }
            );
        }

        // Compute damaged area in sq. metres
        const areaAcres = plot.area;
        const areaSqm = areaAcres * 4046.86;
        const damagedAreaSqm = (areaSqm * damagedPercentage) / 100;

        // Create insurance claim (pending AI)
        const claim = await Insurance.create({
            user: session.user.id,
            plot: plot._id,
            plotSnapshot: {
                name: plot.name,
                state: plot.state,
                city: plot.city,
                area: plot.area,
                landmark: plot.landmark,
            },
            calamityType,
            calamityDescription,
            damagedPercentage,
            damagedAreaSqm,
            images,
            status: "pending",
        });

        // Run mathematical calculation asynchronously (don't block the response)
        calculateInsurance({
            state: plot.state,
            city: plot.city,
            areaAcres,
            calamityType,
            calamityDescription,
            damagedPercentage,
            damagedAreaSqm,
        })
            .then(async (analysis) => {
                await Insurance.findByIdAndUpdate(claim._id, {
                    aiAnalysis: {
                        analysisStatus: "completed",
                        ...analysis,
                        analysisCompletedAt: new Date(),
                    },
                });
            })
            .catch(async (err) => {
                console.error("Insurance calculation failed:", err);
                await Insurance.findByIdAndUpdate(claim._id, {
                    "aiAnalysis.analysisStatus": "failed",
                });
            });

        // Send submission email asynchronously
        try {
            const userDoc = await User.findById(session.user.id);
            if (userDoc && userDoc.email) {
                // Don't await to avoid blocking response
                sendInsuranceSubmissionEmail(claim, userDoc).catch(console.error);
            }
        } catch (emailErr) {
            console.error("Failed to trigger submission email:", emailErr);
        }

        return NextResponse.json(
            { message: "Claim submitted successfully", claimId: claim.claimId, _id: claim._id },
            { status: 201 }
        );
    } catch (error: any) {
        console.error("Error creating insurance claim:", error);
        return NextResponse.json(
            { message: "Error creating claim", error: error.message },
            { status: 500 }
        );
    }
}

// ---------- GET — List Claims ----------
export async function GET() {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        }

        await connectToDatabase();

        const claims = await Insurance.find({ user: session.user.id })
            .sort({ createdAt: -1 })
            .select("-images"); // don't return images in list view

        return NextResponse.json(claims, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching claims:", error);
        return NextResponse.json(
            { message: "Error fetching claims", error: error.message },
            { status: 500 }
        );
    }
}
