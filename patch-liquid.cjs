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

// Liquid Glass replacements
const replacements = [
    // 1. Convert Minimal classes to Liquid Glass equivalents globally
    { regex: /\bcard-elevated\b/g, replace: 'glass-card-elevated' },
    { regex: /\bcard\b(?!-)/g, replace: 'glass-card' },
    { regex: /\bbtn-primary\b/g, replace: 'btn-brand' },
    { regex: /\bsidebar\b(?!-)/g, replace: 'sidebar-glass' },
    { regex: /\bnavbar\b(?!-)/g, replace: 'navbar-glass' },

    // 2. Clear out any dead minimalism surface colors returning to standard variables for text if hijacked
    { regex: /bg-surface-secondary/g, replace: 'bg-[var(--bg-elevated)]' },
    { regex: /bg-surface-primary/g, replace: 'bg-[var(--bg-base)]' },
    { regex: /text-content-primary/g, replace: 'text-[var(--text-primary)]' },
    { regex: /text-content-secondary/g, replace: 'text-[var(--text-secondary)]' },
    { regex: /text-content-muted/g, replace: 'text-[var(--text-muted)]' },

    // 3. Inject missing fade-in structural animations (grids/containers)
    // Replaces "grid" with "grid animate-fade-in" if not already there, avoiding infinite stacking
    {
        regex: /className="grid([^"]*)"/g, replace: (match, p1) => {
            if (p1.includes('animate-fade-in')) return match;
            return `className="grid${p1} animate-fade-in"`;
        }
    }
];

let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    replacements.forEach(({ regex, replace }) => {
        content = content.replace(regex, replace);
    });

    if (originalContent !== content) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Liquified: ${file.replace(__dirname, '')}`);
        changedFiles++;
    }
});

console.log(`\nLiquid Patch complete! Elevated ${changedFiles} files to Liquid Glass Premium.`);
