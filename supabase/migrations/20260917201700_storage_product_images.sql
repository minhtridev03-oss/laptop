-- Tạo bucket 'product-images' nếu chưa có
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Cho phép tất cả mọi người đọc (xem ảnh)
CREATE POLICY "Cho phép mọi người xem ảnh sản phẩm"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Chỉ cho phép admin upload ảnh
CREATE POLICY "Admin được phép tải ảnh lên"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images' AND
  public.is_staff() = true
);

-- Admin được phép sửa/xóa ảnh
CREATE POLICY "Admin được phép sửa xóa ảnh"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  public.is_staff() = true
);

CREATE POLICY "Admin được phép xóa ảnh"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images' AND
  public.is_staff() = true
);
