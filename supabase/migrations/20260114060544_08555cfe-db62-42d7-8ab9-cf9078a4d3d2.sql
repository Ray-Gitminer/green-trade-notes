-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  account_balance DECIMAL(15,2) DEFAULT 10000.00,
  default_risk_percent DECIMAL(5,2) DEFAULT 1.00,
  notification_settings JSONB DEFAULT '{"open_trade_alerts": true, "end_of_day_journal": true, "goal_checkins": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trades table
CREATE TABLE public.trades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  is_paper_trade BOOLEAN DEFAULT false,
  strategy_id UUID,
  entry_price DECIMAL(20,8),
  stop_loss DECIMAL(20,8),
  take_profit DECIMAL(20,8),
  lot_size DECIMAL(15,5),
  risk_amount DECIMAL(15,2),
  risk_reward_ratio DECIMAL(10,2),
  profit_loss DECIMAL(15,2),
  status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'open', 'closed', 'cancelled')),
  emotional_state TEXT CHECK (emotional_state IN ('confident', 'calm', 'anxious', 'fomo', 'revenge', 'tired', 'excited', 'neutral')),
  confidence_level INTEGER CHECK (confidence_level >= 1 AND confidence_level <= 10),
  pre_trade_notes TEXT,
  mn_signal TEXT,
  mn_notes TEXT,
  w_signal TEXT,
  w_notes TEXT,
  d_signal TEXT,
  d_notes TEXT,
  h4_signal TEXT,
  h4_notes TEXT,
  h1_signal TEXT,
  h1_notes TEXT,
  analysis TEXT,
  trade_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  close_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trade_images table
CREATE TABLE public.trade_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trading_goals table
CREATE TABLE public.trading_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  profit_target DECIMAL(15,2) DEFAULT 0,
  profit_achieved DECIMAL(15,2) DEFAULT 0,
  win_rate_target DECIMAL(5,2) DEFAULT 0,
  trade_count_target INTEGER DEFAULT 0,
  is_paper_goal BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month, year, is_paper_goal)
);

-- Create daily_notes table
CREATE TABLE public.daily_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_date DATE NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('market_outlook', 'psychology', 'lessons_learned', 'general')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create knowledge_items table
CREATE TABLE public.knowledge_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('technical_analysis', 'risk_management', 'psychology', 'strategies', 'general')),
  image_url TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trade_templates table
CREATE TABLE public.trade_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general' CHECK (category IN ('scalping', 'swing', 'breakout', 'reversal', 'general')),
  pair TEXT,
  default_stop_loss DECIMAL(20,8),
  default_take_profit DECIMAL(20,8),
  timeframe_settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create strategies table for backtesting
