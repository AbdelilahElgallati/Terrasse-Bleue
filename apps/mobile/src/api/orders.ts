import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { mapOrder, type ApiOrder } from '@/types/menu';
import { useOrderStore } from '@/store/order-store';
export function useOrders(enabled = true) { return useQuery({ queryKey: ['orders'], enabled, queryFn: async () => (await api.get<{ items: ApiOrder[] }>('/orders')).items.map(mapOrder) }); }
export function useOrder(id?: string, enabled = true) { return useQuery({ queryKey: ['orders', id], enabled: enabled && Boolean(id), queryFn: async () => mapOrder(await api.get<ApiOrder>(`/orders/${id}`)), refetchOnReconnect: true, refetchOnWindowFocus: true }); }
export function useCancelOrder() {
  const queryClient = useQueryClient();
  const setCurrentOrder = useOrderStore((state) => state.setCurrentOrder);
  return useMutation({
    mutationFn: async (id: string) => mapOrder(await api.post<ApiOrder>(`/orders/${id}/cancel`)),
    onSuccess: (order) => {
      setCurrentOrder(order);
      queryClient.setQueryData(['orders', order.id], order);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
