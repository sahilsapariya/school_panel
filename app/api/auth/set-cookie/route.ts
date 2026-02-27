/**
 * Sets auth-token cookie for the panel domain.
 * Readable (httpOnly: false) so the API client can send it via Authorization header for backend requests.
 * Required when panel and backend are on different domains - the backend's Set-Cookie won't be stored cross-origin.
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
      httpOnly: false, // Must be readable so api.ts can send it via Authorization header (cross-origin backend)
      secure: isProd,
      sameSite: "lax",
      maxAge: 60 * 60 * 60, // 60 hours, match backend JWT expiry
    });
    return response;
  } catch {
    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
