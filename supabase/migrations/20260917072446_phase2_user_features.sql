-- Migration: Phase 2 User Features (Loyalty & Warranties)

-- 1. Thêm cột Loyalty vào customer_profiles
ALTER TABLE customer_profiles 
ADD COLUMN IF NOT EXISTS total_spent numeric(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS loyalty_points integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS membership_tier varchar(50) DEFAULT 'Thành viên';

-- 2. Bảng Sổ Bảo Hành (Warranties)
CREATE TABLE IF NOT EXISTS warranties (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    order_item_id bigint REFERENCES order_items(id) ON DELETE CASCADE,
    product_id text REFERENCES products(id) ON DELETE CASCADE,
    serial_number varchar(100),
    start_date timestamptz DEFAULT now(),
    end_date timestamptz NOT NULL,
    status varchar(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'voided')),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 3. Bảng Phiếu Yêu Cầu Bảo Hành (Warranty Claims)
CREATE TABLE IF NOT EXISTS warranty_claims (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    warranty_id uuid REFERENCES warranties(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    issue_description text NOT NULL,
    images jsonb DEFAULT '[]'::jsonb,
    status varchar(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    staff_note text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. RLS Policies
ALTER TABLE warranties ENABLE ROW LEVEL SECURITY;
ALTER TABLE warranty_claims ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own warranties" 
ON warranties FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own claims" 
ON warranty_claims FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own claims" 
ON warranty_claims FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- 5. Trigger cập nhật Loyalty khi Order hoàn thành
CREATE OR REPLACE FUNCTION update_loyalty_on_order_complete() 
RETURNS trigger AS $$
BEGIN
    -- Nếu trạng thái đơn hàng chuyển thành 'completed'
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- Cập nhật profile
        UPDATE customer_profiles
        SET 
            total_spent = total_spent + NEW.total,
            loyalty_points = loyalty_points + FLOOR(NEW.total / 100000), -- 100k = 1 điểm
            membership_tier = CASE
                WHEN total_spent + NEW.total >= 50000000 THEN 'Bạch Kim'
                WHEN total_spent + NEW.total >= 20000000 THEN 'Vàng'
                WHEN total_spent + NEW.total >= 5000000 THEN 'Bạc'
                ELSE 'Thành viên'
            END
        WHERE user_id = NEW.user_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_order_completed_loyalty
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_loyalty_on_order_complete();
