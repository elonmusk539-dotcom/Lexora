import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to simulate a Dodo webhook
 * Call this to test webhook handling without making a real payment
 * 
 * Usage: POST http://localhost:3000/api/dodo/test-webhook
 * 
 * This will call your webhook with sample data matching Dodo's format
 */
export async function POST(req: NextRequest) {
  try {
    const baseUrl = req.headers.get('origin') || 'http://localhost:3000';
    
    // Simulate a Dodo checkout.session.completed webhook
    const testWebhookPayload = {
      type: 'checkout.session.completed',
      data: {
        id: 'test_session_123',
        subscription_id: 'sub_test_123',
        customer_id: 'user_12345', // This should be your Supabase user ID
        status: 'completed',
        amount: 299,
        currency: 'USD',
        product_id: 'pdt_agiTpgqJJP8KIwhblX6vv', // Monthly plan ID
        metadata: {
          user_id: 'your-supabase-user-id', // Replace with your actual Supabase user ID
          interval: 'month'
        }
      }
    };

    console.log('🧪 Sending test webhook to:', `${baseUrl}/api/dodo/webhook`);
    console.log('🧪 Payload:', JSON.stringify(testWebhookPayload, null, 2));

    // Call your webhook endpoint
    const webhookResponse = await fetch(`${baseUrl}/api/dodo/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testWebhookPayload)
    });

    const webhookResult = await webhookResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Test webhook sent',
      webhookResponse: {
        status: webhookResponse.status,
        body: webhookResult
      },
      payload: testWebhookPayload
    });

  } catch (error) {
    console.error('Test webhook error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
