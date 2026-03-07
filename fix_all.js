const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Restore file
execSync('git checkout components/ChatInterface.tsx');

const filePath = path.join(__dirname, 'components', 'ChatInterface.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Remove all dark: classes properly
// Match " dark:something" or "dark:something "
content = content.replace(/\s*dark:[a-zA-Z0-9/\[\]-]+\s*/g, ' ');
// Clean up extra spaces
content = content.replace(/  +/g, ' ');

// Also remove the isDarkMode state and related useEffects
content = content.replace(/const \[isDarkMode, setIsDarkMode\] = useState\(false\);\n/g, '');
content = content.replace(/\/\/ Load dark mode preference\n\s*useEffect\(\(\) => \{\n\s*const savedDarkMode = localStorage\.getItem\('isDarkMode'\) === 'true';\n\s*setIsDarkMode\(savedDarkMode\);\n\s*\}, \[\]\);\n\n/g, '');
content = content.replace(/\/\/ Apply dark mode class and save preference\n\s*useEffect\(\(\) => \{\n\s*if \(isDarkMode\) \{\n\s*document\.documentElement\.classList\.add\('dark'\);\n\s*\} else \{\n\s*document\.documentElement\.classList\.remove\('dark'\);\n\s*\}\n\s*localStorage\.setItem\('isDarkMode', isDarkMode\.toString\(\)\);\n\s*\}, \[isDarkMode\]\);\n\n/g, '');

// Remove unused settings
const settingsToRemoveRegex = /\{\/\* Preferensi teks \*\/\}.*?\{\/\* Hapus Semua Riwayat \*\/\}/s;
content = content.replace(settingsToRemoveRegex, '{/* Hapus Semua Riwayat */}');

// Remove dark mode toggle
const darkModeToggleRegex = /\{\/\* Mode Gelap \(Toggle\) \*\/\}.*?\{\/\* Hapus Semua Riwayat \*\/\}/s;
content = content.replace(darkModeToggleRegex, '{/* Hapus Semua Riwayat */}');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done');
