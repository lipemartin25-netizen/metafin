const fs = require('fs');
const path = require('path');

const PATTERNS = {
    'Hardcoded Secret': /['"]?(password|secret|api_key|token)['"]?\s*[:=]\s*['"][a-zA-Z0-9_-]{10,}['"]/i,
    'Eval/Function': /(eval\(|new Function\()/i,
    'DangerouslySetInnerHTML': /dangerouslySetInnerHTML/i,
    'Insecure Auth': /localStorage\.setItem\(['"]token['"]/i,
    'Missing rel=noopener': /target=['"]_blank['"](?!\s*rel=['"][^'"]*(noopener|noreferrer)[^'"]*['"])/i,
};

function scanDir(dir, results = []) {
    if (!fs.existsSync(dir)) return results;
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            if (!file.includes('node_modules') && !file.includes('.git') && !file.includes('dist')) {
                scanDir(fullPath, results);
            }
        } else if (file.match(/\.(js|jsx|ts|tsx)$/)) {
            const content = fs.readFileSync(fullPath, 'utf8');
            const lines = content.split('\n');

            lines.forEach((line, index) => {
                for (const [name, regex] of Object.entries(PATTERNS)) {
                    if (regex.test(line)) {
                        if (line.trim().startsWith('//') || line.trim().startsWith('/*')) continue;
                        results.push(`[${name}] ${fullPath}:${index + 1}\n  -> ${line.trim()}`);
                    }
                }
            });
        }
    });

    return results;
}

console.log("🛡️ Iniciando Auditoria Estática de Segurança (MetaFin)...");
const issues = scanDir(path.join(__dirname, 'src'));

if (issues.length > 0) {
    console.log(`\n⚠️ ENCONTRADOS ${issues.length} ALERTAS DE SEGURANÇA:\n`);
    issues.forEach(issue => console.log(issue));
    console.log("\n❌ Falha na auditoria estática. O Código possui padrões sensíveis apontados pelo OWASP.");
    process.exit(1);
} else {
    console.log("\n✅ Auditoria concluída. Nenhum padrão inseguro detectado. O código está forte e seguro.");
}
