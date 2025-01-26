import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import store from "../src/redux/store/store";
import Layout from "./components/Layout/Layout";
import ErrorBoundary from "./components/ErrorBoundary";

import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Signin from "./pages/Signin";
import Register from "./pages/Register";
import ResetPasswordRequest from "./pages/ResetPasswordRequest";
import ResetPassword from "./pages/ResetPassword";
import TermsAndConditions from "./pages/TermsAndConditions";
import OilProducts from "./pages/OilProducts";
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
      <Routes>
        <Route
          path="/"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/home"
          element={
            <Layout>
              <Home />
            </Layout>
          }
        />
        <Route
          path="/contact"
          element={
            <Layout>
              <Contact />
            </Layout>
          }
        />
        <Route
          path="/signin"
          element={
            <PublicRoute>
              <Layout>
                <Signin />
              </Layout>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Layout>
                <Register />
              </Layout>
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
        <Route
          path="/terms"
          element={
            <Layout>
              <TermsAndConditions />
            </Layout>
          }
        />
        <Route
          path="/oil-products"
          element={
            <Layout>
              <OilProducts />
            </Layout>
          }
        />
        <Route
          path="/my-profile"
          element={
            <ProtectedRoute>
              <Layout>
                <MyProfile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/offer/:offerId"
          element={
            <ProtectedRoute>
              <Layout>
                <OfferDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/offer-generator/:orderId"
          element={
            <ProtectedRoute>
              <Layout>
                <OfferGenerator />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-orders"
          element={
            <ProtectedRoute>
              <Layout>
                <AdminOrders />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin-offers"
          element={
            <ProtectedRoute>
              <Layout>
                <AdminOffers />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <OrderDetails />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-orders"
          element={
            <Layout>
              <MyOrders />
            </Layout>
          }
        />
        <Route
          path="/my-offers"
          element={
            <Layout>
              <MyOffers />
            </Layout>
          }
        />
        <Route
          path="/request-order"
          element={
            <ProtectedRoute>
              <Layout>
                <RequestOrder />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
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
