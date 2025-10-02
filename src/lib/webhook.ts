'use client';

export async function notifyWebhook(payload: any) {
  try {
    // A rota da API no servidor agora lida com a autenticação.
    // O cliente não precisa mais de enviar a chave de API.
    const response = await fetch('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('Webhook notification failed:', response.status, errorBody);
    }
  } catch (error) {
    console.error('Error sending webhook notification:', error);
  }
}
