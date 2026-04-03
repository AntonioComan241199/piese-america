import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: JSON.parse(localStorage.getItem("cartItems")) || [],
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (state, action) => {
      const item = action.payload;
      const existItem = state.items.find((x) => x._id === item._id);

      if (existItem) {
        existItem.qty += 1;
      } else {
        state.items.push({ ...item, qty: 1 });
      }
      localStorage.setItem("cartItems", JSON.stringify(state.items));
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((x) => x._id !== action.payload);
      localStorage.setItem("cartItems", JSON.stringify(state.items));
    },
    updateQty: (state, action) => {
      const { id, qty } = action.payload;
      const item = state.items.find((x) => x._id === id);
      if (item) {
        item.qty = Math.max(1, qty);
      }
      localStorage.setItem("cartItems", JSON.stringify(state.items));
    },
    clearCart: (state) => {
      state.items = [];
      localStorage.removeItem("cartItems");
    },
  },
});

export const { addToCart, removeFromCart, updateQty, clearCart } = cartSlice.actions;
export default cartSlice.reducer;