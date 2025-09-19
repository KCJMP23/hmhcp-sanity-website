-- Publication Analytics and Email Gate Schema
-- This file contains the SQL schema for publication tracking and whitepaper lead generation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create publication_analytics table to track all publication-related events
CREATE TABLE IF NOT EXISTS publication_analytics (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    publication_id VARCHAR(255) NOT NULL, -- Can be from research_publications.id or publication._key
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('page_view', 'publication_view', 'download', 'journal_click', 'pubmed_click')),
    publication_title VARCHAR(500),
    publication_type VARCHAR(50) CHECK (publication_type IN ('peer-reviewed', 'conference', 'white-paper', 'book-chapter')),
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    session_id VARCHAR(255),
    metadata JSONB DEFAULT '{}', -- Store additional event data like clicked URL, download type, etc.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_publication_analytics_publication_id ON publication_analytics(publication_id);
CREATE INDEX IF NOT EXISTS idx_publication_analytics_event_type ON publication_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_publication_analytics_publication_type ON publication_analytics(publication_type);
CREATE INDEX IF NOT EXISTS idx_publication_analytics_created_at ON publication_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_publication_analytics_session_id ON publication_analytics(session_id);

-- Composite index for common queries
CREATE INDEX IF NOT EXISTS idx_publication_analytics_pub_event_date ON publication_analytics(publication_id, event_type, created_at DESC);

-- Create whitepaper_leads table to store email gate submissions
CREATE TABLE IF NOT EXISTS whitepaper_leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    publication_id VARCHAR(255) NOT NULL,
    publication_title VARCHAR(500),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    company VARCHAR(255),
    job_title VARCHAR(255),
    phone VARCHAR(50),
    marketing_consent BOOLEAN DEFAULT false, -- GDPR/privacy compliance
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    session_id VARCHAR(255),
    download_completed BOOLEAN DEFAULT false, -- Track if download was completed after form submission
    download_completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for whitepaper_leads
CREATE INDEX IF NOT EXISTS idx_whitepaper_leads_publication_id ON whitepaper_leads(publication_id);
CREATE INDEX IF NOT EXISTS idx_whitepaper_leads_email ON whitepaper_leads(email);
CREATE INDEX IF NOT EXISTS idx_whitepaper_leads_created_at ON whitepaper_leads(created_at);
CREATE INDEX IF NOT EXISTS idx_whitepaper_leads_company ON whitepaper_leads(company);
CREATE INDEX IF NOT EXISTS idx_whitepaper_leads_download_completed ON whitepaper_leads(download_completed);

-- Create trigger to update updated_at columns automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_publication_analytics_updated_at 
    BEFORE UPDATE ON publication_analytics 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whitepaper_leads_updated_at 
    BEFORE UPDATE ON whitepaper_leads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create RLS policies for security
ALTER TABLE publication_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE whitepaper_leads ENABLE ROW LEVEL SECURITY;

-- Allow public read access to analytics for dashboard display (admin only)
CREATE POLICY "Admin can view all publication analytics" ON publication_analytics
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Allow public insert for tracking (anonymous users can track events)
CREATE POLICY "Anyone can insert analytics events" ON publication_analytics
    FOR INSERT 
    TO public 
    WITH CHECK (true);

-- Admin can view all whitepaper leads
CREATE POLICY "Admin can view all whitepaper leads" ON whitepaper_leads
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'role' = 'admin'
        )
    );

-- Allow public insert for whitepaper leads (anyone can submit email gate form)
CREATE POLICY "Anyone can submit whitepaper leads" ON whitepaper_leads
    FOR INSERT 
    TO public 
    WITH CHECK (true);

-- Allow updates to mark download completion
CREATE POLICY "Allow download completion updates" ON whitepaper_leads
    FOR UPDATE 
    TO public 
    USING (true)
    WITH CHECK (true);

-- Create view for publication analytics summary
CREATE OR REPLACE VIEW publication_analytics_summary AS
SELECT 
    publication_id,
    publication_title,
    publication_type,
    COUNT(*) FILTER (WHERE event_type = 'publication_view') as views,
    COUNT(*) FILTER (WHERE event_type = 'download') as downloads,
    COUNT(*) FILTER (WHERE event_type = 'journal_click') as journal_clicks,
    COUNT(*) FILTER (WHERE event_type = 'pubmed_click') as pubmed_clicks,
    COUNT(DISTINCT session_id) as unique_sessions,
    MIN(created_at) as first_interaction,
    MAX(created_at) as last_interaction
FROM publication_analytics 
WHERE event_type != 'page_view' -- Exclude general page views
GROUP BY publication_id, publication_title, publication_type;

-- Grant access to the view
GRANT SELECT ON publication_analytics_summary TO authenticated;

-- Create view for whitepaper conversion funnel
CREATE OR REPLACE VIEW whitepaper_conversion_funnel AS
WITH whitepaper_views AS (
    SELECT 
        publication_id,
        publication_title,
        COUNT(*) as views,
        COUNT(DISTINCT session_id) as unique_viewers
    FROM publication_analytics 
    WHERE event_type = 'publication_view' 
    AND publication_type = 'white-paper'
    GROUP BY publication_id, publication_title
),
whitepaper_submissions AS (
    SELECT 
        publication_id,
        publication_title,
        COUNT(*) as submissions,
        COUNT(*) FILTER (WHERE download_completed = true) as completed_downloads
    FROM whitepaper_leads
    GROUP BY publication_id, publication_title
)
SELECT 
    COALESCE(wv.publication_id, ws.publication_id) as publication_id,
    COALESCE(wv.publication_title, ws.publication_title) as publication_title,
    COALESCE(wv.views, 0) as views,
    COALESCE(wv.unique_viewers, 0) as unique_viewers,
    COALESCE(ws.submissions, 0) as email_submissions,
    COALESCE(ws.completed_downloads, 0) as completed_downloads,
    CASE 
        WHEN wv.views > 0 THEN ROUND((ws.submissions::decimal / wv.views::decimal) * 100, 2)
        ELSE 0 
    END as conversion_rate_percent,
    CASE 
        WHEN ws.submissions > 0 THEN ROUND((ws.completed_downloads::decimal / ws.submissions::decimal) * 100, 2)
        ELSE 0 
    END as completion_rate_percent
FROM whitepaper_views wv
FULL OUTER JOIN whitepaper_submissions ws ON wv.publication_id = ws.publication_id;

-- Grant access to the view
GRANT SELECT ON whitepaper_conversion_funnel TO authenticated;

-- Add helpful comments
COMMENT ON TABLE publication_analytics IS 'Tracks all user interactions with publications including views, downloads, and external link clicks';
COMMENT ON TABLE whitepaper_leads IS 'Stores email gate submissions for whitepaper downloads with lead information';
COMMENT ON VIEW publication_analytics_summary IS 'Aggregated analytics data per publication for dashboard display';
COMMENT ON VIEW whitepaper_conversion_funnel IS 'Conversion funnel analytics specifically for whitepapers showing view-to-lead conversion rates';