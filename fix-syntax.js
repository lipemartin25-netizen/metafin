import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // Fix literal string classNames to template literals
    // className="group ${tw.card} mb-4" => className={`group ${tw.card} mb-4`}
    content = content.replace(/className="([^"]*)\$\{tw\.card\}([^"]*)"/g, 'className={`$1\\${tw.card}$2`}');

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed syntax in:', filePath);
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

console.log('Fixing template literal syntax globally...');
traverseDir(path.join(__dirname, 'src/pages'));
traverseDir(path.join(__dirname, 'src/components'));
console.log('Syntax fix finished.');
