import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
// 1. Importar a biblioteca da Stripe
import Stripe from "https://esm.sh/stripe@12.3.0?target=deno"

// 2. Inicializar o cliente da Stripe com sua chave secreta da API
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') as string, {
  httpClient: Stripe.createFetchHttpClient(),
})

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Método não permitido', { status: 405 })
  }

  // 3. Validação da assinatura do webhook (Passo de Segurança Essencial)
  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return new Response('Assinatura da Stripe ausente no cabeçalho.', { status: 400 })
  }

  const body = await req.text() // É crucial ler o corpo como texto bruto para a verificação
  let event

  try {
    // Usar o segredo do webhook para verificar se a requisição é genuína
    event = await stripe.webhooks.constructEvent(
      body,
      signature,
      Deno.env.get('STRIPE_WEBHOOK_SIGNING_SECRET')! // Use o segredo do endpoint do webhook aqui
    )
  } catch (err) {
    console.error(`Erro na verificação do webhook: ${err.message}`)
    return new Response(`Webhook Error: ${err.message}`, { status: 400 })
  }
  // Fim da validação de segurança

  // 4. Processar apenas o evento que nos interessa
  if (event.type === 'invoice.payment_succeeded') {
    const invoice = event.data.object
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    try {
      // 5. Montar o XML da NFS-e (RPS)
      const xmlData = `
        <EnviarLoteRpsSincronoEnvio xmlns="http://www.abrasf.org.br/nfse.xsd">
          <LoteRps id="lote_${invoice.id}">
            <NumeroLote>1</NumeroLote>
            <Cnpj>${Deno.env.get('SUA_EMPRESA_CNPJ')}</Cnpj>
            <InscricaoMunicipal>${Deno.env.get('SUA_EMPRESA_IM')}</InscricaoMunicipal>
            <QuantidadeRps>1</QuantidadeRps>
            <ListaRps>
              <Rps>
                <InfDeclaracaoPrestacaoServico>
                  <Rps>
                    <IdentificacaoRps>
                      <Numero>1</Numero>
                      <Serie>S1</Serie>
                      <Tipo>1</Tipo>
                    </IdentificacaoRps>
                    <DataEmissao>${new Date().toISOString()}</DataEmissao>
                    <Status>1</Status>
                  </Rps>
                  <Competencia>${new Date().toISOString()}</Competencia>
                  <Servico>
                     <Valores>
                        <ValorServicos>${(invoice.total / 100).toFixed(2)}</ValorServicos>
                        <IssRetido>2</IssRetido>
                     </Valores>
                     <ItemListaServico>01.07</ItemListaServico>
                     <Discriminacao>Pagamento da mensalidade do sistema - Fatura #${invoice.number}</Discriminacao>
                     <CodigoMunicipio>3303302</CodigoMunicipio>
                     <ExigibilidadeISS>1</ExigibilidadeISS>
                     <OptanteSimplesNacional>1</OptanteSimplesNacional>
                     <IncentivoFiscal>2</IncentivoFiscal>
                  </Servico>
                  <Prestador>
                     <Cnpj>${Deno.env.get('SUA_EMPRESA_CNPJ')}</Cnpj>
                     <InscricaoMunicipal>${Deno.env.get('SUA_EMPRESA_IM')}</InscricaoMunicipal>
                  </Prestador>
                  <Tomador>
                    <IdentificacaoTomador>
                      <CpfCnpj><Cnpj>${invoice.customer_tax_ids?.[0]?.value || 'NAO_INFORMADO'}</Cnpj></CpfCnpj>
                    </IdentificacaoTomador>
                    <RazaoSocial>${invoice.customer_name}</RazaoSocial>
                    <Endereco>
                      <Endereco>${invoice.customer_address?.line1 || 'NAO_INFORMADO'}</Endereco>
                      <Numero>${invoice.customer_address?.line2 || 'S/N'}</Numero>
                      <Bairro>${invoice.customer_address?.state || 'NAO_INFORMADO'}</Bairro>
                      <CodigoMunicipio>3304557</CodigoMunicipio>
                      <Uf>${invoice.customer_address?.state || 'RJ'}</Uf>
                      <Cep>${invoice.customer_address?.postal_code || '20000000'}</Cep>
                    </Endereco>
                  </Tomador>
                </InfDeclaracaoPrestacaoServico>
              </Rps>
            </ListaRps>
          </LoteRps>
        </EnviarLoteRpsSincronoEnvio>
      `

      // 6. Enviar para o WebService da prefeitura (a lógica permanece a mesma)
      const responseNfse = await fetch('https://nfse.niteroi.rj.gov.br/nfse/WSNacional2/nfse.asmx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/soap+xml; charset=utf-8' },
        body: xmlData,
      })

      if (!responseNfse.ok) {
        throw new Error(`Erro na API da prefeitura: ${responseNfse.statusText}`)
      }

      const responseText = await responseNfse.text()

      // 7. Salvar o resultado no banco
      await supabaseAdmin.from('notas_fiscais').insert({
        user_id: invoice.metadata.user_id,
        stripe_invoice_id: invoice.id,
        status: 'issued', // ou 'error' dependendo da resposta
        // ...outros campos da nota...
      })

    } catch (err) {
      await supabaseAdmin.from('notas_fiscais').insert({
        user_id: invoice.metadata.user_id,
        stripe_invoice_id: invoice.id,
        status: 'error',
        error_message: err.message,
      })
      return new Response(`Erro interno: ${err.message}`, { status: 500 })
    }
  }

  // Resposta padrão de sucesso para a Stripe
  return new Response(JSON.stringify({ received: true }), {
    headers: { 'Content-Type': 'application/json' },
  })
})