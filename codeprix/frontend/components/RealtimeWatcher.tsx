'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function RealtimeWatcher() {
  const lastState = useRef<{ is_active: boolean; results_released: boolean } | null>(null);

  useEffect(() => {
    // 1. Fetch initial state to avoid redundant reload on first mount
    supabase
      .from('event_config')
      .select('is_active, results_released')
      .eq('is_active', true)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          lastState.current = {
            is_active: data[0].is_active,
            results_released: data[0].results_released,
          };
        }
      });

    // 2. Subscribe to REALTIME updates on event_config
    const channel = supabase
      .channel('race_events')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'event_config' },
        (payload) => {
          const newState = payload.new as { is_active: boolean; results_released: boolean };
          const oldState = lastState.current;

          // Detect Race START (inactive -> active)
          const raceStarted = newState.is_active && (!oldState || !oldState.is_active);
          
          // Detect Results RELEASED (unreleased -> released)
          const resultsReleased = newState.results_released && (!oldState || !oldState.results_released);

          if (raceStarted || resultsReleased) {
            console.log('--- MISSION CONTROL: REFRESHING PAGE ---');
            window.location.reload();
          }

          lastState.current = newState;
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return null;
}
