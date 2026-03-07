const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'ChatInterface.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/hover rounded-full/g, 'hover:bg-zinc-200 rounded-full');
content = content.replace(/bg-zinc-200\/50 hover rounded-full/g, 'bg-zinc-200/50 hover:bg-zinc-200 rounded-full');
content = content.replace(/group-hover transition-colors/g, 'group-hover:text-zinc-800 transition-colors');
content = content.replace(/'hover text-zinc-600'/g, "'hover:bg-zinc-200 text-zinc-600'");
content = content.replace(/hover hover rounded-md/g, 'hover:text-red-500 hover:bg-red-50 rounded-md');
content = content.replace(/hover rounded-lg/g, 'hover:bg-zinc-200 rounded-lg');
content = content.replace(/hover hover'/g, "hover:border-zinc-300 hover:bg-zinc-50'");
content = content.replace(/bg-zinc-100 hover px-2\.5/g, 'bg-zinc-100 hover:bg-zinc-200 px-2.5');
content = content.replace(/hover hover transition-colors/g, 'hover:bg-zinc-100 hover:text-zinc-900 transition-colors');
content = content.replace(/hover shadow-sm/g, 'hover:bg-zinc-700 shadow-sm');
content = content.replace(/hover text-zinc-600 hover transition-colors/g, 'hover:bg-zinc-100 text-zinc-600 hover:text-zinc-900 transition-colors');
content = content.replace(/hover shadow-md/g, 'hover:bg-zinc-700 shadow-md');
content = content.replace(/hover rounded-2xl/g, 'hover:bg-zinc-50 rounded-2xl');
content = content.replace(/bg-zinc-100 hover text-zinc-700/g, 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700');
content = content.replace(/bg-red-50 hover text-red-600/g, 'bg-red-50 hover:bg-red-100 text-red-600');
content = content.replace(/bg-red-500 hover text-white/g, 'bg-red-500 hover:bg-red-600 text-white');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
