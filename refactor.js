import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const replacements = [
    { from: /\bbg-white\b/g, to: 'bg-gray-800/40' },
    { from: /\bbg-gray-50\b/g, to: 'bg-gray-800/30' },
    { from: /\bbg-gray-100\b/g, to: 'bg-gray-800/40' },
    { from: /\bbg-gray-200\b/g, to: 'bg-gray-800/50' },
    { from: /\bbg-gray-300\b/g, to: 'bg-gray-700/50' },
    { from: /\btext-black\b/g, to: 'text-white' },
    { from: /text-gray-900(?!\/)/g, to: 'text-white' },
    { from: /text-gray-800(?!\/)/g, to: 'text-gray-100' },
    { from: /text-gray-700(?!\/)/g, to: 'text-gray-300' },
    { from: /\bborder-gray-200\b/g, to: 'border-gray-700/40' },
    { from: /\bborder-gray-300\b/g, to: 'border-gray-700/50' },
    { from: /\bshadow-sm\b/g, to: 'shadow-lg shadow-black/10' },
    { from: /\bshadow-md\b/g, to: 'shadow-lg shadow-black/10' },
    { from: /\bdivide-gray-200\b/g, to: 'divide-gray-800/50' },
    { from: /\bring-gray-300\b/g, to: 'ring-gray-700/40' }
];

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Apply regex replacements for colors
    replacements.forEach(({ from, to }) => {
        content = content.replace(from, to);
    });

    // Check if we need to add the import for tw
    // se houve modificacao ou se vamos forçar tw em containers (a refatoracao manual será mais limpa no proximo script, aqui focamos nas cores base que o regex mata rapido)
    if (content !== originalContent && !content.includes("import { tw }")) {
        content = "import { tw } from '@/lib/theme';\n" + content;
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', filePath);
    }
}

function traverseDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            traverseDir(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            processFile(fullPath);
        }
    }
}

traverseDir(path.join(__dirname, 'src/pages'));
traverseDir(path.join(__dirname, 'src/components'));
processFile(path.join(__dirname, 'src/App.jsx'));
console.log('Script finalized.');
