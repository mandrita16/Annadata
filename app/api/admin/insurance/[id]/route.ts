import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Insurance from "@/models/Insurance";
import mongoose from "mongoose";
import User from "@/models/User";
import { sendInsuranceStatusUpdateEmail } from "@/lib/email";

export const runtime = "nodejs";

export async function GET(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Invalid claim ID" }, { status: 400 });
        }

        await connectToDatabase();

        const claim = await Insurance.findById(id);

        if (!claim) {
            return NextResponse.json({ message: "Claim not found" }, { status: 404 });
        }

        return NextResponse.json(claim, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching claim details:", error);
        return NextResponse.json(
            { message: "Error fetching claim", error: error.message },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const { id } = params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ message: "Invalid claim ID" }, { status: 400 });
        }

        const body = await req.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ message: "Status is required" }, { status: 400 });
        }

        const validStatuses = ["pending", "under_review", "field_verification", "approved", "rejected", "cancelled"];
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ message: "Invalid status value" }, { status: 400 });
        }

        await connectToDatabase();

        const claim = await Insurance.findByIdAndUpdate(
            id,
            { status },
            { returnDocument: "after" }
        );

        if (!claim) {
            return NextResponse.json({ message: "Claim not found" }, { status: 404 });
        }

        // Send status update email asynchronously
        try {
            const userDoc = await User.findById(claim.user);
            if (userDoc && userDoc.email) {
                sendInsuranceStatusUpdateEmail(claim, userDoc).catch(console.error);
            }
        } catch (emailErr) {
            console.error("Failed to trigger status update email:", emailErr);
        }

        return NextResponse.json({ message: "Status updated successfully", claim }, { status: 200 });
    } catch (error: any) {
        console.error("Error updating claim status:", error);
        return NextResponse.json(
            { message: "Error updating claim status", error: error.message },
            { status: 500 }
        );
    }
}
