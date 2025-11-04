-- Add 'replaced' status to subscriptions table
-- Run this in Supabase SQL Editor if you want to track subscription history

-- The 'replaced' status indicates that this subscription was replaced by a newer one
-- Status can be: 'active', 'cancelled', 'expired', 'past_due', 'replaced'

-- No schema change needed - just update your application logic
-- The status field already accepts TEXT values

-- Optional: Add a comment to the status column for documentation
COMMENT ON COLUMN public.subscriptions.status IS
  'Subscription status: active, cancelled, expired, past_due, replaced';
