import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { receiverId, senderName, message, chatId } = await request.json();

    // Kontrola, zda máme klíče (pro jistotu)
    if (!process.env.ONESIGNAL_REST_API_KEY || !process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID) {
      console.error("Missing OneSignal API keys in environment variables!");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Authorization": `Basic ${process.env.ONESIGNAL_REST_API_KEY}`
      },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID,
        // Použijeme modernější způsob cílení přes external_id
        include_external_user_ids: [receiverId], 
        // Alternativně, pokud by include_external_user_ids zlobilo, OneSignal doporučuje:
        // target_channel: "push",
        
        contents: { "en": message, "cs": message },
        headings: { 
          "en": `New message from ${senderName}`, 
          "cs": `Nová zpráva od ${senderName}` 
        },
        url: `https://www.findafriend.fun/chat/${chatId}`,
        // Důležité pro Android, aby notifikace hned vyskočila
        priority: 10 
      })
    });

    const data = await response.json();
    
    // Logování do Vercel konzole, abychom viděli, co OneSignal odpověděl
    console.log("OneSignal response:", data);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Notification API error:", error);
    return NextResponse.json({ error: error.message || "Failed to send notification" }, { status: 500 });
  }
}