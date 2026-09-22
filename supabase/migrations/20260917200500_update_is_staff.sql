-- Cập nhật hàm is_staff() để nhận diện quyền admin từ bảng customer_profiles
CREATE OR REPLACE FUNCTION public.is_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.customer_profiles
    WHERE user_id = auth.uid()
      AND role = 'admin'
  ) OR EXISTS (
    SELECT 1
    FROM public.staff_members
    WHERE user_id = auth.uid()
      AND is_active = true
      AND role IN ('admin', 'staff')
  );
$$;
