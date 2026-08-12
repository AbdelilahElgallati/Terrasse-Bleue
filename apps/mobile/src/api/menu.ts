import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import { mapCategory, mapProduct } from '@/data/menu';
import type { ApiCategory, ApiProduct } from '@/types/menu';
export function useMenu() { const categories = useQuery({ queryKey: ['categories'], queryFn: async () => (await api.get<ApiCategory[]>('/categories')).map(mapCategory) }); const products = useQuery({ queryKey: ['products'], queryFn: async () => (await api.get<{ items: ApiProduct[] }>('/products?limit=100')).items.map(mapProduct) }); return { categories, products, isLoading: categories.isLoading || products.isLoading, isError: categories.isError || products.isError, refetch: () => Promise.all([categories.refetch(), products.refetch()]) }; }
export function useProduct(id?: string) { return useQuery({ queryKey: ['products', id], enabled: Boolean(id), queryFn: async () => mapProduct(await api.get<ApiProduct>(`/products/${id}`)) }); }
