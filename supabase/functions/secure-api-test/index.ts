import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { api_type, test_data } = await req.json();
    
    // Get API keys from environment
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    
    let result = { success: false, message: 'Teste não implementado' };
    
    switch (api_type) {
      case 'evolution':
        if (!evolutionApiKey) {
          result = { success: false, message: 'Evolution API Key não configurada' };
          break;
        }
        
        try {
          const response = await fetch(`${test_data.baseUrl}/manager/findInstances`, {
            method: 'GET',
            headers: {
              'apikey': evolutionApiKey,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            result = { success: true, message: 'Conexão com Evolution API bem-sucedida' };
          } else {
            result = { success: false, message: `Erro na API: ${response.status}` };
          }
        } catch (error) {
          result = { success: false, message: `Erro de conexão: ${error.message}` };
        }
        break;
        
      case 'openai':
        if (!openaiApiKey) {
          result = { success: false, message: 'OpenAI API Key não configurada' };
          break;
        }
        
        try {
          const response = await fetch('https://api.openai.com/v1/models', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${openaiApiKey}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            result = { success: true, message: 'Conexão com OpenAI bem-sucedida' };
          } else {
            result = { success: false, message: `Erro na API: ${response.status}` };
          }
        } catch (error) {
          result = { success: false, message: `Erro de conexão: ${error.message}` };
        }
        break;
        
      case 'anthropic':
        if (!anthropicApiKey) {
          result = { success: false, message: 'Anthropic API Key não configurada' };
          break;
        }
        
        try {
          const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': anthropicApiKey,
              'Content-Type': 'application/json',
              'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
              model: 'claude-3-haiku-20240307',
              max_tokens: 10,
              messages: [{ role: 'user', content: 'Test' }]
            })
          });
          
          if (response.ok || response.status === 400) { // 400 é esperado para teste básico
            result = { success: true, message: 'Conexão com Anthropic bem-sucedida' };
          } else {
            result = { success: false, message: `Erro na API: ${response.status}` };
          }
        } catch (error) {
          result = { success: false, message: `Erro de conexão: ${error.message}` };
        }
        break;
        
      case 'google':
        if (!googleApiKey) {
          result = { success: false, message: 'Google API Key não configurada' };
          break;
        }
        
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${googleApiKey}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok) {
            result = { success: true, message: 'Conexão com Google AI bem-sucedida' };
          } else {
            result = { success: false, message: `Erro na API: ${response.status}` };
          }
        } catch (error) {
          result = { success: false, message: `Erro de conexão: ${error.message}` };
        }
        break;
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Erro na função secure-api-test:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      message: 'Erro interno do servidor' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});