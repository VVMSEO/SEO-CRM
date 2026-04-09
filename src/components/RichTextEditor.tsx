import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Bold, Italic, Strikethrough, List, ListOrdered, Quote, Heading1, Heading2 } from 'lucide-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bold') ? 'bg-gray-200 text-indigo-600' : 'text-gray-600'}`}
        title="Жирный"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('italic') ? 'bg-gray-200 text-indigo-600' : 'text-gray-600'}`}
        title="Курсив"
      >
        <Italic className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('strike') ? 'bg-gray-200 text-indigo-600' : 'text-gray-600'}`}
        title="Зачеркнутый"
      >
        <Strikethrough className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('heading', { level: 1 }) ? 'bg-gray-200 text-indigo-600' : 'text-gray-600'}`}
        title="Заголовок 1"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-gray-200 text-indigo-600' : 'text-gray-600'}`}
        title="Заголовок 2"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <div className="w-px h-6 bg-gray-300 mx-1 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 text-indigo-600' : 'text-gray-600'}`}
        title="Маркированный список"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 text-indigo-600' : 'text-gray-600'}`}
        title="Нумерованный список"
      >
        <ListOrdered className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${editor.isActive('blockquote') ? 'bg-gray-200 text-indigo-600' : 'text-gray-600'}`}
        title="Цитата"
      >
        <Quote className="w-4 h-4" />
      </button>
    </div>
  );
};

export default function RichTextEditor({ content, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-sm-2xl mx-auto focus:outline-none min-h-[150px] p-4',
      },
    },
  });

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden flex flex-col bg-white">
      <MenuBar editor={editor} />
      <div className="flex-1 overflow-y-auto resize-y min-h-[150px] max-h-[500px]">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
