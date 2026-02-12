"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function ChatPageClient({ chatId }: { chatId: string }) {
  const router = useRouter();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const anonId =
    typeof window !== "undefined" ? localStorage.getItem("anon_id") : null;

  const [match, setMatch] = useState<any>(null);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  // 🔊 AUDIO REFS
  const sendSound = useRef<HTMLAudioElement | null>(null);
  const receiveSound = useRef<HTMLAudioElement | null>(null);
  const leaveSound = useRef<HTMLAudioElement | null>(null);
  const systemSound = useRef<HTMLAudioElement | null>(null);


  // 📳 HAPTIKA
  function vibrate(pattern: number | number[]) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

  // LOAD MATCH + PROFILES
  useEffect(() => {
    async function loadMatch() {
      const { data } = await supabase
        .from("matches")
        .select("*")
        .eq("chat_id", chatId)
        .maybeSingle();

      if (!data) return;

      setMatch(data);

      if (anonId && anonId !== data.user1_id && anonId !== data.user2_id) {
        const corrected = data.user2_id || data.user1_id;
        localStorage.setItem("anon_id", corrected);
      }

      // load my profile
      if (anonId) {
        const { data: me } = await supabase
          .from("profiles")
          .select("*")
          .eq("anon_id", anonId)
          .maybeSingle();
        setMyProfile(me);
      }

      // load other profile
      const otherId = anonId === data.user1_id ? data.user2_id : data.user1_id;

      if (otherId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("anon_id", otherId)
          .maybeSingle();
        setOtherUser(profile);
      }
    }

    loadMatch();
  }, [chatId]);

  // LOAD MESSAGES
  useEffect(() => {
    async function loadMessages() {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("chat_id", chatId)
        .order("created_at", { ascending: true });

      setMessages(data || []);
      setLoading(false);
    }

    loadMessages();
  }, [chatId]);

  // REALTIME
useEffect(() => {
  const channel = supabase
    .channel(`chat-${chatId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
  setMessages((prev) => [...prev, payload.new]);
  setTypingUser(null);

  // PARTNER ODEŠEL → systémová zpráva → systemSound
  if (payload.new.sender_id === "system") {
    systemSound.current?.play();
    return;
  }

  // Normální zpráva od druhého → receive zvuk + haptika
  if (payload.new.sender_id !== anonId) {
    receiveSound.current?.play();
    vibrate([10, 30]);
  }
}


    )
    .subscribe();

  // ❗ cleanup NESMÍ být async
  return () => {
    supabase.removeChannel(channel);
  };
}, [chatId]);
;

  // TYPING
useEffect(() => {
  const channel = supabase
    .channel(`typing-${chatId}`)
    .on("broadcast", { event: "typing" }, (payload) => {
      if (payload.payload.sender !== anonId) {
        setTypingUser("Typing…");
        setTimeout(() => setTypingUser(null), 1500);
      }
    })
    .subscribe();

  // ❗ cleanup musí být synchronní
  return () => {
    supabase.removeChannel(channel);
  };
}, [chatId, anonId]);


  // AUTO SCROLL
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

// AUTO‑CLEANUP MATCH PŘI OPUŠTĚNÍ CHATU
useEffect(() => {
  return () => {
    supabase.from("matches").delete().eq("chat_id", chatId);
  };
}, [chatId]);


  // SEND MESSAGE
  async function sendMessage() {
    if (!input.trim()) return;

    const currentAnon = localStorage.getItem("anon_id");
    if (!currentAnon) return;

    await supabase.from("messages").insert({
      chat_id: chatId,
      sender_id: currentAnon,
      content: input,
    });

    // 🔊📳 zvuk + haptika při odeslání
    sendSound.current?.play();
    vibrate(30);

    setInput("");
  }

  // TYPING BROADCAST
  function handleTyping(e: any) {
    setInput(e.target.value);

    supabase.channel(`typing-${chatId}`).send({
      type: "broadcast",
      event: "typing",
      payload: { sender: anonId },
    });
  }

  // LEAVE CHAT
  async function leaveChat() {
  if (!chatId) return;

  // 1) systémová zpráva s jejich jménem
  await supabase.from("messages").insert({
    chat_id: chatId,
    sender_id: "system",
    content: `${otherUser?.name || "User"} left`
  });

  // 2) smaž match (ať se chat ukončí)
  await supabase.from("matches").delete().eq("chat_id", chatId);

  // 3) zvuk + haptika
  leaveSound.current?.play();
  vibrate([20, 40]);

  // 4) redirect
  router.push("/");
}



  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh w-screen bg-[#0d0d0d] text-gray-500">
        Loading chat…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh w-screen overflow-hidden bg-[#252525] text-white">

      {/* HEADER */}
      <div className="flex items-center gap-3 bg-[#555] p-3 w-full">
        {otherUser?.photo_url && (
          <img
            src={otherUser.photo_url}
            className="w-10 h-10 rounded-full object-cover"
          />
        )}

        <div className="font-semibold text-lg truncate">
          {otherUser?.name || "Chat"}
        </div>

        <button
          onClick={leaveChat}
          className="ml-auto px-3 py-1 bg-red-500 text-white rounded"
        >
          Leave
        </button>
      </div>

      {/* CHAT */}
      <div className="flex-1 overflow-y-auto space-y-3 bg-[#303030] p-3 w-full">
        {messages.map((msg) => {
  // 🔥 SYSTEM MESSAGE
  if (msg.sender_id === "system") {
    return (
      <div
        key={msg.id}
        className="text-center text-gray-400 text-xs my-2"
      >
        {msg.content}
      </div>
    );
  }

  // 🔥 NORMAL MESSAGE
  const isMe = msg.sender_id === anonId;

  return (
    <div
      key={msg.id}
      className={`flex items-end gap-2 w-full ${
        isMe ? "justify-end" : "justify-start"
      }`}
    >
      {!isMe && otherUser?.photo_url && (
        <img
          src={otherUser.photo_url}
          className="w-8 h-8 rounded-full object-cover shrink-0"
        />
      )}

      <div
        className={`max-w-[70%] p-2 rounded-lg text-sm ${
          isMe
            ? "bg-blue-500 text-white"
            : "bg-[#1e1e1e] text-gray-200"
        }`}
      >
        <div>{msg.content}</div>

        <div className="text-[10px] opacity-70 mt-1 text-right">
          {new Date(msg.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>

      {isMe && myProfile?.photo_url && (
        <img
          src={myProfile.photo_url}
          className="w-8 h-8 rounded-full object-cover shrink-0"
        />
      )}
    </div>
  );
})}


        {typingUser && (
          <div className="text-gray-400 text-xs italic ml-10">{typingUser}</div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* INPUT */}
      <div className="flex items-center gap-2 w-full p-3 bg-[#0d0d0d]">
        <input
          className="flex-1 min-w-0 border border-gray-700 bg-[#1a1a1a] text-white p-2 rounded"
          value={input}
          onChange={handleTyping}
          placeholder="Napiš zprávu…"
        />
        <button
          onClick={sendMessage}
          className="px-4 py-2 bg-blue-600 text-white rounded shrink-0"
        >
          Odeslat
        </button>
      </div>

      {/* AUDIO ELEMENTS */}
      <audio ref={sendSound} src="/sounds/send.mp3" preload="auto" />
      <audio ref={receiveSound} src="/sounds/receive.mp3" preload="auto" />
      <audio ref={leaveSound} src="/sounds/leave.mp3" preload="auto" />
      <audio ref={systemSound} src="/sounds/system.mp3" preload="auto" />
    </div>
  );
}
