// src/components/notes/RecordingNoticeModal.tsx
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Square } from 'lucide-react';

// Componente para a animação da onda sonora
const SoundWaveAnimation = () => (
  <div className="flex items-end justify-center space-x-1.5 h-16">
    <div className="w-1.5 h-4 bg-blue-500 rounded-full animate-wave" style={{ animationDelay: '0.1s' }}></div>
    <div className="w-1.5 h-8 bg-blue-500 rounded-full animate-wave" style={{ animationDelay: '0.2s' }}></div>
    <div className="w-1.5 h-12 bg-blue-500 rounded-full animate-wave" style={{ animationDelay: '0.3s' }}></div>
    <div className="w-1.5 h-8 bg-blue-500 rounded-full animate-wave" style={{ animationDelay: '0.4s' }}></div>
    <div className="w-1.5 h-4 bg-blue-500 rounded-full animate-wave" style={{ animationDelay: '0.5s' }}></div>
  </div>
);

// --- INÍCIO DA ALTERAÇÃO ---
interface RecordingNoticeModalProps {
  isOpen: boolean;
  isRecording: boolean;
  isTranscribing: boolean;
  onStopRecording: () => void; // Adicionada a prop para parar a gravação
}

export const RecordingNoticeModal: React.FC<RecordingNoticeModalProps> = ({ 
  isOpen, 
  isRecording, 
  isTranscribing, 
  onStopRecording 
}) => {
// --- FIM DA ALTERAÇÃO ---
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="text-center text-xl">
            {isRecording && "Gravando Áudio..."}
            {isTranscribing && "Processando Áudio..."}
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Por favor, não feche esta janela para não perder o progresso.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-6 space-y-6">
          {isRecording && <SoundWaveAnimation />}
          {isTranscribing && <Loader2 className="h-16 w-16 animate-spin text-blue-500" />}
          <p className="text-sm text-muted-foreground text-center">
            {isRecording && "A gravação será enviada para transcrição assim que for finalizada."}
            {isTranscribing && "Aguarde enquanto transformamos o áudio em texto."}
          </p>
        </div>
        {/* --- INÍCIO DA ALTERAÇÃO --- */}
        {isRecording && (
          <DialogFooter className="pt-4">
            <Button 
              type="button" 
              variant="destructive" 
              className="w-full gap-2" 
              onClick={onStopRecording}
            >
              <Square className="h-4 w-4" /> Parar Gravação
            </Button>
          </DialogFooter>
        )}
        {/* --- FIM DA ALTERAÇÃO --- */}
      </DialogContent>
    </Dialog>
  );
};