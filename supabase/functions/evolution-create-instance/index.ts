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
    const url = `${base}/instance/create`;
    
    // Formato correto baseado na documentação oficial da Evolution API
    const payload = {
      instanceName: instanceName,
      qrcode: true,
      integration: "WHATSAPP-BAILEYS"
    };

    console.log('Making request to Evolution API:', { url, payload });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    console.log('Evolution API response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error('Evolution API error response:', { status: response.status, text });
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Erro Evolution: ${response.status}`, 
          details: text,
          endpoint: url 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json().catch(() => ({}));
    console.log('Evolution API success response:', data);

    return new Response(
      JSON.stringify({ success: true, instanceName, data, endpoint: url }),
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