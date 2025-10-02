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
      // Retorna uma resposta de erro clara para o cliente
      return new NextResponse(JSON.stringify({ message: 'Failed to forward to webhook', error: errorBody }), {
        status: makeResponse.status, // Usa o mesmo status do erro original
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Se o Make.com respondeu com sucesso, retorne uma resposta de sucesso para o cliente.
    // O Make.com geralmente responde com "Accepted" como texto simples.
    const responseData = await makeResponse.text();
    return NextResponse.json({ message: 'Webhook forwarded successfully', upstreamResponse: responseData }, { status: 200 });

  } catch (error: any) {
    console.error('Error in webhook handler:', error);
    return NextResponse.json(
      { message: 'Internal Server Error', error: error.message },
      { status: 500 }
    );
  }
}
