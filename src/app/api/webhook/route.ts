import { NextResponse } from 'next/server';

const WEBHOOK_URL = 'https://hook.eu2.make.com/3gux6vcanm0m65m65qa5jd89nqmj348p8f';
const API_KEY = process.env.WEBHOOK_API_KEY;

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!API_KEY || authHeader !== `Bearer ${API_KEY}`) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const payload = await request.json();

    // Forward the payload to the external webhook
    const makeResponse = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!makeResponse.ok) {
      const errorBody = await makeResponse.text();
      console.error('Failed to forward to Make.com webhook:', makeResponse.status, errorBody);
      return NextResponse.json(
        { message: 'Failed to forward to webhook', error: errorBody },
        { status: makeResponse.status }
      );
    }

    return NextResponse.json({ message: 'Webhook forwarded successfully' }, { status: 200 });
  } catch (error: any) {
    console.error('Error in webhook handler:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}
