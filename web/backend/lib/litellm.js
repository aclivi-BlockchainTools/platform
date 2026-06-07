export async function callLiteLLM(model, prompt, config) {
  const host = config.LITELLM_HOST || '127.0.0.1';
  const port = config.LITELLM_PORT || '4000';
  const key = config.LITELLM_MASTER_KEY || 'sk-local-platform';
  const url = `http://${host}:${port}/v1/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096
    })
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`LiteLLM HTTP ${response.status}: ${text}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(data.error.message || 'LiteLLM error');
  }

  return data.choices[0].message.content;
}

export async function testModel(model, config) {
  try {
    const host = config.LITELLM_HOST || '127.0.0.1';
    const port = config.LITELLM_PORT || '4000';
    const key = config.LITELLM_MASTER_KEY || 'sk-local-platform';
    const url = `http://${host}:${port}/v1/chat/completions`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 10
      })
    });

    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
    const data = await response.json();
    if (data.error) return { ok: false, error: data.error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export async function checkLiteLLMHealth(config) {
  try {
    const host = config.LITELLM_HOST || '127.0.0.1';
    const port = config.LITELLM_PORT || '4000';
    const url = `http://${host}:${port}/health`;
    const response = await fetch(url);
    return response.ok || response.status === 401;
  } catch {
    return false;
  }
}
