// src/lib/TiptapNodeToText.ts
import { type JSONContent } from '@tiptap/react';

const TiptapNodeToText = (node: JSONContent | string | null | undefined): string => {
  if (!node) {
    return '';
  }

  if (typeof node === 'string') {
    return node;
  }
  
  if (!node.content || !Array.isArray(node.content)) {
    return '';
  }

  let text = '';
  for (const childNode of node.content) {
    if (childNode.type === 'text' && childNode.text) {
      text += childNode.text;
    } else if (childNode.content) {
      text += TiptapNodeToText(childNode);
    }
    
    if (['paragraph', 'heading'].includes(childNode.type || '')) {
       text += '\n';
    }
  }

  return text.trim();
};

export default TiptapNodeToText;