import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import CommerceToast from '../ui/CommerceToast';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-md bg-primary px-4 py-2 text-sm font-bold text-bg-main transition-transform focus:translate-y-0"
      >
        Chuyển tới nội dung chính
      </a>
      <Header />
      <main id="main-content" className="flex-1 bg-transparent" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <CommerceToast />
    </div>
  );
}
