'use client';

export async function notifyWebhook(payload: any) {
  try {
    await fetch('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  } catch (error) {
    // Silently fail or add more robust logging if needed.
    // We don't want to block the user's flow if the webhook fails.
    console.error('Webhook notification failed:', error);
  }
}
