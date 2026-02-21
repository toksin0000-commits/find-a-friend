console.log("CHAT PAGE LOADED");

import { supabaseServer } from "@/lib/supabaseServer";
import ChatPageClient from "./ChatPageClient";
import { redirect } from "next/navigation";

export default async function ChatPage({
  params,
}: {
  params: { id: string };
}) {
  const { id: chatId } = params;
  console.log("CHAT PAGE PARAM ID:", chatId);

  // ⭐ ZÍSKAT SERVEROVÝ SUPABASE KLIENT
  const supabase = supabaseServer();

  const { data: chat } = await supabase
    .from("matches")
    .select("*")
    .eq("chat_id", chatId)
    .single();

  if (!chat) {
    redirect("/");
  }

  return (
    <div className="h-screen flex flex-col">
      <ChatPageClient chatId={chatId} />
    </div>
  );
}
