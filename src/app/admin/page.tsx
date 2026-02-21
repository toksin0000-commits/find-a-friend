'use client';

import { useState, useEffect } from 'react';
import AdminPresenceWidget from "./AdminPresenceWidget";
import { getSupabase } from "@/lib/supabase";
const supabase = getSupabase();

// ===== TYPES =====
interface Report {
  id: number;
  chat_id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  details: string;
  created_at: string;
  reporter: { name: string | null };
  reported: { name: string | null };
}

interface Message {
  id: number;
  chat_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: { name: string | null };
}

interface Match {
  user1_id: string;
  user2_id: string;
  user1: { name: string | null };
  user2: { name: string | null };
}

interface ChatData {
  messages: Message[];
  match: Match;
}

interface Block {
  id: number;
  blocker_id: string;
  blocked_id: string;
  reason: string | null;
  blocked_by_admin: boolean;
  created_at: string;
  blocker?: { name: string | null };
  blocked?: { name: string | null };
}

// ===== TOKEN HELPER =====
function getToken() {
  return localStorage.getItem("admin_token") ?? "";
}

// ===== COMPONENT =====
export default function AdminPage() {
  console.log("ADMIN PAGE RENDERED");

  const [reports, setReports] = useState<Report[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [chatData, setChatData] = useState<ChatData | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [activeTab, setActiveTab] = useState<'reports' | 'blocks'>('reports');

  // ===== NOTIFICATIONS =====
  const [notifications, setNotifications] = useState<
  { id: string; message: string }[]
>([]);


  function pushNotification(message: string) {
  const id = crypto.randomUUID();

  setNotifications(prev => [
    { id, message },
    ...prev.slice(0, 9),
  ]);

  setTimeout(() => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, 3000);
}



  // ===== LOAD DATA =====
  useEffect(() => {
    loadReports();
    loadBlocks();
  }, []);

  // ===== REALTIME REPORTS LISTENER =====
  useEffect(() => {
    const channel = supabase
      .channel("admin-reports")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "reports" },
        (payload) => {
          console.log("📨 NEW REPORT:", payload.new);
          setReports(prev => {
  const exists = prev.some(r => r.id === payload.new.id);
  if (exists) return prev; // zabrání duplicitě
  return [payload.new as Report, ...prev];
});

          pushNotification("New report received");
        }
      );

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        console.log("🟢 REPORT CHANNEL READY");
        setTimeout(() => channel.track?.({}), 300);
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // ===== REALTIME BLOCKS LISTENER =====
useEffect(() => {
  const channel = supabase
    .channel("admin-blocks")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "blocks" },
      (payload) => {
        console.log("🧱 BLOCK CHANGE:", payload);

        setBlocks(prev => {
          // INSERT
          if (payload.eventType === "INSERT") {
            // zabrání duplicitě
            if (prev.some(b => b.id === payload.new.id)) return prev;

            pushNotification(`User ${payload.new.blocked_id} blocked`);
            return [payload.new as Block, ...prev];
          }

          // DELETE
          if (payload.eventType === "DELETE") {
            pushNotification(`Block ${payload.old.id} removed`);
            return prev.filter(b => b.id !== payload.old.id);
          }

          // UPDATE
          if (payload.eventType === "UPDATE") {
            return prev.map(b =>
              b.id === payload.new.id ? (payload.new as Block) : b
            );
          }

          return prev;
        });
      }
    );

  channel.subscribe();

  return () => {
    channel.unsubscribe();
  };
}, []);


  // ===== REALTIME BANS LISTENER =====
  useEffect(() => {
    const channel = supabase
      .channel("admin-bans")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        (payload) => {
          const before = payload.old as any;
          const after = payload.new as any;

          if (before.banned === after.banned) return;

          if (after.banned) {
            pushNotification(`User ${after.anon_id} was banned`);
          } else {
            pushNotification(`User ${after.anon_id} was unbanned`);
          }
        }
      );

    channel.subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, []);

  // ===== REPORTS =====
  async function loadReports() {
    const res = await fetch('/api/admin', {
      headers: { "x-admin-token": getToken() }
    });
    const data = await res.json();
    setReports(data.reports || []);
  }

  async function loadChat(chatId: string) {
    const res = await fetch(`/api/admin?chat=${chatId}`, {
      headers: { "x-admin-token": getToken() }
    });
    const data: ChatData = await res.json();
    setChatData(data);
    setSelectedChat(chatId);
    setBlockReason('');
  }

  async function handleResolve(reportId: number) {
    await fetch('/api/admin', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': getToken()
      },
      body: JSON.stringify({ type: 'report', id: reportId })
    });

    loadReports();
    setSelectedChat(null);
  }

  // ===== BLOCKING =====
  async function loadBlocks() {
    const res = await fetch('/api/admin/blocks', {
      headers: { "x-admin-token": getToken() }
    });
    const data = await res.json();
    setBlocks(data.blocks || []);
  }

  async function handleBlock(userId: string) {
    if (!userId) return;

    await fetch('/api/admin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': getToken()
      },
      body: JSON.stringify({
        blockedId: userId,
        reason: blockReason || 'Blocked by admin'
      })
    });

    pushNotification(`User ${userId} blocked`);
    setBlockReason('');
    loadBlocks();
  }

  async function handleUnblock(blockId: number) {
    if (!confirm('Are you sure you want to unblock this user?')) return;

    await fetch('/api/admin/blocks', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-token': getToken()
      },
      body: JSON.stringify({ blockId })
    });

    pushNotification(`Block ${blockId} removed`);
    loadBlocks();
  }

  // ===== BAN =====
  const handleBan = async (userId: string) => {
    if (!userId) return;
    if (!confirm('Opravdu chcete tohoto uživatele zabanovat?')) return;

    const reason = prompt('Důvod banu (nepovinný):');

    try {
      const res = await fetch('/api/admin/ban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getToken()
        },
        body: JSON.stringify({ userId, reason })
      });

      if (res.ok) {
        pushNotification(`User ${userId} banned`);
      } else {
        const data = await res.json();
        alert(`Chyba při banování: ${data.error || 'Neznámá chyba'}`);
      }
    } catch (error) {
      console.error('Chyba při banování:', error);
      alert('Došlo k neočekávané chybě');
    }
  };

  // ===== UNBAN =====
  const handleUnban = async (userId: string) => {
    if (!confirm('Opravdu chcete tohoto uživatele odbanovat?')) return;

    try {
      const res = await fetch('/api/admin/unban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': getToken()
        },
        body: JSON.stringify({ userId })
      });

      if (res.ok) {
        pushNotification(`User ${userId} unbanned`);
        loadBlocks();
      } else {
        const data = await res.json();
        alert(`Chyba: ${data.error || 'Neznámá chyba'}`);
      }
    } catch (error) {
      console.error('Chyba při odbanování:', error);
      alert('Došlo k neočekávané chybě');
    }
  };

    // ===== RENDER =====
  return (
    <div className="space-y-6 text-white">

      {/* 🔔 NOTIFICATION OVERLAY */}
      <div className="fixed top-4 right-4 space-y-2 z-50">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="bg-gray-800 text-white text-xs px-3 py-2 rounded shadow-lg border border-gray-700 animate-fade-in"
          >
            {n.message}
          </div>
        ))}
      </div>

      {/* PRESENCE + STATS */}
      <AdminPresenceWidget />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'reports'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Reports ({reports.length})
        </button>

        <button
          onClick={() => setActiveTab('blocks')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'blocks'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Blocks ({blocks.length})
        </button>
      </div>

      {/* REPORTS TAB */}
      {activeTab === 'reports' ? (
        <div className="grid grid-cols-3 gap-6">
          {/* LEFT COLUMN */}
          <div className="col-span-1 bg-gray-800 rounded-lg p-4">
            {reports.length === 0 ? (
              <p className="text-gray-400 text-xs">No reports</p>
            ) : (
              reports.map((report) => (
                <div key={report.id} className="border-b border-gray-700 py-3">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">
                      {report.reason}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(report.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400 mt-1">
                    {report.reporter?.name || 'Anonymous'} →{' '}
                    {report.reported?.name || 'Anonymous'}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => loadChat(report.chat_id)}
                      className="text-xs bg-blue-600 px-2 py-1 rounded hover:bg-blue-700"
                    >
                      View Chat
                    </button>
                    <button
                      onClick={() => handleResolve(report.id)}
                      className="text-xs bg-green-600 px-2 py-1 rounded hover:bg-green-700"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="col-span-2 bg-gray-800 rounded-lg p-4">
            {selectedChat ? (
              <div>
                <h2 className="text-xl font-bold mb-4">Chat</h2>

                {/* USER INFO */}
                {chatData?.match && (
                  <div className="bg-gray-900 p-4 rounded-lg mb-4">
                    <div className="grid grid-cols-2 gap-4">
                      {/* USER 1 */}
                      <div>
                        <p className="font-medium">
                          {chatData.match.user1?.name || 'Anonymous 1'}
                        </p>
                        <p className="text-xs text-gray-400 mb-2 break-all">
                          ID: {chatData.match.user1_id}
                        </p>
                        <button
                          onClick={() => handleBlock(chatData.match.user1_id)}
                          className="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          🔨 Block
                        </button>
                        <button
                          onClick={() => handleBan(chatData.match.user1_id)}
                          className="bg-black px-3 py-1 rounded text-sm hover:bg-gray-800 ml-2"
                        >
                          🚫 Ban
                        </button>
                      </div>

                      {/* USER 2 */}
                      <div>
                        <p className="font-medium">
                          {chatData.match.user2?.name || 'Anonymous 2'}
                        </p>
                        <p className="text-xs text-gray-400 mb-2 break-all">
                          ID: {chatData.match.user2_id}
                        </p>
                        <button
                          onClick={() => handleBlock(chatData.match.user2_id)}
                          className="bg-red-600 px-3 py-1 rounded text-sm hover:bg-red-700"
                        >
                          🔨 Block
                        </button>
                        <button
                          onClick={() => handleBan(chatData.match.user2_id)}
                          className="bg-black px-3 py-1 rounded text-sm hover:bg-gray-800 ml-2"
                        >
                          🚫 Ban
                        </button>
                      </div>
                    </div>

                    {/* BLOCK REASON */}
                    <div className="mt-3">
                      <input
                        type="text"
                        placeholder="Block reason (optional)"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        className="w-full p-2 bg-gray-800 rounded border border-gray-700 text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* MESSAGES */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {chatData?.messages?.map((msg, i) => {
                    let senderDisplay = 'Anonymous';
                    if (msg.sender_id === chatData.match?.user1_id)
                      senderDisplay = 'Anonymous 1';
                    if (msg.sender_id === chatData.match?.user2_id)
                      senderDisplay = 'Anonymous 2';
                    if (msg.sender_id === 'system') senderDisplay = 'System';

                    return (
                      <div
                        key={msg.id}
                        className={`p-2 rounded ${
                          msg.sender_id === 'system'
                            ? 'bg-gray-700 text-center text-xs text-gray-400'
                            : msg.sender_id === chatData?.match?.user1_id
                            ? 'bg-blue-900 ml-4'
                            : msg.sender_id === chatData?.match?.user2_id
                            ? 'bg-green-900 mr-4'
                            : 'bg-gray-800'
                        }`}
                      >
                        <div className="text-xs text-gray-400 mb-1">
                          {senderDisplay} •{' '}
                          {new Date(msg.created_at).toLocaleTimeString()}
                        </div>
                        <div className="whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-center py-20 text-xs">
                Select a report to view chat
              </div>
            )}
          </div>
        </div>
      ) : (
        /* BLOCKS TAB */
        <div className="bg-gray-800 rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">
            Blocked Users ({blocks.length})
          </h2>

          {blocks.length === 0 ? (
            <p className="text-gray-400">No blocks</p>
          ) : (
            <div className="space-y-2">
              {blocks.map((block) => (
                <div key={block.id} className="bg-gray-900 p-3 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-red-900 text-red-200 px-2 py-1 rounded">
                          {block.blocked_by_admin ? 'ADMIN' : 'USER'}
                        </span>
                        <span className="text-sm font-medium">
                          {block.blocked?.name || 'Anonymous'}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 mt-1 break-all">
                        ID: {block.blocked_id}
                      </p>

                      {block.reason && (
                        <p className="text-xs text-gray-500 mt-1">
                          Reason: {block.reason}
                        </p>
                      )}

                      <p className="text-xs text-gray-600 mt-1">
                        Blocked:{' '}
                        {new Date(block.created_at).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleUnblock(block.id)}
                        className="bg-green-600 px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        Unblock
                      </button>

                      {block.blocked_by_admin && (
                        <button
                          onClick={() => handleUnban(block.blocked_id)}
                          className="bg-yellow-600 px-3 py-1 rounded text-sm hover:bg-yellow-700"
                        >
                          Unban
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
