import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import Header from './Header';
import Footer from './Footer';

const pageVariants = {
  initial: { opacity: 0, y: 15 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -15 },
};

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.25,
};

export default function MainLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[100] -translate-y-20 rounded-md bg-primary px-4 py-2 text-sm font-bold text-bg-main transition-transform focus:translate-y-0"
      >
        Chuyển tới nội dung chính
      </a>
      <Header />
      <main id="main-content" className="flex-1 bg-transparent overflow-x-hidden" tabIndex={-1}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <Toaster richColors position="bottom-center" />
    </div>
  );
}
