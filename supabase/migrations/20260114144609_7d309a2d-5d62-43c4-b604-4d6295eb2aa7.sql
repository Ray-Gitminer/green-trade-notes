-- Create table for chart analysis logs (daily log entries)
CREATE TABLE public.chart_analysis_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL,
  
  -- Morning TF signals (07:00)
  mn_signal TEXT,
  mn_market_structure TEXT,
  mn_image_url TEXT,
  
  w_signal TEXT,
  w_market_structure TEXT,
  w_image_url TEXT,
  
  d_signal TEXT,
  d_market_structure TEXT,
  d_image_url TEXT,
  
  h4_signal TEXT,
  h4_market_structure TEXT,
  h4_image_url TEXT,
  
  h1_signal TEXT,
  h1_market_structure TEXT,
  h1_image_url TEXT,
  
  -- Market cycle info
  main_resistance TEXT,
  minor_sr TEXT,
  main_support TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(user_id, log_date)
);

-- Create table for intraday sessions (07:00, 11:00, 15:00, 19:00)
CREATE TABLE public.chart_analysis_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_id UUID REFERENCES public.chart_analysis_logs(id) ON DELETE CASCADE,
  session_time TEXT NOT NULL, -- "07:00", "11:00", "15:00", "19:00"
  
  h1_analysis TEXT,
  h4_analysis TEXT,
  chart_notes TEXT,
  h1_image_url TEXT,
  h4_image_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chart_analysis_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chart_analysis_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for chart_analysis_logs
CREATE POLICY "Users can view their own logs" 
ON public.chart_analysis_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own logs" 
ON public.chart_analysis_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own logs" 
ON public.chart_analysis_logs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own logs" 
ON public.chart_analysis_logs 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for chart_analysis_sessions
CREATE POLICY "Users can view their own sessions" 
ON public.chart_analysis_sessions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own sessions" 
ON public.chart_analysis_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions" 
ON public.chart_analysis_sessions 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sessions" 
ON public.chart_analysis_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create storage bucket for chart images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chart-images', 'chart-images', true);

-- Storage policies for chart images
CREATE POLICY "Anyone can view chart images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'chart-images');

CREATE POLICY "Users can upload their own chart images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'chart-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own chart images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'chart-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own chart images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'chart-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_chart_analysis_logs_updated_at
BEFORE UPDATE ON public.chart_analysis_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_chart_analysis_sessions_updated_at
BEFORE UPDATE ON public.chart_analysis_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();