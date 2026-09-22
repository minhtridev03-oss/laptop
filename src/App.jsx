import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import MainLayout from "./components/layout/MainLayout";

const Home = lazy(() => import("./pages/Home"));
const ProductList = lazy(() => import("./pages/ProductList"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Checkout = lazy(() => import("./pages/Checkout"));
const Compare = lazy(() => import("./pages/Compare"));
const SavedProducts = lazy(() => import("./pages/SavedProducts"));
const OrderLookup = lazy(() => import("./pages/OrderLookup"));
const PcBuilder = lazy(() => import("./pages/PcBuilder"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const Account = lazy(() => import("./pages/Account"));

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.28, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.18, ease: "easeIn" } },
};

function PageMotion({ children }) {
  return (
    <motion.div variants={pageVariants} initial="initial" animate="animate" exit="exit">
      {children}
    </motion.div>
  );
}

function LazyRoute({ children, label = "Đang tải nội dung..." }) {
  return (
    <Suspense
      fallback={
        <div className="luxury-page-section grid min-h-[65vh] place-items-center text-sm text-text-muted">
          {label}
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<LazyRoute><PageMotion><Home /></PageMotion></LazyRoute>} />
          <Route path="category/:categoryId" element={<LazyRoute><PageMotion><ProductList /></PageMotion></LazyRoute>} />
          <Route path="products" element={<LazyRoute><PageMotion><ProductList /></PageMotion></LazyRoute>} />
          <Route path="product/:id" element={<LazyRoute><PageMotion><ProductDetail /></PageMotion></LazyRoute>} />
          <Route path="cart" element={<LazyRoute><PageMotion><Cart /></PageMotion></LazyRoute>} />
          <Route path="checkout" element={<LazyRoute><PageMotion><Checkout /></PageMotion></LazyRoute>} />
          <Route path="wishlist" element={<LazyRoute><PageMotion><SavedProducts /></PageMotion></LazyRoute>} />
          <Route path="recently-viewed" element={<LazyRoute><PageMotion><SavedProducts mode="recent" /></PageMotion></LazyRoute>} />
          <Route path="compare" element={<LazyRoute><PageMotion><Compare /></PageMotion></LazyRoute>} />
          <Route path="order-lookup" element={<LazyRoute><PageMotion><OrderLookup /></PageMotion></LazyRoute>} />
          <Route path="build-pc" element={<LazyRoute><PageMotion><PcBuilder /></PageMotion></LazyRoute>} />
          <Route path="account" element={<LazyRoute label="Đang tải tài khoản..."><PageMotion><Account /></PageMotion></LazyRoute>} />
          <Route path="admin" element={<LazyRoute label="Đang tải khu vực quản trị..."><AdminDashboard /></LazyRoute>} />
          <Route path="*" element={<LazyRoute><PageMotion><NotFound /></PageMotion></LazyRoute>} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
}


function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  );
}

export default App;

