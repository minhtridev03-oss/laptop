export const categories = [
  { id: 'laptop-van-phong', name: 'Laptop văn phòng', icon: 'Laptop' },
  { id: 'laptop-gaming', name: 'Laptop Games & Đồ họa', icon: 'Gamepad2' },
  { id: 'may-game', name: 'Máy Game chuyên nghiệp', icon: 'Monitor' },
  { id: 'may-tinh-bang', name: 'Máy tính bảng', icon: 'Tablet' },
  { id: 'pc', name: 'PC đồng bộ', icon: 'MonitorDot' },
  { id: 'pc-lap-rap', name: 'PC Lắp Ráp', icon: 'Cpu' },
  { id: 'workstation', name: 'PC Workstation & Server', icon: 'Server' },
  { id: 'linh-kien', name: 'Linh kiện máy tính', icon: 'CircuitBoard' },
  { id: 'phan-mem', name: 'Phần mềm bản quyền', icon: 'LayoutGrid' },
  { id: 'man-hinh', name: 'Màn hình máy tính', icon: 'MonitorSmartphone' },
  { id: 'gaming-gear', name: 'Gaming Gear', icon: 'Joystick' },
  { id: 'thiet-bi-van-phong', name: 'Thiết bị văn phòng', icon: 'Printer' },
  { id: 'luu-tru', name: 'Thiết bị lưu trữ', icon: 'HardDrive' },
  { id: 'phu-kien', name: 'Phụ kiện laptop', icon: 'Cable' },
  { id: 'thiet-bi-mang', name: 'Thiết bị mạng', icon: 'Wifi' },
];

export const products = [
  {
    id: 'asus-tuf-f15',
    name: 'Laptop Asus TUF Gaming F15 FX506HF HN014W (Core i5 11400H/ 8GB/ 512GB/ RTX 2050 4GB/ 15.6 inch FHD 144Hz)',
    price: 15990000,
    originalPrice: 18990000,
    discount: 15,
    category: 'laptop-gaming',
    image: 'https://images.unsplash.com/photo-1603302576837-37561b2e2302?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    specs: { cpu: 'Core i5 11400H', ram: '8GB', storage: '512GB SSD', gpu: 'RTX 2050 4GB' },
    isHot: true,
    images: [
      'https://images.unsplash.com/photo-1603302576837-37561b2e2302?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1593642702821-c823b2816291?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
    ],
    detailedSpecs: [
      { label: 'Hệ điều hành - Operation System', value: 'Windows 11 Home bản quyền' },
      { label: 'Bộ xử lý - CPU', value: 'Intel® Core™ i5 11400H (2.70GHz up to 4.50GHz, 12MB Cache)' },
      { label: 'Bo mạch chủ - Mainboard', value: '--' },
      { label: 'Màn hình - Monitor', value: '15.6 inch FHD (1920 x 1080) 144Hz, IPS-Level panel' },
      { label: 'Bộ nhớ trong - Ram', value: '8GB DDR4 3200MHz' },
      { label: 'Ổ đĩa cứng - SSD', value: '512GB M.2 NVMe PCIe 3.0 SSD' },
      { label: 'Card đồ hoạ - Video', value: 'NVIDIA® GeForce RTX™ 2050 4GB GDDR6' },
      { label: 'Card Âm thanh - Audio', value: '--' },
      { label: 'Đọc thẻ - Card reader', value: '--' }
    ]
  },
  {
    id: 'macbook-air-m2',
    name: 'MacBook Air M2 2022 (8GB RAM/ 256GB SSD/ 8 Core GPU/ 13.6 inch/ Midnight)',
    price: 26490000,
    originalPrice: 28990000,
    discount: 8,
    category: 'laptop-van-phong',
    image: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    specs: { cpu: 'Apple M2', ram: '8GB', storage: '256GB SSD', gpu: '8 Core GPU' },
    isHot: true
  },
  {
    id: 'lenovo-loq-15irh8',
    name: 'Laptop Lenovo LOQ 15IRH8 82XV00QPVN (Core i5 13420H/ 16GB/ 512GB/ RTX 4050 6GB/ 15.6 inch FHD 144Hz)',
    price: 22990000,
    originalPrice: 25990000,
    discount: 11,
    category: 'laptop-gaming',
    image: 'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    specs: { cpu: 'Core i5 13420H', ram: '16GB', storage: '512GB SSD', gpu: 'RTX 4050 6GB' },
    isHot: true
  },
  {
    id: 'dell-xps-13',
    name: 'Laptop Dell XPS 13 Plus 9320 (Core i7 1360P/ 16GB/ 512GB/ Intel Iris Xe/ 13.4 inch 3.5K OLED Touch)',
    price: 45990000,
    originalPrice: 49990000,
    discount: 8,
    category: 'laptop-van-phong',
    image: 'https://images.unsplash.com/photo-1593642702821-c823b2816291?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    specs: { cpu: 'Core i7 1360P', ram: '16GB', storage: '512GB SSD', gpu: 'Intel Iris Xe' },
    isHot: true
  }
];

export const banners = {
  mainBanner: {
    tag: 'Mới Ra Mắt',
    title1: 'ROG STRIX',
    title2: 'SCAR 16/18',
    description: 'Đỉnh cao hiệu năng Gaming 2026.\nSẵn sàng mọi thử thách.',
    buttonText: 'Khám Phá Ngay',
    image: 'https://images.unsplash.com/photo-1542393545-10f5cde2c810?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    link: '/category/laptop-gaming'
  },
  subBanners: [
    {
      id: 1,
      tag: 'Super Sale',
      tagColor: 'text-primary',
      title: 'Laptop Gaming',
      image: 'https://images.unsplash.com/photo-1593640408182-31c70c8268f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      link: '/category/laptop-gaming',
      hiddenOnMobile: false
    },
    {
      id: 2,
      tag: 'Mỏng Nhẹ',
      tagColor: 'text-text-muted',
      title: 'Doanh Nhân - Văn Phòng',
      image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      link: '/category/laptop-van-phong',
      hiddenOnMobile: false
    },
    {
      id: 3,
      tag: 'Tùy biến',
      tagColor: 'text-text-muted',
      title: 'PC Lắp Ráp',
      image: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80',
      link: '/category/pc-lap-rap',
      hiddenOnMobile: true
    }
  ]
};
