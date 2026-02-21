export const runtime = "nodejs";

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const { chatId, senderId, reportedId, reason, details } = await request.json();

    
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);



    // 1) Uložit report do DB (včetně reported_id)
    const { error } = await supabase.from('reports').insert({
      chat_id: chatId,
      sender_id: senderId,
      reported_id: reportedId,  // ⬅️ PŘIDÁNO!
      reason,
      details
    });

    if (error) {
      console.error("SUPABASE INSERT ERROR:", error);
      return NextResponse.json({ error: 'Insert failed' }, { status: 500 });
    }

    // 2) Poslat email přes Resend (beze změny)
    const resend = new Resend(process.env.RESEND_API_KEY!);

    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: process.env.ADMIN_EMAIL!,
      subject: "⚠️ Nový report z aplikace",
      html: `
        <h2>Nový report</h2>
        <p><strong>Chat ID:</strong> ${chatId}</p>
        <p><strong>Odesílatel:</strong> ${senderId}</p>
        <p><strong>Nahlášený uživatel:</strong> ${reportedId}</p>
        <p><strong>Důvod:</strong> ${reason}</p>
        <p><strong>Detaily:</strong> ${details}</p>
      `
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }
}