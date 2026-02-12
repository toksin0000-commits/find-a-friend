export const dynamic = "force-dynamic";

console.log("CHAT PAGE LOADED");

import ChatPageClient from "./ChatPageClient";
import { redirect } from "next/navigation";

export default async function ChatPage({
  params,
}: {
  params: { id: string };
}) {
  const { id: chatId } = params;
  console.log("CHAT PAGE PARAM ID:", chatId);

  // Lazy import Supabase
  const { getSupabaseServer } = await import("@/lib/supabaseServer");
  const supabaseServer = getSupabaseServer();

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
