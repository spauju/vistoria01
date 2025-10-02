'use client';

export async function notifyWebhook(payload: any) {
  try {
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
      // Optional: Don't throw an error to the user, just log it.
      // throw new Error(`Webhook notification failed: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending webhook notification:', error);
     // Optional: Don't throw an error to the user, just log it.
    // throw new Error('Could not send webhook notification.');
  }
}
