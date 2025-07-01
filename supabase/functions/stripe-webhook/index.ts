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

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            is_subscribed: true,
            subscription_status: 'active',
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            stripe_subscription_status: subscription.status,
            subscription_current_period_end: toDateTime(subscription.current_period_end),
          })
          .eq('id', userId);

        if (error) throw error;
        console.log(`Usuário ${userId} assinou com sucesso! Status do App atualizado para 'active'.`);
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = receivedEvent.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, subscription_current_period_end')
            .eq('stripe_customer_id', invoice.customer)
            .single();

        if (profileError) {
            console.error(`Webhook: Perfil não encontrado para o customer_id: ${invoice.customer}. Erro: ${profileError.message}`);
            return new Response(JSON.stringify({ error: `Perfil não encontrado` }), { status: 200 });
        }

        // --- SUBSTITUIÇÃO SIMPLES E DIRETA ---
        
        // 1. Montar o objeto para salvar, usando a URL correta e sem complicações.
        const invoiceData = {
          id: invoice.id,
          user_id: profile.id,
          customer_id: invoice.customer as string,
          created_at: toDateTime(invoice.created),
          // A URL que você precisa, diretamente do evento, sem chamadas extras.
          pdf_url: invoice.hosted_invoice_url, 
          total: invoice.amount_paid,
          status: invoice.status,
          paid: invoice.paid,
          next_billing_date: profile.subscription_current_period_end,
        };

        // 2. Salvar (ou atualizar) a fatura na sua tabela.
        const { error: invoiceError } = await supabaseAdmin
          .from('invoices')
          .upsert(invoiceData, { onConflict: 'id' });

        if (invoiceError) throw invoiceError;

        console.log(`Webhook: Fatura ${invoice.id} salva com sucesso para o usuário ${profile.id}.`);

        // 3. Atualizar o status da assinatura.
        if (!subscriptionId) {
          console.log(`Webhook: Fatura ${invoice.id} paga, mas não pertence a uma assinatura.`);
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        
        const { error: updateProfileError } = await supabaseAdmin
          .from('profiles')
          .update({
            stripe_subscription_status: subscription.status,
            subscription_current_period_end: toDateTime(subscription.current_period_end),
          })
          .eq('id', profile.id);

        if (updateProfileError) throw updateProfileError;

        console.log(`Webhook: Assinatura ${subscription.id} renovada para o usuário ${profile.id}.`);
        
        break;
      }

      default:
        // console.log(`Evento não tratado: ${receivedEvent.type}`);
    }
  } catch (error) {
      console.error('Erro fatal no processamento do webhook:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})