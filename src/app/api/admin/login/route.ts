import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { password } = await req.json();

  if (password === "toksin-admin-secret-983274982374") {
    return NextResponse.json({ ok: true, token: "toksin-admin-secret-983274982374" });
  }

  return NextResponse.json({ ok: false }, { status: 401 });
}
