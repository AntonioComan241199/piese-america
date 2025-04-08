import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import store from "../src/redux/store/store";
import Layout from "./components/Layout/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import { Spinner } from "react-bootstrap";


import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Signin from "./pages/Account/Signin";
import Register from "./pages/Account/Register";
import ResetPasswordRequest from "./pages/ResetPasswordRequest";
import ResetPassword from "./pages/ResetPassword";
import TermsAndConditions from "./pages/TermsAndConditions";
import OilProducts from "./pages/Products/Oils/OilProducts";
import MyOrders from "./pages/Orders/MyOrders";
import MyOffers from "./pages/Offers/MyOffers";
import RequestOrder from "./pages/Orders/RequestOrder";
import OrderDetails from "./pages/Orders/OrderDetails";
import OfferDetail from "./pages/Offers/OfferDetail";
import OfferGenerator from "./pages/Offers/OfferGenerator";
import MyProfile from "./pages/MyProfile";
import AdminOrders from "./pages/Orders/AdminOrders";
import AdminOffers from "./pages/Offers/AdminOffers";
import RealtimeStats from "./pages/Admin/RealtimeStats";
import FordMustangPage from "./pages/DedicatedCars/FordMustangPage";

import { checkAuth } from "./slices/authSlice";
import { ProtectedRoute } from "./utils/ProtectedRoute";
import { PublicRoute } from "./utils/PublicRoute";
import { ProtectedAdminRoute } from "./utils/ProtectedAdminRoute";
import AdminOilProducts from "./pages/Admin/AdminOilProducts";
import AdminFireExtinguishers from "./pages/Admin/AdminFireExtinguishers";
import FireExtinguisherProducts from "./pages/Products/FireExtinghuishers/FireExtinguisherProducts";
import AdminDashboard from "./pages/Admin/AdminDashboard";

const AppWrapper = () => {
  const dispatch = useDispatch();
  const { authChecked } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!authChecked) {
      dispatch(checkAuth()); // ✅ Se apelează doar dacă autentificarea nu este deja verificată
    }
  }, [dispatch, authChecked]);

  if (!authChecked) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "100vh" }}>
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

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
          path="/ford-mustang"
          element={
            <Layout>
              <FordMustangPage />
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
          path="/fire-products"
          element={
            <Layout>
              <FireExtinguisherProducts />
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
          path="/admin/oil-products"
          element={
            <ProtectedAdminRoute>
              <Layout>
                <AdminOilProducts />
              </Layout>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/fire-extinguishers"
          element={
            <ProtectedAdminRoute>
              <Layout>
                <AdminFireExtinguishers />
              </Layout>
            </ProtectedAdminRoute>
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            <ProtectedAdminRoute>
              <Layout>
                <AdminDashboard />
              </Layout>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/offer-generator/:orderId"
          element={
            <ProtectedAdminRoute>
              <Layout>
                <OfferGenerator />
              </Layout>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin-orders"
          element={
            <ProtectedAdminRoute>
              <Layout>
                <AdminOrders />
              </Layout>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin-offers"
          element={
            <ProtectedAdminRoute>
              <Layout>
                <AdminOffers />
              </Layout>
            </ProtectedAdminRoute>
          }
        />
        <Route
          path="/admin/reports"
          element={
            <ProtectedAdminRoute>
              <Layout>
                <RealtimeStats />
              </Layout>
            </ProtectedAdminRoute>
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
          path="/my-orders/:id"
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
