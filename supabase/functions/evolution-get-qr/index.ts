import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function tryFetch(url: string, apiKey: string, instanceName: string) {
  // Try GET without body first
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'apikey': apiKey,
    },
  });
  if (res.ok) return res;

  // Try POST with JSON
  const res2 = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ instanceName }),
  });
  return res2;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { baseUrl, instanceName } = await req.json();

    if (!baseUrl || !instanceName) {
      return new Response(
        JSON.stringify({ success: false, message: 'baseUrl e instanceName são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('EVOLUTION_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, message: 'EVOLUTION_API_KEY não configurada nas Functions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const base = baseUrl.replace(/\/$/, '');
    // Try multiple known patterns
    const candidates = [
      `${base}/instance/qr?instanceName=${encodeURIComponent(instanceName)}`,
      `${base}/instance/qrcode?instanceName=${encodeURIComponent(instanceName)}`,
      `${base}/instance/${encodeURIComponent(instanceName)}/qrcode`,
      `${base}/instances/${encodeURIComponent(instanceName)}/qrcode`,
      `${base}/instances/qr?instanceName=${encodeURIComponent(instanceName)}`,
      `${base}/manager/instances/${encodeURIComponent(instanceName)}/qrcode`,
      `${base}/manager/instances/qr?instanceName=${encodeURIComponent(instanceName)}`,
    ];

    let finalRes: Response | null = null;
    for (const url of candidates) {
      try {
        const res = await tryFetch(url, apiKey, instanceName);
        if (res.ok) { finalRes = res; break; }
      } catch (_) { /* try next */ }
    }

    if (!finalRes) {
      return new Response(
        JSON.stringify({ success: false, message: 'Não foi possível obter QR Code da Evolution API' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentType = finalRes.headers.get('content-type') || '';
    if (contentType.includes('image/')) {
      const arrayBuffer = await finalRes.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const mime = contentType.split(';')[0];
      const dataUrl = `data:${mime};base64,${base64}`;
      return new Response(
        JSON.stringify({ success: true, instanceName, qrCode: dataUrl, contentType: mime }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try JSON body with common fields
    let json: any = {};
    try { json = await finalRes.json(); } catch { /* ignore */ }

    let qrCandidate: string | null = null;
    // Common Evolution API shapes
    qrCandidate =
      json?.qrcode?.base64 ||
      json?.qrcode ||
      json?.base64 ||
      json?.qrCode ||
      json?.qr ||
      json?.image ||
      json?.imageUrl ||
      json?.url ||
      null;

    if (!qrCandidate) {
      return new Response(
        JSON.stringify({ success: false, message: 'Resposta inválida da Evolution API ao obter QR', json }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize to data URL if plain base64
    if (!/^data:image\//i.test(qrCandidate) && /^(?:[A-Za-z0-9+/]+={0,2})$/.test(qrCandidate.replace(/\s+/g, ''))) {
      qrCandidate = `data:image/png;base64,${qrCandidate}`;
    }

    return new Response(
      JSON.stringify({ success: true, instanceName, qrCode: qrCandidate }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('evolution-get-qr error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno ao obter QR' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
