console.log("CHAT PAGE LOADED");

import { supabaseServer } from "@/lib/supabaseServer";
import ChatPageClient from "./ChatPageClient";

import { redirect } from "next/navigation";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: chatId } = await params;
console.log("CHAT PAGE PARAM ID:", chatId);

  const { data: chat } = await supabaseServer
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
