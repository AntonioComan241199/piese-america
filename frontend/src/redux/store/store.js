import { configureStore } from "@reduxjs/toolkit";
import authReducer, { checkAuth } from "../../slices/authSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
  },
});

// Initializează autentificarea din localStorage la încărcare
store.dispatch(checkAuth());