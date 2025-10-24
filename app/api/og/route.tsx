import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    const word = searchParams.get('word') || 'こんにちは';
    const reading = searchParams.get('reading') || 'konnichiwa';
    const meaning = searchParams.get('meaning') || 'Hello';
    const imageUrl = searchParams.get('image') || '';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '40px',
          }}
        >
          {/* Word Image */}
          {imageUrl && (
            <div
              style={{
                display: 'flex',
                width: '400px',
                height: '300px',
                borderRadius: '24px',
                overflow: 'hidden',
                marginBottom: '40px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              }}
            >
              <img
                src={imageUrl}
                alt={word}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>
          )}

          {/* Word */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.95)',
              borderRadius: '24px',
              padding: '40px 60px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: 'bold',
                color: '#1f2937',
                marginBottom: '16px',
              }}
            >
              {word}
            </div>
            <div
              style={{
                fontSize: 36,
                color: '#6b7280',
                marginBottom: '24px',
              }}
            >
              {reading}
            </div>
            <div
              style={{
                fontSize: 48,
                fontWeight: 600,
                color: '#3b82f6',
              }}
            >
              {meaning}
            </div>
          </div>

          {/* Branding */}
          <div
            style={{
              position: 'absolute',
              bottom: '40px',
              display: 'flex',
              alignItems: 'center',
              fontSize: 32,
              fontWeight: 'bold',
              color: '#fff',
              textShadow: '0 2px 10px rgba(0,0,0,0.3)',
            }}
          >
            Lexora
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    return new Response('Failed to generate image', { status: 500 });
  }
}
