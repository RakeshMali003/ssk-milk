-- SQL script to create or update tables for the new requirements

-- 1. Create a view or table for user sessions to track visit counts and last visit
-- Since we want a unique row per user with their total visits, we can create a tracking table
CREATE TABLE IF NOT EXISTS public.user_activity (
    mobile_no VARCHAR(20) PRIMARY KEY,
    customer_name VARCHAR(255),
    last_device_details TEXT,
    last_login_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    visit_count INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- We keep the existing user_login_logs as a historical log if needed, or just use user_activity.
-- The user requested 'User Login Logs' showing Total Visit Count and Last Visit.
