import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Plot from "@/models/Plot";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        await connectToDatabase();

        const plot = await Plot.findOne({
            _id: id,
            user: session.user.id,
        });

        if (!plot) {
            return NextResponse.json(
                { message: "Plot not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(plot, { status: 200 });
    } catch (error: any) {
        console.error("Error fetching plot:", error);
        return NextResponse.json(
            { message: "Error fetching plot", error: error.message },
            { status: 500 }
        );
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { soilData } = body;

        await connectToDatabase();

        const plot = await Plot.findOneAndUpdate(
            { _id: id, user: session.user.id },
            { $set: { soilData } },
            { returnDocument: "after" }
        );

        if (!plot) {
            return NextResponse.json(
                { message: "Plot not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(plot, { status: 200 });
    } catch (error: any) {
        console.error("Error updating plot:", error);
        return NextResponse.json(
            { message: "Error updating plot", error: error.message },
            { status: 500 }
        );
    }
}
