import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import { useEffect } from "react";
import store from "../src/redux/store/store"

import ErrorBoundary from "./components/ErrorBoundary";

import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Signin from "./pages/Signin";
import Register from "./pages/Register";
import ResetPasswordRequest from "./pages/ResetPasswordRequest";
import ResetPassword from './pages/ResetPassword'; // Asigură-te că importi corect componenta

import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import MyOrders from "./pages/MyOrders";
import MyOffers from "./pages/MyOffers";
import RequestOrder from "./pages/RequestOrder";
import OrderDetails from "./pages/OrderDetails";
import OfferDetail from "./pages/OfferDetail";
import OfferGenerator from "./pages/OfferGenerator";
import MyProfile from "./pages/MyProfile";
import AdminOrders from "./pages/AdminOrders";
import AdminOffers from "./pages/AdminOffers";


import { checkAuth } from "./slices/authSlice";

import { ProtectedRoute } from "./utils/ProtectedRoute";
import { PublicRoute } from "./utils/PublicRoute";

const AppWrapper = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <ErrorBoundary>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/contact" element={<Contact />} />

        {/* Rute publice */}
        <Route path="/signin" element={<Signin />} />
        
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPasswordRequest />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* Rute protejate */}
        <Route
          path="/my-profile"
          element={
            <ProtectedRoute>
              <MyProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/offer/:offerId"
          element={
            <ProtectedRoute>
              <OfferDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/offer-generator/:orderId"
          element={
            <ProtectedRoute>
              <OfferGenerator />
            </ProtectedRoute>
          }
        />

        {/* Rute pentru Admin */}
        <Route
          path="/admin-orders"
          element={
            <ProtectedRoute>
              <AdminOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-offers"
          element={
            <ProtectedRoute>
              <AdminOffers />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <OrderDetails />
            </ProtectedRoute>
          }
        />
          {/* Adaugă alte rute admin când este necesar */}

        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/my-orders/:id" element={<OrderDetails />} />
        <Route path="/my-offers" element={<MyOffers />} />


        <Route path="/request-order" element={
            <ProtectedRoute>
              <RequestOrder />
            </ProtectedRoute>
          } />
      </Routes>
      <Footer />
    </ErrorBoundary>
  );
};

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppWrapper />
      </BrowserRouter>
    </Provider>
  );
}
