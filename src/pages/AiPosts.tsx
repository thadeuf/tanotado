import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Send, Loader2, Sparkles } from 'lucide-react';
import { addMessageToThread, checkRunStatus, createThread, getAssistantResponse, runAssistant } from '@/lib/openai';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'assistant';
}

const postsAssistantId = 'asst_f8Gn3TYI77016V4trUXV5IYh';

const AiPosts: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Olá! Sou sua assistente de criação. Sobre o que você gostaria de criar um post hoje?', sender: 'assistant' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeThread = async () => {
      if (!postsAssistantId) {
        toast({
          title: "Erro de Configuração",
          description: "O ID do assistente de posts não foi configurado.",
          variant: "destructive",
        });
        return;
      }
      try {
        const newThreadId = await createThread();
        setThreadId(newThreadId);
      } catch (error) {
        console.error("Failed to create assistant thread:", error);
        toast({
          title: "Erro no Assistente de IA",
          description: "Não foi possível iniciar o assistente. Verifique sua chave de API da OpenAI.",
          variant: "destructive"
        });
      }
    };
    initializeThread();
  }, []);

  useEffect(() => {
    // Acessa o elemento da viewport dentro da ScrollArea e rola para o final.
    const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (viewport) {
      viewport.scrollTop = viewport.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = inputValue.trim();
    if (!currentInput || isLoading || !threadId || !postsAssistantId) {
      if (!threadId) {
        toast({ title: "Aguarde", description: "O assistente ainda está sendo inicializado.", variant: "default" });
      }
      return;
    }

    const userMessage: Message = { id: Date.now(), text: currentInput, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      await addMessageToThread(threadId, currentInput);
      const runId = await runAssistant(threadId, postsAssistantId);

      const pollStatus = async (): Promise<void> => {
        const status = await checkRunStatus(threadId, runId);
        if (status === 'completed') {
          const responseText = await getAssistantResponse(threadId);
          const assistantMessage: Message = { id: Date.now() + 1, text: responseText, sender: 'assistant' };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
        } else if (status === 'failed' || status === 'cancelled' || status === 'expired') {
          throw new Error(`A execução do assistente falhou com status: ${status}`);
        } else {
          setTimeout(pollStatus, 2000); // Poll every 2 seconds
        }
      };
      await pollStatus();

    } catch (error) {
      console.error("Erro durante comunicação com a OpenAI:", error);
      const errorMessage : Message = { id: Date.now() + 1, text: 'Desculpe, não consegui processar sua mensagem. Tente novamente.', sender: 'assistant' };
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      toast({
        title: "Erro de Comunicação",
        description: "Falha ao se comunicar com a IA. Por favor, tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-tanotado-navy flex items-center gap-2">
                <Sparkles className="h-7 w-7 text-tanotado-purple" />
                Posts com IA
            </h1>
            <p className="text-muted-foreground mt-2">
                Sua assistente para criar conteúdo para redes sociais, blogs e muito mais.
            </p>
        </div>

        <Card className="flex-1 flex flex-col">
            <CardContent className="flex-1 p-0 overflow-hidden">
                <ScrollArea className="h-full" ref={scrollAreaRef}>
                    <div className="p-6 space-y-6">
                        {messages.map(message => (
                        <div key={message.id} className={cn('flex items-end gap-3', message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                            {message.sender === 'assistant' && (
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src="/avatar_ia_suporte.png" alt="Assistente IA" />
                                    <AvatarFallback>IA</AvatarFallback>
                                </Avatar>
                            )}
                            <div className={cn(
                                'max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap',
                                message.sender === 'user'
                                ? 'bg-gradient-to-r from-tanotado-pink to-tanotado-purple text-white rounded-br-none'
                                : 'bg-muted rounded-bl-none'
                            )}>
                            {message.text}
                            </div>
                        </div>
                        ))}
                        {isLoading && (
                            <div className="flex items-end gap-3 justify-start">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src="/avatar_ia_suporte.png" alt="Assistente IA" />
                                    <AvatarFallback>IA</AvatarFallback>
                                </Avatar>
                                <div className="bg-muted rounded-2xl px-4 py-3 rounded-bl-none">
                                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
            <CardFooter className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                    <Input
                        placeholder={!threadId ? "Inicializando assistente..." : "Descreva sua ideia para o post..."}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isLoading || !threadId}
                        className="h-11"
                    />
                    <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={isLoading || !threadId || !inputValue.trim()}>
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </form>
            </CardFooter>
        </Card>
    </div>
  );
};

export default AiPosts;