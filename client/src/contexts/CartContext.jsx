import { createContext, useContext, useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "fieldwork-cart";
const CartContext = createContext(null);

function readStoredCart() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    const parsed = value ? JSON.parse(value) : [];
    return Array.isArray(parsed)
      ? parsed.filter(
          (item) =>
            item?.product?._id &&
            Number.isInteger(item.quantity) &&
            item.quantity > 0,
        )
      : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStoredCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function addItem(product, quantity = 1) {
    setItems((current) => {
      const existing = current.find(
        (item) => item.product._id === product._id,
      );
      if (existing) {
        return current.map((item) =>
          item.product._id === product._id
            ? {
                product,
                quantity: Math.min(
                  item.quantity + quantity,
                  Math.max(product.stock, 1),
                ),
              }
            : item,
        );
      }
      return [
        ...current,
        { product, quantity: Math.min(quantity, Math.max(product.stock, 1)) },
      ];
    });
  }

  function updateQuantity(productId, quantity) {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }
    setItems((current) =>
      current.map((item) =>
        item.product._id === productId
          ? {
              ...item,
              quantity: Math.min(
                quantity,
                Math.max(item.product.stock, 1),
              ),
            }
          : item,
      ),
    );
  }

  function removeItem(productId) {
    setItems((current) =>
      current.filter((item) => item.product._id !== productId),
    );
  }

  function clearCart() {
    setItems([]);
  }

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0,
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    }),
    [items, itemCount, subtotal],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
