import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { productId, planType, units = 1 } = await req.json()

    console.log('[Checkout] Request received:', { productId, planType, units })

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Check API key is configured
    const apiKey = process.env.CREEM_API_KEY
    if (!apiKey) {
      console.error('[Checkout] CREEM_API_KEY is not configured')
      return NextResponse.json(
        { error: 'Payment system not configured' },
        { status: 500 }
      )
    }

    console.log('[Checkout] API Key configured:', apiKey.substring(0, 15) + '...')

    // Determine API endpoint based on API key type
    // Test keys use: https://test-api.creem.io
    // Live keys use: https://api.creem.io
    const isTestMode = apiKey.startsWith('creem_test_')
    const apiBaseUrl = isTestMode
      ? 'https://test-api.creem.io/v1'
      : 'https://api.creem.io/v1'

    console.log('[Checkout] Using API endpoint:', apiBaseUrl, '(test mode:', isTestMode + ')')

    // Check if user is authenticated
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('[Checkout] User authenticated:', user.email)

    // Create unique request ID for tracking
    const requestId = `req_${user.id}_${Date.now()}`

    // Prepare request body
    const requestBody = {
      product_id: productId,
      request_id: requestId,
      units: units,
      customer: {
        email: user.email,
      },
      success_url: `${req.headers.get('origin')}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        user_id: user.id,
        plan_type: planType,
      },
    }

    console.log('[Checkout] Sending request to Creem:', JSON.stringify(requestBody, null, 2))

    // Create Creem checkout session
    // API Reference: https://docs.creem.io/api-reference/endpoint/create-checkout
    const creemResponse = await fetch(`${apiBaseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    })

    console.log('[Checkout] Creem response status:', creemResponse.status)

    const responseText = await creemResponse.text()
    console.log('[Checkout] Creem response body:', responseText)

    if (!creemResponse.ok) {
      let error
      try {
        error = JSON.parse(responseText)
      } catch (e) {
        error = { message: responseText }
      }

      console.error('[Checkout] Creem API Error:', {
        status: creemResponse.status,
        error: error,
        apiKey: apiKey.substring(0, 15) + '...',
        productId: productId,
      })

      return NextResponse.json(
        {
          error: 'Failed to create checkout session',
          details: error,
          debug: {
            status: creemResponse.status,
            productId: productId,
            hasApiKey: !!apiKey,
          }
        },
        { status: 500 }
      )
    }

    const session = JSON.parse(responseText)
    console.log('[Checkout] Checkout session created:', session.id)

    // Return checkout URL for redirect
    return NextResponse.json({
      checkoutUrl: session.checkout_url || session.url,
      sessionId: session.id,
      requestId: requestId,
    })
  } catch (error) {
    console.error('[Checkout] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}
