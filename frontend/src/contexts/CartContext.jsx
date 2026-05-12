import { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem("ht_cart");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("ht_cart", JSON.stringify(items));
  }, [items]);

  const add = (meal, qty = 1) => {
    setItems((prev) => {
      const i = prev.findIndex((p) => p.meal_id === meal.id);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], quantity: next[i].quantity + qty };
        return next;
      }
      return [
        ...prev,
        {
          meal_id: meal.id,
          name: meal.name,
          price: meal.price,
          image_url: meal.image_url,
          quantity: qty,
        },
      ];
    });
  };

  const remove = (meal_id) =>
    setItems((prev) => prev.filter((p) => p.meal_id !== meal_id));

  const setQty = (meal_id, qty) =>
    setItems((prev) =>
      prev.map((p) =>
        p.meal_id === meal_id ? { ...p, quantity: Math.max(1, qty) } : p
      )
    );

  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, add, remove, setQty, clear, count, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
