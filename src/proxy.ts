import { NextRequest, NextResponse } from "next/server";

export async function proxy(req: NextRequest) {
    if (req.method === "OPTIONS") {
        return new NextResponse("", { status: 200 });
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
