/**
 * Sets auth-token cookie for the panel domain so middleware can detect logged-in state.
 * Required when panel and API are on different domains (cross-site).
 * The backend sets its own cookie for API requests; this sets one for the panel.
 */

import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body?.access_token;
    if (!token || typeof token !== "string") {
      return NextResponse.json(
        { error: "Missing access_token" },
        { status: 400 }
      );
    }

    const isProd = process.env.NODE_ENV === "production";
    const response = NextResponse.json({ success: true });
    response.cookies.set("auth-token", token, {
      path: "/",
      httpOnly: true,
      secure: isProd,
      sameSite: "lax",
      maxAge: 60 * 15, // 15 min, match backend JWT expiry
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
