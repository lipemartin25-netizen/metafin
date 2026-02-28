import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Substituir Tailwind dinâmico de Cores
    content = content.replace(/purple-500/g, 'brand-primary');
    content = content.replace(/purple-600/g, 'brand-primary');
    content = content.replace(/purple-400/g, 'brand-glow');
    content = content.replace(/purple-900/g, 'brand-dark');
    content = content.replace(/purple-800/g, 'brand-dark');
    content = content.replace(/purple-700/g, 'brand-dark');

    content = content.replace(/fuchsia-500/g, 'brand-glow');
    content = content.replace(/fuchsia-600/g, 'brand-glow');
    content = content.replace(/fuchsia-400/g, 'brand-glow');

    // Adicionar prefixos Tailwind dinâmicos on the fly se aparecer no componente
    content = content.replace(/text-gray-900/g, 'text-white dark:text-gray-900');
    content = content.replace(/bg-white/g, 'bg-gray-800/40 dark:bg-white');

    // Explicit mapping of BankCards for Dashboard / BankAccounts
    // It handles replacing basic "tw.card" to "tw.bankCard" on those iterations
    if (filePath.includes('Dashboard.jsx') || filePath.includes('BankAccounts.jsx')) {
        // Apenas heurística simples, trocar tw.card por tw.bankCard onde houver loop de bank iterators
        // Não faremos isso cegamente.
    }

    // Tentar encontrar classes globais não utilizadas
    content = content.replace(/glass-card/g, '${tw.card}');

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

console.log('Starting 3D Dual-Theme Patch...');
traverseDir(path.join(__dirname, 'src/pages'));
traverseDir(path.join(__dirname, 'src/components'));
console.log('Global patch finished.');
