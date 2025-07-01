// supabase/functions/stripe-webhook/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.20.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Inicializa o cliente da Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const toDateTime = (secs: number) => new Date(secs * 1000).toISOString();

serve(async (req) => {
  const signature = req.headers.get('Stripe-Signature')
  const body = await req.text()

  let receivedEvent: Stripe.Event;
  try {
    receivedEvent = await stripe.webhooks.constructEventAsync(
      body,
      signature!,
      Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')!
    )
  } catch (err) {
    return new Response(err.message, { status: 400 })
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    switch (receivedEvent.type) {
      case 'checkout.session.completed': {
        const session = receivedEvent.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id;
        const subscriptionId = session.subscription as string;

        if (!userId) throw new Error('User ID (client_reference_id) não encontrado.');
        if (!subscriptionId) {
          console.log('Sessão de checkout completada, mas não é uma assinatura. Ignorando.');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // --- INÍCIO DA CORREÇÃO ---
        // Agora atualizamos TODOS os campos necessários, incluindo o 'subscription_status' do seu app.
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            is_subscribed: true,
            subscription_status: 'active', // <<< AQUI ESTÁ A CORREÇÃO PRINCIPAL
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            stripe_subscription_status: subscription.status,
            subscription_current_period_end: toDateTime(subscription.current_period_end),
          })
          .eq('id', userId);
        // --- FIM DA CORREÇÃO ---

        if (error) throw error;
        console.log(`Usuário ${userId} assinou com sucesso! Status do App atualizado para 'active'.`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = receivedEvent.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (!subscriptionId) {
          console.log(`Fatura ${invoice.id} paga (não é de assinatura). Ignorando.`);
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        // Atualiza a data de expiração e o status da Stripe na renovação
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            stripe_subscription_status: subscription.status,
            subscription_current_period_end: toDateTime(subscription.current_period_end),
          })
          .eq('stripe_subscription_id', subscription.id);

        if (error) throw error;
        console.log(`Assinatura ${subscription.id} renovada. Novo status: ${subscription.status}.`);
        break;
      }

      default:
        // console.log(`Evento não tratado: ${receivedEvent.type}`);
    }
  } catch (error) {
      console.error(error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})