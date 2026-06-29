-- Full setup script for Supabase (Run this in the SQL Editor)

-- 1. Create user_login_logs table (Historical)
CREATE TABLE IF NOT EXISTS public.user_login_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mobile_no VARCHAR(20) NOT NULL,
    device_details TEXT,
    login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create customer_reviews table
CREATE TABLE IF NOT EXISTS public.customer_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(50) NOT NULL,
    customer_name VARCHAR(255),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create user_activity table (Aggregated Sessions)
CREATE TABLE IF NOT EXISTS public.user_activity (
    mobile_no VARCHAR(20) PRIMARY KEY,
    customer_name VARCHAR(255),
    last_device_details TEXT,
    last_login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    visit_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create an RPC function to safely upsert user_activity
CREATE OR REPLACE FUNCTION upsert_user_activity(
    p_mobile_no VARCHAR(20),
    p_customer_name VARCHAR(255),
    p_device_details TEXT
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO public.user_activity (mobile_no, customer_name, last_device_details, last_login_time, visit_count)
    VALUES (p_mobile_no, p_customer_name, p_device_details, NOW(), 1)
    ON CONFLICT (mobile_no) DO UPDATE SET
        customer_name = EXCLUDED.customer_name,
        last_device_details = EXCLUDED.last_device_details,
        last_login_time = NOW(),
        visit_count = public.user_activity.visit_count + 1;
END;
$$;

-- 5. Disable Row Level Security (RLS) to ensure the React app can read/write without complex auth
ALTER TABLE public.user_login_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity DISABLE ROW LEVEL SECURITY;
