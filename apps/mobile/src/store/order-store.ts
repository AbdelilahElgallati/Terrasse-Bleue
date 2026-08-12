import { create } from 'zustand';
import type { DemoOrder } from '@/types/menu';
type OrderState = { currentOrder?: DemoOrder; setCurrentOrder: (order: DemoOrder) => void; clearCurrentOrder: () => void };
export const useOrderStore = create<OrderState>((set) => ({ setCurrentOrder: (currentOrder) => set({ currentOrder }), clearCurrentOrder: () => set({ currentOrder: undefined }) }));
