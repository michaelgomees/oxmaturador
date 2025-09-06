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
    console.log('Evolution get-instance request:', { baseUrl, instanceName, base });
    
    // Endpoint para obter informações da instância
    const candidates = [
      `${base}/instance/fetchInstances?instanceName=${encodeURIComponent(instanceName)}`,
      `${base}/instance/${encodeURIComponent(instanceName)}`,
      `${base}/instance/connectionState/${encodeURIComponent(instanceName)}`,
    ];

    let finalRes: Response | null = null;
    const attempts: Array<{url:string; method:string; status:number; contentType:string; bodySnippet:string}> = [];
    
    for (const url of candidates) {
      try {
        console.log('Trying URL:', url);
        
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
      } catch (e) {
        console.error('Error with URL:', url, e);
        attempts.push({ url, method: 'ERROR', status: 0, contentType: '', bodySnippet: String(e) });
      }
    }

    if (!finalRes) {
      console.error('All instance endpoints failed:', attempts);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Não foi possível obter dados da instância da Evolution API', 
          tried: attempts,
          instanceName 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let json: any = {};
    try { 
      const text = await finalRes.text();
      console.log('Response text:', text.slice(0, 500));
      json = JSON.parse(text); 
      console.log('Parsed JSON:', json);
    } catch (e) { 
      console.error('Failed to parse JSON:', e);
      return new Response(
        JSON.stringify({ success: false, message: 'Erro ao processar resposta da Evolution API' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extrair informações da resposta
    let instanceData: any = {};
    
    if (Array.isArray(json)) {
      // Se for array, procurar pela instância
      instanceData = json.find(instance => instance.instanceName === instanceName) || json[0] || {};
    } else if (json.instance) {
      instanceData = json.instance;
    } else {
      instanceData = json;
    }

    // Extrair dados relevantes
    const phoneNumber = instanceData.owner || instanceData.phone || instanceData.number || null;
    const profilePicture = instanceData.profilePicture || instanceData.picture || instanceData.avatar || null;
    const status = instanceData.state || instanceData.status || instanceData.connectionState || 'disconnected';
    const displayName = instanceData.displayName || instanceData.pushname || instanceData.name || null;

    console.log('Instance data extracted:', { phoneNumber, profilePicture, status, displayName });

    return new Response(
      JSON.stringify({ 
        success: true, 
        instanceName,
        phoneNumber,
        profilePicture,
        status,
        displayName,
        rawData: instanceData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('evolution-get-instance error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno ao obter dados da instância', details: String(error) }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});