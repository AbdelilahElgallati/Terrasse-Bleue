import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export type RestaurantSettings = { restaurantName: string; address: string; contactPhone?: string | null; contactEmail?: string | null; isOpen: boolean; acceptsOrders: boolean; estimatedPrepMinutes: number; updatedAt: string };

export function useRestaurantSettings() {
  return useQuery({ queryKey: ['restaurant-settings'], queryFn: () => api.get<RestaurantSettings>('/admin/restaurant'), staleTime: 10_000, refetchInterval: 15_000 });
}
