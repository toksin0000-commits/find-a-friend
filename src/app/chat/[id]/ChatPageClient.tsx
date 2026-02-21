"use client";


import { useEffect, useState, useRef } from "react";
import { getSupabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useBlockedUsers } from '@/hooks/useBlockedUsers';
import { usePresence } from "@/hooks/usePresence"; // 🔥 přidáno

export default function ChatPageClient({ chatId }: { chatId: string }) {
  console.log("CLIENT COMPONENT LOADED");
  const router = useRouter();

  // 🔥 Lokální presence pro tento chat room
  const { onlineCount } = usePresence(`room-${chatId}`);
  const supabase = getSupabase();

  // 🔥 Neviditelný element, aby React hook neoptimalizoval pryč
  const presenceAnchor = (
    <div
      style={{
        position: "absolute",
        opacity: 0,
        pointerEvents: "none",
      }}
    >
      {onlineCount}
    </div>
  );

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const anonId =
    typeof window !== "undefined" ? localStorage.getItem("anon_id") : null;

  const [match, setMatch] = useState<any>(null);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');


  // 🔊 AUDIO REFS
  const sendSound = useRef<HTMLAudioElement | null>(null);
  const receiveSound = useRef<HTMLAudioElement | null>(null);
  const leaveSound = useRef<HTMLAudioElement | null>(null);
  const systemSound = useRef<HTMLAudioElement | null>(null);

  // 📳 HAPTIKA
  function vibrate(pattern: number | number[]) {
    if (navigator.vibrate) navigator.vibrate(pattern);
  }

    const { isBlocked, blockUser, unblockUser } = useBlockedUsers();

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
        
        // 🚫 KONTROLA BANU
        if (profile?.banned) {
          alert("Your account has been banned. Contact support for more information.");
          await supabase.from("matches").delete().eq("chat_id", chatId);
          router.push("/");
          return;
        }
        
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
          if (systemSound.current) {
            systemSound.current.play().catch(e => {
              if (e.name !== 'AbortError') {
                console.error('Chyba při přehrávání system zvuku:', e);
              }
            });
          }
          return;
        }

        // Normální zpráva od druhého → receive zvuk + haptika
        if (payload.new.sender_id !== anonId) {
          if (receiveSound.current) {
            receiveSound.current.play().catch(e => {
              if (e.name !== 'AbortError') {
                console.error('Chyba při přehrávání receive zvuku:', e);
              }
            });
          }
          vibrate([10, 30]);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [chatId, anonId]); // ⬅️ přidal jsem anonId do závislostí

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

    // AUTO‑CLEANUP MATCH PŘI OPUŠTĚNÍ CHATU
  useEffect(() => {
    return () => {
      supabase.from("matches").delete().eq("chat_id", chatId);
    };
  }, [chatId]);

  // 🚫 SLEDOVÁNÍ BLOKACÍ – když mě někdo zablokuje, okamžitě opustím chat
  useEffect(() => {
    if (!anonId || !chatId) return;

    console.log('📡 Spouštím sledování blokací pro uživatele:', anonId);

    const channel = supabase
      .channel('blocks-monitoring')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'blocks',
          filter: `blocked_id=eq.${anonId}`
        },
        async (payload) => {
          console.log('🚫 BYL JSTE BLOKOVÁN! Opouštím chat...', payload);
          
          await supabase.from("messages").insert({
            chat_id: chatId,
            sender_id: "system",
            content: "Chat was closed (user blocked)"
          });
          
          await supabase.from("matches").delete().eq("chat_id", chatId);
          router.push("/");
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [anonId, chatId, router]);

  

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

  // 🎵 Bezpečné přehrávání zvuku
  if (sendSound.current) {
    try {
      await sendSound.current.play();
    } catch (e: any) {
      // Ignorujeme AbortError (element byl odstraněn)
      if (e.name !== 'AbortError') {
        console.error('Chyba při přehrávání zvuku:', e);
      }
    }
  }

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

  await supabase.from("messages").insert({
    chat_id: chatId,
    sender_id: "system",
    content: `${otherUser?.name || "User"} left`
  });

  await supabase.from("matches").delete().eq("chat_id", chatId);

  // 🎵 Bezpečné přehrávání zvuku
  if (leaveSound.current) {
    leaveSound.current.play().catch(e => {
      if (e.name !== 'AbortError') {
        console.error('Chyba při přehrávání leave zvuku:', e);
      }
    });
  }

  vibrate([20, 40]);

  router.push("/");
}

  // FILTR ZPRÁV – tady je správné místo (mimo return)
  const visibleMessages = messages.filter((msg) => {
    if (msg.sender_id === "system") return true;
    return !isBlocked(msg.sender_id);
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-dvh w-screen bg-[#0d0d0d] text-gray-500">
        Loading chat…
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh w-screen overflow-hidden bg-[#252525] text-white">

            {/* 🔥 Presence anchor – neviditelné, ale hook se používá */}
      <div
        style={{
          position: "absolute",
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        {onlineCount}
      </div>


      {/* HEADER */}
      <div className="flex items-center gap-3 bg-[#555555] p-3 w-full">
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
      <div
  className="flex-1 overflow-y-auto space-y-3 p-3 w-full"
  style={{
    backgroundColor: "#303030",
    backgroundImage: `
      /* kružnice */
      radial-gradient(circle, transparent 0, transparent 55px, rgba(255,255,255,0.10) 200px, transparent 57px),
      radial-gradient(circle, transparent 0, transparent 30px, rgba(255,255,255,0.10) 80px, transparent 57px),


      /* čtverec */
      linear-gradient(0deg, transparent 0, transparent 80px, rgba(255,255,255,0.08) 81px, transparent 82px),
      linear-gradient(90deg, transparent 0, transparent 80px, rgba(255,255,255,0.08) 81px, transparent 82px),

      /* obdélník */
      linear-gradient(0deg, transparent 0, transparent 40px, rgba(255,255,255,0.07) 41px, transparent 42px),
      linear-gradient(90deg, transparent 0, transparent 120px, rgba(255,255,255,0.07) 121px, transparent 122px),

      /* trojúhelník (šikmá hrana) */
      linear-gradient(60deg, transparent 0, transparent 90px, rgba(255,255,255,0.06) 91px, transparent 92px),
      linear-gradient(130deg, transparent 0, transparent 90px, rgba(255,255,255,0.06) 91px, transparent 92px),

      /* dvě úsečky */
      linear-gradient(0deg, transparent 0, transparent 0, rgba(255,255,255,0.10) 1px, transparent 2px),
      linear-gradient(90deg, transparent 0, transparent 0, rgba(255,255,255,0.10) 1px, transparent 2px)
    `,
    backgroundRepeat: "no-repeat",
    backgroundPosition: `
      20px 20px,   /* kružnice */
      60px 50px,   /* kružnice */

      80px 40px,  /* čtverec hrana 1 */
      150px 40px,  /* čtverec hrana 2 */

      40px 160px,  /* obdélník hrana 1 */
      40px 160px,  /* obdélník hrana 2 */

      120px -50px, /* trojúhelník hrana 1 */
      200px 180px, /* trojúhelník hrana 2 */
      

      80px 260px,  /* úsečka 1 */
      20px 50px  /* úsečka 2 */
    `,
  }}
>

        {visibleMessages.map((msg) => {
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
              className={`relative group flex items-end gap-2 w-full ${
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
  className={`
    max-w-[70%] p-2 rounded-lg text-sm
    overflow-hidden wrap-break-word whitespace-pre-wrap
    ${isMe
      ? "bg-blue-500 text-white"
      : "bg-[#1e1e1e] text-gray-200"
    }
  `}
>
  <div className="wrap-break-word whitespace-pre-wrap">
    {msg.content}
  </div>

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

              {/* Tři tečky – jen u zpráv od druhého */}
              {!isMe && (
                <button
                  className="
                    absolute 
                    top-1 right-2 
                    opacity-100 group-hover:opacity-100 
                    focus:opacity-100 
                    transition-opacity 
                    p-1.5 rounded-full 
                    hover:bg-gray-700/70 
                    text-gray-400 hover:text-white 
                    z-10
                  "
                  onClick={() => setMenuFor(msg.sender_id)}
                >
                  ⋯
                </button>
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
    placeholder="Write a message…"
    onKeyDown={(e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    }}
  />

  <button
    onClick={sendMessage}
    className="px-4 py-2 bg-blue-600 text-white rounded shrink-0"
  >
    Send
  </button>
</div>


            {/* OVERLAY MENU (Actions) */}
      {menuFor && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setMenuFor(null)}
        >
          <div
            className="bg-[#1e1e1e] rounded-xl overflow-hidden w-72 max-w-[90vw] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-700 text-center font-medium text-gray-300">
              Actions
            </div>

            {/* V OVERLAY MENU (Actions) */}
<button
  className="w-full px-5 py-4 text-left hover:bg-gray-800 transition-colors"
  onClick={() => {
    if (isBlocked(menuFor)) {
      unblockUser(menuFor);  // ⭐ Odblokovat
      alert('User has been unblocked');
    } else {
      blockUser(menuFor);    // ⭐ Blokovat
      alert('User has been blocked');
    }
    setMenuFor(null);
  }}
>
  {isBlocked(menuFor) ? '🚫 Unblock this user' : '⛔ Block this user'}
</button>

            <button
              className="w-full px-5 py-4 text-left text-red-400 hover:bg-gray-800 transition-colors"
              onClick={() => {
                setReportModalOpen(true);
                setMenuFor(null);
              }}
            >
              Report user
            </button>

            <button
              className="w-full px-5 py-4 text-left text-gray-400 hover:bg-gray-800 transition-colors border-t border-gray-700"
              onClick={() => setMenuFor(null)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* REPORT MODAL */}
      {reportModalOpen && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-60 p-4"
          onClick={() => setReportModalOpen(false)}
        >
          <div
            className="bg-[#1e1e1e] rounded-xl w-full max-w-md overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-700 text-lg font-medium text-center text-white">
              Report User
            </div>

            <div className="p-5 space-y-5">
              <p className="text-sm text-gray-300">Select reason:</p>

              {['Spam', 'Harassment', 'Inappropriate content', 'Other'].map((opt) => (
                <label key={opt} className="flex items-center gap-3 cursor-pointer text-gray-200">
                  <input
                    type="radio"
                    name="reason"
                    value={opt}
                    checked={reportReason === opt}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="w-5 h-5 accent-red-500"
                  />
                  <span>{opt}</span>
                </label>
              ))}

              <textarea
                placeholder="Additional details (optional)"
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="w-full h-28 p-3 bg-[#0d0d0d] border border-gray-700 rounded text-white text-sm resize-none focus:outline-none focus:border-red-500 placeholder-gray-500"
              />

              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!reportReason) {
                      alert('Please select a reason');
                      return;
                    }

                    try {

                      console.log("myProfile při reportu:", myProfile);

                      const res = await fetch('/api/report', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    chatId,
    senderId: anonId,
    reportedId: otherUser?.anon_id,  // ⬅️ TAKTO
    reason: reportReason,
    details: reportDetails.trim(),
  }),
});             


                      if (res.ok) {
                        alert('Report submitted successfully. Thank you!');
                      } else {
                        alert('Failed to submit report. Please try again.');
                      }
                    } catch (err) {
                      console.error('Report error:', err);
                      alert('Error submitting report');
                    }

                    setReportModalOpen(false);
                    setReportReason('');
                    setReportDetails('');
                  }}
                  className="flex-1 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white py-3 rounded font-medium transition-colors"
                >
                  Submit Report
                </button>

                <button
                  onClick={() => setReportModalOpen(false)}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white py-3 rounded font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUDIO ELEMENTS */}
      <audio ref={sendSound} src="/sounds/send.mp3" preload="auto" />
      <audio ref={receiveSound} src="/sounds/receive.mp3" preload="auto" />
      <audio ref={leaveSound} src="/sounds/leave.mp3" preload="auto" />
      <audio ref={systemSound} src="/sounds/system.mp3" preload="auto" />
    </div>
  );
}