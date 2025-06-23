import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

/**
 * ATENÇÃO: EM UM AMBIENTE DE PRODUÇÃO, ESTA FUNÇÃO DEVE ESTAR NO BACKEND.
 */

// --- INÍCIO DA ALTERAÇÃO 1: Adicionar função de transcrição ---
/**
 * Envia um arquivo de áudio para a API da OpenAI para transcrição.
 * @param audioFile O arquivo de áudio a ser transcrito.
 * @returns O texto transcrito.
 */
export const transcribeAudio = async (audioFile: File): Promise<string> => {
  try {
    const response = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
    });
    return response.text;
  } catch (error) {
    console.error("Erro na transcrição do áudio:", error);
    throw new Error("Não foi possível transcrever o áudio.");
  }
};
// --- FIM DA ALTERAÇÃO 1 ---

export const createThread = async (): Promise<string> => {
  const thread = await openai.beta.threads.create();
  return thread.id;
};

export const addMessageToThread = async (threadId: string, message: string) => {
  await openai.beta.threads.messages.create(threadId, {
    role: 'user',
    content: message,
  });
};

// A função agora aceita o ID do assistente como um parâmetro.
export const runAssistant = async (threadId: string, assistantId: string) => {
  if (!assistantId) throw new Error("O ID do Assistente da OpenAI não foi fornecido.");
  
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
  });
  return run.id;
};

export const checkRunStatus = async (threadId: string, runId: string): Promise<string> => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  const response = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'OpenAI-Beta': 'assistants=v2',
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Erro ao verificar o status do run: ${errorData.error.message}`);
  }

  const runObject = await response.json();
  return runObject.status;
};

export const getAssistantResponse = async (threadId: string) => {
  const messages = await openai.beta.threads.messages.list(threadId);
  const assistantMessage = messages.data.find(m => m.role === 'assistant');

  if (assistantMessage && assistantMessage.content[0].type === 'text') {
    return assistantMessage.content[0].text.value;
  }
  return 'Não foi possível obter uma resposta.';
};