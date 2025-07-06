import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import ZipWriter from 'https://deno.land/x/zip@v1.2.0/mod.ts'; // Importe a biblioteca de ZIP

// Cabeçalhos CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Adicionado POST e OPTIONS
};

// Funções auxiliares para CSV (sem alterações)
const tiptapNodeToText = (node: any): string => {
    if (!node) return '';
    if (node.type === 'text' && node.text) return node.text;
    if (!node.content || !Array.isArray(node.content)) return '';
    return node.content.map(tiptapNodeToText).join('\n');
};

const escapeCsvValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    let str = String(value).replace(/\r\n/g, '\n');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        str = str.replace(/"/g, '""');
        return `"${str}"`;
    }
    return str;
};

// --- SERVIDOR DA FUNÇÃO ---
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. AUTENTICAÇÃO E BUSCA DE DADOS
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders });
    }

    const { data: patients } = await supabase.from('clients').select('*').eq('user_id', user.id);
    const { data: sessionReports } = await supabase.from('session_notes').select('*, appointments ( start_time )').eq('user_id', user.id);
    const { data: financialRecords } = await supabase.from('payments').select('*').eq('user_id', user.id);

    // 2. GERAÇÃO DOS CONTEÚDOS CSV
    let csvPacientes = 'Nome,Email,WhatsApp,CPF,Data de Nascimento,Endereço,Data de Cadastro\r\n';
    patients?.forEach(p => {
        const row = [p.name, p.email, p.whatsapp, p.cpf, p.birth_date ? new Date(p.birth_date).toLocaleDateString('pt-BR') : '', p.address, p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : ''].map(escapeCsvValue).join(',');
        csvPacientes += row + '\r\n';
    });

    let csvSessoes = 'ID,ID do Paciente,Data da Sessão,Resumo,Criado em\r\n';
    sessionReports?.forEach(r => {
        const row = [r.id, r.client_id, r.appointments ? new Date(r.appointments.start_time).toLocaleDateString('pt-BR') : 'N/A', tiptapNodeToText(r.content), r.created_at ? new Date(r.created_at).toLocaleDateString('pt-BR') : ''].map(escapeCsvValue).join(',');
        csvSessoes += row + '\r\n';
    });

    let csvFinanceiro = 'ID,ID do Paciente,Data,Descrição,Valor,Tipo,Status,Criado em\r\n';
    financialRecords?.forEach(f => {
        const row = [f.id, f.client_id, f.due_date ? new Date(f.due_date).toLocaleDateString('pt-BR') : '', f.notes, typeof f.amount === 'number' ? f.amount.toFixed(2).replace('.', ',') : '0,00', f.amount >= 0 ? 'Receita' : 'Despesa', f.status, f.created_at ? new Date(f.created_at).toLocaleDateString('pt-BR') : ''].map(escapeCsvValue).join(',');
        csvFinanceiro += row + '\r\n';
    });

    // 3. CRIAÇÃO DO ARQUIVO ZIP USANDO A BIBLIOTECA 'zip'
    const zipWriter = new ZipWriter();
    await zipWriter.add('pacientes.csv', new TextEncoder().encode(csvPacientes));
    await zipWriter.add('sessoes.csv', new TextEncoder().encode(csvSessoes));
    await zipWriter.add('financeiro.csv', new TextEncoder().encode(csvFinanceiro));
    const zipData = await zipWriter.close();

    // 4. ENVIO DA RESPOSTA FINAL
    return new Response(zipData, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="export_tanotado_${Date.now()}.zip"`,
      },
    });

  } catch (error) {
    console.error('Erro na exportação para ZIP:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
