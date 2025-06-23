// src/components/ui/RichTextEditor.tsx

import React, { useState, useRef, useEffect } from 'react'; // Adicionado useEffect
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  Bold, Italic, Strikethrough, List, ListOrdered, Heading2, Heading3, 
  Pilcrow, Undo, Redo, Mic, Square, Loader2
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { transcribeAudio } from '@/lib/openai'; 
import { toast } from '@/hooks/use-toast';

const Toolbar = ({ 
  editor, 
  onStartRecording, 
  onStopRecording, 
  isRecording, 
  isTranscribing 
}: { 
  editor: Editor | null;
  onStartRecording: () => void;
  onStopRecording: () => void;
  isRecording: boolean;
  isTranscribing: boolean;
}) => {
  if (!editor) {
    return null;
  }

  const isDisabled = isRecording || isTranscribing;

  return (
    <div className="border-b border-input p-2 flex flex-wrap items-center gap-1">
      <Toggle size="sm" pressed={editor.isActive('bold')} onPressedChange={() => editor.chain().focus().toggleBold().run()} disabled={isDisabled}><Bold className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('italic')} onPressedChange={() => editor.chain().focus().toggleItalic().run()} disabled={isDisabled}><Italic className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('strike')} onPressedChange={() => editor.chain().focus().toggleStrike().run()} disabled={isDisabled}><Strikethrough className="h-4 w-4" /></Toggle>
      
      <Separator orientation="vertical" className="h-6 mx-1" />

      <Toggle size="sm" pressed={editor.isActive('heading', { level: 2 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} disabled={isDisabled}><Heading2 className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('heading', { level: 3 })} onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} disabled={isDisabled}><Heading3 className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('paragraph')} onPressedChange={() => editor.chain().focus().setParagraph().run()} disabled={isDisabled}><Pilcrow className="h-4 w-4" /></Toggle>
      
      <Separator orientation="vertical" className="h-6 mx-1" />

      <Toggle size="sm" pressed={editor.isActive('bulletList')} onPressedChange={() => editor.chain().focus().toggleBulletList().run()} disabled={isDisabled}><List className="h-4 w-4" /></Toggle>
      <Toggle size="sm" pressed={editor.isActive('orderedList')} onPressedChange={() => editor.chain().focus().toggleOrderedList().run()} disabled={isDisabled}><ListOrdered className="h-4 w-4" /></Toggle>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Toggle size="sm" onPressedChange={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo() || isDisabled}><Undo className="h-4 w-4" /></Toggle>
      <Toggle size="sm" onPressedChange={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo() || isDisabled}><Redo className="h-4 w-4" /></Toggle>

      <Separator orientation="vertical" className="h-6 mx-1" />
      <Toggle
        size="sm"
        pressed={isRecording}
        onPressedChange={isRecording ? onStopRecording : onStartRecording}
        className={isRecording ? 'bg-red-500/20 text-red-600 hover:bg-red-500/30' : ''}
        disabled={isTranscribing}
      >
        {isTranscribing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isRecording ? (
          <Square className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Toggle>
    </div>
  );
};

interface RichTextEditorProps {
  content: any;
  onChange?: (richText: any) => void;
  tags?: Record<string, string>;
  editable?: boolean;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, tags, editable = true }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const editor = useEditor({
    extensions: [StarterKit.configure({
      code: false, codeBlock: false, blockquote: false,
    })],
    content: content,
    editable: editable && !isRecording && !isTranscribing,
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert max-w-none p-4 min-h-[300px] focus:outline-none ${!editable ? 'bg-muted/30' : ''}`,
      },
    },
    onUpdate({ editor }) {
      if (onChange) onChange(editor.getJSON());
    },
  });

  const handleStartRecording = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({ title: 'Erro de Compatibilidade', description: 'A gravação de áudio não é suportada neste navegador.', variant: 'destructive' });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioFile = new File([audioBlob], "recording.webm", { type: "audio/webm" });
        
        setIsTranscribing(true);
        try {
          toast({ title: "Processando...", description: "Transcrevendo o áudio, aguarde." });
          const transcribedText = await transcribeAudio(audioFile);
          if (transcribedText) {
            editor?.chain().focus().insertContent(` ${transcribedText}`).run();
          }
          toast({ title: "Sucesso!", description: "Áudio transcrito e inserido." });
        } catch (error) {
          toast({ title: "Erro na Transcrição", description: "Não foi possível processar o áudio.", variant: "destructive" });
        } finally {
          setIsTranscribing(false);
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      toast({ title: "Gravando...", description: "Clique no botão novamente para parar." });
    } catch (err) {
      toast({ title: 'Permissão Negada', description: 'É necessário permitir o acesso ao microfone para gravar.', variant: 'destructive' });
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    if (editor && content) {
      if (JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
        editor.commands.setContent(content, false);
      }
    }
  }, [content, editor]);
  
  useEffect(() => {
    editor?.setEditable(editable && !isRecording && !isTranscribing);
  }, [editable, isRecording, isTranscribing, editor]);

  const handleTagClick = (tagValue: string) => {
    editor?.chain().focus().insertContent(` ${tagValue} `).run();
  };

  return (
    <div className="border border-input rounded-lg bg-transparent">
      {editable && (
        <Toolbar 
          editor={editor} 
          onStartRecording={handleStartRecording} 
          onStopRecording={handleStopRecording} 
          isRecording={isRecording}
          isTranscribing={isTranscribing}
        />
      )}
      
      {tags && editable && (
        <div className="p-2 border-b border-input">
            <p className="text-xs text-muted-foreground mb-2">
                Clique nas tags para adicionar ao documento:
            </p>
            <div className="flex flex-wrap gap-2">
                {Object.entries(tags).map(([label, value]) => (
                    <Badge
                        key={value}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary/20"
                        onClick={() => handleTagClick(value)}
                    >
                        {label}
                    </Badge>
                ))}
            </div>
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
};