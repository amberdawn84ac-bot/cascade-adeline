-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('STUDENT', 'PARENT', 'TEACHER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ClubRole" AS ENUM ('MEMBER', 'LEADER');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('BRAINSTORM', 'ACTIVE', 'COMPLETED', 'SHOWCASED');

-- CreateEnum
CREATE TYPE "ArtifactType" AS ENUM ('DOCUMENT', 'PRESENTATION', 'VIDEO', 'PHYSICAL_BUILD', 'CODE', 'BUSINESS_PLAN', 'ART', 'OTHER');

-- CreateEnum
CREATE TYPE "OpportunityType" AS ENUM ('CONTEST', 'GRANT', 'APPRENTICESHIP', 'SERVICE_PROJECT', 'SCHOLARSHIP', 'SPELLING_BEE', 'COMPETITION', 'EVENT');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('PRIMARY', 'CURATED', 'SECONDARY', 'MAINSTREAM');

-- CreateEnum
CREATE TYPE "LearningGapSeverity" AS ENUM ('MINOR', 'MODERATE', 'SIGNIFICANT');

-- CreateEnum
CREATE TYPE "ConversationRole" AS ENUM ('USER', 'ASSISTANT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "ReflectionType" AS ENUM ('POST_ACTIVITY', 'WEEKLY_REVIEW', 'PROJECT_MILESTONE', 'SELF_ASSESSMENT');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('FREE', 'STUDENT', 'PARENT', 'FAMILY', 'TEACHER');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'PAST_DUE', 'CANCELED', 'TRIALING');

-- CreateEnum
CREATE TYPE "ReferralStatus" AS ENUM ('PENDING', 'PAID', 'CREDITED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MasteryLevel" AS ENUM ('INTRODUCED', 'DEVELOPING', 'PROFICIENT', 'MASTERED');

-- CreateEnum
CREATE TYPE "AlignmentStrength" AS ENUM ('FULL', 'PARTIAL', 'RELATED');

-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "GroupRole" AS ENUM ('MEMBER', 'MODERATOR');

-- CreateEnum
CREATE TYPE "CompetitionType" AS ENUM ('SCIENCE_FAIR', 'RESEARCH_PAPER', 'INNOVATION', 'ENVIRONMENTAL', 'STEM_CHALLENGE', 'SCHOLARSHIP', 'HACKATHON', 'MATH', 'WRITING', 'ROBOTICS', 'OTHER');

-- CreateTable
CREATE TABLE "UserMFACredential" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "secret" TEXT NOT NULL,
    "backup_codes" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserMFACredential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserActivity" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "activity_type" TEXT NOT NULL,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollaborativeSession" (
    "id" UUID NOT NULL,
    "host_user_id" UUID NOT NULL,
    "participant_ids" JSONB NOT NULL,
    "topic" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "start_time" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "end_time" TIMESTAMP(3),
    "shared_insights" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CollaborativeSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "parentId" UUID,
    "avatarUrl" TEXT,
    "age" INTEGER,
    "grade_level" TEXT,
    "math_level" INTEGER,
    "ela_level" INTEGER,
    "science_level" INTEGER,
    "history_level" INTEGER,
    "pacing_multiplier" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "target_graduation_year" INTEGER,
    "interests" TEXT[],
    "learningStyle" TEXT NOT NULL DEFAULT 'EXPEDITION',
    "onboardingComplete" BOOLEAN NOT NULL DEFAULT false,
    "coppa_consent_at" TIMESTAMP(3),
    "coppa_consent_by" UUID,
    "data_retention_days" INTEGER DEFAULT 365,
    "referral_code" TEXT,
    "referred_by" UUID,
    "message_count" INTEGER NOT NULL DEFAULT 0,
    "message_reset_at" TIMESTAMP(3),
    "data_deletion_requested_at" TIMESTAMP(3),
    "account_locked_at" TIMESTAMP(3),
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "joined_groups" TEXT[] DEFAULT ARRAY[]::TEXT[],

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Club" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subject" TEXT,
    "age_range" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "createdById" UUID NOT NULL,
    "isActive" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Club_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClubMembership" (
    "userId" UUID NOT NULL,
    "clubId" UUID NOT NULL,
    "role" "ClubRole" NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClubMembership_pkey" PRIMARY KEY ("userId","clubId")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "clubId" UUID,
    "createdById" UUID NOT NULL,
    "status" "ProjectStatus" NOT NULL,
    "service_goal" TEXT NOT NULL,
    "intended_impact" TEXT NOT NULL,
    "actual_impact" TEXT,
    "curriculum_unit" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artifact" (
    "id" UUID NOT NULL,
    "projectId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ArtifactType" NOT NULL,
    "file_url" TEXT,
    "description" TEXT NOT NULL,
    "is_showcase" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Artifact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "type" "OpportunityType" NOT NULL,
    "description" TEXT NOT NULL,
    "url" TEXT,
    "deadline" TIMESTAMP(3),
    "age_range" TEXT,
    "matched_interests" TEXT[],
    "is_active" BOOLEAN NOT NULL,
    "createdById" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TranscriptEntry" (
    "id" UUID NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "userId" UUID,
    "activity_name" TEXT NOT NULL,
    "mapped_subject" TEXT NOT NULL,
    "credits_earned" DECIMAL(10,2) NOT NULL,
    "grade_level" TEXT,
    "evidenceArtifactId" UUID,
    "date_completed" TIMESTAMP(3) NOT NULL,
    "approvedById" UUID,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "external_proof_url" TEXT,
    "validation_type" TEXT NOT NULL DEFAULT 'internal',
    "mastery_evidence" JSONB,
    "plan_standard_id" UUID,

    CONSTRAINT "TranscriptEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concept" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subject_area" TEXT NOT NULL,
    "grade_band" TEXT,
    "embedding" vector NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConceptPrerequisite" (
    "conceptId" UUID NOT NULL,
    "prerequisiteId" UUID NOT NULL,

    CONSTRAINT "ConceptPrerequisite_pkey" PRIMARY KEY ("conceptId","prerequisiteId")
);

-- CreateTable
CREATE TABLE "ConceptActivity" (
    "id" UUID NOT NULL,
    "conceptId" UUID NOT NULL,
    "activity_description" TEXT NOT NULL,
    "credit_mapping" TEXT NOT NULL,
    "suggested_extension" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConceptActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TimelineEntry" (
    "id" UUID NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "worldview_note" TEXT NOT NULL,
    "source_type" "SourceType" NOT NULL,
    "source_citation" TEXT,
    "curriculum_unit" TEXT,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimelineEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HippocampusDocument" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "source_type" "SourceType" NOT NULL,
    "embedding" vector NOT NULL,
    "chunk_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HippocampusDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConversationMemory" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "session_id" TEXT NOT NULL,
    "role" "ConversationRole" NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "embedding" vector NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "importance" DOUBLE PRECISION NOT NULL DEFAULT 0.5,

    CONSTRAINT "ConversationMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningGap" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "conceptId" UUID NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL,
    "severity" "LearningGapSeverity" NOT NULL,
    "addressed" BOOLEAN NOT NULL DEFAULT false,
    "addressed_via" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningGap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReflectionEntry" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "type" "ReflectionType" NOT NULL,
    "activity_summary" TEXT NOT NULL,
    "prompt_used" TEXT NOT NULL,
    "student_response" TEXT,
    "ai_follow_up" TEXT,
    "concepts_tagged" TEXT[],
    "insight_score" DOUBLE PRECISION,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReflectionEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReviewSchedule" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "conceptId" UUID NOT NULL,
    "next_review_at" TIMESTAMP(3) NOT NULL,
    "interval" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "ease_factor" DOUBLE PRECISION NOT NULL DEFAULT 2.5,
    "repetitions" INTEGER NOT NULL DEFAULT 0,
    "last_quality" INTEGER,
    "last_reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserConceptMastery" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "conceptId" UUID NOT NULL,
    "mastery_level" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "last_practiced" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "history" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserConceptMastery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_interaction_stats" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "session_id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "response_time_ms" INTEGER NOT NULL,
    "edit_distance" INTEGER NOT NULL,
    "sentiment_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_interaction_stats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LLMTrace" (
    "id" UUID NOT NULL,
    "trace_id" TEXT NOT NULL,
    "agent_node" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "prompt_tokens" INTEGER NOT NULL DEFAULT 0,
    "output_tokens" INTEGER NOT NULL DEFAULT 0,
    "total_tokens" INTEGER NOT NULL DEFAULT 0,
    "latency_ms" INTEGER NOT NULL,
    "estimated_cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "userId" UUID,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LLMTrace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Highlight" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "messageId" UUID,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "impact" TEXT,
    "user_note" TEXT,
    "intent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OnboardingProgress" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "completed_steps" TEXT[],
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "stripe_customer_id" TEXT,
    "stripe_subscription_id" TEXT,
    "stripe_price_id" TEXT,
    "tier" "SubscriptionTier" NOT NULL DEFAULT 'FREE',
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "cancel_at_period_end" BOOLEAN NOT NULL DEFAULT false,
    "credits" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" UUID NOT NULL,
    "referrer_id" UUID NOT NULL,
    "referee_id" UUID NOT NULL,
    "status" "ReferralStatus" NOT NULL DEFAULT 'PENDING',
    "credit_amount" DECIMAL(10,2) NOT NULL DEFAULT 10.00,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paid_at" TIMESTAMP(3),
    "credited_at" TIMESTAMP(3),

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AIJob" (
    "id" UUID NOT NULL,
    "userId" UUID,
    "session_id" TEXT NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "intent" TEXT,
    "prompt" TEXT NOT NULL,
    "result" TEXT,
    "error" TEXT,
    "metadata" JSONB,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AIJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StateStandard" (
    "id" UUID NOT NULL,
    "standard_code" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "grade_level" TEXT NOT NULL,
    "statement_text" TEXT NOT NULL,
    "description" TEXT,
    "mastery_indicators" JSONB,
    "typical_microcredit_value" DECIMAL(10,4),

    CONSTRAINT "StateStandard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningComponent" (
    "id" UUID NOT NULL,
    "standard_id" UUID NOT NULL,
    "component_text" TEXT NOT NULL,
    "component_order" INTEGER,

    CONSTRAINT "LearningComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillStandardMapping" (
    "id" UUID NOT NULL,
    "concept_id" UUID NOT NULL,
    "standard_id" UUID NOT NULL,
    "alignment_strength" "AlignmentStrength" NOT NULL DEFAULT 'FULL',
    "notes" TEXT,

    CONSTRAINT "SkillStandardMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentStandardProgress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "standard_id" UUID NOT NULL,
    "mastery" "MasteryLevel" NOT NULL DEFAULT 'INTRODUCED',
    "source_type" TEXT,
    "source_id" TEXT,
    "evidence" JSONB,
    "demonstrated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_activity_at" TIMESTAMP(3),
    "microcredits_earned" DECIMAL(10,4) NOT NULL DEFAULT 0,

    CONSTRAINT "StudentStandardProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlacementAssessment" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "current_subject" TEXT,
    "responses" JSONB,
    "results" JSONB,
    "learning_profile" JSONB,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "PlacementAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigations" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "investigations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "investigation_sources" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "investigationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "investigation_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "share_links" (
    "id" TEXT NOT NULL,
    "investigationId" TEXT NOT NULL,
    "createdBy" UUID NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LearningPlan" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "state" TEXT NOT NULL,
    "graduation_year" INTEGER NOT NULL,
    "last_reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlanStandard" (
    "id" UUID NOT NULL,
    "plan_id" UUID NOT NULL,
    "standard_id" UUID NOT NULL,
    "microcredit_value" DECIMAL(10,4) NOT NULL,
    "custom_notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlanStandard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandardActivity" (
    "id" UUID NOT NULL,
    "plan_standard_id" UUID NOT NULL,
    "activity_type" TEXT NOT NULL,
    "activity_metadata" JSONB,
    "mastery_threshold" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandardActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScienceGroup" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "current_challenge" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "creator_id" UUID NOT NULL,
    "moderator_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScienceGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMembership" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "role" "GroupRole" NOT NULL DEFAULT 'MEMBER',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMembership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupMessage" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "ai_mediated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupProject" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GroupProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GroupLogEntry" (
    "id" UUID NOT NULL,
    "group_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "project_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GroupLogEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Competition" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT NOT NULL,
    "type" "CompetitionType" NOT NULL,
    "description" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "eligibility_rules" JSONB NOT NULL,
    "themes" TEXT[],
    "age_range" TEXT,
    "grade_range" TEXT,
    "url" TEXT,
    "year" INTEGER NOT NULL DEFAULT 2026,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_scraped_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Competition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompetitionMatch" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "competition_id" UUID NOT NULL,
    "match_score" DOUBLE PRECISION NOT NULL,
    "match_reason" TEXT NOT NULL,
    "project_context" TEXT,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompetitionMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "global_content_cache" (
    "id" UUID NOT NULL,
    "module" TEXT NOT NULL,
    "topic_key" TEXT NOT NULL,
    "grade_level" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "global_content_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "living_books" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "description" TEXT,
    "cover_url" TEXT,
    "reading_level" TEXT,
    "genre" TEXT,
    "gutenberg_id" TEXT,
    "is_downloaded" BOOLEAN NOT NULL DEFAULT false,
    "epub_file_url" TEXT,
    "source_library" TEXT,
    "pdf_url" TEXT,
    "external_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "living_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "source_gap_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "topic" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "missing_role" TEXT NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "resolved_at" TIMESTAMP(3),
    "resolution" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "source_gap_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cached_lessons" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "credit_id" TEXT NOT NULL,
    "grade_level" TEXT NOT NULL DEFAULT '',
    "subject" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "lesson_data" JSONB NOT NULL,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cached_lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_reflections" (
    "id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "prompt" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "daily_reflections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_clubs" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "book_id" TEXT NOT NULL,
    "book_title" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "book_clubs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_club_members" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_club_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "book_club_posts" (
    "id" UUID NOT NULL,
    "club_id" UUID NOT NULL,
    "user_id" UUID,
    "content" TEXT NOT NULL,
    "is_adeline" BOOLEAN NOT NULL DEFAULT false,
    "chapter" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "book_club_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "grade_level" TEXT NOT NULL,
    "lesson_json" JSONB NOT NULL,
    "content_blocks" JSONB,
    "standards_codes" TEXT[],
    "estimated_duration" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_lesson_progress" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "response" JSONB,
    "time_spent" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_lesson_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "primary_sources" (
    "id" UUID NOT NULL,
    "source_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "creator" TEXT,
    "date" TEXT,
    "source_type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "url" TEXT,
    "collection" TEXT,
    "rights" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_verified" BOOLEAN NOT NULL DEFAULT true,
    "subject_track" TEXT NOT NULL DEFAULT 'general',
    "is_ai_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "primary_sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_environments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "location" TEXT NOT NULL,
    "resources" TEXT[],
    "interests" TEXT[],
    "constraints" TEXT[],
    "preferences" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_environments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scripture_library" (
    "id" UUID NOT NULL,
    "reference" TEXT NOT NULL,
    "translation" TEXT NOT NULL DEFAULT 'ESV',
    "passage" TEXT NOT NULL,
    "hebrew_greek_notes" TEXT,
    "topics" TEXT[],
    "keywords" TEXT[],
    "ethical_themes" TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scripture_library_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_sessions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "visible_blocks" TEXT[],
    "completed_blocks" TEXT[],
    "current_branch" TEXT,
    "student_responses" JSONB NOT NULL DEFAULT '{}',
    "checkpoint_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserMFACredential_user_id_key" ON "UserMFACredential"("user_id");

-- CreateIndex
CREATE INDEX "UserMFACredential_user_id_idx" ON "UserMFACredential"("user_id");

-- CreateIndex
CREATE INDEX "UserMFACredential_enabled_idx" ON "UserMFACredential"("enabled");

-- CreateIndex
CREATE INDEX "UserActivity_userId_idx" ON "UserActivity"("userId");

-- CreateIndex
CREATE INDEX "UserActivity_created_at_idx" ON "UserActivity"("created_at");

-- CreateIndex
CREATE INDEX "UserActivity_activity_type_idx" ON "UserActivity"("activity_type");

-- CreateIndex
CREATE INDEX "CollaborativeSession_host_user_id_idx" ON "CollaborativeSession"("host_user_id");

-- CreateIndex
CREATE INDEX "CollaborativeSession_status_idx" ON "CollaborativeSession"("status");

-- CreateIndex
CREATE INDEX "CollaborativeSession_start_time_idx" ON "CollaborativeSession"("start_time");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_code_key" ON "users"("referral_code");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_parentId_idx" ON "users"("parentId");

-- CreateIndex
CREATE INDEX "users_data_deletion_requested_at_idx" ON "users"("data_deletion_requested_at");

-- CreateIndex
CREATE INDEX "ClubMembership_userId_idx" ON "ClubMembership"("userId");

-- CreateIndex
CREATE INDEX "ClubMembership_clubId_idx" ON "ClubMembership"("clubId");

-- CreateIndex
CREATE INDEX "Project_createdById_idx" ON "Project"("createdById");

-- CreateIndex
CREATE INDEX "Artifact_createdById_idx" ON "Artifact"("createdById");

-- CreateIndex
CREATE INDEX "Opportunity_createdById_idx" ON "Opportunity"("createdById");

-- CreateIndex
CREATE INDEX "TranscriptEntry_userId_idx" ON "TranscriptEntry"("userId");

-- CreateIndex
CREATE INDEX "TranscriptEntry_mapped_subject_idx" ON "TranscriptEntry"("mapped_subject");

-- CreateIndex
CREATE INDEX "TranscriptEntry_plan_standard_id_idx" ON "TranscriptEntry"("plan_standard_id");

-- CreateIndex
CREATE INDEX "TranscriptEntry_date_completed_idx" ON "TranscriptEntry"("date_completed");

-- CreateIndex
CREATE INDEX "TranscriptEntry_userId_date_completed_idx" ON "TranscriptEntry"("userId", "date_completed");

-- CreateIndex
CREATE INDEX "ConceptPrerequisite_conceptId_idx" ON "ConceptPrerequisite"("conceptId");

-- CreateIndex
CREATE INDEX "ConceptActivity_conceptId_idx" ON "ConceptActivity"("conceptId");

-- CreateIndex
CREATE INDEX "HippocampusDocument_source_type_idx" ON "HippocampusDocument"("source_type");

-- CreateIndex
CREATE INDEX "ConversationMemory_userId_session_id_idx" ON "ConversationMemory"("userId", "session_id");

-- CreateIndex
CREATE INDEX "ConversationMemory_created_at_idx" ON "ConversationMemory"("created_at");

-- CreateIndex
CREATE INDEX "ConversationMemory_userId_importance_idx" ON "ConversationMemory"("userId", "importance");

-- CreateIndex
CREATE INDEX "ReflectionEntry_userId_idx" ON "ReflectionEntry"("userId");

-- CreateIndex
CREATE INDEX "ReflectionEntry_type_idx" ON "ReflectionEntry"("type");

-- CreateIndex
CREATE INDEX "ReviewSchedule_userId_next_review_at_idx" ON "ReviewSchedule"("userId", "next_review_at");

-- CreateIndex
CREATE UNIQUE INDEX "ReviewSchedule_userId_conceptId_key" ON "ReviewSchedule"("userId", "conceptId");

-- CreateIndex
CREATE INDEX "UserConceptMastery_userId_idx" ON "UserConceptMastery"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserConceptMastery_userId_conceptId_key" ON "UserConceptMastery"("userId", "conceptId");

-- CreateIndex
CREATE INDEX "user_interaction_stats_user_id_idx" ON "user_interaction_stats"("user_id");

-- CreateIndex
CREATE INDEX "user_interaction_stats_user_id_created_at_idx" ON "user_interaction_stats"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "LLMTrace_trace_id_idx" ON "LLMTrace"("trace_id");

-- CreateIndex
CREATE INDEX "LLMTrace_agent_node_idx" ON "LLMTrace"("agent_node");

-- CreateIndex
CREATE INDEX "LLMTrace_created_at_idx" ON "LLMTrace"("created_at");

-- CreateIndex
CREATE INDEX "LLMTrace_userId_idx" ON "LLMTrace"("userId");

-- CreateIndex
CREATE INDEX "Highlight_userId_created_at_idx" ON "Highlight"("userId", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "OnboardingProgress_userId_key" ON "OnboardingProgress"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripe_customer_id_key" ON "Subscription"("stripe_customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripe_subscription_id_key" ON "Subscription"("stripe_subscription_id");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_stripe_customer_id_idx" ON "Subscription"("stripe_customer_id");

-- CreateIndex
CREATE INDEX "Referral_referrer_id_idx" ON "Referral"("referrer_id");

-- CreateIndex
CREATE INDEX "Referral_referee_id_idx" ON "Referral"("referee_id");

-- CreateIndex
CREATE INDEX "AIJob_userId_status_idx" ON "AIJob"("userId", "status");

-- CreateIndex
CREATE INDEX "AIJob_session_id_idx" ON "AIJob"("session_id");

-- CreateIndex
CREATE INDEX "AIJob_status_idx" ON "AIJob"("status");

-- CreateIndex
CREATE INDEX "StateStandard_jurisdiction_subject_idx" ON "StateStandard"("jurisdiction", "subject");

-- CreateIndex
CREATE INDEX "StateStandard_jurisdiction_grade_level_idx" ON "StateStandard"("jurisdiction", "grade_level");

-- CreateIndex
CREATE UNIQUE INDEX "StateStandard_standard_code_jurisdiction_key" ON "StateStandard"("standard_code", "jurisdiction");

-- CreateIndex
CREATE INDEX "LearningComponent_standard_id_idx" ON "LearningComponent"("standard_id");

-- CreateIndex
CREATE INDEX "SkillStandardMapping_concept_id_idx" ON "SkillStandardMapping"("concept_id");

-- CreateIndex
CREATE INDEX "SkillStandardMapping_standard_id_idx" ON "SkillStandardMapping"("standard_id");

-- CreateIndex
CREATE UNIQUE INDEX "SkillStandardMapping_concept_id_standard_id_key" ON "SkillStandardMapping"("concept_id", "standard_id");

-- CreateIndex
CREATE INDEX "StudentStandardProgress_user_id_idx" ON "StudentStandardProgress"("user_id");

-- CreateIndex
CREATE INDEX "StudentStandardProgress_standard_id_idx" ON "StudentStandardProgress"("standard_id");

-- CreateIndex
CREATE INDEX "StudentStandardProgress_user_id_mastery_idx" ON "StudentStandardProgress"("user_id", "mastery");

-- CreateIndex
CREATE UNIQUE INDEX "StudentStandardProgress_user_id_standard_id_key" ON "StudentStandardProgress"("user_id", "standard_id");

-- CreateIndex
CREATE INDEX "PlacementAssessment_user_id_status_idx" ON "PlacementAssessment"("user_id", "status");

-- CreateIndex
CREATE INDEX "PlacementAssessment_user_id_idx" ON "PlacementAssessment"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "LearningPlan_user_id_key" ON "LearningPlan"("user_id");

-- CreateIndex
CREATE INDEX "LearningPlan_user_id_idx" ON "LearningPlan"("user_id");

-- CreateIndex
CREATE INDEX "LearningPlan_state_idx" ON "LearningPlan"("state");

-- CreateIndex
CREATE INDEX "PlanStandard_plan_id_idx" ON "PlanStandard"("plan_id");

-- CreateIndex
CREATE INDEX "PlanStandard_standard_id_idx" ON "PlanStandard"("standard_id");

-- CreateIndex
CREATE INDEX "PlanStandard_is_active_idx" ON "PlanStandard"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "PlanStandard_plan_id_standard_id_key" ON "PlanStandard"("plan_id", "standard_id");

-- CreateIndex
CREATE INDEX "StandardActivity_plan_standard_id_idx" ON "StandardActivity"("plan_standard_id");

-- CreateIndex
CREATE INDEX "StandardActivity_activity_type_idx" ON "StandardActivity"("activity_type");

-- CreateIndex
CREATE INDEX "ScienceGroup_creator_id_idx" ON "ScienceGroup"("creator_id");

-- CreateIndex
CREATE INDEX "ScienceGroup_is_public_idx" ON "ScienceGroup"("is_public");

-- CreateIndex
CREATE INDEX "GroupMembership_user_id_idx" ON "GroupMembership"("user_id");

-- CreateIndex
CREATE INDEX "GroupMembership_group_id_idx" ON "GroupMembership"("group_id");

-- CreateIndex
CREATE UNIQUE INDEX "GroupMembership_user_id_group_id_key" ON "GroupMembership"("user_id", "group_id");

-- CreateIndex
CREATE INDEX "GroupMessage_group_id_idx" ON "GroupMessage"("group_id");

-- CreateIndex
CREATE INDEX "GroupMessage_author_id_idx" ON "GroupMessage"("author_id");

-- CreateIndex
CREATE INDEX "GroupMessage_created_at_idx" ON "GroupMessage"("created_at");

-- CreateIndex
CREATE INDEX "GroupProject_group_id_idx" ON "GroupProject"("group_id");

-- CreateIndex
CREATE INDEX "GroupLogEntry_group_id_idx" ON "GroupLogEntry"("group_id");

-- CreateIndex
CREATE INDEX "GroupLogEntry_user_id_idx" ON "GroupLogEntry"("user_id");

-- CreateIndex
CREATE INDEX "Competition_type_idx" ON "Competition"("type");

-- CreateIndex
CREATE INDEX "Competition_deadline_idx" ON "Competition"("deadline");

-- CreateIndex
CREATE INDEX "Competition_is_active_idx" ON "Competition"("is_active");

-- CreateIndex
CREATE INDEX "Competition_last_scraped_at_idx" ON "Competition"("last_scraped_at");

-- CreateIndex
CREATE INDEX "CompetitionMatch_user_id_idx" ON "CompetitionMatch"("user_id");

-- CreateIndex
CREATE INDEX "CompetitionMatch_competition_id_idx" ON "CompetitionMatch"("competition_id");

-- CreateIndex
CREATE INDEX "CompetitionMatch_dismissed_idx" ON "CompetitionMatch"("dismissed");

-- CreateIndex
CREATE INDEX "global_content_cache_module_topic_key_grade_level_idx" ON "global_content_cache"("module", "topic_key", "grade_level");

-- CreateIndex
CREATE UNIQUE INDEX "global_content_cache_module_topic_key_grade_level_key" ON "global_content_cache"("module", "topic_key", "grade_level");

-- CreateIndex
CREATE INDEX "living_books_userId_idx" ON "living_books"("userId");

-- CreateIndex
CREATE INDEX "living_books_gutenberg_id_idx" ON "living_books"("gutenberg_id");

-- CreateIndex
CREATE INDEX "living_books_is_downloaded_idx" ON "living_books"("is_downloaded");

-- CreateIndex
CREATE INDEX "source_gap_requests_user_id_idx" ON "source_gap_requests"("user_id");

-- CreateIndex
CREATE INDEX "source_gap_requests_resolved_idx" ON "source_gap_requests"("resolved");

-- CreateIndex
CREATE INDEX "cached_lessons_user_id_idx" ON "cached_lessons"("user_id");

-- CreateIndex
CREATE INDEX "cached_lessons_expires_at_idx" ON "cached_lessons"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "cached_lessons_user_id_credit_id_grade_level_key" ON "cached_lessons"("user_id", "credit_id", "grade_level");

-- CreateIndex
CREATE INDEX "daily_reflections_student_id_idx" ON "daily_reflections"("student_id");

-- CreateIndex
CREATE INDEX "daily_reflections_date_idx" ON "daily_reflections"("date");

-- CreateIndex
CREATE UNIQUE INDEX "daily_reflections_student_id_date_key" ON "daily_reflections"("student_id", "date");

-- CreateIndex
CREATE INDEX "book_clubs_active_idx" ON "book_clubs"("active");

-- CreateIndex
CREATE INDEX "book_club_members_user_id_idx" ON "book_club_members"("user_id");

-- CreateIndex
CREATE INDEX "book_club_members_club_id_idx" ON "book_club_members"("club_id");

-- CreateIndex
CREATE UNIQUE INDEX "book_club_members_club_id_user_id_key" ON "book_club_members"("club_id", "user_id");

-- CreateIndex
CREATE INDEX "book_club_posts_club_id_idx" ON "book_club_posts"("club_id");

-- CreateIndex
CREATE INDEX "book_club_posts_created_at_idx" ON "book_club_posts"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "lessons_lesson_id_key" ON "lessons"("lesson_id");

-- CreateIndex
CREATE INDEX "lessons_subject_idx" ON "lessons"("subject");

-- CreateIndex
CREATE INDEX "lessons_grade_level_idx" ON "lessons"("grade_level");

-- CreateIndex
CREATE INDEX "lessons_is_active_idx" ON "lessons"("is_active");

-- CreateIndex
CREATE INDEX "student_lesson_progress_user_id_idx" ON "student_lesson_progress"("user_id");

-- CreateIndex
CREATE INDEX "student_lesson_progress_lesson_id_idx" ON "student_lesson_progress"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_lesson_progress_user_id_lesson_id_block_id_key" ON "student_lesson_progress"("user_id", "lesson_id", "block_id");

-- CreateIndex
CREATE UNIQUE INDEX "primary_sources_source_id_key" ON "primary_sources"("source_id");

-- CreateIndex
CREATE INDEX "primary_sources_source_type_idx" ON "primary_sources"("source_type");

-- CreateIndex
CREATE INDEX "primary_sources_is_active_idx" ON "primary_sources"("is_active");

-- CreateIndex
CREATE INDEX "primary_sources_subject_track_idx" ON "primary_sources"("subject_track");

-- CreateIndex
CREATE INDEX "primary_sources_is_ai_generated_idx" ON "primary_sources"("is_ai_generated");

-- CreateIndex
CREATE UNIQUE INDEX "student_environments_user_id_key" ON "student_environments"("user_id");

-- CreateIndex
CREATE INDEX "scripture_library_reference_idx" ON "scripture_library"("reference");

-- CreateIndex
CREATE INDEX "scripture_library_topics_idx" ON "scripture_library"("topics");

-- CreateIndex
CREATE INDEX "scripture_library_is_active_idx" ON "scripture_library"("is_active");

-- CreateIndex
CREATE INDEX "lesson_sessions_user_id_idx" ON "lesson_sessions"("user_id");

-- CreateIndex
CREATE INDEX "lesson_sessions_lesson_id_idx" ON "lesson_sessions"("lesson_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_sessions_user_id_lesson_id_is_active_key" ON "lesson_sessions"("user_id", "lesson_id", "is_active");

-- AddForeignKey
ALTER TABLE "UserMFACredential" ADD CONSTRAINT "UserMFACredential_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserActivity" ADD CONSTRAINT "UserActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CollaborativeSession" ADD CONSTRAINT "CollaborativeSession_host_user_id_fkey" FOREIGN KEY ("host_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Club" ADD CONSTRAINT "Club_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMembership" ADD CONSTRAINT "ClubMembership_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClubMembership" ADD CONSTRAINT "ClubMembership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_clubId_fkey" FOREIGN KEY ("clubId") REFERENCES "Club"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Artifact" ADD CONSTRAINT "Artifact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptEntry" ADD CONSTRAINT "TranscriptEntry_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptEntry" ADD CONSTRAINT "TranscriptEntry_evidenceArtifactId_fkey" FOREIGN KEY ("evidenceArtifactId") REFERENCES "Artifact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptEntry" ADD CONSTRAINT "TranscriptEntry_plan_standard_id_fkey" FOREIGN KEY ("plan_standard_id") REFERENCES "PlanStandard"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TranscriptEntry" ADD CONSTRAINT "TranscriptEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptPrerequisite" ADD CONSTRAINT "ConceptPrerequisite_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptPrerequisite" ADD CONSTRAINT "ConceptPrerequisite_prerequisiteId_fkey" FOREIGN KEY ("prerequisiteId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConceptActivity" ADD CONSTRAINT "ConceptActivity_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConversationMemory" ADD CONSTRAINT "ConversationMemory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningGap" ADD CONSTRAINT "LearningGap_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningGap" ADD CONSTRAINT "LearningGap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReflectionEntry" ADD CONSTRAINT "ReflectionEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSchedule" ADD CONSTRAINT "ReviewSchedule_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReviewSchedule" ADD CONSTRAINT "ReviewSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConceptMastery" ADD CONSTRAINT "UserConceptMastery_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserConceptMastery" ADD CONSTRAINT "UserConceptMastery_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OnboardingProgress" ADD CONSTRAINT "OnboardingProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningComponent" ADD CONSTRAINT "LearningComponent_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "StateStandard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillStandardMapping" ADD CONSTRAINT "SkillStandardMapping_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillStandardMapping" ADD CONSTRAINT "SkillStandardMapping_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "StateStandard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentStandardProgress" ADD CONSTRAINT "StudentStandardProgress_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "StateStandard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentStandardProgress" ADD CONSTRAINT "StudentStandardProgress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlacementAssessment" ADD CONSTRAINT "PlacementAssessment_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigations" ADD CONSTRAINT "investigations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "investigation_sources" ADD CONSTRAINT "investigation_sources_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "share_links" ADD CONSTRAINT "share_links_investigationId_fkey" FOREIGN KEY ("investigationId") REFERENCES "investigations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LearningPlan" ADD CONSTRAINT "LearningPlan_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanStandard" ADD CONSTRAINT "PlanStandard_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "LearningPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlanStandard" ADD CONSTRAINT "PlanStandard_standard_id_fkey" FOREIGN KEY ("standard_id") REFERENCES "StateStandard"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandardActivity" ADD CONSTRAINT "StandardActivity_plan_standard_id_fkey" FOREIGN KEY ("plan_standard_id") REFERENCES "PlanStandard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScienceGroup" ADD CONSTRAINT "ScienceGroup_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScienceGroup" ADD CONSTRAINT "ScienceGroup_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "ScienceGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMembership" ADD CONSTRAINT "GroupMembership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupMessage" ADD CONSTRAINT "GroupMessage_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "ScienceGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupProject" ADD CONSTRAINT "GroupProject_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "ScienceGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupLogEntry" ADD CONSTRAINT "GroupLogEntry_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "ScienceGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupLogEntry" ADD CONSTRAINT "GroupLogEntry_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "GroupProject"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GroupLogEntry" ADD CONSTRAINT "GroupLogEntry_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionMatch" ADD CONSTRAINT "CompetitionMatch_competition_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "Competition"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompetitionMatch" ADD CONSTRAINT "CompetitionMatch_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "source_gap_requests" ADD CONSTRAINT "source_gap_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cached_lessons" ADD CONSTRAINT "cached_lessons_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "daily_reflections" ADD CONSTRAINT "daily_reflections_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_club_members" ADD CONSTRAINT "book_club_members_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "book_clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_club_members" ADD CONSTRAINT "book_club_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_club_posts" ADD CONSTRAINT "book_club_posts_club_id_fkey" FOREIGN KEY ("club_id") REFERENCES "book_clubs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "book_club_posts" ADD CONSTRAINT "book_club_posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_lesson_progress" ADD CONSTRAINT "student_lesson_progress_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("lesson_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_lesson_progress" ADD CONSTRAINT "student_lesson_progress_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_environments" ADD CONSTRAINT "student_environments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_sessions" ADD CONSTRAINT "lesson_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
