import { getSupabase } from "@/lib/supabase";
const supabase = getSupabase();


export async function createOrGetChat(a: string, b: string) {
  console.log("createOrGetChat a:", a);
  console.log("createOrGetChat b:", b);

  // 1) Najdeme existující chat
  const { data: existing, error: existingError } = await supabase
    .from("chats")
    .select("*")
    .or(
      `and(user1.eq.${a},user2.eq.${b}),and(user1.eq.${b},user2.eq.${a})`
    )
    .maybeSingle();

  if (existingError) {
    console.error("Existing chat lookup error:", existingError);
  }

  if (existing) {
    console.log("Existing chat found:", existing.id);
    return existing.id;
  }

  // 2) Vytvoříme nový chat
  const { data: created, error: createError } = await supabase
    .from("chats")
    .insert({
      user1: a,
      user2: b,
    })
    .select()
    .single();

  if (createError) {
    console.error("Chat creation error:", createError);
    return null;
  }

  console.log("New chat created:", created.id);
  return created.id;
}
