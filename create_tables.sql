-- SQL script to create User Login Logs and Customer Reviews tables

-- 1. Create user_login_logs table
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
