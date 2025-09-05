import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { baseUrl, instanceName } = await req.json();
    console.log('Received request:', { baseUrl, instanceName });

    if (!baseUrl || !instanceName) {
      console.error('Missing required fields:', { baseUrl, instanceName });
      return new Response(
        JSON.stringify({ success: false, message: 'baseUrl e instanceName são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('EVOLUTION_API_KEY');
    if (!apiKey) {
      console.error('EVOLUTION_API_KEY not found in environment');
      return new Response(
        JSON.stringify({ success: false, message: 'EVOLUTION_API_KEY não configurada nas Functions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const url = `${baseUrl.replace(/\/$/, '')}/manager/instances/create`;
    console.log('Making request to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ instanceName }),
    });

    console.log('Evolution API response status:', response.status);

    if (!response.ok) {
      const text = await response.text();
      console.error('Evolution API error response:', { status: response.status, text });
      return new Response(
        JSON.stringify({ success: false, message: `Erro Evolution: ${response.status}`, details: text }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json().catch(() => ({}));
    console.log('Evolution API success response:', data);

    return new Response(
      JSON.stringify({ success: true, instanceName, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('evolution-create-instance error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Erro interno ao criar instância' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
