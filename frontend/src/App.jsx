import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider, useDispatch, useSelector } from "react-redux";
import { useEffect } from "react";
import store from "./store";

import Home from "./pages/Home";
import Contact from "./pages/Contact";
import Signin from "./pages/Signin";
import Register from "./pages/Register";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import AllOrders from "./pages/AllOrders";
import MyOrders from "./pages/MyOrders";
import RequestOrder from "./pages/RequestOrder";
import OrderDetail from "./pages/OrderDetail";
import { checkAuth } from "./slices/authSlice";

// Wrapper pentru rutele protejate
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated) {
    return <Signin />; // Redirecționează utilizatorii neautentificați
  }

  return children; // Returnează componenta protejată
};

// Wrapper pentru verificarea autentificării la nivel de aplicație
const AppWrapper = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    // Verifică dacă utilizatorul este autentificat la inițializarea aplicației
    dispatch(checkAuth());
  }, [dispatch]);

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<Home />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/register" element={<Register />} />

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
          path="/order-detail/:id"
          element={
            <ProtectedRoute>
              <OrderDetail />
            </ProtectedRoute>
          }

        />
        

        <Route
          path="/my-orders"
          element={
            <ProtectedRoute>
              <MyOrders />
            </ProtectedRoute>
          }
        />
        <Route path="/request-order" element={<RequestOrder />} />
      </Routes>
      <Footer />
    </>
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
