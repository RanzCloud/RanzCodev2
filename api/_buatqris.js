const BUATQRIS_ENDPOINT = 'https://app.buatqris.site/api';

export async function createQrisTransaction({ account_id, secret_token, amount, description, callback_url, test }) {
  try {
    const params = new URLSearchParams();
    params.append('action', 'api_create_qris');
    params.append('account_id', account_id);
    params.append('secret_token', secret_token);
    params.append('amount', String(Math.round(amount)));
    if (description) params.append('description', description);
    if (callback_url) params.append('callback_url', callback_url);
    if (test) params.append('test', '1');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(BUATQRIS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

export async function checkQrisStatus({ account_id, secret_token, transaction_id }) {
  try {
    const params = new URLSearchParams();
    params.append('action', 'api_check_status');
    params.append('account_id', account_id);
    params.append('secret_token', secret_token);
    params.append('transaction_id', transaction_id);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(BUATQRIS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    const data = await res.json();
    return data;
  } catch (err) {
    return { success: false, error: err.message };
  }
}
