import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

/**
 * Test endpoint to verify subscription table access
 *
 * Test with:
 * GET /api/test-subscription - List all subscriptions (admin view)
 * POST /api/test-subscription - Create a test subscription
 */

export async function GET() {
  try {
    const adminClient = createAdminClient()

    // Check if table exists and list all subscriptions
    const { data, error } = await adminClient
      .from('subscriptions')
      .select('*')
      .limit(10)

    if (error) {
      console.error('[Test] Error fetching subscriptions:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully fetched subscriptions',
      count: data?.length || 0,
      subscriptions: data,
    })
  } catch (error) {
    console.error('[Test] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    // Get current user
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
      }, { status: 401 })
    }

    // Use admin client to create test subscription
    const adminClient = createAdminClient()

    const currentPeriodStart = new Date()
    const currentPeriodEnd = new Date()
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1)

    const testSubscription = {
      user_id: user.id,
      creem_subscription_id: `test_sub_${Date.now()}`,
      creem_customer_id: `test_cus_${Date.now()}`,
      creem_checkout_id: `test_checkout_${Date.now()}`,
      plan_name: 'pro',
      plan_type: 'monthly',
      product_id: 'prod_test_pro_monthly',
      amount: 39.00,
      currency: 'USD',
      status: 'active',
      current_period_start: currentPeriodStart.toISOString(),
      current_period_end: currentPeriodEnd.toISOString(),
      cancel_at_period_end: false,
      credits_total: 800,
      credits_used: 0,
      metadata: { test: true },
    }

    console.log('[Test] Attempting to insert test subscription:', testSubscription)

    const { data, error } = await adminClient
      .from('subscriptions')
      .insert(testSubscription)
      .select()

    if (error) {
      console.error('[Test] Error creating test subscription:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
      }, { status: 500 })
    }

    console.log('[Test] Test subscription created successfully:', data)

    return NextResponse.json({
      success: true,
      message: 'Test subscription created successfully',
      subscription: data[0],
    })
  } catch (error) {
    console.error('[Test] Unexpected error:', error)
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    const adminClient = createAdminClient()

    // Delete all test subscriptions
    const { error } = await adminClient
      .from('subscriptions')
      .delete()
      .like('creem_subscription_id', 'test_sub_%')

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Test subscriptions deleted',
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: String(error),
    }, { status: 500 })
  }
}
