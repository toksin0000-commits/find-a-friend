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

  console.log("BEFORE SUPABASE QUERY");

  const { data: chat, error } = await supabase
    .from("matches")
    .select("*")
    .eq("chat_id", chatId)
    .maybeSingle(); // ⭐ místo .single()

  console.log("AFTER SUPABASE QUERY", { chat, error });

  if (error) {
    console.error("SUPABASE ERROR:", error);
  }

  if (!chat) {
    console.log("NO CHAT FOUND → redirecting");
    redirect("/");
  }

  return (
    <div className="h-screen flex flex-col">
      <ChatPageClient chatId={chatId} />
    </div>
  );
}
