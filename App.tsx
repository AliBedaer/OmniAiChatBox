import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Message, ChatSession, Role, AppSettings, DEFAULT_SETTINGS, ModelProvider } from './types';
import { PlusIcon, MenuIcon, SendIcon, SettingsIcon, TrashIcon, MessageSquareIcon, BotIcon } from './components/Icons';
import { MessageBubble } from './components/MessageBubble';
import { SettingsModal } from './components/SettingsModal';
import { createGeminiChat, streamGeminiResponse } from './services/geminiService';

// --- Local Storage Keys ---
const STORAGE_KEY_SETTINGS = 'omnichat_settings';
const STORAGE_KEY_SESSIONS = 'omnichat_sessions';

const App: React.FC = () => {
  // --- State ---
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  // Refs for scrolling and resizing
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Initialization ---
  useEffect(() => {
    const storedSettings = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }

    const storedSessions = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (storedSessions) {
      const parsedSessions = JSON.parse(storedSessions);
      setSessions(parsedSessions);
      if (parsedSessions.length > 0) {
        setCurrentSessionId(parsedSessions[0].id);
      } else {
        createNewSession();
      }
    } else {
      createNewSession();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  }, [sessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionId, isLoading]);

  // --- Session Management ---
  const createNewSession = () => {
    const newSession: ChatSession = {
      id: Date.now().toString(),
      title: 'New Chat',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    if (window.innerWidth < 768) setSidebarOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== id);
    setSessions(newSessions);
    if (currentSessionId === id) {
      if (newSessions.length > 0) {
        setCurrentSessionId(newSessions[0].id);
      } else {
        // Don't call createNewSession immediately to avoid loop if not careful, 
        // but here it's safe.
        const newSession: ChatSession = {
            id: Date.now().toString(),
            title: 'New Chat',
            messages: [],
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        setSessions([newSession]);
        setCurrentSessionId(newSession.id);
      }
    }
  };

  const getCurrentSession = () => sessions.find(s => s.id === currentSessionId);

  // --- Chat Logic ---
  const handleSend = async () => {
    if (!input.trim() || !currentSessionId || isLoading) return;

    const currentSession = getCurrentSession();
    if (!currentSession) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      content: input,
      timestamp: Date.now()
    };

    // Optimistic UI update
    const updatedMessages = [...currentSession.messages, userMessage];
    updateSessionMessages(currentSessionId, updatedMessages);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    // Generate Title if it's the first message
    if (currentSession.messages.length === 0) {
        updateSessionTitle(currentSessionId, input.slice(0, 30) + (input.length > 30 ? '...' : ''));
    }

    try {
      let responseText = '';
      
      if (settings.provider === ModelProvider.GEMINI) {
        // Initialize Gemini Chat with History
        const chat = createGeminiChat(settings, currentSession.messages);
        
        // Placeholder message for AI
        const aiMessageId = (Date.now() + 1).toString();
        const initialAiMessage: Message = {
            id: aiMessageId,
            role: Role.MODEL,
            content: '',
            timestamp: Date.now()
        };
        
        updateSessionMessages(currentSessionId, [...updatedMessages, initialAiMessage]);

        await streamGeminiResponse(chat, input, (chunk) => {
            responseText += chunk;
            setSessions(prev => prev.map(s => {
                if (s.id === currentSessionId) {
                    const msgs = [...s.messages];
                    const lastMsg = msgs[msgs.length - 1];
                    if (lastMsg && lastMsg.role === Role.MODEL) {
                        // Update last message content
                         msgs[msgs.length - 1] = { ...lastMsg, content: responseText };
                    }
                    return { ...s, messages: msgs, updatedAt: Date.now() };
                }
                return s;
            }));
        });

      } else {
        // Simulation for other providers
        const aiMessageId = (Date.now() + 1).toString();
        setTimeout(() => {
             const aiMessage: Message = {
                id: aiMessageId,
                role: Role.MODEL,
                content: `[Simulated ${settings.provider} Response] \n\nI am configured to use the **${settings.provider}** provider, but the backend demo logic is currently optimized for Gemini. \n\nPlease switch to **Gemini** in settings to see the full streaming API integration in action!`,
                timestamp: Date.now()
            };
            updateSessionMessages(currentSessionId, [...updatedMessages, aiMessage]);
            setIsLoading(false);
        }, 1000);
        // Return early to avoid setting loading false twice immediately
        return; 
      }

    } catch (error) {
      console.error("Chat Error:", error);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: Role.MODEL,
        content: "Sorry, an error occurred while processing your request.",
        timestamp: Date.now(),
        isError: true
      };
      updateSessionMessages(currentSessionId, [...updatedMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSessionMessages = (sessionId: string, newMessages: Message[]) => {
    setSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, messages: newMessages, updatedAt: Date.now() } : s
    ));
  };

  const updateSessionTitle = (sessionId: string, title: string) => {
      setSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, title: title } : s
      ));
  }

  // --- Input Auto-resize ---
  const handleInputResize = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSend();
      }
  }

  const currentSession = getCurrentSession();

  return (
    <div className="flex h-screen w-full bg-[#343541] overflow-hidden">
      
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed md:relative md:translate-x-0 z-30 w-[260px] h-full bg-[#202123] flex flex-col transition-transform duration-300 border-r border-white/10`}>
        
        {/* New Chat Button */}
        <div className="p-3">
          <button 
            onClick={createNewSession}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-md border border-white/20 text-white text-sm hover:bg-[#2A2B32] transition-colors duration-200 text-left mb-2"
          >
            <PlusIcon className="w-4 h-4" />
            New chat
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar px-3 pb-2">
            <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-zinc-500 px-3 py-2">History</span>
                {sessions.map(session => (
                    <div 
                        key={session.id}
                        onClick={() => {
                            setCurrentSessionId(session.id);
                            if(window.innerWidth < 768) setSidebarOpen(false);
                        }}
                        className={`group flex items-center gap-3 px-3 py-3 text-sm text-zinc-100 rounded-md cursor-pointer overflow-hidden relative ${currentSessionId === session.id ? 'bg-[#343541]' : 'hover:bg-[#2A2B32]'}`}
                    >
                        <MessageSquareIcon className="w-4 h-4 text-zinc-400 shrink-0" />
                        <div className="flex-1 truncate relative pr-5">
                            {session.title}
                            {/* Fade effect for long titles */}
                            <div className={`absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#202123] to-transparent group-hover:from-[#2A2B32] ${currentSessionId === session.id ? 'from-[#343541]' : ''}`}></div>
                        </div>
                        {/* Delete Button (Visible on Hover or Active) */}
                        {(currentSessionId === session.id) && (
                             <button 
                                onClick={(e) => deleteSession(e, session.id)}
                                className="absolute right-2 text-zinc-400 hover:text-white"
                             >
                                 <TrashIcon className="w-4 h-4" />
                             </button>
                        )}
                    </div>
                ))}
            </div>
        </div>

        {/* Settings / User Footer */}
        <div className="border-t border-white/20 p-3">
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-md hover:bg-[#2A2B32] text-sm text-white transition-colors"
            >
                <SettingsIcon className="w-4 h-4" />
                <div className="flex flex-col items-start text-left">
                    <span className="font-medium">Settings</span>
                    <span className="text-xs text-zinc-400">{settings.modelName}</span>
                </div>
            </button>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div 
            className="fixed inset-0 bg-black/60 z-20 md:hidden"
            onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative min-w-0">
        
        {/* Mobile Header */}
        <div className="md:hidden sticky top-0 z-10 flex items-center justify-between p-2 bg-[#343541] border-b border-white/10 text-zinc-200">
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-[#40414F] rounded">
                <MenuIcon className="w-6 h-6" />
            </button>
            <span className="font-medium truncate">{currentSession?.title || 'OmniChat'}</span>
            <button onClick={createNewSession} className="p-2 hover:bg-[#40414F] rounded">
                <PlusIcon className="w-6 h-6" />
            </button>
        </div>

        {/* Desktop Model Header */}
        <div className="hidden md:flex items-center justify-center p-2 border-b border-black/10 dark:border-white/10 bg-[#343541] text-sm text-zinc-400">
             Using Model: <span className="font-medium text-zinc-200 ml-1">{settings.modelName}</span>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar scroll-smooth">
            {currentSession?.messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-100 px-4">
                    <div className="bg-white/10 p-4 rounded-full mb-6">
                         <MessageSquareIcon className="w-12 h-12" />
                    </div>
                    <h2 className="text-2xl font-semibold mb-2">OmniChat Desktop</h2>
                    <p className="text-zinc-400 mb-8 text-center max-w-md">
                        Configurable AI interface. Powered by Gemini.
                        Start a conversation below.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full">
                        <button onClick={() => {setInput("Explain quantum computing in simple terms");}} className="p-3 bg-[#40414F] hover:bg-[#2A2B32] rounded-lg text-sm text-left transition-colors">
                            "Explain quantum computing" &rarr;
                        </button>
                        <button onClick={() => {setInput("Write a Python script to scrape a website");}} className="p-3 bg-[#40414F] hover:bg-[#2A2B32] rounded-lg text-sm text-left transition-colors">
                            "Write a Python script" &rarr;
                        </button>
                         <button onClick={() => {setInput("Write a haiku about coding");}} className="p-3 bg-[#40414F] hover:bg-[#2A2B32] rounded-lg text-sm text-left transition-colors">
                            "Write a haiku about coding" &rarr;
                        </button>
                        <button onClick={() => {setInput("How do I make a React app?");}} className="p-3 bg-[#40414F] hover:bg-[#2A2B32] rounded-lg text-sm text-left transition-colors">
                            "How do I make a React app?" &rarr;
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col pb-32 pt-4">
                    {currentSession?.messages.map((msg) => (
                        <MessageBubble key={msg.id} message={msg} userName={settings.userName} />
                    ))}
                     {isLoading && currentSession?.messages[currentSession.messages.length-1]?.role === Role.USER && (
                        <div className="w-full bg-[#444654] border-b border-black/10 dark:border-zinc-900/50 p-6">
                             <div className="max-w-4xl mx-auto flex gap-6">
                                <div className="w-8 h-8 bg-emerald-500 rounded-sm flex items-center justify-center">
                                    <BotIcon className="w-5 h-5 text-white" />
                                </div>
                                <div className="typing-cursor text-zinc-200">Thinking</div>
                             </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>
            )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#343541] via-[#343541] to-transparent pt-10 pb-6 px-4">
            <div className="max-w-3xl mx-auto relative">
                <div className="relative flex items-end w-full p-3 bg-[#40414F] border border-black/10 dark:border-none rounded-xl shadow-md overflow-hidden focus-within:ring-1 focus-within:ring-black/10">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputResize}
                        onKeyDown={handleKeyDown}
                        placeholder="Send a message..."
                        rows={1}
                        className="w-full max-h-[200px] py-2 pr-10 bg-transparent text-zinc-100 placeholder-zinc-400 focus:outline-none resize-none text-base custom-scrollbar"
                        style={{ minHeight: '24px' }}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={isLoading || !input.trim()}
                        className={`absolute right-3 bottom-3 p-1 rounded-md transition-colors ${input.trim() ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-transparent text-zinc-400 cursor-not-allowed'}`}
                    >
                        <SendIcon className="w-4 h-4" />
                    </button>
                </div>
                <div className="text-center mt-2">
                     <p className="text-[10px] text-zinc-500">
                        OmniChat may produce inaccurate information. Model: {settings.provider} ({settings.modelName})
                    </p>
                </div>
            </div>
        </div>

      </div>

      {/* Modals */}
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onSave={setSettings}
      />

    </div>
  );
};

export default App;