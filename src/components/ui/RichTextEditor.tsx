// src/components/ui/RichTextEditor.tsx

import React from 'react';
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { 
  Bold, 
  Italic, 
  Strikethrough, 
  List, 
  ListOrdered, 
  Heading2, 
  Heading3, 
  Pilcrow, 
  Undo, 
  Redo 
} from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

/**
 * Barra de ferramentas com os controles de formatação.
 */
const Toolbar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="border-b border-input p-2 flex flex-wrap items-center gap-1">
      <Toggle
        size="sm"
        pressed={editor.isActive('bold')}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('italic')}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('strike')}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      
      <Separator orientation="vertical" className="h-6 mx-1" />

      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 2 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('heading', { level: 3 })}
        onPressedChange={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('paragraph')}
        onPressedChange={() => editor.chain().focus().setParagraph().run()}
      >
        <Pilcrow className="h-4 w-4" />
      </Toggle>
      
      <Separator orientation="vertical" className="h-6 mx-1" />

      <Toggle
        size="sm"
        pressed={editor.isActive('bulletList')}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive('orderedList')}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      
      <Separator orientation="vertical" className="h-6 mx-1" />
      
      <Toggle
        size="sm"
        onPressedChange={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="h-4 w-4" />
      </Toggle>
       <Toggle
        size="sm"
        onPressedChange={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="h-4 w-4" />
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

/**
 * Componente principal do Editor de Rich Text
 */
export const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onChange, tags, editable = true }) => {
  const editor = useEditor({
    extensions: [StarterKit.configure({
      code: false,
      codeBlock: false,
      blockquote: false,
    })],
    content: content,
    editable: editable,
    editorProps: {
      attributes: {
        class: `prose dark:prose-invert max-w-none p-4 min-h-[300px] focus:outline-none ${!editable ? 'bg-muted/30' : ''}`,
      },
    },
    onUpdate({ editor }) {
      if (onChange) {
        onChange(editor.getJSON());
      }
    },
  });

  React.useEffect(() => {
    if (editor && content) {
      if (JSON.stringify(editor.getJSON()) !== JSON.stringify(content)) {
        editor.commands.setContent(content, false);
      }
    }
  }, [content, editor]);

  const handleTagClick = (tagValue: string) => {
    editor?.chain().focus().insertContent(` ${tagValue} `).run();
  };

  return (
    <div className="border border-input rounded-lg bg-transparent">
      {editable && <Toolbar editor={editor} />}
      
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