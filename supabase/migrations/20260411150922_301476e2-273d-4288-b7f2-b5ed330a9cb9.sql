ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_confidence_level_check;
ALTER TABLE public.trades ADD CONSTRAINT trades_confidence_level_check CHECK (confidence_level >= 0 AND confidence_level <= 100);

ALTER TABLE public.trades DROP CONSTRAINT IF EXISTS trades_emotional_state_check;