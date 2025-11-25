// Zustand Store para Carrito de Compras
// Propósito: Gestión de estado del carrito con persistencia en localStorage

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Types
export interface CartItem {
  productId: string;
  variantId: string | null;
  quantity: number;
  price: number; // Precio al momento de agregar
  name: string;
  image: string;
  sku: string;
  slug: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId?: string | null) => void;
  updateQuantity: (
    productId: string,
    quantity: number,
    variantId?: string | null,
  ) => void;
  clear: () => void;
  itemCount: () => number;
  subtotal: () => number;
  tax: () => number;
  shipping: () => number;
  total: () => number;
}

// Helper: Round to 2 decimals
const round = (num: number): number => Math.round(num * 100) / 100;

// Helper: Find item index
const findItemIndex = (
  items: CartItem[],
  productId: string,
  variantId?: string | null,
): number => {
  return items.findIndex(
    (item) =>
      item.productId === productId && item.variantId === (variantId || null),
  );
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      // Agregar item o aumentar cantidad si ya existe
      addItem: (item: CartItem) =>
        set((state) => {
          const existingIndex = findItemIndex(
            state.items,
            item.productId,
            item.variantId,
          );

          if (existingIndex !== -1) {
            // Item ya existe, aumentar cantidad
            const newItems = [...state.items];
            newItems[existingIndex].quantity += item.quantity;
            return { items: newItems };
          } else {
            // Item nuevo
            return { items: [...state.items, item] };
          }
        }),

      // Eliminar item completamente
      removeItem: (productId: string, variantId?: string | null) =>
        set((state) => ({
          items: state.items.filter(
            (item) =>
              !(
                item.productId === productId &&
                item.variantId === (variantId || null)
              ),
          ),
        })),

      // Actualizar cantidad (si llega a 0, eliminar)
      updateQuantity: (
        productId: string,
        quantity: number,
        variantId?: string | null,
      ) =>
        set((state) => {
          if (quantity <= 0) {
            // Si cantidad es 0 o negativa, eliminar item
            return {
              items: state.items.filter(
                (item) =>
                  !(
                    item.productId === productId &&
                    item.variantId === (variantId || null)
                  ),
              ),
            };
          }

          const existingIndex = findItemIndex(
            state.items,
            productId,
            variantId,
          );

          if (existingIndex !== -1) {
            const newItems = [...state.items];
            newItems[existingIndex].quantity = quantity;
            return { items: newItems };
          }

          return state;
        }),

      // Vaciar carrito
      clear: () => set({ items: [] }),

      // Total de items (suma de quantities)
      itemCount: () => {
        const { items } = get();
        return items.reduce((total, item) => total + item.quantity, 0);
      },

      // Subtotal (suma de price × quantity)
      subtotal: () => {
        const { items } = get();
        const sum = items.reduce(
          (total, item) => total + item.price * item.quantity,
          0,
        );
        return round(sum);
      },

      // Impuesto (16% del subtotal)
      tax: () => {
        const subtotal = get().subtotal();
        return round(subtotal * 0.16);
      },

      // Envío ($9.99 si subtotal < $100, sino gratis)
      shipping: () => {
        const subtotal = get().subtotal();
        return subtotal < 100 ? 9.99 : 0;
      },

      // Total (subtotal + tax + shipping)
      total: () => {
        const { subtotal, tax, shipping } = get();
        return round(subtotal() + tax() + shipping());
      },
    }),
    {
      name: "cart-storage", // localStorage key
      skipHydration: true, // Hidratación manual para evitar mismatch SSR
    },
  ),
);
