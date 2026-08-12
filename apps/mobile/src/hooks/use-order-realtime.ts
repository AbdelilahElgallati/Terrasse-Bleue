import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { orderSocket, type RealtimeConnectionState } from '@/lib/order-socket';

export function useOrderRealtime(orderId?: string) {
  const queryClient = useQueryClient();
  const [connectionState, setConnectionState] = useState<RealtimeConnectionState>('disabled');

  useEffect(() => orderSocket.onConnectionState(setConnectionState), []);
  useEffect(() => {
    if (!orderId) return;
    const refetch = () => void queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
    const unsubscribe = orderSocket.subscribeOrder(orderId, (event) => {
      if (event.orderId !== orderId) return;
      queryClient.setQueryData(['orders', orderId], (current: { status?: string } | undefined) =>
        current ? { ...current, status: event.status } : current,
      );
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    });
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        orderSocket.connect();
        refetch();
      } else orderSocket.pause();
    });
    return () => {
      appState.remove();
      unsubscribe();
    };
  }, [orderId, queryClient]);

  return connectionState;
}
