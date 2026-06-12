
CREATE TABLE IF NOT EXISTS public.statement_imports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  source_type TEXT NOT NULL DEFAULT 'pdf',
  bank_hint TEXT,
  transaction_count INTEGER NOT NULL DEFAULT 0,
  skipped_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  summary JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.statement_imports TO authenticated;
GRANT ALL ON public.statement_imports TO service_role;
ALTER TABLE public.statement_imports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own statement imports"
  ON public.statement_imports FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_statement_imports_updated_at
  BEFORE UPDATE ON public.statement_imports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS statement_import_id UUID REFERENCES public.statement_imports(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_statement_import ON public.transactions(statement_import_id);
CREATE INDEX IF NOT EXISTS idx_statement_imports_user ON public.statement_imports(user_id, created_at DESC);

CREATE POLICY "Users read own statement files"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'statements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users upload own statement files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'statements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users update own statement files"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'statements' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own statement files"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'statements' AND auth.uid()::text = (storage.foldername(name))[1]);
