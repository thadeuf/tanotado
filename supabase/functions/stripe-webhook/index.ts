// supabase/functions/stripe-webhook/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import Stripe from 'https://esm.sh/stripe@14.20.0?target=deno'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

// Função segura para converter o timestamp
const toDateTime = (secs: number | null | undefined): string | null => {
  if (typeof secs !== 'number') return null;
  return new Date(secs * 1000).toISOString();
};

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
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            stripe_subscription_status: subscription.status,
            subscription_current_period_end: toDateTime(subscription.current_period_end),
          })
          .eq('id', userId);

        if (error) throw error;
        console.log(`Usuário ${userId} assinou com sucesso!`);
        break;
      }

      // Bloco unificado para quando uma fatura é paga
      case 'invoice.payment_succeeded':
      case 'invoice.paid': {
        const invoice = receivedEvent.data.object as Stripe.Invoice;
        
        // **A CORREÇÃO ESTÁ AQUI**
        // Pega a data de fim do período diretamente do item da fatura, como você apontou.
        const lineItem = invoice.lines.data[0];
        const newPeriodEnd = lineItem?.period?.end ? toDateTime(lineItem.period.end) : null;
        
        if (!newPeriodEnd) {
          console.log(`Fatura ${invoice.id} paga, mas não foi possível determinar a nova data de renovação. Ignorando atualização de perfil.`);
          break;
        }

        // Primeiro, atualiza o perfil do usuário com a nova data de renovação.
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({
            is_subscribed: true,
            stripe_subscription_status: 'active', // Garante que o status esteja ativo
            subscription_current_period_end: newPeriodEnd,
          })
          .eq('stripe_customer_id', invoice.customer);

        if (profileError) throw profileError;

        console.log(`Perfil do cliente ${invoice.customer} atualizado com a nova data de renovação.`);

        // Em seguida, salva os dados da fatura na sua tabela 'invoices'.
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', invoice.customer)
            .single();
        
        if (profile) {
            const invoiceData = {
                id: invoice.id,
                user_id: profile.id,
                customer_id: invoice.customer as string,
                created_at: toDateTime(invoice.created),
                pdf_url: invoice.hosted_invoice_url, 
                total: invoice.amount_paid,
                status: 'paid',
                paid: true,
                next_billing_date: newPeriodEnd,
            };
            await supabaseAdmin.from('invoices').upsert(invoiceData, { onConflict: 'id' });
            console.log(`Fatura ${invoice.id} salva para o usuário ${profile.id}.`);
        }
        
        break;
      }

      // Os outros cases permanecem como estão.
      case 'customer.subscription.deleted': {
        const subscription = receivedEvent.data.object as Stripe.Subscription;
        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            is_subscribed: false,
            stripe_subscription_status: 'canceled',
            canceled_at: toDateTime(subscription.canceled_at),
          })
          .eq('stripe_subscription_id', subscription.id);
        if (error) throw error;
        console.log(`Assinatura ${subscription.id} cancelada.`);
        break;
      }

      // ... (outros cases, como 'invoice.voided', podem ser mantidos)
    }
  } catch (error) {
      console.error('Erro fatal no processamento do webhook:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})