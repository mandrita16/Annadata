import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Insurance from "@/models/Insurance";
import mongoose from "mongoose";

export async function GET(
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

        return NextResponse.json(claim, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching claim:", error);
        return NextResponse.json(
            { message: "Error fetching claim", error: error.message },
            { status: 500 }
        );
    }
}
