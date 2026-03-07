const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'ChatInterface.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/hover rounded-md text-zinc-400 hover transition-colors/g, 'hover:bg-zinc-100 rounded-md text-zinc-400 hover:text-zinc-900 transition-colors');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
