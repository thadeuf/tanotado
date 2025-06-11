// src/lib/templateUtils.ts

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Tipos para os dados que usaremos. Adapte se necessário.
interface ClientData {
  name: string;
  [key: string]: any; // Permite outras propriedades
}

interface UserData {
  name: string;
  [key: string]: any;
}

// Função que percorre o JSON do TipTap recursivamente
function traverseAndReplace(node: any, replacements: Record<string, string>) {
  if (node.type === 'text' && node.text) {
    let newText = node.text;
    for (const [tag, value] of Object.entries(replacements)) {
      newText = newText.replace(new RegExp(tag.replace(/\{/g, '\\{').replace(/\}/g, '\\}'), 'g'), value);
    }
    return { ...node, text: newText };
  }

  if (node.content && Array.isArray(node.content)) {
    return {
      ...node,
      content: node.content.map(childNode => traverseAndReplace(childNode, replacements)),
    };
  }

  return node;
}

/**
 * Renderiza um template de documento, substituindo as tags pelos dados do cliente e do profissional.
 * @param templateContent - O conteúdo do modelo no formato JSON do TipTap.
 * @param client - O objeto com os dados do cliente.
 * @param user - O objeto com os dados do profissional.
 * @returns O conteúdo do modelo com as tags substituídas.
 */
export function renderTemplate(templateContent: any, client: ClientData, user: UserData): any {
  if (!templateContent || !client || !user) {
    return templateContent;
  }

  const replacements: Record<string, string> = {
    '{nome_cliente}': client.name || '',
    '{primeiro_nome_cliente}': client.name?.split(' ')[0] || '',
    '{email_cliente}': client.email || '',
    '{whatsapp_cliente}': client.whatsapp || '',
    '{cpf_cliente}': client.cpf || '',
    '{rg_cliente}': client.rg || '',
    '{data_nascimento_cliente}': client.birth_date ? format(new Date(client.birth_date), 'dd/MM/yyyy') : '',
    '{endereco_cliente}': `${client.address || ''}, ${client.address_number || ''} - ${client.address_neighborhood || ''}`,
    '{nome_profissional}': user.name || '',
    '{email_profissional}': user.email || '',
    '{whatsapp_profissional}': user.whatsapp || '',
    '{data_atual}': format(new Date(), 'dd/MM/yyyy'),
    '{data_atual_extenso}': format(new Date(), "d 'de' MMMM 'de' yyyy", { locale: ptBR }),
  };

  // Cria uma cópia profunda para não modificar o objeto original
  const contentCopy = JSON.parse(JSON.stringify(templateContent));
  
  return traverseAndReplace(contentCopy, replacements);
}