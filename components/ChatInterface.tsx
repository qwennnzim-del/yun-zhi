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
  File as FileIcon,
  ArrowUp,
  ArrowLeft,
  Link2,
  Volume2,
  Globe,
  MessageCircle,
  Smartphone,
  Share2,
  ThumbsUp,
  Loader2
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
  groundingChunks?: any[];
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
  const [chatHistory, setChatHistory] = useState<{id: string, title: string, isPublic?: boolean, updatedAt?: any}[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showHelpPopup, setShowHelpPopup] = useState(false);
  const [showPublicLinks, setShowPublicLinks] = useState(false);
  
  // Model selection state
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [showModelSelector, setShowModelSelector] = useState(false);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedSources, setSelectedSources] = useState<any[] | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Settings & Delete state
  const [showSettings, setShowSettings] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
    const [likedMessages, setLikedMessages] = useState<Set<string>>(new Set());

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.popup-container') && !target.closest('.sidebar-container') && !target.closest('.menu-button')) {
        setShowAttachmentMenu(false);
        setShowTools(false);
        if (isMobile) setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile]);

      const toggleLike = (id: string) => {
    setLikedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  // Fetch chat history from Firestore
  useEffect(() => {
    const q = query(collection(db, 'chats'), orderBy('updatedAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        title: doc.data().title || 'Chat Baru',
        isPublic: doc.data().isPublic || false,
        updatedAt: doc.data().updatedAt
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

  const handleShareChat = async () => {
    if (!currentChatId) return;
    try {
      await updateDoc(doc(db, 'chats', currentChatId), {
        isPublic: true
      });
      const shareUrl = `${window.location.origin}/share/${currentChatId}`;
      await navigator.clipboard.writeText(shareUrl);
      alert('Link publik berhasil disalin ke clipboard!');
    } catch (error) {
      console.error("Error sharing chat:", error);
    }
  };

  const handleRemovePublicLink = async (chatId: string) => {
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        isPublic: false
      });
    } catch (error) {
      console.error("Error removing public link:", error);
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
    setIsSearching(isSearchEnabled);

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
          ...(isSearchEnabled ? { tools: [{ googleSearch: {} }] } : {})
        },
        history: messages.filter(m => m.content.trim() || m.inlineData).map(m => {
          const parts: any[] = [];
          if (m.inlineData) {
            parts.push({ inlineData: m.inlineData });
          }
          if (m.content.trim()) {
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

      const result = await chat.sendMessageStream({ message: { parts: messageParts } });
      
      let assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: '',
        timestamp: new Date().toISOString(),
      };

      let fullText = '';
      let groundingChunks: any[] = [];
      let isFirstChunk = true;

      for await (const chunk of result) {
        if (isFirstChunk) {
          setMessages(prev => [...prev, assistantMessage]);
          isFirstChunk = false;
        }

        const chunkText = chunk.text || '';
        fullText += chunkText;
        
        if (chunk.candidates?.[0]?.groundingMetadata?.groundingChunks) {
          groundingChunks = chunk.candidates[0].groundingMetadata.groundingChunks;
        }

        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessage.id 
            ? { ...msg, content: fullText, groundingChunks: groundingChunks.length > 0 ? groundingChunks : undefined } 
            : msg
        ));
      }

      // If stream was empty, still add the message
      if (isFirstChunk) {
        setMessages(prev => [...prev, assistantMessage]);
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
    <div className="flex h-full bg-white overflow-hidden font-sans text-zinc-900 transition-colors duration-200">
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
              shadow-xl lg:shadow-none transition-colors duration-200 sidebar-container
            `}
          >
            <div className="p-4 flex items-center justify-between">
              <div className="lg:hidden flex items-center gap-2 text-zinc-500">
                <Menu size={20} />
                <span className="font-medium">Menu</span>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors lg:hidden text-zinc-500"
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
                <span className="group-hover">Chat Baru</span>
              </button>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari percakapan..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-200/50 border-none rounded-lg pl-9 pr-3 py-2 text-sm focus focus outline-none text-zinc-700 placeholder transition-all"
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
                        <MessageSquare size={16} className={`shrink-0 ${currentChatId === chat.id ? 'text-zinc-600' : 'text-zinc-400 group-hover'}`} />
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
                      <Link href="/help?tab=faq" className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-200 rounded-lg text-sm text-zinc-600 transition-colors">
                        <BookOpen size={16} className="text-indigo-500" />
                        <span>Pusat Bantuan</span>
                      </Link>
                      <Link href="/help?tab=privacy" className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-200 rounded-lg text-sm text-zinc-600 transition-colors">
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
      <main className="flex-1 flex flex-col relative min-w-0 h-full bg-white transition-colors duration-200">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 border-b border-transparent shrink-0">
          <div className="flex items-center gap-2">
            {!isSidebarOpen && (
              <button 
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors text-zinc-600"
              >
                <Menu size={20} />
              </button>
            )}
            <div className="flex items-center gap-2 px-2">
              <button 
                onClick={() => setShowModelSelector(true)}
                className="flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 px-2.5 py-1.5 rounded-lg text-zinc-600 font-medium transition-colors"
              >
                <img src="/logo-app.png" alt="Yun-Zhi Logo" className="w-5 h-5 object-contain" />
                {selectedModel === 'gemini-3-flash-preview' ? 'Yun-Zhi 3' : 'Yun-Zhi 2.5'}
                <ChevronUp size={14} className="rotate-180 text-zinc-400" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {currentChatId && (
              <button 
                onClick={handleShareChat}
                className="p-2 hover:bg-zinc-200 rounded-full transition-colors text-zinc-600"
                title="Bagikan percakapan"
              >
                <Share2 size={20} />
              </button>
            )}
            <button className="button">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Login
              <div className="hoverEffect">
                <div></div>
              </div>
            </button>
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
                <div className="flex items-center justify-center mx-auto mb-6">
                  <img src="/logo-app.png" alt="Yun-Zhi Logo" className="w-20 h-20 object-contain" />
                </div>
                <h1 className="text-3xl md font-medium text-zinc-800 tracking-tight">
                  Halo, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-600">User</span>
                </h1>
                <div className="text-lg text-zinc-500 font-light max-w-xl mx-auto space-y-4">
                  <p>
                    I&apos;m <strong>Yun-Zhi</strong>. How can I help you today?
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
                      <div className="w-10 h-10 rounded-full bg-zinc-200 flex items-center justify-center text-zinc-500 text-xs font-bold hidden sm:flex">
                        U
                      </div>
                    ) : (
                      <div className="w-10 h-10 flex items-center justify-center">
                        <img src="/logo-app.png" alt="Yun-Zhi Logo" className="w-10 h-10 object-contain" />
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
                        {message.groundingChunks && message.groundingChunks.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            <button 
                              onClick={() => setSelectedSources(message.groundingChunks!)}
                              className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 rounded-full text-xs font-medium text-zinc-600 transition-colors"
                            >
                              <Globe size={14} />
                              <span>
                                {(() => {
                                  try {
                                    return new URL(message.groundingChunks[0].web?.uri || 'http://google.com').hostname.replace('www.', '');
                                  } catch (e) {
                                    return 'Sumber';
                                  }
                                })()}
                                {message.groundingChunks.length > 1 ? ` +${message.groundingChunks.length - 1} lainnya` : ''}
                              </span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {message.role === 'model' && message.content && (
                      <div className="flex items-center gap-2 pt-2 pl-2 transition-opacity">
                        <button 
                          onClick={() => toggleLike(message.id)}
                          className={`p-1.5 rounded-md transition-colors ${likedMessages.has(message.id) ? 'text-indigo-600 bg-indigo-50' : 'text-zinc-400 hover:border-zinc-300 hover:bg-zinc-50'}`}
                          title={likedMessages.has(message.id) ? "Batal Suka" : "Suka"}
                        >
                          <ThumbsUp size={14} className={likedMessages.has(message.id) ? "fill-indigo-600" : ""} />
                        </button>
                        <button 
                          onClick={() => copyToClipboard(message.content, message.id)}
                          className="p-1.5 hover:bg-zinc-100 rounded-md text-zinc-400 hover:text-zinc-900 transition-colors"
                          title="Salin"
                        >
                          {copiedId === message.id ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        </button>
                        <button 
                          className="p-1.5 hover:bg-zinc-100 rounded-md text-zinc-400 hover:text-zinc-900 transition-colors"
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
                     <div className="w-10 h-10 flex items-center justify-center">
                        <img src="/logo-app.png" alt="Yun-Zhi Logo" className="w-10 h-10 object-contain" />
                      </div>
                  </div>
                  <div className="px-2 py-2">
                    {isSearching ? (
                      <div className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" className="animate-spin-slow">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        <span className="font-medium bg-clip-text text-transparent bg-gradient-to-r from-[#4285F4] via-[#EA4335] via-[#FBBC05] to-[#34A853] animate-pulse">Searching...</span>
                      </div>
                    ) : (
                      <motion.span 
                        animate={{ opacity: [0.4, 1, 0.4] }} 
                        transition={{ repeat: Infinity, duration: 1.5 }}
                        className="text-zinc-500 font-medium"
                      >
                        Thinking...
                      </motion.span>
                    )}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white shrink-0 transition-colors duration-200">
          <div className="max-w-3xl mx-auto chat-input-wrapper">
            <form 
              onSubmit={handleSubmit}
              className="chat-input-inner p-3 shadow-sm focus-within:ring-1 focus-within:ring-zinc-200 transition-all"
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAttachmentMenu(!showAttachmentMenu);
                    }}
                    className={`p-2.5 rounded-full transition-colors ${showAttachmentMenu ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-500 hover'}`}
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
                        className="absolute bottom-full left-0 mb-3 bg-white rounded-2xl shadow-xl border border-zinc-200 p-1.5 flex items-center gap-1 z-50 popup-container"
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
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTools(!showTools);
                    }}
                    className={`p-2.5 rounded-full transition-colors relative ${isSearchEnabled ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-zinc-500 hover:bg-zinc-200'}`}
                    title="Tools"
                  >
                    <Wand2 size={18} />
                    {isSearchEnabled && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full border-2 border-white"></span>
                    )}
                    {showTools && (
                      <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-lg border border-zinc-100 p-2 flex flex-col gap-1 z-50 popup-container">
                        <div className="text-xs font-semibold text-zinc-400 px-2 py-1">Fitur</div>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            imageInputRef.current?.click();
                            setShowTools(false);
                          }}
                          className="flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-200 rounded-lg text-sm text-zinc-600 text-left w-full"
                        >
                          <ImageIcon size={16} />
                          <span>Analisis Gambar</span>
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsSearchEnabled(!isSearchEnabled);
                            setShowTools(false);
                          }}
                          className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-left w-full transition-colors ${
                            isSearchEnabled 
                              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' 
                              : 'text-zinc-600 hover:bg-zinc-200'
                          }`}
                        >
                          <Globe size={16} className={isSearchEnabled ? "text-blue-500" : ""} />
                          <span>{isSearchEnabled ? 'Pencarian Aktif' : 'Cari di Web'}</span>
                        </button>
                      </div>
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="submit"
                    disabled={(!input.trim() && !selectedFile) || isLoading}
                    className={`p-2.5 rounded-full transition-all ${
                      (input.trim() || selectedFile) && !isLoading 
                        ? 'bg-zinc-900 text-white hover:bg-zinc-700 shadow-md' 
                        : 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                    }`}
                  >
                    <ArrowUp size={18} strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      {/* Sources Bottom Sheet */}
      <AnimatePresence>
        {selectedSources && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSources(null)}
              className="fixed inset-0 bg-black/20 z-[60] backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[70] max-h-[80vh] flex flex-col shadow-2xl"
            >
              <div className="p-4 border-b border-zinc-100 flex items-center justify-between shrink-0">
                <h3 className="font-semibold text-zinc-800 flex items-center gap-2">
                  <Globe size={18} className="text-blue-500" />
                  Sumber Informasi
                </h3>
                <button 
                  onClick={() => setSelectedSources(null)}
                  className="p-2 hover:bg-zinc-100 rounded-full text-zinc-500 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-4 overflow-y-auto space-y-3">
                {selectedSources.map((chunk, idx) => {
                  const web = chunk.web;
                  if (!web) return null;
                  return (
                    <a 
                      key={idx}
                      href={web.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 transition-colors"
                    >
                      <div className="text-xs text-zinc-500 mb-1 truncate">{web.uri}</div>
                      <div className="font-medium text-zinc-800 text-sm line-clamp-2">{web.title}</div>
                    </a>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Settings Full Screen */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[100] bg-white overflow-y-auto flex flex-col transition-colors duration-200"
          >
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 flex items-center px-4 h-16 border-b border-zinc-100">
              <button 
                onClick={() => setShowSettings(false)}
                className="p-2 -ml-2 hover:bg-zinc-200 rounded-full text-zinc-600 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-normal text-zinc-800 ml-4">Pengaturan Yun-Zhi</h2>
            </div>
            
            <div className="flex-1 max-w-3xl mx-auto w-full py-4 px-4 sm:px-6">
              <div className="space-y-1">
                {/* Link publik Anda */}
                <div 
                  onClick={() => {
                    setShowSettings(false);
                    setShowPublicLinks(true);
                  }}
                  className="flex items-start gap-4 p-4 hover:bg-zinc-50 rounded-2xl transition-colors cursor-pointer"
                >
                  <div className="mt-1 text-zinc-500 shrink-0">
                    <Link2 size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-zinc-900">Link publik Anda</h4>
                    <p className="text-sm text-zinc-500 mt-0.5">Kontrol cara Anda membagikan percakapan dan respons</p>
                  </div>
                </div>

                {/* Hapus Semua Riwayat */}
                <div 
                  onClick={() => {
                    setShowSettings(false);
                    setShowDeleteAllConfirm(true);
                  }}
                  className="flex items-start gap-4 p-4 hover:bg-zinc-50 rounded-2xl transition-colors cursor-pointer group"
                >
                  <div className="mt-1 text-red-500 shrink-0">
                    <Trash2 size={24} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-red-600">Hapus Semua Riwayat</h4>
                    <p className="text-sm text-red-500/80 mt-0.5">Hapus permanen semua percakapan dari perangkat dan server</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Public Links Full Screen */}
      <AnimatePresence>
        {showPublicLinks && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[110] bg-white overflow-y-auto flex flex-col transition-colors duration-200"
          >
            <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 flex items-center px-4 h-16 border-b border-zinc-100">
              <button 
                onClick={() => {
                  setShowPublicLinks(false);
                  setShowSettings(true);
                }}
                className="p-2 -ml-2 hover:bg-zinc-200 rounded-full text-zinc-600 transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-2xl font-normal text-zinc-800 ml-4">Link publik Anda</h2>
            </div>
            
            <div className="flex-1 max-w-3xl mx-auto w-full py-6 px-4 sm:px-6">
              {chatHistory.filter(c => c.isPublic).length === 0 ? (
                <div className="text-center mt-20">
                  <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
                    <Link2 size={32} />
                  </div>
                  <h3 className="text-lg font-medium text-zinc-900 mb-2">Belum ada link publik</h3>
                  <p className="text-zinc-500 text-sm max-w-sm mx-auto">
                    Anda belum membagikan percakapan apa pun. Bagikan percakapan untuk membuat link publik.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {chatHistory.filter(c => c.isPublic).map(chat => (
                    <div key={chat.id} className="p-4 border border-zinc-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-medium text-zinc-900">{chat.title}</h4>
                        <p className="text-sm text-zinc-500 mt-1">
                          {chat.updatedAt?.toDate ? new Date(chat.updatedAt.toDate()).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Baru saja'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/share/${chat.id}`);
                            alert('Link disalin!');
                          }}
                          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Copy size={14} /> Salin
                        </button>
                        <button 
                          onClick={() => handleRemovePublicLink(chat.id)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={14} /> Hapus link
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
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
