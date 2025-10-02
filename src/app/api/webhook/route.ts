import { NextResponse } from 'next/server';

// O URL do seu webhook Make.com
const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/w5m2kk57rrs9ixdpvg65fb5b32k1ig';

export async function POST(request: Request) {
  try {
    const payload = await request.json();

    const makeResponse = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!makeResponse.ok) {
      const errorBody = await makeResponse.text();
      console.error('Failed to forward to Make.com webhook:', makeResponse.status, errorBody);
      return new NextResponse(JSON.stringify({ message: 'Failed to forward to webhook', error: errorBody }), {
        status: makeResponse.status,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Tenta retornar a resposta do Make.com como JSON.
    // Se falhar (ex: o Make.com respondeu com texto simples como "Accepted"), retorna o texto.
    try {
        const responseData = await makeResponse.json();
        return NextResponse.json(responseData, { status: makeResponse.status });
    } catch (e) {
        return new NextResponse(await makeResponse.text(), { status: makeResponse.status });
    }

  } catch (error: any) {
    console.error('Error in webhook handler:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}
