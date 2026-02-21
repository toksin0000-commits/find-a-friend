import { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
const supabase = getSupabase();

export function useBlockedUsers() {
  const [blockedByMe, setBlockedByMe] = useState<Set<string>>(new Set()); // koho jsem blokoval já
  const [blockedByOthers, setBlockedByOthers] = useState<Set<string>>(new Set()); // kdo blokuje mě
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);

  // Načíst své ID z localStorage
  useEffect(() => {
    const id = localStorage.getItem('anon_id');
    setMyId(id);
  }, []);

  // Hlavní funkce pro načtení blokací
  async function loadBlocks() {
    if (!myId) return;

    try {
      console.log('📥 Načítám blokace pro uživatele:', myId);

      // 1. Koho jsem blokoval já (jsem blocker)
      const { data: myBlocks, error: error1 } = await supabase
        .from('blocks')
        .select('blocked_id')
        .eq('blocker_id', myId);

      if (error1) throw error1;

      // 2. Kdo blokuje mě (jsem blocked) – TOTO JE PRO ADMIN BLOKOVÁNÍ!
      const { data: blocksAgainstMe, error: error2 } = await supabase
        .from('blocks')
        .select('blocker_id')
        .eq('blocked_id', myId);

      if (error2) throw error2;
      
      console.log('✅ Koho jsem blokoval já:', myBlocks);
      console.log('✅ Kdo blokuje mě (včetně admina):', blocksAgainstMe);
      
      setBlockedByMe(new Set<string>(myBlocks?.map(b => b.blocked_id) || []));
      setBlockedByOthers(new Set<string>(blocksAgainstMe?.map(b => b.blocker_id) || []));
      
    } catch (error) {
      console.error('❌ Chyba při načítání blokací:', error);
    } finally {
      setLoading(false);
    }
  }

  // Načíst při startu a při změně myId
  useEffect(() => {
    if (myId) {
      loadBlocks();
    }
  }, [myId]);

  // REALTIME: Sledování změn v blocích
  useEffect(() => {
    if (!myId) return;

    const channel = supabase
      .channel('blocks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'blocks',
          filter: `blocked_id=eq.${myId}` // sleduj změny, kde jsem já blokovaný
        },
        () => {
          console.log('🔄 Změna v blokacích – aktualizuji data');
          loadBlocks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId]);

  // Blokovat uživatele
  const blockUser = async (userId: string) => {
    if (!userId || userId === myId) {
      alert('Nemůžete blokovat sám sebe');
      return;
    }

    if (blockedByMe.has(userId)) {
      alert('Tento uživatel je již blokovaný');
      return;
    }

    try {
      const anonId = localStorage.getItem('anon_id');
      if (!anonId) return;

      const { error } = await supabase
        .from('blocks')
        .insert({
          blocker_id: anonId,
          blocked_id: userId
        });

      if (error) {
        if (error.code === '23505') {
          alert('Tento uživatel je již blokovaný');
        } else {
          throw error;
        }
        return;
      }

      alert('Uživatel byl zablokován');
      loadBlocks(); // znovu načti data
      
    } catch (error) {
      console.error('❌ Chyba při blokování:', error);
      alert('Došlo k chybě při blokování');
    }
  };

  // Odblokovat uživatele
  const unblockUser = async (userId: string) => {
    if (!userId || !blockedByMe.has(userId)) return;

    try {
      const anonId = localStorage.getItem('anon_id');
      if (!anonId) return;

      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_id', anonId)
        .eq('blocked_id', userId);

      if (error) throw error;

      alert('Uživatel byl odblokován');
      loadBlocks(); // znovu načti data
      
    } catch (error) {
      console.error('❌ Chyba při odblokování:', error);
      alert('Došlo k chybě při odblokování');
    }
  };

  // Kontrola, jestli můžu poslat zprávu
  const canSendMessage = (otherUserId?: string) => {
    if (!otherUserId || !myId) return false;
    if (otherUserId === myId) return false;
    
    // Pokud mě ten druhý blokuje (včetně admina), nemohu mu psát
    if (blockedByOthers.has(otherUserId)) {
      console.log('❌ Tento uživatel mě blokuje, nemohu psát');
      return false;
    }
    
    return true;
  };

  // Původní isBlocked pro kompatibilitu (koho jsem blokoval já)
  const isBlocked = (userId?: string) => {
    return !!userId && blockedByMe.has(userId);
  };

  return { 
    blockUser, 
    unblockUser, 
    isBlocked,
    canSendMessage,
    blockedList: [...blockedByMe], 
    blockedByList: [...blockedByOthers],
    loading 
  };
}