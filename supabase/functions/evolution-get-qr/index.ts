import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchWithLog(url: string, init: RequestInit) {
  const res = await fetch(url, init);
  let snippet = '';
  try { snippet = (await res.clone().text()).slice(0, 200); } catch { /* ignore */ }
  return {
    res,
    log: {
      url,
      method: (init.method || 'GET'),
      status: res.status,
      contentType: res.headers.get('content-type') || '',
      bodySnippet: snippet,
    }
  };
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
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('EVOLUTION_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, message: 'EVOLUTION_API_KEY não configurada nas Functions' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const base = baseUrl.replace(/\/$/, '');
    console.log('Evolution get-qr request:', { baseUrl, instanceName, base });
    
    // Endpoint oficial da Evolution API para obter QR Code
    const candidates = [
      `${base}/instance/connect/${encodeURIComponent(instanceName)}`,
      `${base}/instance/qrcode?instanceName=${encodeURIComponent(instanceName)}`,
      `${base}/instance/${encodeURIComponent(instanceName)}/qrcode`,
    ];

    let finalRes: Response | null = null;
    const attempts: Array<{url:string; method:string; status:number; contentType:string; bodySnippet:string}> = [];
    
    for (const url of candidates) {
      try {
        console.log('Trying URL:', url);
        
        // GET attempt (mais comum para QR code)
        const { res: resGet, log: logGet } = await fetchWithLog(url, {
          method: 'GET',
          headers: { 'apikey': apiKey },
        });
        attempts.push(logGet);
        console.log('GET result:', logGet);
        
        if (resGet.ok) { 
          finalRes = resGet; 
          console.log('Success with GET:', url);
          break; 
        }

        // POST attempt apenas se GET falhar
        const { res: resPost, log: logPost } = await fetchWithLog(url, {
          method: 'POST',
          headers: { 'apikey': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ instanceName }),
        });
        attempts.push(logPost);
        console.log('POST result:', logPost);
        
        if (resPost.ok) { 
          finalRes = resPost; 
          console.log('Success with POST:', url);
          break; 
        }
      } catch (e) {
        console.error('Error with URL:', url, e);
        attempts.push({ url, method: 'ERROR', status: 0, contentType: '', bodySnippet: String(e) });
      }
    }

    if (!finalRes) {
      console.error('All QR endpoints failed:', attempts);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Não foi possível obter QR Code da Evolution API. Verifique se a instância existe e está funcionando.', 
          tried: attempts,
          instanceName 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const contentType = finalRes.headers.get('content-type') || '';
    console.log('Final response content-type:', contentType);
    
    if (contentType.includes('image/')) {
      console.log('Response is image, converting to base64...');
      const arrayBuffer = await finalRes.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      const mime = contentType.split(';')[0];
      const dataUrl = `data:${mime};base64,${base64}`;
      console.log('Image converted to data URL, length:', dataUrl.length);
      return new Response(
        JSON.stringify({ success: true, instanceName, qrCode: dataUrl, contentType: mime }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Try JSON body with common fields
    let json: any = {};
    try { 
      const text = await finalRes.text();
      console.log('Response text:', text.slice(0, 500));
      json = JSON.parse(text); 
      console.log('Parsed JSON:', json);
    } catch (e) { 
      console.error('Failed to parse JSON:', e);
    }

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

    console.log('QR candidate found:', qrCandidate ? 'YES' : 'NO');

    if (!qrCandidate) {
      console.error('No QR code found in response:', json);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Resposta inválida da Evolution API ao obter QR. A instância pode não estar pronta para gerar QR Code.', 
          json,
          instanceName 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize to data URL if plain base64
    if (!/^data:image\//i.test(qrCandidate) && /^(?:[A-Za-z0-9+/]+={0,2})$/.test(qrCandidate.replace(/\s+/g, ''))) {
      qrCandidate = `data:image/png;base64,${qrCandidate}`;
    }

    console.log('Final QR code ready, length:', qrCandidate.length);
    return new Response(
      JSON.stringify({ success: true, instanceName, qrCode: qrCandidate }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('evolution-get-qr error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno ao obter QR', details: String(error) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
