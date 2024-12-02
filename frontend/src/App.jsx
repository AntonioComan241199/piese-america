import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider, useDispatch } from "react-redux";
import { useEffect } from "react";
import store from "./store";

import ErrorBoundary from "./components/ErrorBoundary";

import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Signin from "./pages/Signin";
import Register from "./pages/Register";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import AllOrders from "./pages/AllOrders";
import MyOrders from "./pages/MyOrders";
import RequestOrder from "./pages/RequestOrder";
import OrderDetails from "./pages/OrderDetails";
import OfferDetail from "./pages/OfferDetail";
import OfferGenerator from "./pages/OfferGenerator";
import OfferManagement from "./pages/OfferManagement";
import MyProfile from "./pages/MyProfile";

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
        <Route
          path="/signin"
          element={
            <PublicRoute>
              <Signin />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* Rute protejate */}
        <Route
          path="/all-orders"
          element={
            <ProtectedRoute>
              <AllOrders />
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-profile"
          element={
            <ProtectedRoute>
              <MyProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/order-detail/:id"
          element={
            <ProtectedRoute>
              <OrderDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/offer-detail/:offerId"
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
        <Route
          path="/offer-management"
          element={
            <ProtectedRoute>
              <OfferManagement />
            </ProtectedRoute>
          }
        />
        <Route path="/my-orders" element={<MyOrders />} />
        <Route path="/my-orders/:id" element={<OrderDetails />} />

        <Route path="/request-order" element={<RequestOrder />} />
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
