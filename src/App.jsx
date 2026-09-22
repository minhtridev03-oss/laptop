import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import ProductList from './pages/ProductList';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Compare from './pages/Compare';
import SavedProducts from './pages/SavedProducts';
import OrderLookup from './pages/OrderLookup';
import PcBuilder from './pages/PcBuilder';
import NotFound from './pages/NotFound';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="category/:categoryId" element={<ProductList />} />
          <Route path="products" element={<ProductList />} />
          <Route path="product/:id" element={<ProductDetail />} />
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="wishlist" element={<SavedProducts />} />
          <Route path="recently-viewed" element={<SavedProducts mode="recent" />} />
          <Route path="compare" element={<Compare />} />
          <Route path="order-lookup" element={<OrderLookup />} />
          <Route path="build-pc" element={<PcBuilder />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
