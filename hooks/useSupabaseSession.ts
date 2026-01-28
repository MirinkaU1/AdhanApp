import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type SessionState = {
  session: Session | null;
  isLoading: boolean;
};

export const useSupabaseSession = (): SessionState => {
  const [state, setState] = useState<SessionState>({
    session: null,
    isLoading: true,
  });

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      if (!supabase) {
        if (isMounted) {
          setState({ session: null, isLoading: false });
        }
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (isMounted) {
        setState({ session: data.session ?? null, isLoading: false });
      }
    };

    const { data: subscription } = supabase
      ? supabase.auth.onAuthStateChange((_event, session) => {
          if (isMounted) {
            setState({ session, isLoading: false });
          }
        })
      : { data: { subscription: null } };

    loadSession();

    return () => {
      isMounted = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  return state;
};
