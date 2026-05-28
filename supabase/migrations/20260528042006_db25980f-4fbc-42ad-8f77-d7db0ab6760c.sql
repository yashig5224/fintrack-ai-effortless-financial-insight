CREATE TABLE public.ai_usage_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  requested_model TEXT,
  prompt_tokens INTEGER,
  completion_tokens INTEGER,
  total_tokens INTEGER,
  latency_ms INTEGER,
  status TEXT NOT NULL DEFAULT 'ok',
  fallback_used BOOLEAN NOT NULL DEFAULT false,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.ai_usage_logs TO authenticated;
GRANT ALL ON public.ai_usage_logs TO service_role;

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own ai logs select" ON public.ai_usage_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "own ai logs insert" ON public.ai_usage_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "service manages ai logs" ON public.ai_usage_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_ai_usage_logs_user_created ON public.ai_usage_logs(user_id, created_at DESC);