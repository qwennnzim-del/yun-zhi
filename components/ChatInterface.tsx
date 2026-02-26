'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Plus, 
  MessageSquare, 
  MoreVertical, 
  User, 
  Sparkles,
  Menu,
  X,
  Settings,
  HelpCircle,
  History,
  Copy,
  Check,
  RotateCcw
} from 'lucide-react';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY as string });

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
}

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const chat = genAI.chats.create({
        model: "gemini-3-flash-preview",
        config: {
          systemInstruction: "You are a helpful, creative, and friendly AI assistant. Your responses should be clear, concise, and formatted nicely using Markdown where appropriate.",
        },
        history: messages.map(m => ({
          role: m.role,
          parts: [{ text: m.content }]
        }))
      });

      const result = await chat.sendMessageStream({ message: input });
      
      let assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: '',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      let fullText = '';
      for await (const chunk of result) {
        const chunkText = chunk.text || '';
        fullText += chunkText;
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: fullText } 
            : msg
        ));
      }
    } catch (error) {
      console.error("Error calling Gemini:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'model',
        content: "Maaf, terjadi kesalahan saat menghubungi AI. Silakan coba lagi.",
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 20, stiffness: 100 }}
            className="w-72 bg-zinc-50 border-r border-zinc-200 flex flex-col z-20"
          >
            <div className="p-4 flex items-center justify-between">
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors lg:hidden"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-3 mb-4">
              <button 
                onClick={startNewChat}
                className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-200/50 hover:bg-zinc-200 rounded-full transition-colors text-zinc-700 font-medium"
              >
                <Plus size={20} />
                <span>Chat Baru</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-1">
              <div className="text-xs font-semibold text-zinc-500 px-4 py-2 uppercase tracking-wider">
                Terbaru
              </div>
              {/* Mock history for UI demo */}
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-200 rounded-lg transition-colors text-sm text-zinc-600 text-left truncate">
                <MessageSquare size={16} className="shrink-0" />
                <span className="truncate">Apa itu Next.js?</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-200 rounded-lg transition-colors text-sm text-zinc-600 text-left truncate">
                <MessageSquare size={16} className="shrink-0" />
                <span className="truncate">Resep Nasi Goreng</span>
              </button>
            </div>

            <div className="p-3 border-t border-zinc-200 space-y-1">
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-200 rounded-lg transition-colors text-sm text-zinc-600">
                <HelpCircle size={18} />
                <span>Bantuan</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-200 rounded-lg transition-colors text-sm text-zinc-600">
                <History size={18} />
                <span>Aktivitas</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-200 rounded-lg transition-colors text-sm text-zinc-600">
                <Settings size={18} />
                <span>Setelan</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-transparent">
          <div className="flex items-center gap-2">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="flex items-center gap-2 px-2">
              <span className="text-xl font-medium text-zinc-800 tracking-tight">Gemini</span>
              <span className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 font-medium">Flash</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-600">
              <Sparkles size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold">
              U
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div 
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-6 max-w-3xl mx-auto text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <h1 className="text-4xl md:text-5xl font-medium text-zinc-800 tracking-tight">
                  Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">User</span>
                </h1>
                <p className="text-xl md:text-2xl text-zinc-400 font-light max-w-xl">
                  Ada yang bisa saya bantu hari ini?
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-12">
                  {[
                    "Bantu saya menulis email profesional",
                    "Jelaskan konsep kuantum fisika",
                    "Ide kado untuk ulang tahun teman",
                    "Buat rencana perjalanan ke Bali"
                  ].map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setInput(suggestion);
                      }}
                      className="p-4 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-2xl text-left text-sm text-zinc-600 transition-all hover:shadow-sm"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-8 px-4 space-y-10">
              {messages.map((message) => (
                <div key={message.id} className="group flex gap-4 md:gap-6">
                  <div className="shrink-0 mt-1">
                    {message.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                        U
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white shadow-sm">
                        <Sparkles size={16} />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="font-medium text-sm text-zinc-900">
                      {message.role === 'user' ? 'Anda' : 'Gemini'}
                    </div>
                    <div className="prose prose-zinc max-w-none text-zinc-700 leading-relaxed">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                    {message.role === 'model' && message.content && (
                      <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="p-1.5 hover:bg-zinc-100 rounded-md text-zinc-500 transition-colors"
                          title="Salin"
                        >
                          {copiedId === message.id ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                        </button>
                        <button 
                          className="p-1.5 hover:bg-zinc-100 rounded-md text-zinc-500 transition-colors"
                          title="Bagikan"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-4 md:gap-6 animate-pulse">
                  <div className="shrink-0">
                    <div className="w-8 h-8 rounded-full bg-zinc-200" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-zinc-200 rounded w-20" />
                    <div className="h-4 bg-zinc-200 rounded w-full" />
                    <div className="h-4 bg-zinc-200 rounded w-2/3" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white">
          <div className="max-w-3xl mx-auto relative">
            <form 
              onSubmit={handleSubmit}
              className="relative flex items-end gap-2 bg-zinc-100 rounded-3xl p-2 pl-4 pr-2 focus-within:bg-zinc-50 focus-within:ring-1 focus-within:ring-zinc-200 transition-all"
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
                placeholder="Ketik pesan di sini..."
                rows={1}
                className="flex-1 bg-transparent border-none focus:ring-0 py-3 resize-none text-zinc-800 placeholder:text-zinc-500 max-h-60"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              <div className="flex items-center gap-1 pb-1">
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`p-2 rounded-full transition-all ${
                    input.trim() && !isLoading 
                      ? 'bg-zinc-800 text-white hover:bg-zinc-700' 
                      : 'text-zinc-400 cursor-not-allowed'
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
            <p className="text-[10px] text-zinc-400 text-center mt-3 px-4">
              Gemini dapat menampilkan informasi yang tidak akurat, termasuk tentang orang, jadi periksa kembali responsnya.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
