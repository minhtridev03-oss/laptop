export default function Footer() {
  return (
    <footer className="bg-bg-card text-text-muted pt-10 pb-6 border-t border-border-subtle mt-10">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-text-main text-lg font-bold mb-4">VỀ LAPTOP WORLD</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-primary transition-colors">Giới thiệu công ty</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Tuyển dụng</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Gửi góp ý, khiếu nại</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Tìm siêu thị (100 shop)</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-text-main text-lg font-bold mb-4">CHÍNH SÁCH</h3>
          <ul className="space-y-2 text-sm">
            <li><a href="#" className="hover:text-primary transition-colors">Chính sách bảo hành</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Chính sách đổi trả</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Chính sách bảo mật</a></li>
            <li><a href="#" className="hover:text-primary transition-colors">Hướng dẫn mua trả góp</a></li>
          </ul>
        </div>
        <div>
          <h3 className="text-text-main text-lg font-bold mb-4">TỔNG ĐÀI HỖ TRỢ</h3>
          <ul className="space-y-2 text-sm">
            <li>Gọi mua: <strong className="text-text-main font-bold">1800.1060</strong> (7:30 - 22:00)</li>
            <li>Kỹ thuật: <strong className="text-text-main font-bold">1800.1763</strong> (7:30 - 22:00)</li>
            <li>Khiếu nại: <strong className="text-text-main font-bold">1800.1062</strong> (8:00 - 21:30)</li>
            <li>Bảo hành: <strong className="text-text-main font-bold">1800.1064</strong> (8:00 - 21:00)</li>
          </ul>
        </div>
        <div>
          <h3 className="text-text-main text-lg font-bold mb-4">THANH TOÁN MIỄN PHÍ</h3>
          <div className="flex space-x-2 mb-4">
            <div className="bg-bg-main p-1.5 rounded-sm border border-border-subtle"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" className="h-6" /></div>
            <div className="bg-bg-main p-1.5 rounded-sm border border-border-subtle"><img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" alt="Mastercard" className="h-6" /></div>
          </div>
        </div>
      </div>
      <div className="border-t border-border-subtle mt-8 pt-6 text-center text-xs">
        © 2026 Laptop World. Mọi bản quyền thuộc về Laptop World.
      </div>
    </footer>
  );
}
