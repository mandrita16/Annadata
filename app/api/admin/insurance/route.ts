import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Insurance from "@/models/Insurance";

export const runtime = "nodejs";

export async function GET() {
    try {
        await connectToDatabase();

        const claims = await Insurance.find({})
            .sort({ createdAt: -1 })
            .select("-images"); // Exclude heavy images for list view

        return NextResponse.json(claims, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching admin claims:", error);
        return NextResponse.json(
            { message: "Error fetching claims", error: error.message },
            { status: 500 }
        );
    }
}
