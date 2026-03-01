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

let changedFiles = 0;

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let originalContent = content;

    // Revert broken object property access `tw.glass-card` back to `tw.card`
    // Also revert `tw.glass-glass-card` to `tw.card` just in case it doubled up
    content = content.replace(/tw\.glass-glass-card/g, 'tw.card');
    content = content.replace(/tw\.glass-card/g, 'tw.card');

    // Also revert any other possible broken tw properties due to the script
    content = content.replace(/tw\.sidebar-glass/g, 'tw.sidebar');
    content = content.replace(/tw\.navbar-glass/g, 'tw.navbar');

    // Revert specific variable mangling (like const glass-card = ...)
    content = content.replace(/const glass-card /g, 'const card ');
    content = content.replace(/let glass-card /g, 'let card ');
    content = content.replace(/glass-card\./g, 'card.');
    content = content.replace(/\(glass-card/g, '(card');
    content = content.replace(/\[glass-card/g, '[card');
    content = content.replace(/\{glass-card/g, '{card');

    if (originalContent !== content) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed syntax in: ${file.replace(__dirname, '')}`);
        changedFiles++;
    }
});

console.log(`\nSyntax Fix complete! Corrected ${changedFiles} files.`);
