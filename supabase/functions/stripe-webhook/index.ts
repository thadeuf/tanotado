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

        if (!userId || !subscriptionId) {
          console.log('Sessão de checkout sem ID de usuário ou assinatura. Ignorando.');
          break;
        }

        const subscription = await stripe.subscriptions.retrieve(subscriptionId);

        await supabaseAdmin
          .from('profiles')
          .update({
            is_subscribed: true,
            stripe_customer_id: subscription.customer as string,
            stripe_subscription_id: subscription.id,
            stripe_subscription_status: subscription.status,
            subscription_current_period_end: toDateTime(subscription.current_period_end),
          })
          .eq('id', userId);
        
        console.log(`Usuário ${userId} assinou com sucesso!`);
        break;
      }

      // Bloco unificado e corrigido para quando uma fatura é paga
      case 'invoice.payment_succeeded':
      case 'invoice.paid': {
        const invoice = receivedEvent.data.object as Stripe.Invoice;
        
        const lineItem = invoice.lines.data[0];
        const newPeriodEnd = lineItem?.period?.end ? toDateTime(lineItem.period.end) : null;
        
        if (!newPeriodEnd) {
          console.log(`Fatura ${invoice.id} paga, mas não foi possível determinar a nova data de renovação.`);
          break;
        }

        // Encontra o perfil para obter o ID do usuário
        const { data: profile, error: findProfileError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('stripe_customer_id', invoice.customer)
            .single();

        if (findProfileError || !profile) {
            console.error(`Webhook: Perfil não encontrado para o customer_id: ${invoice.customer}. Erro: ${findProfileError?.message}`);
            break;
        }

        // Prepara os dados para as duas tabelas
        const profileUpdateData = {
          is_subscribed: true,
          stripe_subscription_status: 'active',
          subscription_current_period_end: newPeriodEnd,
        };

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
        
        // Executa as duas atualizações em paralelo
        const [profileResult, invoiceResult] = await Promise.all([
            supabaseAdmin.from('profiles').update(profileUpdateData).eq('stripe_customer_id', invoice.customer),
            supabaseAdmin.from('invoices').upsert(invoiceData, { onConflict: 'id' })
        ]);

        if (profileResult.error) {
            console.error('Erro ao atualizar o perfil:', profileResult.error);
            throw profileResult.error;
        }
        
        if (invoiceResult.error) {
            console.error('Erro ao salvar a fatura:', invoiceResult.error);
            throw invoiceResult.error;
        }

        console.log(`Processo de pagamento para a fatura ${invoice.id} concluído com sucesso.`);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = receivedEvent.data.object as Stripe.Invoice;

        await supabaseAdmin
          .from('profiles')
          .update({ stripe_subscription_status: 'past_due' })
          .eq('stripe_customer_id', invoice.customer);

        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('id, subscription_current_period_end')
            .eq('stripe_customer_id', invoice.customer)
            .single();
        
        if (profile) {
            await supabaseAdmin.from('invoices').upsert({
                id: invoice.id,
                user_id: profile.id,
                customer_id: invoice.customer as string,
                created_at: toDateTime(invoice.created),
                pdf_url: invoice.hosted_invoice_url,
                total: invoice.amount_due,
                status: 'open',
                paid: false,
                next_billing_date: profile.subscription_current_period_end,
            }, { onConflict: 'id' });
            console.log(`Fatura pendente ${invoice.id} salva.`);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = receivedEvent.data.object as Stripe.Subscription;
        await supabaseAdmin
          .from('profiles')
          .update({
            is_subscribed: false,
            stripe_subscription_status: 'canceled',
            canceled_at: toDateTime(subscription.canceled_at),
          })
          .eq('stripe_subscription_id', subscription.id);
        console.log(`Assinatura ${subscription.id} cancelada.`);
        break;
      }

    }
  } catch (error) {
      console.error('Erro no processamento do webhook:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})