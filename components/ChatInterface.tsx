'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Send, 
  Plus, 
  MessageSquare, 
  MoreVertical, 
  Sparkles,
  Menu,
  X,
  Settings,
  HelpCircle,
  Info,
  Copy,
  Check,
  RotateCcw,
  Mic,
  Image as ImageIcon,
  Code
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
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTools, setShowTools] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Handle responsive sidebar
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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
          systemInstruction: "You are Yun-Zhi, a helpful, creative, and friendly AI assistant. Your responses should be clear, concise, and formatted nicely using Markdown where appropriate.",
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
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-full bg-white overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobile && isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/20 z-40 lg:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`
              fixed lg:relative inset-y-0 left-0 z-50
              w-72 bg-zinc-50 border-r border-zinc-200 flex flex-col
              shadow-xl lg:shadow-none
            `}
          >
            <div className="p-4 flex items-center justify-between">
              <div className="lg:hidden flex items-center gap-2 text-zinc-500">
                <Menu size={20} />
                <span className="font-medium">Menu</span>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors lg:hidden"
              >
                <X size={20} />
              </button>
            </div>

            <div className="px-3 mb-4 mt-2 lg:mt-6">
              <button 
                onClick={startNewChat}
                className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-200/50 hover:bg-zinc-200 rounded-full transition-all hover:shadow-md text-zinc-700 font-medium group"
              >
                <Plus size={20} className="text-zinc-500 group-hover:text-zinc-800 transition-colors" />
                <span className="group-hover:text-zinc-900">Chat Baru</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-1">
              <div className="text-xs font-semibold text-zinc-500 px-4 py-2 uppercase tracking-wider">
                Terbaru
              </div>
              {/* Mock history for UI demo */}
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-200 rounded-lg transition-colors text-sm text-zinc-600 text-left truncate group">
                <MessageSquare size={16} className="shrink-0 text-zinc-400 group-hover:text-zinc-600" />
                <span className="truncate">Apa itu Next.js?</span>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-200 rounded-lg transition-colors text-sm text-zinc-600 text-left truncate group">
                <MessageSquare size={16} className="shrink-0 text-zinc-400 group-hover:text-zinc-600" />
                <span className="truncate">Resep Nasi Goreng</span>
              </button>
            </div>

            <div className="p-3 border-t border-zinc-200 space-y-1">
              <button className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-200 rounded-lg transition-colors text-sm text-zinc-600">
                <HelpCircle size={18} />
                <span>Bantuan</span>
              </button>
              <button 
                onClick={() => {
                  setShowAbout(true);
                  if (isMobile) setIsSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-200 rounded-lg transition-colors text-sm text-zinc-600"
              >
                <Info size={18} />
                <span>Tentang</span>
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
      <main className="flex-1 flex flex-col relative min-w-0 h-full">
        {/* About Overlay */}
        <AnimatePresence>
          {showAbout && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute inset-0 z-40 bg-white overflow-y-auto"
            >
              <div className="max-w-3xl mx-auto py-12 px-6 md:px-8 pb-32">
                <button 
                  onClick={() => setShowAbout(false)}
                  className="mb-8 flex items-center gap-2 text-zinc-500 hover:text-zinc-800 transition-colors"
                >
                  <X size={20} />
                  <span>Tutup</span>
                </button>
                
                <article className="prose prose-zinc prose-lg max-w-none">
                  <h1 className="text-4xl md:text-5xl font-medium tracking-tight text-zinc-900 mb-8">
                    Tentang Yun-Zhi
                  </h1>
                  
                  <div className="flex items-center gap-4 mb-10 not-prose">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                      FA
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-zinc-900">M Fariz Alfauzi</h3>
                      <p className="text-zinc-500">CEO & Lead Developer</p>
                    </div>
                  </div>

                  <p className="lead text-xl text-zinc-600">
                    Halo! Saya M Fariz Alfauzi, pemuda berusia 17 tahun kelahiran Cianjur, Jawa Barat. Saat ini saya sedang menempuh pendidikan di <strong>SMK NURUL ISLAM AFFANDIYAH</strong> mengambil jurusan Teknik Komputer.
                  </p>

                  <h2>Visi & Misi</h2>
                  <p>
                    <strong>Visi:</strong> Menghadirkan teknologi kecerdasan buatan yang mudah diakses, responsif, dan memiliki antarmuka yang ramah bagi semua kalangan di Indonesia dan dunia.
                  </p>
                  <p>
                    <strong>Misi:</strong> Mengembangkan aplikasi dengan standar industri modern, mengutamakan kenyamanan pengguna (UX), dan terus berinovasi dalam dunia rekayasa perangkat lunak meskipun masih di usia muda.
                  </p>

                  <h2>Di Balik Layar (Teknologi)</h2>
                  <p>
                    Proyek Yun-Zhi ini dibangun dari nol dengan semangat untuk belajar dan menciptakan produk berkualitas tinggi. Berikut adalah teknologi utama yang menggerakkan aplikasi ini:
                  </p>
                  <ul>
                    <li><strong>Next.js 15:</strong> Framework React modern untuk performa rendering yang sangat cepat.</li>
                    <li><strong>Tailwind CSS 4:</strong> Digunakan untuk meracik desain antarmuka yang minimalis, bersih, dan responsif di berbagai ukuran layar.</li>
                    <li><strong>Google Gemini API:</strong> Otak kecerdasan buatan di balik Yun-Zhi yang memberikan respon cerdas dan natural.</li>
                    <li><strong>Framer Motion:</strong> Memberikan sentuhan animasi yang halus agar aplikasi terasa lebih hidup dan premium.</li>
                  </ul>

                  <hr className="my-10 border-zinc-200" />
                  
                  <p className="text-sm text-zinc-500 text-center">
                    Dibuat dengan ❤️ oleh M Fariz Alfauzi © {new Date().getFullYear()}
                  </p>
                </article>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-transparent shrink-0">
          <div className="flex items-center gap-2">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-600"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="flex items-center gap-2 px-2">
              <span className="text-xl font-medium text-zinc-800 tracking-tight">Yun-Zhi</span>
              <span className="text-xs bg-zinc-100 px-1.5 py-0.5 rounded text-zinc-500 font-medium">Flash</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-600">
              <Sparkles size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-indigo-100">
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
                  Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">User</span>
                </h1>
                <p className="text-xl md:text-2xl text-zinc-400 font-light max-w-xl">
                  Saya Yun-Zhi, asisten AI Anda. Ada yang bisa saya bantu?
                </p>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto py-8 px-4 space-y-8 pb-32">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`group flex gap-4 md:gap-6 ${
                    message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className="shrink-0 mt-1">
                    {message.role === 'user' ? (
                      <div className="w-8 h-8 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 text-xs font-bold hidden sm:flex">
                        U
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-indigo-600 shadow-sm bg-white">
                        <Sparkles size={16} />
                      </div>
                    )}
                  </div>
                  <div className={`flex-1 min-w-0 flex flex-col ${
                    message.role === 'user' ? 'items-end' : 'items-start'
                  }`}>
                    <div className={`
                      max-w-[90%] sm:max-w-[85%] px-2
                    `}>
                      <div className={`prose max-w-none leading-relaxed ${
                        message.role === 'user' ? 'prose-zinc text-zinc-800 text-right' : 'prose-zinc text-zinc-800'
                      }`}>
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                    </div>
                    {message.role === 'model' && message.content && (
                      <div className="flex items-center gap-2 pt-2 pl-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="p-1.5 hover:bg-zinc-100 rounded-md text-zinc-400 hover:text-zinc-600 transition-colors"
                          title="Salin"
                        >
                          {copiedId === message.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        </button>
                        <button 
                          className="p-1.5 hover:bg-zinc-100 rounded-md text-zinc-400 hover:text-zinc-600 transition-colors"
                          title="Putar ulang"
                        >
                          <RotateCcw size={14} />
                        </button>
                        <button 
                          className="p-1.5 hover:bg-zinc-100 rounded-md text-zinc-400 hover:text-zinc-600 transition-colors"
                          title="Lainnya"
                        >
                          <MoreVertical size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-4 md:gap-6">
                  <div className="shrink-0 mt-1">
                     <div className="w-8 h-8 rounded-full border border-zinc-200 flex items-center justify-center text-indigo-600 shadow-sm bg-white">
                        <Sparkles size={16} />
                      </div>
                  </div>
                  <div className="px-2 py-2">
                    <div className="flex gap-1.5">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                        className="w-2 h-2 bg-zinc-400 rounded-full" 
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                        className="w-2 h-2 bg-zinc-400 rounded-full" 
                      />
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                        className="w-2 h-2 bg-zinc-400 rounded-full" 
                      />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white shrink-0">
          <div className="max-w-3xl mx-auto">
            <form 
              onSubmit={handleSubmit}
              className="bg-zinc-100 rounded-[32px] p-3 shadow-sm focus-within:ring-1 focus-within:ring-zinc-200 transition-all"
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
                placeholder="Tanyakan apa saja"
                rows={1}
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none px-2 resize-none text-zinc-800 placeholder:text-zinc-500 min-h-[24px] max-h-60 text-base mb-2"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
              
              <div className="flex items-center justify-between pl-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="p-2 text-zinc-500 hover:bg-zinc-200 rounded-full transition-colors"
                    title="Upload file"
                  >
                    <Plus size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowTools(!showTools)}
                    className="p-2 text-zinc-500 hover:bg-zinc-200 rounded-full transition-colors relative"
                    title="Tools"
                  >
                    <Mic size={20} />
                    {showTools && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-lg border border-zinc-100 p-2 flex flex-col gap-1 z-50">
                        <div className="text-xs font-semibold text-zinc-400 px-2 py-1">Fitur</div>
                        <button className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-50 rounded-lg text-sm text-zinc-600 text-left">
                          <ImageIcon size={16} />
                          <span>Analisis Gambar</span>
                        </button>
                        <button className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-50 rounded-lg text-sm text-zinc-600 text-left">
                          <Code size={16} />
                          <span>Code Interpreter</span>
                        </button>
                      </div>
                    )}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className={`p-2 rounded-full transition-all ${
                    input.trim() && !isLoading 
                      ? 'bg-zinc-900 text-white hover:bg-zinc-700 shadow-md' 
                      : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                  }`}
                >
                  <Send size={20} />
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
