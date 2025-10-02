import { NextResponse } from 'next/server';

const WEBHOOK_URL = 'https://hook.eu2.make.com/3gux6vcanm0m65m65qa5jd89nqmj348p8f';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    // Forward the request to the external webhook
    const makeResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!makeResponse.ok) {
      // Log the error if the external webhook fails
      const errorText = await makeResponse.text();
      console.error('External webhook failed:', makeResponse.status, errorText);
      return new NextResponse(
        JSON.stringify({ message: 'Webhook call failed', error: errorText }),
        { status: makeResponse.status }
      );
    }

    return new NextResponse(
        JSON.stringify({ message: 'Webhook triggered successfully' }),
        { status: 200 }
    );

  } catch (error: any) {
    console.error('Error processing webhook request:', error);
    return new NextResponse(
        JSON.stringify({ message: 'Internal Server Error', error: error.message }),
        { status: 500 }
    );
  }
}
