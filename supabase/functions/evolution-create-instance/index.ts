import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeBaseUrl(url: string) {
  let u = String(url || '').trim();
  if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
  return u.replace(/\/$/, '');
}

async function tryRequest(url: string, apiKey: string, method: string, body?: Record<string, unknown>) {
  const init: RequestInit = {
    method,
    headers: {
      'apikey': apiKey,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  };

  const res = await fetch(url, init);
  const text = await res.text();
  let json: unknown = undefined;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    // keep as text
  }
  return { ok: res.ok, status: res.status, url, method, requestBody: body, responseText: text, responseJson: json };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { baseUrl, instanceName } = await req.json();
    console.log('Received request:', { baseUrl, instanceName });

    if (!baseUrl || !instanceName) {
      return new Response(
        JSON.stringify({ success: false, message: 'baseUrl e instanceName são obrigatórios' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('EVOLUTION_API_KEY');
    if (!apiKey) {
      console.error('EVOLUTION_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ success: false, message: 'EVOLUTION_API_KEY não configurada nas Functions' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const base = normalizeBaseUrl(baseUrl);

    // Tentar múltiplos caminhos/métodos comuns da Evolution API
    const candidates: Array<{ path: string; method: string; body?: Record<string, unknown> }> = [
      // Rotas mais comuns da Evolution API
      { path: '/instance/create', method: 'POST', body: { instanceName } },
      { path: `/instance/create/${encodeURIComponent(instanceName)}`, method: 'POST' },
      { path: '/manager/instances/create', method: 'POST', body: { instanceName } },
      { path: '/instances/create', method: 'POST', body: { instanceName } },
      { path: '/instance', method: 'POST', body: { instanceName } },
      { path: '/instances', method: 'POST', body: { instanceName } },
      { path: '/v1/instance/create', method: 'POST', body: { instanceName } },
      { path: '/api/instance/create', method: 'POST', body: { instanceName } },
      // Variações com diferentes parâmetros
      { path: '/instance/create', method: 'POST', body: { name: instanceName } },
      { path: '/instance/create', method: 'POST', body: { instance: instanceName } },
      { path: '/manager/instances', method: 'POST', body: { instanceName } },
      { path: '/manager/instances', method: 'POST', body: { name: instanceName } },
    ];

    const attempts: any[] = [];
    let successResult: any = null;

    for (const c of candidates) {
      const url = `${base}${c.path}`;
      console.log('Trying Evolution endpoint:', { url, method: c.method, body: c.body });
      try {
        const result = await tryRequest(url, apiKey, c.method, c.body);
        attempts.push({ url: result.url, method: result.method, status: result.status, response: result.responseJson ?? result.responseText, requestBody: result.requestBody });
        console.log('Attempt result:', { url: result.url, status: result.status });
        if (result.ok) {
          successResult = { endpoint: url, status: result.status, data: result.responseJson ?? result.responseText };
          break;
        }
      } catch (e) {
        attempts.push({ url, method: c.method, error: String(e) });
        console.error('Attempt error:', url, e);
      }
    }

    if (!successResult) {
      console.error('All Evolution endpoints failed');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Falha ao criar instância na Evolution (todas as tentativas falharam).',
          instanceName,
          tried: attempts,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Evolution API success response on:', successResult.endpoint);

    return new Response(
      JSON.stringify({ success: true, instanceName, endpointUsed: successResult.endpoint, data: successResult.data }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('evolution-create-instance error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno ao criar instância', details: String(error) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
