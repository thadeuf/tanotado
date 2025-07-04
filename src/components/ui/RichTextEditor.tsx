// src/components/ui/RichTextEditor.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  Bold, Italic, Strikethrough, List, ListOrdered, Heading2, Heading3, 
  Pilcrow, Undo, Redo, Mic, Square, Loader2
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

const Toolbar = ({ 
  editor, 
  onStartRecording, 
  onStopRecording, 
  isRecording, 
  isTranscribing 
}: { 
  editor: Editor | null;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
  isRecording?: boolean;
  isTranscribing?: boolean;
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
        onPressedChange={() => (isRecording ? onStopRecording?.() : onStartRecording?.())}
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

// --- INÍCIO DA ALTERAÇÃO: Interface de props atualizada ---
interface RichTextEditorProps {
  content: any;
  onChange?: (richText: any) => void;
  tags?: Record<string, string>;
  editable?: boolean;
  onEditorInstance?: (editor: Editor | null) => void;
  isRecording?: boolean;
  isTranscribing?: boolean;
  onStartRecording?: () => void;
  onStopRecording?: () => void;
}
// --- FIM DA ALTERAÇÃO ---

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content,
  onChange,
  tags,
  editable = true,
  // --- INÍCIO DA ALTERAÇÃO: Novas props recebidas ---
  onEditorInstance,
  isRecording = false,
  isTranscribing = false,
  onStartRecording,
  onStopRecording,
  // --- FIM DA ALTERAÇÃO ---
}) => {

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

  // --- INÍCIO DA ALTERAÇÃO: Lógica de gravação removida daqui ---
  // A lógica de handleStartRecording e handleStopRecording foi movida para SessionNotesDialog.tsx
  // --- FIM DA ALTERAÇÃO ---

  // --- INÍCIO DA ALTERAÇÃO: Passando a instância do editor para o componente pai ---
  useEffect(() => {
    if (onEditorInstance) {
      onEditorInstance(editor);
    }
    return () => {
      if (onEditorInstance) {
        onEditorInstance(null);
      }
    };
  }, [editor, onEditorInstance]);
  // --- FIM DA ALTERAÇÃO ---
  
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
        // --- INÍCIO DA ALTERAÇÃO: Passando as props para a Toolbar ---
        <Toolbar 
          editor={editor} 
          onStartRecording={onStartRecording} 
          onStopRecording={onStopRecording} 
          isRecording={isRecording}
          isTranscribing={isTranscribing}
        />
        // --- FIM DA ALTERAÇÃO ---
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