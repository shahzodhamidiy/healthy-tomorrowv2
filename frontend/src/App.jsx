import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import Layout from "@/components/Layout";
import Protected from "@/components/Protected";

// Public
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Register from "@/pages/Register";

// Customer
import Meals from "@/pages/customer/Meals";
import MealDetail from "@/pages/customer/MealDetail";
import Cart from "@/pages/customer/Cart";
import Checkout from "@/pages/customer/Checkout";
import Orders from "@/pages/customer/Orders";
import OrderTrack from "@/pages/customer/OrderTrack";
import Dashboard from "@/pages/customer/Dashboard";
import Profile from "@/pages/customer/Profile";
import Favorites from "@/pages/customer/Favorites";
import Subscriptions from "@/pages/customer/Subscriptions";
import Chat from "@/pages/customer/Chat";

// Admin
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminMeals from "@/pages/admin/AdminMeals";
import AdminOrders from "@/pages/admin/AdminOrders";
import AdminReports from "@/pages/admin/AdminReports";

// Dietitian
import DietitianDashboard from "@/pages/dietitian/DietitianDashboard";
import DietitianAppointments from "@/pages/dietitian/DietitianAppointments";
import DietitianClients from "@/pages/dietitian/DietitianClients";

// Delivery
import DeliveryDashboard from "@/pages/delivery/DeliveryDashboard";
import DeliveryHistory from "@/pages/delivery/DeliveryHistory";
import DeliveryEarnings from "@/pages/delivery/DeliveryEarnings";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Customer */}
            <Route path="/meals" element={<Meals />} />
            <Route path="/meals/:id" element={<MealDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Protected><Checkout /></Protected>} />
            <Route path="/orders" element={<Protected><Orders /></Protected>} />
            <Route path="/orders/:id" element={<Protected><OrderTrack /></Protected>} />
            <Route path="/dashboard" element={<Protected roles={["customer"]}><Dashboard /></Protected>} />
            <Route path="/profile" element={<Protected><Profile /></Protected>} />
            <Route path="/favorites" element={<Protected><Favorites /></Protected>} />
            <Route path="/subscriptions" element={<Subscriptions />} />
            <Route path="/chat" element={<Protected><Chat /></Protected>} />

            {/* Admin */}
            <Route path="/admin" element={<Protected roles={["admin"]}><AdminDashboard /></Protected>} />
            <Route path="/admin/users" element={<Protected roles={["admin"]}><AdminUsers /></Protected>} />
            <Route path="/admin/meals" element={<Protected roles={["admin"]}><AdminMeals /></Protected>} />
            <Route path="/admin/orders" element={<Protected roles={["admin"]}><AdminOrders /></Protected>} />
            <Route path="/admin/reports" element={<Protected roles={["admin"]}><AdminReports /></Protected>} />

            {/* Dietitian */}
            <Route path="/dietitian" element={<Protected roles={["dietitian", "admin"]}><DietitianDashboard /></Protected>} />
            <Route path="/dietitian/appointments" element={<Protected roles={["dietitian", "admin"]}><DietitianAppointments /></Protected>} />
            <Route path="/dietitian/clients" element={<Protected roles={["dietitian", "admin"]}><DietitianClients /></Protected>} />

            {/* Delivery */}
            <Route path="/delivery" element={<Protected roles={["delivery", "admin"]}><DeliveryDashboard /></Protected>} />
            <Route path="/delivery/history" element={<Protected roles={["delivery", "admin"]}><DeliveryHistory /></Protected>} />
            <Route path="/delivery/earnings" element={<Protected roles={["delivery", "admin"]}><DeliveryEarnings /></Protected>} />
          </Routes>
        </Layout>
      </CartProvider>
    </AuthProvider>
  );
}
