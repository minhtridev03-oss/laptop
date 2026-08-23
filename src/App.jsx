import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route
            index
            element={
              <LazyRoute>
                <Home />
              </LazyRoute>
            }
          />
          <Route
            path="category/:categoryId"
            element={
              <LazyRoute>
                <ProductList />
              </LazyRoute>
            }
          />
          <Route
            path="products"
            element={
              <LazyRoute>
                <ProductList />
              </LazyRoute>
            }
          />
          <Route
            path="product/:id"
            element={
              <LazyRoute>
                <ProductDetail />
              </LazyRoute>
            }
          />
          <Route
            path="cart"
            element={
              <LazyRoute>
                <Cart />
              </LazyRoute>
            }
          />
          <Route
            path="checkout"
            element={
              <LazyRoute>
                <Checkout />
              </LazyRoute>
            }
          />
          <Route
            path="wishlist"
            element={
              <LazyRoute>
                <SavedProducts />
              </LazyRoute>
            }
          />
          <Route
            path="recently-viewed"
            element={
              <LazyRoute>
                <SavedProducts mode="recent" />
              </LazyRoute>
            }
          />
          <Route
            path="compare"
            element={
              <LazyRoute>
                <Compare />
              </LazyRoute>
            }
          />
          <Route
            path="order-lookup"
            element={
              <LazyRoute>
                <OrderLookup />
              </LazyRoute>
            }
          />
          <Route
            path="build-pc"
            element={
              <LazyRoute>
                <PcBuilder />
              </LazyRoute>
            }
          />
          <Route
            path="account"
            element={
              <LazyRoute label="Đang tải tài khoản...">
                <Account />
              </LazyRoute>
            }
          />
          <Route
            path="admin"
            element={
              <LazyRoute label="Đang tải khu vực quản trị...">
                <AdminDashboard />
              </LazyRoute>
            }
          />
          <Route
            path="*"
            element={
              <LazyRoute>
                <NotFound />
              </LazyRoute>
            }
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
