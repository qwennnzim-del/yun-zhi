const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'ChatInterface.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix artifacts from previous regex
content = content.replace(/:[a-zA-Z0-9/\[\]-]+/g, (match) => {
  // If it's something like :bg-zinc-800, remove it, but be careful not to remove valid pseudo-classes like :hover
  if (match.startsWith(':bg-') || match.startsWith(':text-') || match.startsWith(':border-') || match.startsWith(':from-') || match.startsWith(':to-') || match.startsWith(':ring-') || match.startsWith(':placeholder-') || match.startsWith(':prose-')) {
    return '';
  }
  return match;
});

// Remove dark mode toggle
const darkModeToggleRegex = /\{\/\* Mode Gelap \(Toggle\) \*\/\}.*?\{\/\* Hapus Semua Riwayat \*\/\}/s;
content = content.replace(darkModeToggleRegex, '{/* Hapus Semua Riwayat */}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
