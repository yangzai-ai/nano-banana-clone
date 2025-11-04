import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Check if user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's active subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subError && subError.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which is acceptable
      console.error('[Subscription API] Error fetching subscription:', subError)
      return NextResponse.json(
        { error: 'Failed to fetch subscription' },
        { status: 500 }
      )
    }

    // If no active subscription, return null
    if (!subscription) {
      return NextResponse.json({
        subscription: null,
        hasActiveSubscription: false,
      })
    }

    // Return subscription data
    return NextResponse.json({
      subscription: {
        id: subscription.id,
        planName: subscription.plan_name,
        planType: subscription.plan_type,
        status: subscription.status,
        creditsTotal: subscription.credits_total,
        creditsUsed: subscription.credits_used,
        creditsRemaining: subscription.credits_remaining,
        currentPeriodStart: subscription.current_period_start,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelledAt: subscription.cancelled_at,
        amount: subscription.amount,
        currency: subscription.currency,
        createdAt: subscription.created_at,
      },
      hasActiveSubscription: true,
    })
  } catch (error) {
    console.error('[Subscription API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
