import { NextRequest, NextResponse } from 'next/server'

// Mock checkout completion page for testing
// This simulates the Stripe checkout success flow

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Security guard - only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session')

  if (!sessionId) {
    return new NextResponse('Missing session parameter', { status: 400 })
  }

  // Mock payment provider should auto-complete the session
  // This page just provides user feedback
  
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Mock Payment Complete - Cabo Fit Pass</title>
        <style>
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                max-width: 600px;
                margin: 0 auto;
                padding: 40px 20px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                color: white;
            }
            .container {
                background: rgba(255, 255, 255, 0.95);
                color: #333;
                padding: 40px;
                border-radius: 12px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                text-align: center;
            }
            .success-icon {
                font-size: 64px;
                margin-bottom: 20px;
            }
            h1 {
                color: #16a085;
                margin: 0 0 20px 0;
            }
            .session-info {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 8px;
                margin: 20px 0;
                font-family: monospace;
                font-size: 14px;
                color: #666;
            }
            .button {
                display: inline-block;
                background: #16a085;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin: 10px 5px;
                transition: background 0.2s;
            }
            .button:hover {
                background: #138d75;
            }
            .warning {
                background: #fff3cd;
                color: #856404;
                padding: 15px;
                border-radius: 6px;
                margin: 20px 0;
                border: 1px solid #ffeaa7;
            }
            .dev-info {
                margin-top: 30px;
                padding: 20px;
                background: #e8f5e8;
                border-radius: 8px;
                text-align: left;
            }
            .dev-info h3 {
                margin-top: 0;
                color: #27ae60;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="success-icon">✅</div>
            <h1>Payment Completed (Mock)</h1>
            <p>Your mock payment has been processed successfully!</p>
            
            <div class="session-info">
                Session ID: ${sessionId}
            </div>
            
            <div class="warning">
                <strong>Development Mode:</strong> This is a mock payment completion. 
                No real payment was processed.
            </div>
            
            <a href="/dashboard" class="button">Return to Dashboard</a>
            <a href="/api/dev/status" class="button">Check Status</a>
            
            <div class="dev-info">
                <h3>Development Information</h3>
                <ul>
                    <li>The mock payment provider automatically completes sessions</li>
                    <li>Credits or tourist passes should be granted within 1-2 seconds</li>
                    <li>Check your dashboard to see the updated balance</li>
                    <li>Audit logs are created for all transactions</li>
                </ul>
                
                <h4>Testing Different Scenarios:</h4>
                <ul>
                    <li>Set <code>MOCK_AUTO_COMPLETE=false</code> to test manual completion</li>
                    <li>Use direct endpoints: <code>/api/dev/topup-direct</code></li>
                    <li>Use direct endpoints: <code>/api/dev/tourist-pass-direct</code></li>
                </ul>
            </div>
        </div>
        
        <script>
            // Auto-redirect after 10 seconds
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 10000);
            
            // Check if session is completed
            async function checkSessionStatus() {
                try {
                    const response = await fetch('/api/dev/session-status?session=${sessionId}');
                    const data = await response.json();
                    
                    if (data.success && data.data.status === 'completed') {
                        document.querySelector('.warning').innerHTML = 
                            '<strong>✅ Session Completed:</strong> Credits/passes have been granted!';
                    }
                } catch (error) {
                    console.log('Status check failed:', error);
                }
            }
            
            // Check status every 2 seconds for 30 seconds
            let checks = 0;
            const statusInterval = setInterval(() => {
                checkSessionStatus();
                checks++;
                if (checks >= 15) {
                    clearInterval(statusInterval);
                }
            }, 2000);
        </script>
    </body>
    </html>
  `

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
}