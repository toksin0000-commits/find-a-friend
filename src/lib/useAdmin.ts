import { useState, useEffect } from 'react';
import { getSupabase } from "@/lib/supabase";
const supabase = getSupabase();

export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const anonId = localStorage.getItem('anon_id');
      
      if (!anonId) {
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      // Zkontrolujeme, jestli je anon_id v tabulce admins
      const { data, error } = await supabase
        .from('admins')
        .select('anon_id')
        .eq('anon_id', anonId)
        .single();

      if (error) {
        console.error('Error checking admin:', error);
        setIsAdmin(false);
      } else {
        setIsAdmin(!!data);
      }
    } catch (error) {
      console.error('Failed to check admin:', error);
      setIsAdmin(false);
    } finally {
      setLoading(false);
    }
  }

  return { isAdmin, loading };
}