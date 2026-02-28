import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    content = content.replace(/bg-emerald/g, 'bg-purple');
    content = content.replace(/border-emerald/g, 'border-purple');
    content = content.replace(/text-emerald/g, 'text-purple');
    content = content.replace(/shadow-emerald/g, 'shadow-purple');
    content = content.replace(/from-emerald/g, 'from-purple');
    content = content.replace(/to-cyan/g, 'to-fuchsia');
    content = content.replace(/border-green/g, 'border-purple');
    content = content.replace(/text-green/g, 'text-purple');
    content = content.replace(/bg-green/g, 'bg-purple');
    content = content.replace(/from-green/g, 'from-purple');
    content = content.replace(/glass-card/g, '${tw.card}');

    if (content !== originalContent && !content.includes("import { tw }")) {
        content = "import { tw } from '@/lib/theme';\n" + content;
    }

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Updated:', filePath);
    } else {
        // console.log('No changes in:', filePath);
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

// Applies to everything
traverseDir(path.join(__dirname, 'src/pages'));
traverseDir(path.join(__dirname, 'src/components'));
console.log('Global patch finished.');