CREATE TABLE public.strategies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  rules TEXT,
  entry_criteria TEXT,
  exit_criteria TEXT,
  ideal_conditions TEXT,
  status TEXT DEFAULT 'testing' CHECK (status IN ('testing', 'validated', 'rejected', 'ready_for_live')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create risk_journal_sessions table
CREATE TABLE public.risk_journal_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  session_type TEXT NOT NULL CHECK (session_type IN ('pre_session', 'post_session')),
  mood TEXT CHECK (mood IN ('happy', 'neutral', 'stressed', 'tired', 'excited', 'anxious')),
  sleep_quality TEXT CHECK (sleep_quality IN ('poor', 'average', 'good', 'excellent')),
  focus_level INTEGER CHECK (focus_level >= 1 AND focus_level <= 10),
  external_factors TEXT,
  followed_plan TEXT CHECK (followed_plan IN ('yes', 'partial', 'no')),
  emotional_shifts TEXT,
  key_decisions TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create risk_decisions table
CREATE TABLE public.risk_decisions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  decision_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  situation TEXT NOT NULL,
  emotional_state TEXT,
  decision_made TEXT NOT NULL,
  was_rule_based BOOLEAN DEFAULT true,
  is_fomo BOOLEAN DEFAULT false,
  is_revenge_trade BOOLEAN DEFAULT false,
  outcome TEXT,
  lessons_learned TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create chat_messages table for Ryuta AI
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create reminders table
CREATE TABLE public.reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL CHECK (reminder_type IN ('open_trade', 'end_of_day', 'goal_checkin', 'custom')),
  title TEXT NOT NULL,
  time TEXT NOT NULL,
  days_of_week INTEGER[],
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trading_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_journal_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for trades
CREATE POLICY "Users can view their own trades" ON public.trades FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own trades" ON public.trades FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own trades" ON public.trades FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trades" ON public.trades FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for trade_images
CREATE POLICY "Users can view their own trade images" ON public.trade_images FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own trade images" ON public.trade_images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own trade images" ON public.trade_images FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for trading_goals
CREATE POLICY "Users can view their own goals" ON public.trading_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own goals" ON public.trading_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own goals" ON public.trading_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own goals" ON public.trading_goals FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for daily_notes
CREATE POLICY "Users can view their own notes" ON public.daily_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own notes" ON public.daily_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own notes" ON public.daily_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notes" ON public.daily_notes FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for knowledge_items
CREATE POLICY "Users can view their own knowledge" ON public.knowledge_items FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own knowledge" ON public.knowledge_items FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own knowledge" ON public.knowledge_items FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own knowledge" ON public.knowledge_items FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for trade_templates
CREATE POLICY "Users can view their own templates" ON public.trade_templates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own templates" ON public.trade_templates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own templates" ON public.trade_templates FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own templates" ON public.trade_templates FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for strategies
CREATE POLICY "Users can view their own strategies" ON public.strategies FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own strategies" ON public.strategies FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own strategies" ON public.strategies FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own strategies" ON public.strategies FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for risk_journal_sessions
CREATE POLICY "Users can view their own sessions" ON public.risk_journal_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own sessions" ON public.risk_journal_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own sessions" ON public.risk_journal_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own sessions" ON public.risk_journal_sessions FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for risk_decisions
CREATE POLICY "Users can view their own decisions" ON public.risk_decisions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own decisions" ON public.risk_decisions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own decisions" ON public.risk_decisions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own decisions" ON public.risk_decisions FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for chat_messages
CREATE POLICY "Users can view their own messages" ON public.chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own messages" ON public.chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for reminders
CREATE POLICY "Users can view their own reminders" ON public.reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own reminders" ON public.reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reminders" ON public.reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own reminders" ON public.reminders FOR DELETE USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trades_updated_at BEFORE UPDATE ON public.trades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trading_goals_updated_at BEFORE UPDATE ON public.trading_goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_daily_notes_updated_at BEFORE UPDATE ON public.daily_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_knowledge_items_updated_at BEFORE UPDATE ON public.knowledge_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_trade_templates_updated_at BEFORE UPDATE ON public.trade_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_strategies_updated_at BEFORE UPDATE ON public.strategies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for trade images
INSERT INTO storage.buckets (id, name, public) VALUES ('trade-images', 'trade-images', true);

-- Create storage bucket for knowledge library
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-library', 'knowledge-library', true);

-- Create storage policies for trade-images bucket
CREATE POLICY "Users can upload trade images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'trade-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view trade images" ON storage.objects FOR SELECT USING (bucket_id = 'trade-images');
CREATE POLICY "Users can delete their trade images" ON storage.objects FOR DELETE USING (bucket_id = 'trade-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Create storage policies for knowledge-library bucket
CREATE POLICY "Users can upload knowledge items" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'knowledge-library' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can view knowledge items" ON storage.objects FOR SELECT USING (bucket_id = 'knowledge-library');
CREATE POLICY "Users can delete their knowledge items" ON storage.objects FOR DELETE USING (bucket_id = 'knowledge-library' AND auth.uid()::text = (storage.foldername(name))[1]);