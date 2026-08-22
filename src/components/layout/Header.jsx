import { Link } from 'react-router-dom';
import { Search, ShoppingCart, User, Menu, Cpu } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-bg-main text-text-main sticky top-0 z-50 border-b border-border-subtle">
      {/* Top bar */}
      <div className="bg-bg-card border-b border-border-subtle">
        <div className="container mx-auto px-4 py-1.5 flex justify-between items-center text-[12px] text-text-muted font-medium tracking-wide">
          <div className="flex space-x-6">
            <span className="hidden md:flex items-center gap-2 hover:text-text-main transition-colors cursor-pointer">Hotline: <strong className="text-text-main font-bold">0961.56.0888</strong></span>
            <span className="hidden md:flex items-center gap-2 hover:text-text-main transition-colors cursor-pointer">Địa chỉ: 10 Ngõ 117 Thái Hà, Hà Nội</span>
          </div>
          <div className="flex space-x-6">
            <Link to="/tin-tuc" className="hover:text-text-main transition-colors">Tin tức công nghệ</Link>
            <Link to="/huong-dan" className="hover:text-text-main transition-colors">Hướng dẫn mua hàng</Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-6">
        {/* Logo */}
        <Link to="/" className="text-2xl font-black tracking-tighter flex items-center gap-1 group">
          <span className="text-text-main group-hover:text-primary transition-colors">LAPTOP</span>
          <span className="bg-primary text-bg-main px-2 py-0.5 rounded shadow-sm">WORLD</span>
        </Link>

        {/* Search Bar */}
        <div className="flex-1 max-w-2xl hidden md:block">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Nhập tên sản phẩm, từ khóa cần tìm..." 
              className="w-full pl-5 pr-12 py-2.5 rounded bg-bg-card text-text-main text-sm border border-border-subtle focus:outline-none focus:border-primary transition-colors placeholder-text-muted font-medium"
            />
            <button className="absolute right-1 top-1 bottom-1 w-10 flex items-center justify-center bg-transparent rounded text-text-muted hover:text-primary transition-colors">
              <Search size={18} strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-6">
          <Link to="/build-pc" className="hidden lg:flex flex-col items-center cursor-pointer text-text-muted hover:text-primary transition-colors group">
            <div className="p-1.5 rounded group-hover:bg-bg-card transition-colors">
              <Cpu size={22} strokeWidth={2} />
            </div>
            <span className="text-[11px] font-medium mt-0.5 uppercase tracking-wider">Xây cấu hình</span>
          </Link>
          <div className="hidden lg:flex flex-col items-center cursor-pointer text-text-muted hover:text-primary transition-colors group">
            <div className="p-1.5 rounded group-hover:bg-bg-card transition-colors">
              <User size={22} strokeWidth={2} />
            </div>
            <span className="text-[11px] font-medium mt-0.5 uppercase tracking-wider">Tài khoản</span>
          </div>
          <Link to="/cart" className="flex flex-col items-center cursor-pointer text-text-muted hover:text-primary transition-colors group">
            <div className="relative p-1.5 rounded group-hover:bg-bg-card transition-colors">
              <ShoppingCart size={22} strokeWidth={2} />
              <span className="absolute top-0.5 right-0 bg-primary text-bg-main text-[10px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                0
              </span>
            </div>
            <span className="text-[11px] font-medium mt-0.5 uppercase tracking-wider">Giỏ hàng</span>
          </Link>
          <button className="md:hidden p-2 text-text-muted hover:text-primary hover:bg-bg-card rounded transition-colors">
            <Menu size={26} />
          </button>
        </div>
      </div>
      
      {/* Search for mobile */}
      <div className="px-4 pb-4 md:hidden">
        <div className="relative">
          <input 
            type="text" 
            placeholder="Tìm kiếm sản phẩm..." 
            className="w-full pl-5 pr-12 py-2.5 rounded-full bg-white text-gray-800 text-sm border-2 border-transparent focus:outline-none focus:border-primary/40 focus:ring-4 focus:ring-primary/10 transition-all shadow-sm"
          />
          <button className="absolute right-1 top-1 bottom-1 w-9 flex items-center justify-center bg-gray-100 rounded-full text-gray-500">
            <Search size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </header>
  );
}
