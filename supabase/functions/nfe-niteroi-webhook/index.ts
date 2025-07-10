import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from "https://esm.sh/stripe@12.3.0?target=deno"

// --- CORREÇÃO ---
// 1. Inicializamos o cliente da Stripe da forma padrão, sem o CryptoProvider na configuração inicial.
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  httpClient: Stripe.createFetchHttpClient(),
  apiVersion: '2024-04-10',
})

// 2. Criamos uma instância do CryptoProvider separadamente.
const cryptoProvider = Stripe.createSubtleCryptoProvider()

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Método não permitido', { status: 405 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Assinatura da Stripe ausente no cabeçalho.', { status: 400 })
  }

  const body = await req.text()
  let event

  try {
    // 3. Usamos a função `constructEventAsync` e passamos o cryptoProvider que criamos.
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      Deno.env.get('STRIPE_NFE_WEBHOOK_SECRET')!,
      undefined,
      cryptoProvider
    )
  } catch (err) {
    console.error(`Erro na verificação do webhook: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }

  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
      // 1. Prepara os parâmetros para chamar a função do banco de dados.
      const params = {
        p_invoice_id: invoice.id,
        p_invoice_number: invoice.number,
        p_invoice_total: (invoice.total / 100),
        p_customer_name: invoice.customer_name,
        p_customer_tax_id: invoice.customer_tax_ids?.[0]?.value || 'NAO_INFORMADO',
        p_customer_address_line1: invoice.customer_address?.line1 || 'NAO_INFORMADO',
        p_customer_address_line2: invoice.customer_address?.line2 || 'S/N',
        p_customer_address_state: invoice.customer_address?.state || 'RJ',
        p_customer_address_postal_code: invoice.customer_address?.postal_code || '20000000',
        p_stripe_customer_id: invoice.customer, // <-- Enviando o ID do cliente da Stripe
        p_empresa_cnpj: Deno.env.get('SUA_EMPRESA_CNPJ'),
        p_empresa_im: Deno.env.get('SUA_EMPRESA_IM'),
        p_nfe_certificate: Deno.env.get('NFE_CERTIFICATE'), // <-- Enviando o certificado
        p_nfe_private_key: Deno.env.get('NFE_PRIVATE_KEY')   // <-- Enviando a chave
      };
      
      // 2. Chama a função do banco de dados `emitir_nfe_niteroi`.
      const { data, error } = await supabaseAdmin.rpc('emitir_nfe_niteroi', params);

      if (error) {
        // Se a chamada RPC falhar, lança um erro para ser pego pelo catch.
        throw new Error(`Erro ao chamar a função do banco de dados: ${error.message}`);
      }

      console.log('Resposta da função de emissão de NF-e:', data);

    } catch (err) {
      // O erro já foi (ou deveria ter sido) registrado no banco de dados pela própria função SQL.
      // Aqui apenas logamos para depuração na Edge Function.
      console.error(`Erro final na Edge Function: ${err.message}`);
      return new Response(`Erro interno: ${err.message}`, { status: 500 });
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
