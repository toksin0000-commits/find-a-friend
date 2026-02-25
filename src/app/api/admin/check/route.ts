import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const token = req.headers.get("x-admin-token");

  if (token === "toksin-admin-secret-983274982374") {
    return NextResponse.json({ isAdmin: true });
  }

  return NextResponse.json({ isAdmin: false });
}
