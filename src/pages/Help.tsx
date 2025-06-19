// src/pages/Help.tsx

import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  LifeBuoy,
  LayoutDashboard,
  Calendar,
  Users,
  DollarSign,
  Settings,
  Globe,
  MessageSquare,
  FileSignature,
  Rocket
} from 'lucide-react';

const HelpPage: React.FC = () => {
  const sections = [
    // NOVO ITEM ADICIONADO AQUI
    {
      id: 'primeiros-passos',
      icon: Rocket,
      title: 'Primeiros Passos',
      content: (
        <div className="space-y-4">
          <p>Para começar a usar o TaNotado, a primeira ação que você deve realizar é o <strong>cadastro de um paciente/cliente</strong>. É a partir desse cadastro que a maioria das funcionalidades, como a criação de agendamentos e prontuários, é habilitada.</p>
          <h4 className="font-semibold text-foreground">Configurando a Sala de Vídeo para Atendimentos Online</h4>
          <p>Nossa plataforma oferece flexibilidade para suas consultas por vídeo. Você pode utilizar uma sala de vídeo própria (Google Meet, Zoom, etc.) ou a que é gerada automaticamente pelo TaNotado.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li>
              <strong>Usando sua própria sala de vídeo:</strong> Na ficha de cadastro do cliente, há um campo chamado "Link de video chamada". Insira o link da sua sala pessoal ali. Ao criar um agendamento do tipo "online", este link será automaticamente associado ao evento.
            </li>
            <li>
              <strong>Usando a sala de vídeo do TaNotado:</strong> Se preferir não usar um link próprio, ao marcar uma sessão como "online", nossa plataforma irá gerar um link de vídeo exclusivo e seguro para aquele atendimento. O link será criado e exibido no momento do agendamento.
            </li>
          </ul>
          <p>
            O link de acesso à sala de vídeo (seja a sua ou a nossa) estará sempre visível no card do respectivo agendamento no <strong>Dashboard</strong> e na página da <strong>Agenda</strong>. Para facilitar, você encontrará um botão no card que permite copiar e enviar o link diretamente para o seu cliente.
          </p>
        </div>
      ),
    },
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      title: 'Dashboard: Sua Visão Geral',
      content: (
        <div className="space-y-4">
          <p>O Dashboard é a sua central de comando. Ele oferece uma visão rápida e inteligente do seu dia e do seu mês.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>Cards de Resumo:</strong> Veja rapidamente seu próximo agendamento, o total de sessões do dia, atendimentos concluídos e faltas no mês.</li>
            <li><strong>Próximos Agendamentos:</strong> Navegue facilmente entre os agendamentos de "Hoje", "Amanhã" e da "Semana". Cada card de agendamento mostra o horário, o cliente e o status.</li>
            <li><strong>Aniversariantes do Dia:</strong> Nunca mais esqueça de parabenizar um cliente! O card de aniversariantes mostra quem está celebrando e oferece um atalho para enviar uma mensagem via WhatsApp.</li>
            <li><strong>Aviso de Teste Gratuito:</strong> Enquanto estiver no período de teste, um aviso amigável mostrará quantos dias restam e um link para a página de assinatura.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'agenda',
      icon: Calendar,
      title: 'Agenda: Organize seu Tempo',
      content: (
        <div className="space-y-4">
          <p>Sua agenda é flexível e poderosa, projetada para se adaptar ao seu fluxo de trabalho.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>Múltiplas Visualizações:</strong> Alterne entre a visão de "Semana" para planejar seus próximos dias e a visão de "Mês" para uma perspectiva mais ampla.</li>
            <li><strong>Criação de Eventos:</strong> Clique no botão "Novo Evento" ou diretamente em um horário vago no calendário para agendar. Você pode criar:
              <ul className="list-circle space-y-1 pl-5 mt-2">
                <li><strong>Sessão Única:</strong> Um único atendimento para um cliente.</li>
                <li><strong>Sessões Recorrentes:</strong> Configure atendimentos semanais ou mensais para um cliente, e o sistema criará todos de uma vez.</li>
                <li><strong>Compromisso Pessoal:</strong> Marque seus compromissos particulares que não aparecem para os clientes.</li>
                <li><strong>Bloquear Horário:</strong> Reserve um tempo para almoço, estudos ou qualquer outra atividade, impedindo novos agendamentos.</li>
              </ul>
            </li>
            <li><strong>Gestão de Status:</strong> Dentro de um evento, você pode facilmente marcar se o cliente "Compareceu" ou "Faltou".</li>
             <li><strong>Anotações da Sessão:</strong> <Badge variant="secondary">NOVO</Badge> Clique no ícone de bloco de notas (📝) em um agendamento para adicionar anotações específicas daquela sessão.</li>
            <li><strong>Configurações Personalizadas:</strong> Acesse as configurações da agenda para definir seus dias e horários de trabalho, além da duração padrão dos atendimentos.</li>
          </ul>
        </div>
      ),
    },
    {
        id: 'clientes',
        icon: Users,
        title: 'Clientes e Prontuários: Tudo em um só Lugar',
        content: (
            <div className="space-y-4">
              <p>Gerencie todos os seus clientes e seus respectivos prontuários de forma centralizada e segura.</p>
              <h3 className="font-semibold text-base">Gestão de Clientes</h3>
              <ul className="list-disc space-y-2 pl-5">
                <li><strong>Cadastro Completo:</strong> Salve informações essenciais como dados pessoais, de contato, endereço, financeiro e contatos de emergência.</li>
                <li><strong>Filtros Inteligentes:</strong> Encontre clientes rapidamente usando a busca ou os filtros de "Ativos", "Inativos" e "Pendentes".</li>
                <li><strong>Aprovação de Cadastros:</strong> <Badge>DICA</Badge> Clientes que se cadastram pela sua página pública ficam com o status "Pendente" para sua aprovação na tela de Clientes.</li>
                <li><strong>Página de Edição:</strong> Clique em um cliente para acessar seu perfil completo.</li>
              </ul>
               <h3 className="font-semibold text-base pt-2">Prontuário Digital <Badge variant="secondary">INTEGRADO</Badge></h3>
               <p>O prontuário agora é uma seção dentro do perfil de cada cliente, garantindo que todas as informações fiquem organizadas juntas.</p>
               <ul className="list-disc space-y-2 pl-5">
                <li><strong>Estrutura Personalizável:</strong> Acesse a aba "Prontuário" no perfil do cliente para visualizar e preencher as informações. Você pode editar os títulos das seções e dos campos para se adequar perfeitamente à sua metodologia de trabalho.</li>
                <li><strong>Anotações Detalhadas:</strong> Preencha campos como anamnese, histórico, evolução, plano de tratamento e muito mais.</li>
                <li><strong>Anotações de Sessão:</strong> Além do prontuário principal, cada sessão agendada possui seu próprio espaço para anotações, acessível diretamente pela Agenda ou pela aba "Anotações da Sessão" no perfil do cliente.</li>
              </ul>
            </div>
        )
    },
    {
      id: 'financeiro',
      icon: DollarSign,
      title: 'Financeiro: Suas Contas em Dia',
      content: (
        <div className="space-y-4">
          <p>Um controle financeiro simples e eficaz, integrado aos seus clientes e agendamentos.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>Lançamentos:</strong> Registre todas as suas "Receitas" e "Despesas" de forma rápida.</li>
            <li><strong>Associação a Clientes:</strong> Vincule cada lançamento a um cliente específico ou ao centro de custo "Minha Clínica" para despesas gerais.</li>
            <li><strong>Recorrência:</strong> Crie lançamentos recorrentes (semanais ou mensais) para automatizar o registro de mensalidades ou despesas fixas.</li>
            <li><strong>Visão por Período:</strong> Alterne facilmente a visualização entre "Mês" e "Ano" para ter um panorama completo da sua saúde financeira.</li>
            <li><strong>Gestão de Status:</strong> Dê baixa em um pagamento com um clique, atualizando o status para "Pago". O sistema também identifica automaticamente os lançamentos "Vencidos".</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'documentos',
      icon: FileSignature,
      title: 'Modelos e Documentos: Agilidade na Rotina',
      content: (
        <div className="space-y-4">
          <p>Crie modelos para os documentos que você mais usa e gere versões personalizadas para seus clientes em segundos.</p>
          <h3 className="font-semibold text-base">Modelos de Documentos</h3>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>Crie Modelos:</strong> Vá em <strong>Configurações {'>'} Modelos de Documentos</strong> para criar seus próprios modelos de contratos, recibos, declarações, etc.</li>
            <li><strong>Editor Avançado:</strong> Utilize o editor de texto para formatar seus documentos como preferir.</li>
            <li><strong>Tags Dinâmicas:</strong> <Badge variant="secondary">PODEROSO</Badge> Use tags como <code>{`{nome_cliente}`}</code>, <code>{`{cpf_cliente}`}</code>, <code>{`{data_atual_extenso}`}</code> e muitas outras. Ao gerar um documento, o sistema substitui as tags automaticamente pelos dados do cliente e do profissional.</li>
          </ul>
          <h3 className="font-semibold text-base pt-2">Documentos Salvos</h3>
          <ul className="list-disc space-y-2 pl-5">
             <li><strong>Gere Documentos:</strong> Na página de um cliente, vá na aba "Documentos Salvos" e clique em "Criar Documento" para usar um de seus modelos.</li>
            <li><strong>Visualize e Edite:</strong> Todos os documentos gerados para um cliente ficam salvos em seu perfil, na aba "Documentos". Você pode visualizar, editar ou excluir a qualquer momento.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'configuracoes',
      icon: Settings,
      title: 'Configurações: Deixe o Sistema com a sua Cara',
      content: (
        <div className="space-y-4">
          <p>A área de Configurações permite que você personalize diversos aspectos do sistema para que ele trabalhe para você.</p>
          <ul className="list-disc space-y-2 pl-5">
            <li><strong>Minha Conta:</strong> Edite suas informações pessoais, de perfil, foto, e configure sua página pública de agendamento.</li>
            <li><strong>Grupos de Clientes:</strong> Personalize os grupos para categorizar seus clientes (ex: Crianças, Adultos, Terapia de Casal).</li>
            <li><strong>Agenda:</strong> Defina seus horários de atendimento, dias da semana em que trabalha e a duração padrão das suas sessões.</li>
            <li><strong>Mensagens:</strong> <Badge>AUTOMÁTICO</Badge> Personalize os textos dos lembretes de sessão e de cobrança enviados automaticamente via WhatsApp.</li>
            <li><strong>Modelos de Documentos:</strong> Central para criar e gerenciar seus modelos de contrato, recibo, etc.</li>
            <li><strong>Assinatura:</strong> Gerencie seu plano, faturas e método de pagamento.</li>
            <li><strong>Segurança:</strong> Altere sua senha e saia de todos os dispositivos conectados para manter sua conta segura.</li>
          </ul>
        </div>
      ),
    },
    {
      id: 'public-booking',
      icon: Globe,
      title: 'Página Pública de Agendamento',
      content: (
        <div className="space-y-4">
            <p>Ofereça aos seus clientes a conveniência de agendar uma sessão diretamente pela sua página exclusiva.</p>
            <ul className="list-disc space-y-2 pl-5">
                <li><strong>Ativação:</strong> Ative sua página em <strong>Configurações {'>'} Minha Conta</strong> e escolha uma URL amigável (ex: <code>tanotado.com.br/agendar/seu-nome</code>).</li>
                <li><strong>Identificação Segura:</strong> O cliente se identifica com CPF e data de nascimento. Se já for seu cliente ativo, ele pode agendar diretamente.</li>
                <li><strong>Novos Clientes:</strong> Se for um novo cliente, ele preencherá um formulário de cadastro simplificado e o pedido de agendamento ficará como "Pendente" para sua aprovação na tela de Clientes.</li>
                <li><strong>Disponibilidade Real:</strong> A página mostra apenas seus horários realmente livres, respeitando seus agendamentos e bloqueios existentes.</li>
            </ul>
        </div>
      )
    }
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in max-w-5xl mx-auto">
      <div className="flex flex-col items-center text-center mb-12">
        <div className="bg-gradient-to-r from-tanotado-pink to-tanotado-purple p-3 rounded-full inline-block mb-4">
            <LifeBuoy className="h-10 w-10 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-tanotado-navy">Central de Ajuda</h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
          Encontre respostas para suas dúvidas e aprenda a usar todos os recursos do <strong>tanotado</strong> para otimizar sua rotina.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <Accordion type="single" collapsible className="w-full">
            {sections.map(section => (
              <AccordionItem value={section.id} key={section.id}>
                <AccordionTrigger className="text-lg hover:no-underline">
                  <div className="flex items-center gap-4">
                    <section.icon className="h-6 w-6 text-tanotado-blue" />
                    <span>{section.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-2 pb-4 text-base text-muted-foreground">
                  {section.content}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <div className="text-center mt-12">
        <h3 className="text-xl font-semibold">Não encontrou o que precisava?</h3>
        <p className="mt-2 text-muted-foreground">
          Nossa equipe de suporte está pronta para ajudar.
        </p>
        <Button className="mt-4 gap-2">
          <MessageSquare className="h-4 w-4" /> Entrar em contato
        </Button>
      </div>

    </div>
  );
};

export default HelpPage;