import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-bg-main">
      <Header />
      <main className="flex-1 bg-bg-main">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
