import { NextResponse } from 'next/server';

// O URL do seu webhook Make.com
const MAKE_WEBHOOK_URL = 'https://hook.eu2.make.com/w5m2kk57rrs9ixdpvg65fb5b32k1ig';
// A chave de API para o seu cenário Make.com (se o seu webhook estiver protegido)
const MAKE_API_KEY = process.env.MAKE_API_KEY; // Opcional, se o Make.com exigir.

export async function POST(request: Request) {
  try {
    // Este endpoint é público para a própria app, atuando como um proxy seguro.
    const payload = await request.json();

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Adicione a chave de API para o Make.com, se existir.
    if (MAKE_API_KEY) {
      headers['Authorization'] = `Bearer ${MAKE_API_KEY}`;
    }

    // Reencaminha o payload para o webhook externo (Make.com)
    const makeResponse = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload), // Garante que o corpo é uma string JSON válida
    });

    if (!makeResponse.ok) {
      const errorBody = await makeResponse.text();
      console.error('Failed to forward to Make.com webhook:', makeResponse.status, errorBody);
      // Retorna o status e a mensagem de erro do Make.com para uma depuração mais fácil
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
