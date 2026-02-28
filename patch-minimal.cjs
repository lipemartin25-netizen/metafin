const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
    fs.readdirSync(dir).forEach(file => {
        const dirFile = path.join(dir, file);
        if (fs.statSync(dirFile).isDirectory()) {
            filelist = walkSync(dirFile, filelist);
        } else {
            if (dirFile.endsWith('.jsx') || dirFile.endsWith('.js')) {
                filelist.push(dirFile);
            }
        }
    });
    return filelist;
};

const srcDir = path.join(__dirname, 'src');
const files = walkSync(srcDir);

// Patterns to expunge and their replacements
const replacements = [
    // 1. Remove bg-slate-XXX hardcoded
    { regex: /bg-slate-900\/[0-9]+/g, replace: 'bg-surface-secondary' },
    { regex: /bg-slate-900/g, replace: 'bg-surface-secondary' },
    { regex: /bg-slate-800\/[0-9]+/g, replace: 'bg-surface-secondary' },
    { regex: /bg-slate-800/g, replace: 'bg-surface-secondary' },
    { regex: /bg-\[\#0f172a\]/g, replace: 'bg-surface-primary' },

    // 2. Remove complex borders
    { regex: /border-white\/[0-9]+/g, replace: 'border-[var(--border)]' },

    // 3. Remove text colors
    { regex: /text-slate-400/g, replace: 'text-content-secondary' },
    { regex: /text-slate-500/g, replace: 'text-content-muted' },
    { regex: /text-slate-300/g, replace: 'text-content-secondary' },
    { regex: /text-white/g, replace: 'text-content-primary' },

    // 4. Remove excessive shadow & blur
    { regex: /shadow-\[.*?\]/g, replace: 'shadow-card' },
    { regex: /shadow-2xl/g, replace: 'shadow-elevated' },
    { regex: /shadow-xl/g, replace: 'shadow-elevated' },
    { regex: /backdrop-blur-[a-zA-Z0-9]+/g, replace: '' },

    // 5. Replace card classes if any remain as strings
    { regex: /\btw-card\b/g, replace: 'card' },
    { regex: /\bglass-card\b/g, replace: 'card' },
    { regex: /\btw-bank-card\b/g, replace: 'card-elevated' },

    // 6. Fix App Layout backgrounds
    { regex: /from-slate-950/g, replace: '' },
    { regex: /to-slate-[0-9]+/g, replace: '' },
    { regex: /bg-gradient-to-[a-z]{1,2}/g, replace: 'bg-surface-primary' },

    // 7. Hover effects heavily 3D
    { regex: /hover:scale-[0-9]+/g, replace: 'hover:-translate-y-px transition-transform' },
    { regex: /hover:-translate-y-[0-9]+/g, replace: 'hover:-translate-y-px' },
    { regex: /hover:bg-slate-[0-9]+\/[0-9]+/g, replace: 'hover:bg-surface-secondary border-transparent hover:border-[var(--border-hover)]' }
];

let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    replacements.forEach(({ regex, replace }) => {
        content = content.replace(regex, replace);
    });

    // Clean up double spaces from empty replacements
    content = content.replace(/  +/g, ' ');

    if (originalContent !== content) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Patched: ${file.replace(__dirname, '')}`);
        changedFiles++;
    }
});

console.log(`\nPatch complete! Modified ${changedFiles} files to adhere to Linear/Stripe style.`);
