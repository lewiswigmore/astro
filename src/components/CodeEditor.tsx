import { useEffect, useRef, useState } from 'react';
import { Editor } from '@monaco-editor/react';
import { ensureKQL, initMonaco } from '../utils/monacoConfig';

interface CodeEditorProps {
  code: string;
  language?: string;
  height?: string;
  readOnly?: boolean;
}

const CodeEditor = ({ 
  code, 
  language = 'kql', 
  height, 
  readOnly = true 
}: CodeEditorProps) => {
  const [editorHeight, setEditorHeight] = useState(height || '100px');
  const [isEditorReady, setIsEditorReady] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const lastRemountAtRef = useRef<number>(0);

  useEffect(() => {
    // Initialize Monaco globally
    initMonaco().then(monaco => {
      monacoRef.current = monaco;
    });
  }, []);

  useEffect(() => {
    const relayout = () => {
      const editor = editorRef.current;
      if (!editor) return;
      requestAnimationFrame(() => {
        try {
          if (monacoRef.current) {
            ensureKQL(monacoRef.current);
            monacoRef.current.editor.setTheme('kql-dark');
          }
          editor.layout();
        } catch {
          // noop
        }
      });
    };

    const remount = () => {
      const now = Date.now();
      if (now - lastRemountAtRef.current < 500) return;
      lastRemountAtRef.current = now;
      setIsEditorReady(false);
      setEditorKey((k) => k + 1);
    };

    const onSwap = () => {
      // Try immediate relayout
      relayout();
      
      // Try again after a short delay
      setTimeout(() => {
        if (monacoRef.current) {
          ensureKQL(monacoRef.current);
          monacoRef.current.editor.setTheme('kql-dark');
        }
        relayout();
      }, 100);

      // Force a hard remount to be absolutely sure
      setTimeout(remount, 250);
    };

    document.addEventListener('astro:page-load', onSwap as any);
    document.addEventListener('astro:after-swap', onSwap as any);
    window.addEventListener('resize', onSwap);

    return () => {
      document.removeEventListener('astro:page-load', onSwap as any);
      document.removeEventListener('astro:after-swap', onSwap as any);
      window.removeEventListener('resize', onSwap);
    };
  }, []);

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    ensureKQL(monaco);
    
    // Force the model to use the correct language and theme
    const model = editor.getModel();
    if (model) {
      monaco.editor.setModelLanguage(model, language);
    }
    monaco.editor.setTheme('kql-dark');
    
    setIsEditorReady(true);
    
    // Auto-resize logic
    if (!height) {
      const updateHeight = () => {
        const contentHeight = editor.getContentHeight();
        const finalHeight = Math.max(40, contentHeight);
        setEditorHeight(`${finalHeight}px`);
        editor.layout();
      };
      
      editor.onDidChangeModelContent(updateHeight);
      updateHeight();
    }

    // Ensure we layout once after mount.
    requestAnimationFrame(() => editor.layout());
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleUplink = () => {
    const encodedQuery = encodeURIComponent(code);
    const adxUrl = `https://dataexplorer.azure.com/clusters/help/databases/Samples?query=${encodedQuery}`;
    window.open(adxUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="relative border border-space-700/50 rounded-lg overflow-hidden bg-space-900 my-4 shadow-lg group">
      <div className="absolute top-2 right-2 z-10 flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
            onClick={handleUplink}
            className="bg-space-900/80 backdrop-blur-sm text-nebula-400 border border-nebula-500/20 px-2 py-1 rounded text-[9px] hover:bg-nebula-500/20 hover:text-nebula-300 transition-colors cursor-pointer font-mono flex items-center tracking-widest"
            title="Run in Azure Data Explorer"
        >
            <svg className="w-2.5 h-2.5 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="currentColor" />
            </svg>
            UPLINK
        </button>
        <button 
            onClick={handleCopy}
            className="bg-space-900/80 backdrop-blur-sm text-slate-500 border border-space-700 px-2 py-1 rounded text-[9px] hover:bg-space-800 hover:text-slate-300 transition-colors cursor-pointer font-mono tracking-widest"
        >
            COPY
        </button>
      </div>
      <Editor
        key={editorKey}
        height={editorHeight}
        defaultLanguage={language}
        value={code}
        theme="kql-dark"
        loading={
          <div className="absolute inset-0 flex items-center justify-center bg-space-900">
            <div className="flex items-center gap-3 text-slate-500 font-mono text-[10px] tracking-widest">
              <div className="w-3 h-3 border border-nebula-400/30 border-t-nebula-400 rounded-full animate-spin" />
              <span>INITIALIZING EDITOR…</span>
            </div>
          </div>
        }
        options={{
          readOnly: readOnly,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          lineNumbers: 'off',
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
          scrollbar: {
            vertical: 'hidden',
            horizontal: 'hidden'
          },
          overviewRulerBorder: false,
          overviewRulerLanes: 0,
          hideCursorInOverviewRuler: true,
          fontSize: 14,
          lineHeight: 20,
          padding: { top: 12, bottom: 12 },
          wordWrap: 'on',
          contextmenu: false,
          renderLineHighlight: 'none',
          selectionHighlight: false,
          occurrencesHighlight: 'off'
        }}
        onMount={handleEditorDidMount}
      />

      {!isEditorReady && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center bg-space-900">
          <div className="flex items-center gap-3 text-slate-500 font-mono text-[10px] tracking-widest">
            <div className="w-3 h-3 border border-nebula-400/30 border-t-nebula-400 rounded-full animate-spin" />
            <span>INITIALIZING EDITOR…</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeEditor;
