-- Database Optimization Script for Dear Adeline Production Scaling
-- This script creates critical indexes for 100K+ user performance

-- ==========================================
-- USER MASTERY OPTIMIZATION (Critical for ZPD Engine)
-- ==========================================

-- Primary lookup index for user concept mastery
-- This is the most frequently queried table in the ZPD engine
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_mastery_user_concept 
ON user_concept_mastery (user_id, concept_id);

-- Index for mastery-based queries (finding mastered concepts)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_mastery_mastery_level 
ON user_concept_mastery (mastery_level) 
WHERE mastery_level >= 0.7;

-- Index for last practiced queries (spaced repetition)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_mastery_last_practiced 
ON user_concept_mastery (last_practiced DESC) 
WHERE last_practiced IS NOT NULL;

-- Composite index for ZPD calculations (prerequisites + mastery)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_mastery_zpd_calculation 
ON user_concept_mastery (user_id, mastery_level, last_practiced);

-- ==========================================
-- CONCEPT RELATIONSHIPS OPTIMIZATION
-- ==========================================

-- Index for prerequisite lookups (critical for ZPD readiness calculations)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_concept_prereqs_prerequisite_id 
ON concept_prerequisites (prerequisite_id);

-- Index for concept dependents (used in priority scoring)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_concept_prereqs_concept_id 
ON concept_prerequisites (concept_id);

-- Composite index for concept filtering by subject and grade
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_concepts_subject_grade 
ON concepts (subject_area, grade_band) 
WHERE grade_band IS NOT NULL;

-- ==========================================
-- SPACED REPETITION OPTIMIZATION
-- ==========================================

-- Index for due reviews (critical for daily review scheduling)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_concept_reviews_due_next_review 
ON concept_reviews (next_review_at, user_id) 
WHERE next_review_at <= NOW();

-- Index for review scheduling by user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_concept_reviews_user_due 
ON concept_reviews (user_id, next_review_at);

-- Index for review history analytics
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_concept_reviews_created_at 
ON concept_reviews (created_at DESC);

-- ==========================================
-- TRANSCRIPT ENTRIES OPTIMIZATION
-- ==========================================

-- Index for approved transcript lookups (used in Knowledge Herbarium)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transcript_entries_user_approved 
ON transcript_entries (user_id, approved_by_id) 
WHERE approved_by_id IS NOT NULL;

-- Index for subject-based transcript queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transcript_entries_subject_date 
ON transcript_entries (mapped_subject, date_completed DESC);

-- Index for credit calculations
CREATE INDEX CONCURRENTITY IF NOT EXISTS idx_transcript_entries_credits 
ON transcript_entries (credits_earned) 
WHERE credits_earned > 0;

-- ==========================================
-- HIPPOCAMPUS (RAG) OPTIMIZATION
-- ==========================================

-- Index for document type filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hippocampus_docs_source_type 
ON hippocampus_documents (source_type);

-- Index for subject-based document retrieval
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hippocampus_docs_subject 
ON hippocampus_documents (subject_area) 
WHERE subject_area IS NOT NULL;

-- Composite index for search optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_hippocampus_docs_search 
ON hippocampus_documents (source_type, subject_area, created_at DESC);

-- ==========================================
-- USER ACTIVITY & SESSIONS OPTIMIZATION
-- ==========================================

-- Index for user activity tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_activities_user_timestamp 
ON user_activities (user_id, created_at DESC);

-- Index for session management
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_sessions_user_expires 
ON user_sessions (user_id, expires_at) 
WHERE expires_at > NOW();

-- ==========================================
-- ANALYTICS & REPORTING OPTIMIZATION
-- ==========================================

-- Index for learning analytics time series
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_learning_analytics_user_metric_date 
ON learning_analytics (user_id, metric_type, recorded_at DESC);

-- Index for reflection entries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_reflection_entries_user_date 
ON reflection_entries (user_id, created_at DESC);

-- ==========================================
-- PERFORMANCE MONITORING INDEXES
-- ==========================================

-- Index for job queue processing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_jobs_status_created 
ON jobs (status, created_at) 
WHERE status IN ('PENDING', 'PROCESSING');

-- Index for error tracking
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_error_logs_timestamp 
ON error_logs (timestamp DESC) 
WHERE timestamp >= NOW() - INTERVAL '7 days';

-- ==========================================
-- PARTITIONING PREPARATION (for future scaling)
-- ==========================================

-- These comments prepare for horizontal partitioning when needed
-- For user_concept_mastery: Partition by user_id hash
-- For concept_reviews: Partition by next_review_at ranges
-- For transcript_entries: Partition by date_completed ranges

-- ==========================================
-- VACUUM AND ANALYSIS
-- ==========================================

-- Update table statistics for query planner
ANALYZE user_concept_mastery;
ANALYZE concept_prerequisites;
ANALYZE concepts;
ANALYZE concept_reviews;
ANALYZE transcript_entries;
ANALYZE hippocampus_documents;
ANALYZE user_activities;
ANALYZE user_sessions;
ANALYZE learning_analytics;
ANALYZE reflection_entries;
ANALYZE jobs;
ANALYZE error_logs;

-- ==========================================
-- PERFORMANCE VERIFICATION
-- ==========================================

-- Query to verify index usage (run after deployment)
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
    AND tablename IN (
        'user_concept_mastery', 'concept_prerequisites', 'concepts',
        'concept_reviews', 'transcript_entries', 'hippocampus_documents'
    )
ORDER BY idx_scan DESC;
*/
