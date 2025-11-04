-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Creem subscription info
  creem_subscription_id TEXT UNIQUE,
  creem_customer_id TEXT,
  creem_checkout_id TEXT,

  -- Plan details
  plan_name TEXT NOT NULL, -- 'basic', 'pro', 'max'
  plan_type TEXT NOT NULL, -- 'monthly', 'annual'
  product_id TEXT NOT NULL,

  -- Pricing
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Status
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'expired', 'past_due'

  -- Dates
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMPTZ,

  -- Credits
  credits_total INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  credits_remaining INTEGER GENERATED ALWAYS AS (credits_total - credits_used) STORED,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_creem_subscription_id ON public.subscriptions(creem_subscription_id);

-- Enable RLS (Row Level Security)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only read their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Service role can do everything
CREATE POLICY "Service role can manage all subscriptions"
  ON public.subscriptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create usage_logs table to track credit usage
CREATE TABLE IF NOT EXISTS public.usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.subscriptions(id) ON DELETE SET NULL,

  -- Usage details
  action_type TEXT NOT NULL, -- 'image_generation', 'credit_purchase', 'credit_refund'
  credits_used INTEGER NOT NULL,

  -- Context
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for usage logs
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON public.usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_subscription_id ON public.usage_logs(subscription_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON public.usage_logs(created_at);

-- Enable RLS for usage logs
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own usage logs
CREATE POLICY "Users can view own usage logs"
  ON public.usage_logs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Service role can manage all usage logs
CREATE POLICY "Service role can manage all usage logs"
  ON public.usage_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Create function to get user's active subscription
CREATE OR REPLACE FUNCTION get_user_active_subscription(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  plan_name TEXT,
  plan_type TEXT,
  status TEXT,
  credits_total INTEGER,
  credits_used INTEGER,
  credits_remaining INTEGER,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.plan_name,
    s.plan_type,
    s.status,
    s.credits_total,
    s.credits_used,
    s.credits_remaining,
    s.current_period_end,
    s.cancel_at_period_end
  FROM public.subscriptions s
  WHERE s.user_id = p_user_id
    AND s.status = 'active'
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
