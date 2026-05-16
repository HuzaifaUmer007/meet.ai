-- ================================================================
-- Meet.AI — Supabase Database Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ================================================================


-- ================================================================
-- 1. UPDATED_AT TRIGGER FUNCTION (shared)
-- ================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'meeting_status') THEN
    CREATE TYPE public.meeting_status AS ENUM (
      'upcoming',
      'active',
      'completed',
      'processing',
      'cancelled'
    );
  END IF;
END$$;


-- ================================================================
-- 3. PROFILES TABLE (User metadata)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name    TEXT,
  avatar_url   TEXT,
  updated_at   TIMESTAMPTZ DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ================================================================
-- 4. AGENTS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.agents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  instructions TEXT NOT NULL,
  voice        TEXT NOT NULL DEFAULT 'alloy',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS agents_user_id_idx ON public.agents(user_id);

DROP TRIGGER IF EXISTS agents_updated_at ON public.agents;
CREATE TRIGGER agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ================================================================
-- 4. MEETINGS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.meetings (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_id       UUID NOT NULL REFERENCES public.agents(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  status         public.meeting_status NOT NULL DEFAULT 'upcoming',
  started_at     TIMESTAMPTZ,
  ended_at       TIMESTAMPTZ,
  transcript_url TEXT,
  recording_url  TEXT,
  summary        TEXT,
  tokens_used    INTEGER NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS meetings_user_id_idx  ON public.meetings(user_id);
CREATE INDEX IF NOT EXISTS meetings_agent_id_idx ON public.meetings(agent_id);
CREATE INDEX IF NOT EXISTS meetings_status_idx   ON public.meetings(status);

DROP TRIGGER IF EXISTS meetings_updated_at ON public.meetings;
CREATE TRIGGER meetings_updated_at
  BEFORE UPDATE ON public.meetings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- ================================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ================================================================
ALTER TABLE public.agents   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;

-- AGENTS policies
DROP POLICY IF EXISTS "Users can view own agents"   ON public.agents;
DROP POLICY IF EXISTS "Users can insert own agents" ON public.agents;
DROP POLICY IF EXISTS "Users can update own agents" ON public.agents;
DROP POLICY IF EXISTS "Users can delete own agents" ON public.agents;
DROP POLICY IF EXISTS "Service role full access to agents" ON public.agents;

CREATE POLICY "Users can view own agents"
  ON public.agents FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own agents"
  ON public.agents FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own agents"
  ON public.agents FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own agents"
  ON public.agents FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to agents"
  ON public.agents FOR ALL USING (auth.role() = 'service_role');

-- MEETINGS policies
DROP POLICY IF EXISTS "Users can view own meetings"   ON public.meetings;
DROP POLICY IF EXISTS "Users can insert own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can update own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Users can delete own meetings" ON public.meetings;
DROP POLICY IF EXISTS "Service role full access to meetings" ON public.meetings;

CREATE POLICY "Users can view own meetings"
  ON public.meetings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meetings"
  ON public.meetings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meetings"
  ON public.meetings FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own meetings"
  ON public.meetings FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to meetings"
  ON public.meetings FOR ALL USING (auth.role() = 'service_role');


-- ================================================================
-- 6. UTILITY FUNCTIONS
-- ================================================================
CREATE OR REPLACE FUNCTION public.increment_tokens(meeting_id UUID, tokens INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE public.meetings
  SET tokens_used = tokens_used + tokens
  WHERE id = meeting_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ================================================================
-- DONE! Your database is ready.
-- ================================================================
