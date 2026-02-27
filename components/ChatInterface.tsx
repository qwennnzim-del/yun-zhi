'use client';

import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc, updateDoc, onSnapshot, query, orderBy, serverTimestamp, getDoc, deleteDoc } from 'firebase/firestore';
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
  Code,
  Wand2,
  Search,
  BookOpen,
  Shield,
  ChevronUp,
  Trash2,
  FileText,
  Camera,
  File as FileIcon
} from 'lucide-react';

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY as string });

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  inlineData?: {
    mimeType: string;
    data: string;
  };
  attachmentUrl?: string;
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const base64Data = reader.result.split(',')[1];
        resolve(base64Data);
      }
    };
    reader.onerror = error => reject(error);
  });
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTools, setShowTools] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Firebase state
  const [chatHistory, setChatHistory] = useState<{id: string, title: string}[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  
  // Model selection state
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [showModelSelector, setShowModelSelector] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Settings & Delete state
  const [showSettings, setShowSettings] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Fetch chat history from Firestore
  useEffect(() => {
    const q = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || 'Chat Baru',
      }));
      setChatHistory(chats);
    });
    return () => unsubscribe();
  }, []);

  const loadChat = async (id: string) => {
    try {
      const docRef = doc(db, 'chats', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMessages(data.messages || []);
        setCurrentChatId(id);
        if (isMobile) setIsSidebarOpen(false);
      }
    } catch (error) {
      console.error("Error loading chat:", error);
    }
  };

  // Handle responsive sidebar
  useEffect(() => {
    let prevMobile = window.innerWidth < 1024;
    setIsMobile(prevMobile);
    setIsSidebarOpen(!prevMobile);

    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      // Only change sidebar state if crossing the breakpoint
      if (mobile !== prevMobile) {
        setIsSidebarOpen(!mobile);
        prevMobile = mobile;
      }
    };
    
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setFilePreview(url);
      } else {
        setFilePreview('file'); // Special string to denote non-image file
      }
      setShowAttachmentMenu(false);
    }
    // Reset all inputs
    if (imageInputRef.current) imageInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (filePreview && filePreview !== 'file') {
      URL.revokeObjectURL(filePreview);
    }
    setFilePreview(null);
  };

  const deleteChat = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'chats', id));
      if (currentChatId === id) {
        startNewChat();
      }
      setChatToDelete(null);
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  };

  const deleteAllChats = async () => {
    try {
      for (const chat of chatHistory) {
        await deleteDoc(doc(db, 'chats', chat.id));
      }
      startNewChat();
      setShowDeleteAllConfirm(false);
    } catch (error) {
      console.error("Error deleting all chats:", error);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!input.trim() && !selectedFile) || isLoading) return;

    let base64Data = '';
    let mimeType = '';
    let attachmentUrl = '';

    if (selectedFile) {
      base64Data = await fileToBase64(selectedFile);
      mimeType = selectedFile.type || 'text/plain';
      if (mimeType.startsWith('image/')) {
        attachmentUrl = URL.createObjectURL(selectedFile);
      } else {
        attachmentUrl = 'file'; // Special marker for non-image files
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || (selectedFile ? (mimeType.startsWith('image/') ? "Tolong analisis gambar ini." : "Tolong analisis dokumen ini.") : ''),
      timestamp: new Date().toISOString(),
    };

    if (base64Data) {
      userMessage.inlineData = { mimeType, data: base64Data };
    }
    if (attachmentUrl) {
      userMessage.attachmentUrl = attachmentUrl;
    }

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setSelectedFile(null);
    setFilePreview(null);
    setIsLoading(true);

    let activeChatId = currentChatId;

    try {
      if (!activeChatId) {
        const newChatRef = doc(collection(db, 'chats'));
        activeChatId = newChatRef.id;
        setCurrentChatId(activeChatId);
        await setDoc(newChatRef, {
          title: userMessage.content.slice(0, 30) || 'Percakapan Baru',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          messages: newMessages
        });
      } else {
        await updateDoc(doc(db, 'chats', activeChatId), {
          messages: newMessages,
          updatedAt: serverTimestamp()
        });
      }

      const chat = genAI.chats.create({
        model: selectedModel,
        config: {
          systemInstruction: "You are Yun-Zhi, an advanced AI assistant developed by M Fariz Alfauzi at Zent Technology Inc. You are helpful, creative, and friendly. Your responses should be clear, concise, and formatted nicely using Markdown where appropriate.",
        },
        history: messages.map(m => {
          const parts: any[] = [];
          if (m.inlineData) {
            parts.push({ inlineData: m.inlineData });
          }
          if (m.content) {
            parts.push({ text: m.content });
          }
          return {
            role: m.role,
            parts
          };
        })
      });

      const messageParts: any[] = [];
      if (base64Data) {
        messageParts.push({ inlineData: { mimeType, data: base64Data } });
      }
      messageParts.push({ text: userMessage.content });

      const result = await chat.sendMessageStream({ message: messageParts });
      
      let assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: '',
        timestamp: new Date().toISOString(),
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

      // Save final AI message to Firestore
      if (activeChatId) {
        const finalMessages = [...newMessages, { ...assistantMessage, content: fullText }];
        await updateDoc(doc(db, 'chats', activeChatId), {
          messages: finalMessages,
          updatedAt: serverTimestamp()
        });
      }

    } catch (error: any) {
      console.error("Error calling Gemini or Firebase:", error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'model',
        content: `Maaf, terjadi kesalahan: ${error?.message || 'Unknown error'}. Silakan coba lagi.`,
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewChat = () => {
    setMessages([]);
    setInput('');
    removeFile();
    setCurrentChatId(null);
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
                className="w-full flex items-center gap-3 px-4 py-3 bg-zinc-200/50 hover:bg-zinc-200 rounded-full transition-all hover:shadow-md text-zinc-700 font-medium group mb-4"
              >
                <Plus size={18} className="text-zinc-500 group-hover:text-zinc-800 transition-colors" />
                <span className="group-hover:text-zinc-900">Chat Baru</span>
              </button>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari percakapan..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-200/50 border-none rounded-lg pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-zinc-300 outline-none text-zinc-700 placeholder:text-zinc-400 transition-all"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-3 space-y-1">
              <div className="text-xs font-semibold text-zinc-500 px-4 py-2 uppercase tracking-wider">
                Terbaru
              </div>
              {chatHistory.length === 0 ? (
                <div className="px-4 py-2 text-sm text-zinc-400 italic">Belum ada percakapan</div>
              ) : (
                chatHistory.filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                  <div className="px-4 py-2 text-sm text-zinc-400 italic">Tidak ditemukan</div>
                ) : (
                  chatHistory.filter(chat => chat.title.toLowerCase().includes(searchQuery.toLowerCase())).map((chat) => (
                    <div key={chat.id} className="relative group">
                      <button 
                        onClick={() => loadChat(chat.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm text-left truncate pr-10 ${
                          currentChatId === chat.id ? 'bg-zinc-200 text-zinc-900 font-medium' : 'hover:bg-zinc-200 text-zinc-600'
                        }`}
                      >
                        <MessageSquare size={16} className={`shrink-0 ${currentChatId === chat.id ? 'text-zinc-600' : 'text-zinc-400 group-hover:text-zinc-600'}`} />
                        <span className="truncate">{chat.title}</span>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setChatToDelete(chat.id);
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-md opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all"
                        title="Hapus percakapan"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))
                )
              )}
            </div>

            <div className="p-3 border-t border-zinc-200 space-y-1">
              <div className="relative">
                <button 
                  onClick={() => setShowHelpPopup(!showHelpPopup)}
                  className="w-full flex items-center justify-between px-4 py-2 hover:bg-zinc-200 rounded-lg transition-colors text-sm text-zinc-600"
                >
                  <div className="flex items-center gap-3">
                    <HelpCircle size={18} />
                    <span>Bantuan</span>
                  </div>
                  <ChevronUp size={16} className={`transition-transform ${showHelpPopup ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {showHelpPopup && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute bottom-full left-0 mb-2 w-full bg-white rounded-xl shadow-lg border border-zinc-100 p-2 flex flex-col gap-1 z-50"
                    >
                      <Link href="/help?tab=faq" className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 rounded-lg text-sm text-zinc-600 transition-colors">
                        <BookOpen size={16} className="text-indigo-500" />
                        <span>Pusat Bantuan</span>
                      </Link>
                      <Link href="/help?tab=privacy" className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-50 rounded-lg text-sm text-zinc-600 transition-colors">
                        <Shield size={16} className="text-emerald-500" />
                        <span>Privasi & Keamanan</span>
                      </Link>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Link 
                href="/about"
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-200 rounded-lg transition-colors text-sm text-zinc-600"
              >
                <Info size={18} />
                <span>Tentang</span>
              </Link>
              <button 
                onClick={() => setShowSettings(true)}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-zinc-200 rounded-lg transition-colors text-sm text-zinc-600"
              >
                <Settings size={18} />
                <span>Setelan</span>
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/20 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[70] bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-md"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-zinc-900">Setelan</h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full text-zinc-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <h4 className="font-medium text-zinc-900 mb-1">Tema</h4>
                  <p className="text-sm text-zinc-500 mb-3">Pilih tema tampilan aplikasi.</p>
                  <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-zinc-200 rounded-lg text-sm font-medium text-zinc-700 shadow-sm">Terang</button>
                    <button className="px-4 py-2 bg-zinc-100 border border-transparent rounded-lg text-sm font-medium text-zinc-400 cursor-not-allowed">Gelap (Segera)</button>
                  </div>
                </div>
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                  <h4 className="font-medium text-zinc-900 mb-1">Akun</h4>
                  <p className="text-sm text-zinc-500">Masuk untuk menyimpan riwayat percakapan antar perangkat.</p>
                  <button className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors">
                    Masuk
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Chat Confirmation */}
      <AnimatePresence>
        {chatToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-[80] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[90] bg-white rounded-2xl shadow-xl p-6 w-[90%] max-w-sm"
            >
              <h3 className="text-lg font-semibold text-zinc-900 mb-2">Hapus Percakapan?</h3>
              <p className="text-sm text-zinc-500 mb-6">Percakapan ini akan dihapus secara permanen dan tidak dapat dikembalikan.</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setChatToDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={() => deleteChat(chatToDelete)}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>



      {/* Model Selector Bottom Sheet */}
      <AnimatePresence>
        {showModelSelector && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModelSelector(false)}
              className="fixed inset-0 bg-black/20 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl border-t border-zinc-200 p-6 md:max-w-md md:mx-auto md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:rounded-3xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-zinc-900">Pilih Model AI</h3>
                <button 
                  onClick={() => setShowModelSelector(false)}
                  className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full text-zinc-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setSelectedModel('gemini-2.5-flash');
                    setShowModelSelector(false);
                  }}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                    selectedModel === 'gemini-2.5-flash' 
                      ? 'border-indigo-500 bg-indigo-50/50' 
                      : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedModel === 'gemini-2.5-flash' ? 'border-indigo-500' : 'border-zinc-300'
                  }`}>
                    {selectedModel === 'gemini-2.5-flash' && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-zinc-900 flex items-center gap-2">
                      Yun-Zhi 2.5
                      <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Default</span>
                    </div>
                    <div className="text-sm text-zinc-500 mt-1">Model cepat dan efisien untuk tugas sehari-hari. Gratis digunakan.</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setSelectedModel('gemini-3-flash-preview');
                    setShowModelSelector(false);
                  }}
                  className={`w-full flex items-start gap-4 p-4 rounded-2xl border transition-all ${
                    selectedModel === 'gemini-3-flash-preview' 
                      ? 'border-indigo-500 bg-indigo-50/50' 
                      : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                  }`}
                >
                  <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedModel === 'gemini-3-flash-preview' ? 'border-indigo-500' : 'border-zinc-300'
                  }`}>
                    {selectedModel === 'gemini-3-flash-preview' && <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full" />}
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-zinc-900 flex items-center gap-2">
                      Yun-Zhi 3
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Preview</span>
                    </div>
                    <div className="text-sm text-zinc-500 mt-1">Model terbaru dengan kemampuan penalaran lebih tinggi. Gratis digunakan.</div>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0 h-full">
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
              <button 
                onClick={() => setShowModelSelector(true)}
                className="flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1.5 rounded-lg text-zinc-600 font-medium transition-colors"
              >
                <Sparkles size={14} className="text-indigo-500" />
                {selectedModel === 'gemini-3-flash-preview' ? 'Yun-Zhi 3' : 'Yun-Zhi 2.5'}
                <ChevronUp size={14} className="rotate-180 text-zinc-400" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
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
                <div className="w-16 h-16 rounded-full border border-zinc-200 flex items-center justify-center text-indigo-600 shadow-sm bg-white mx-auto mb-6">
                  <Sparkles size={32} />
                </div>
                <h1 className="text-3xl md:text-4xl font-medium text-zinc-800 tracking-tight">
                  Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">User</span>
                </h1>
                <div className="text-lg text-zinc-500 font-light max-w-xl mx-auto space-y-4">
                  <p>
                    I'm <strong>Yun-Zhi</strong>. How can I help you today?
                  </p>
                </div>
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
                        {message.attachmentUrl && message.attachmentUrl !== 'file' && (
                          <div className={`mb-3 ${message.role === 'user' ? 'flex justify-end' : 'flex justify-start'}`}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={message.attachmentUrl} alt="Attachment" className="max-w-[200px] rounded-2xl border border-zinc-200 shadow-sm" />
                          </div>
                        )}
                        {message.attachmentUrl === 'file' && (
                          <div className={`mb-3 flex items-center gap-3 p-3 rounded-2xl border border-zinc-200 bg-zinc-50 shadow-sm max-w-[250px] ${message.role === 'user' ? 'ml-auto' : 'mr-auto'}`}>
                            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                              <FileIcon size={20} className="text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-zinc-900 truncate">Dokumen Terlampir</p>
                              <p className="text-xs text-zinc-500">File</p>
                            </div>
                          </div>
                        )}
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
              {filePreview && (
                <div className="px-3 pt-2 pb-2">
                  <div className="relative inline-block">
                    {filePreview === 'file' ? (
                      <div className="h-16 w-16 rounded-xl border border-zinc-200 shadow-sm bg-indigo-50 flex items-center justify-center">
                        <FileIcon size={24} className="text-indigo-500" />
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={filePreview} alt="Preview" className="h-16 w-16 object-cover rounded-xl border border-zinc-200 shadow-sm" />
                    )}
                    <button
                      type="button"
                      onClick={removeFile}
                      className="absolute -top-2 -right-2 bg-zinc-800 text-white rounded-full p-1 hover:bg-zinc-700 shadow-sm"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}

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
                <div className="flex items-center gap-1 relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={imageInputRef} 
                    onChange={handleFileChange} 
                  />
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx,.txt,.csv" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                  />
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment"
                    className="hidden" 
                    ref={cameraInputRef} 
                    onChange={handleFileChange} 
                  />
                  
                  <button
                    type="button"
                    onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    className={`p-2.5 rounded-full transition-colors ${showAttachmentMenu ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-500 hover:bg-zinc-200'}`}
                    title="Lampirkan"
                  >
                    <Plus size={18} className={`transition-transform duration-200 ${showAttachmentMenu ? 'rotate-45' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showAttachmentMenu && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute bottom-full left-0 mb-3 bg-white rounded-2xl shadow-xl border border-zinc-200 p-1.5 flex items-center gap-1 z-50"
                      >
                        <button
                          type="button"
                          onClick={() => imageInputRef.current?.click()}
                          className="flex flex-col items-center justify-center w-16 h-14 rounded-xl hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors gap-1"
                        >
                          <ImageIcon size={20} />
                          <span className="text-[10px] font-medium">Gambar</span>
                        </button>
                        <div className="w-px h-8 bg-zinc-200 mx-0.5" />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex flex-col items-center justify-center w-16 h-14 rounded-xl hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors gap-1"
                        >
                          <FileIcon size={20} />
                          <span className="text-[10px] font-medium">File</span>
                        </button>
                        <div className="w-px h-8 bg-zinc-200 mx-0.5" />
                        <button
                          type="button"
                          onClick={() => cameraInputRef.current?.click()}
                          className="flex flex-col items-center justify-center w-16 h-14 rounded-xl hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors gap-1"
                        >
                          <Camera size={20} />
                          <span className="text-[10px] font-medium">Kamera</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <button
                    type="button"
                    onClick={() => setShowTools(!showTools)}
                    className="p-2.5 text-zinc-500 hover:bg-zinc-200 rounded-full transition-colors relative"
                    title="Tools"
                  >
                    <Wand2 size={18} />
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

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="p-2.5 text-zinc-500 hover:bg-zinc-200 rounded-full transition-colors"
                    title="Voice Note"
                  >
                    <Mic size={18} />
                  </button>
                  <button
                    type="submit"
                    disabled={(!input.trim() && !selectedFile) || isLoading}
                    className={`p-2.5 rounded-full transition-all ${
                      (input.trim() || selectedFile) && !isLoading 
                        ? 'bg-zinc-900 text-white hover:bg-zinc-700 shadow-md' 
                        : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="fixed inset-0 bg-black/20 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed z-[70] bg-white rounded-3xl shadow-2xl border border-zinc-200 p-6 w-[90%] max-w-md left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-zinc-900">Pengaturan</h3>
                <button 
                  onClick={() => setShowSettings(false)}
                  className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full text-zinc-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-3">
                <div 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <div className={`w-12 h-7 rounded-full relative shrink-0 transition-colors ${isDarkMode ? 'bg-indigo-500' : 'bg-zinc-300'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full absolute top-1 shadow-sm transition-transform ${isDarkMode ? 'left-6' : 'left-1'}`}></div>
                  </div>
                  <div>
                    <h4 className="font-medium text-zinc-900">Mode Gelap</h4>
                    <p className="text-xs text-zinc-500">Ubah tampilan menjadi gelap (Segera)</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => {
                    setShowSettings(false);
                    setShowDeleteAllConfirm(true);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-2xl border border-red-100 bg-red-50 hover:bg-red-100 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                    <Trash2 size={18} />
                  </div>
                  <div>
                    <h4 className="font-medium text-red-600">Hapus Semua Riwayat</h4>
                    <p className="text-xs text-red-500/80">Hapus permanen semua percakapan</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete All Confirmation Bottom Sheet */}
      <AnimatePresence>
        {showDeleteAllConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDeleteAllConfirm(false)}
              className="fixed inset-0 bg-black/20 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-3xl shadow-2xl border-t border-zinc-200 p-6 md:max-w-md md:mx-auto md:bottom-auto md:top-1/2 md:-translate-y-1/2 md:rounded-3xl"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                    <Trash2 size={20} />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-900">Hapus Semua Riwayat?</h3>
                </div>
                <button 
                  onClick={() => setShowDeleteAllConfirm(false)}
                  className="p-2 bg-zinc-100 hover:bg-zinc-200 rounded-full text-zinc-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <p className="text-sm text-zinc-500 mb-6">
                Tindakan ini akan menghapus semua percakapan Anda secara permanen dari perangkat dan server. Anda yakin ingin melanjutkan?
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteAllConfirm(false)}
                  className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={deleteAllChats}
                  className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium shadow-sm transition-colors"
                >
                  Hapus Semua
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {chatToDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setChatToDelete(null)}
              className="fixed inset-0 bg-black/20 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed z-[70] bg-white rounded-3xl shadow-2xl border border-zinc-200 p-6 w-[90%] max-w-sm left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
            >
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 mb-2">Hapus Percakapan?</h3>
              <p className="text-sm text-zinc-500 mb-6">
                Percakapan ini akan dihapus secara permanen dari riwayat Anda. Tindakan ini tidak dapat dibatalkan.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setChatToDelete(null)}
                  className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl font-medium transition-colors"
                >
                  Batal
                </button>
                <button 
                  onClick={() => deleteChat(chatToDelete)}
                  className="flex-1 py-3 px-4 bg-red-500 hover:bg-red-600 text-white rounded-xl font-medium shadow-sm transition-colors"
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
