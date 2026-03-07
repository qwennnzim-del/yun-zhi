const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'components', 'ChatInterface.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(/focus-within focus-within/g, 'focus-within:ring-1 focus-within:ring-zinc-200');
content = content.replace(/focus focus:outline-none/g, 'focus:ring-0 focus:outline-none');
content = content.replace(/placeholder min-h-\[24px\]/g, 'placeholder:text-zinc-500 min-h-[24px]');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
