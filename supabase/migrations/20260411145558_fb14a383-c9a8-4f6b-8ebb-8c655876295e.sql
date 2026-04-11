ALTER TABLE public.trades 
ADD COLUMN IF NOT EXISTS entry_conditions jsonb DEFAULT '{}',
ADD COLUMN IF NOT EXISTS trading_session text;