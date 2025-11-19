import React, { useState } from 'react';
import { Message, Role } from '../types';
import { UserIcon, BotIcon, CopyIcon, CheckIcon } from './Icons';

interface Props {
  message: Message;
  userName: string;
}

interface CodeBlockProps {
  code: string;
  language?: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-md overflow-hidden border border-zinc-700 bg-black/50">
      <div className="flex items-center justify-between bg-zinc-800/50 px-4 py-1.5 border-b border-zinc-700">
        <span className="text-xs text-zinc-400 font-mono lowercase">{language || 'code'}</span>
        <button 
          onClick={handleCopy}
          className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          {copied ? <CheckIcon className="w-3 h-3" /> : <CopyIcon className="w-3 h-3" />}
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <div className="p-4 overflow-x-auto">
        <pre className="font-mono text-sm text-zinc-100 whitespace-pre-wrap">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

const ContentRenderer = ({ content }: { content: string }) => {
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="text-sm md:text-base leading-relaxed space-y-4 break-words">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          const inner = part.slice(3, -3);
          const newlineIndex = inner.indexOf('\n');
          const language = newlineIndex > -1 ? inner.slice(0, newlineIndex).trim() : '';
          const code = newlineIndex > -1 ? inner.slice(newlineIndex + 1) : inner;
          return <CodeBlock key={index} code={code} language={language} />;
        }
        // Split by newlines to render paragraphs, but avoid empty ones
        return part.split('\n\n').map((p, i) => (
             p.trim() ? <p key={`${index}-${i}`} className="whitespace-pre-wrap">{p}</p> : null
        ));
      })}
    </div>
  );
};

export const MessageBubble: React.FC<Props> = ({ message, userName }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`w-full border-b border-black/10 dark:border-zinc-900/50 ${isUser ? 'bg-[#343541]' : 'bg-[#444654]'}`}>
      <div className="max-w-4xl mx-auto p-4 md:p-6 flex gap-4 md:gap-6">
        <div className="flex-shrink-0 flex flex-col relative items-end">
          <div className={`w-8 h-8 rounded-sm flex items-center justify-center ${isUser ? 'bg-indigo-500' : 'bg-emerald-500'}`}>
            {isUser ? <UserIcon className="w-5 h-5 text-white" /> : <BotIcon className="w-5 h-5 text-white" />}
          </div>
        </div>
        
        <div className="relative flex-1 overflow-hidden">
            <div className="font-bold text-zinc-200 mb-1 text-xs opacity-50 uppercase tracking-wide">
                {isUser ? userName : 'OmniChat'}
            </div>
            <ContentRenderer content={message.content} />
            {message.isError && (
                <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                    Error generating response. Please check your configuration or try again.
                </div>
            )}
        </div>
      </div>
    </div>
  );
};