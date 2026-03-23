import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { receiverId, senderName, message, chatId } = await request.json();

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        include_external_user_ids: [receiverId], // Tady cílíme na ID ze Supabase
        contents: { "en": message, "cs": message },
        headings: { "en": `New message from ${senderName}`, "cs": `Nová zpráva od ${senderName}` },
        url: `https://www.findafriend.fun/chat/${chatId}` // Kam se uživatel dostane po kliku
      })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}