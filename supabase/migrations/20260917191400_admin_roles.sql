-- Thêm cột role vào bảng customer_profiles
ALTER TABLE customer_profiles
ADD COLUMN IF NOT EXISTS role varchar(20) DEFAULT 'user';

-- Đặt chỉ mục (index) để tìm kiếm quyền nhanh hơn
CREATE INDEX IF NOT EXISTS customer_profiles_role_idx ON customer_profiles(role);
