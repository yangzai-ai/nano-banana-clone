import { NextRequest, NextResponse } from 'next/server'

// 简化版测试 API - 用于调试 Creem 集成
export async function POST(req: NextRequest) {
  try {
    const { productId } = await req.json()
    const apiKey = process.env.CREEM_API_KEY || ''

    console.log('[Test Checkout] Product ID:', productId)
    console.log('[Test Checkout] API Key:', apiKey.substring(0, 20) + '...')

    // 根据 API Key 类型选择端点
    const isTestMode = apiKey.startsWith('creem_test_')
    const apiBaseUrl = isTestMode
      ? 'https://test-api.creem.io/v1'
      : 'https://api.creem.io/v1'

    console.log('[Test Checkout] API Endpoint:', apiBaseUrl)

    // 最简单的请求 - 只传递必需参数
    const requestBody = {
      product_id: productId || "prod_2zUJFfU5Mc9TT7mSr1OyEo",
    }

    console.log('[Test Checkout] Request body:', JSON.stringify(requestBody))

    const response = await fetch(`${apiBaseUrl}/checkouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify(requestBody),
    })

    console.log('[Test Checkout] Response status:', response.status)

    const responseText = await response.text()
    console.log('[Test Checkout] Response body:', responseText)

    let responseData
    try {
      responseData = JSON.parse(responseText)
    } catch (e) {
      responseData = { raw: responseText }
    }

    return NextResponse.json({
      status: response.status,
      ok: response.ok,
      data: responseData,
      request: requestBody,
      endpoint: apiBaseUrl,
      testMode: isTestMode,
    })
  } catch (error) {
    console.error('[Test Checkout] Error:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
