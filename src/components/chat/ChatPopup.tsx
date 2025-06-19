import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Send, Loader2 } from 'lucide-react';
import { addMessageToThread, checkRunStatus, createThread, getAssistantResponse, runAssistant } from '@/lib/openai';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'assistant';
}

export const ChatPopup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: 'Olá! Sou a assistente virtual do TaNotado. Como posso te ajudar hoje?', sender: 'assistant' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initializeThread = async () => {
      try {
        const newThreadId = await createThread();
        setThreadId(newThreadId);
      } catch (error) {
        console.error("Failed to create assistant thread:", error);
        toast({
          title: "Erro no Chat",
          description: "Não foi possível iniciar o assistente de suporte.",
          variant: "destructive"
        });
      }
    };
    initializeThread();
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentInput = inputValue.trim();
    if (!currentInput || isLoading || !threadId) {
      if (!threadId) {
        toast({ title: "Aguarde", description: "O chat ainda está sendo inicializado.", variant: "default" });
      }
      return;
    }

    const userMessage: Message = { id: Date.now(), text: currentInput, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      await addMessageToThread(threadId, currentInput);
      const runId = await runAssistant(threadId);

      const pollStatus = async () => {
        const status = await checkRunStatus(threadId, runId);
        if (status === 'completed') {
          const responseText = await getAssistantResponse(threadId);
          const assistantMessage: Message = { id: Date.now() + 1, text: responseText, sender: 'assistant' };
          setMessages(prev => [...prev, assistantMessage]);
          setIsLoading(false);
        } else if (status === 'failed' || status === 'cancelled' || status === 'expired') {
          throw new Error(`A execução do assistente falhou com status: ${status}`);
        } else {
          setTimeout(pollStatus, 2000);
        }
      };
      await pollStatus();

    } catch (error) {
      console.error("Erro durante comunicação com a OpenAI:", error);
      setMessages(prev => [...prev, { id: Date.now() + 1, text: 'Desculpe, não consegui processar sua mensagem. Tente novamente.', sender: 'assistant' }]);
      setIsLoading(false);
    }
  };

  return (
    <>
      <Button
        className="fixed bottom-6 right-6 h-16 w-16 rounded-full bg-gradient-to-r from-tanotado-pink to-tanotado-purple shadow-lg hover:shadow-xl transition-all p-0"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Avatar className="h-full w-full">
            <img src="/avatar_ia_suporte.png" alt="Suporte IA" className="object-cover" />
        </Avatar>
      </Button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-sm z-50 animate-fade-in-up">
            <Card className="flex flex-col h-[60vh] shadow-2xl">
                <CardHeader className="flex flex-row items-center gap-3 border-b">
                    <Avatar className="h-10 w-10">
                        <img src="/avatar_ia_suporte.png" alt="Suporte IA" />
                    </Avatar>
                    <div>
                        <CardTitle className="text-base">Assistente TaNotado</CardTitle>
                        <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-green-500"></span>
                            <span className="text-xs text-muted-foreground">Online</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 p-0 overflow-y-hidden">
                    <ScrollArea className="h-full" ref={scrollAreaRef}>
                        <div className="space-y-4 p-4">
                            {messages.map(message => (
                            <div key={message.id} className={cn('flex items-end gap-2', message.sender === 'user' ? 'justify-end' : 'justify-start')}>
                                {message.sender === 'assistant' && <Avatar className="h-8 w-8"><img src="/avatar_ia_suporte.png" /></Avatar>}
                                <div className={cn('max-w-[75%] rounded-lg px-3 py-2 text-sm', message.sender === 'user' ? 'bg-tanotado-purple text-white rounded-br-none' : 'bg-muted rounded-bl-none')}>
                                {message.text}
                                </div>
                            </div>
                            ))}
                            {isLoading && (
                                <div className="flex items-end gap-2 justify-start">
                                    <Avatar className="h-8 w-8"><img src="/avatar_ia_suporte.png" /></Avatar>
                                    <div className="bg-muted rounded-lg px-3 py-2 rounded-bl-none"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
                <CardFooter className="p-2 border-t">
                    <form onSubmit={handleSendMessage} className="flex w-full items-center space-x-2">
                        <Input placeholder={!threadId ? "Inicializando chat..." : "Digite sua mensagem..."} value={inputValue} onChange={(e) => setInputValue(e.target.value)} disabled={isLoading || !threadId} />
                        <Button type="submit" size="icon" disabled={isLoading || !threadId || !inputValue.trim()}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        </Button>
                    </form>
                </CardFooter>
            </Card>
        </div>
      )}
    </>
  );
};