// supabase/functions/cancel-subscription/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@12.12.0?target=deno'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  // @ts-ignore
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { subscriptionId } = await req.json()
    if (!subscriptionId) {
      throw new Error('O ID da assinatura (subscriptionId) é obrigatório.')
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    // --- ALTERAÇÃO AQUI: Usando o método .del() para cancelamento imediato ---
    const canceledSubscription = await stripe.subscriptions.del(subscriptionId);

    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        stripe_subscription_status: canceledSubscription.status, // O status será 'canceled'
        canceled_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscriptionId)

    if (updateError) {
      throw updateError
    }

    return new Response(
      JSON.stringify({ message: 'Assinatura cancelada imediatamente.', status: canceledSubscription.status }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})