const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'ChatInterface.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add groundingChunks to Message interface
content = content.replace(
  /attachmentUrl\?: string;\n}/,
  "attachmentUrl?: string;\n  groundingChunks?: any[];\n}"
);

// 2. Add isSearchEnabled and selectedSources states
content = content.replace(
  /const \[selectedFile, setSelectedFile\] = useState<File \| null>\(null\);/,
  `const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSearchEnabled, setIsSearchEnabled] = useState(false);
  const [selectedSources, setSelectedSources] = useState<any[] | null>(null);`
);

// 3. Update genAI.chats.create to include googleSearch tool
content = content.replace(
  /config: {\n\s*systemInstruction: "You are Yun-Zhi, an advanced AI assistant developed by M Fariz Alfauzi at Zent Technology Inc. You are helpful, creative, and friendly. Your responses should be clear, concise, and formatted nicely using Markdown where appropriate.",\n\s*},/,
  `config: {
          systemInstruction: "You are Yun-Zhi, an advanced AI assistant developed by M Fariz Alfauzi at Zent Technology Inc. You are helpful, creative, and friendly. Your responses should be clear, concise, and formatted nicely using Markdown where appropriate.",
          ...(isSearchEnabled ? { tools: [{ googleSearch: {} }] } : {})
        },`
);

// 4. Update the stream loop to extract groundingChunks
content = content.replace(
  /let fullText = '';\n\s*for await \(const chunk of result\) {\n\s*const chunkText = chunk\.text \|\| '';\n\s*fullText \+= chunkText;\n\s*setMessages\(prev => prev\.map\(msg => \n\s*msg\.id === assistantMessage\.id \n\s*\? { \.\.\.msg, content: fullText } \n\s*: msg\n\s*\)\);\n\s*}/,
  `let fullText = '';
      let groundingChunks: any[] = [];
      for await (const chunk of result) {
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
      }`
);

// 5. Update the loading indicator
content = content.replace(
  /<div className="flex gap-1\.5">\n\s*<motion\.div \n\s*animate={{ scale: \[1, 1\.2, 1\] }} \n\s*transition={{ repeat: Infinity, duration: 0\.6, delay: 0 }}\n\s*className="w-2 h-2 bg-zinc-400 rounded-full" \n\s*\/>\n\s*<motion\.div \n\s*animate={{ scale: \[1, 1\.2, 1\] }} \n\s*transition={{ repeat: Infinity, duration: 0\.6, delay: 0\.2 }}\n\s*className="w-2 h-2 bg-zinc-400 rounded-full" \n\s*\/>\n\s*<motion\.div \n\s*animate={{ scale: \[1, 1\.2, 1\] }} \n\s*transition={{ repeat: Infinity, duration: 0\.6, delay: 0\.4 }}\n\s*className="w-2 h-2 bg-zinc-400 rounded-full" \n\s*\/>\n\s*<\/div>/,
  `{isSearchEnabled ? (
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
                    )}`
);

// 6. Add Globe toggle button
content = content.replace(
  /<button\n\s*type="button"\n\s*onClick={\(e\) => {\n\s*e\.stopPropagation\(\);\n\s*setShowAttachmentMenu\(!showAttachmentMenu\);\n\s*}}\n\s*className={`p-2\.5 rounded-full transition-colors \${showAttachmentMenu \? 'bg-zinc-200 text-zinc-900' : 'text-zinc-500 hover'}`}\n\s*title="Lampirkan"\n\s*>\n\s*<Plus size={18} className={`transition-transform duration-200 \${showAttachmentMenu \? 'rotate-45' : ''}`} \/>\n\s*<\/button>/,
  `<button
                    type="button"
                    onClick={() => setIsSearchEnabled(!isSearchEnabled)}
                    className={\`p-2.5 rounded-full transition-colors \${isSearchEnabled ? 'bg-blue-50 text-blue-600' : 'text-zinc-500 hover:bg-zinc-200'}\`}
                    title="Search Web"
                  >
                    <Globe size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowAttachmentMenu(!showAttachmentMenu);
                    }}
                    className={\`p-2.5 rounded-full transition-colors \${showAttachmentMenu ? 'bg-zinc-200 text-zinc-900' : 'text-zinc-500 hover'}\`}
                    title="Lampirkan"
                  >
                    <Plus size={18} className={\`transition-transform duration-200 \${showAttachmentMenu ? 'rotate-45' : ''}\`} />
                  </button>`
);

// 7. Add grounding chunks UI
content = content.replace(
  /<ReactMarkdown>{message\.content}<\/ReactMarkdown>/,
  `<ReactMarkdown>{message.content}</ReactMarkdown>
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
                                {message.groundingChunks.length > 1 ? \` +\${message.groundingChunks.length - 1} lainnya\` : ''}
                              </span>
                            </button>
                          </div>
                        )}`
);

// 8. Add bottom sheet for sources
content = content.replace(
  /<\/div>\n\s*<\/div>\n\s*<\/main>/,
  `</div>
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
      </AnimatePresence>`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
