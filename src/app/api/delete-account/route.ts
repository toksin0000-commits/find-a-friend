import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function POST(req: Request) {
  try {
    const { anonId } = await req.json();

    if (!anonId) {
      return NextResponse.json({ error: 'Missing anonId' }, { status: 400 });
    }

    console.log('🗑️ Mažu účet pro anonId:', anonId);

    // 1. Nejprve zkontrolujeme, jestli profil existuje
    const { data: existingProfile, error: checkError } = await supabaseServer
      .from('profiles')
      .select('anon_id')
      .eq('anon_id', anonId)
      .maybeSingle();

    if (checkError) {
      console.error('❌ Chyba při kontrole profilu:', checkError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!existingProfile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 2. Označíme účet jako smazaný
    const { error: updateError } = await supabaseServer
      .from('profiles')
      .update({ 
        deleted_at: new Date().toISOString(),
        name: null,
        age: null,
        gender: null,
        country: null,
        language: null,
        interest: null,
        photo_url: null,
        latitude: null,
        longitude: null
      })
      .eq('anon_id', anonId);

    if (updateError) {
      console.error('❌ Chyba při mazání účtu:', updateError);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    console.log('✅ Účet úspěšně smazán pro:', anonId);
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('❌ Neočekávaná chyba:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}