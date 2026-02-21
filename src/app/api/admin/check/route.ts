import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const token = req.headers.get("x-admin-token");

  // 🔥 Ověření admin tokenu
  if (token && token === process.env.ADMIN_SECRET) {
    return NextResponse.json({ isAdmin: true });
  }

  return NextResponse.json({ isAdmin: false });
}
