/**
 * MetaFin — Multi-Format File Parser
 * Suporta: CSV, XLSX/XLS, JSON, TXT, XML, HTML, PDF*, DOCX*, imagens*
 * (*) formatos marcados mostram mensagem de suporte futuro com OCR/IA
 */
import Papa from 'papaparse';
import readXlsxFile from 'read-excel-file';

// ========== CATEGORY DETECTION ==========
const CATEGORY_KEYWORDS = {
 alimentacao: ['mercado', 'supermercado', 'ifood', 'restaurante', 'padaria', 'açougue', 'alimenta', 'food', 'refeição'],
 transporte: ['uber', 'combustível', 'gasolina', '99', 'estacionamento', 'pedágio', 'transporte', 'ônibus', 'metrô'],
 moradia: ['aluguel', 'condomínio', 'luz', 'água', 'gás', 'energia', 'cpfl', 'iptu', 'moradia'],
 saude: ['farmácia', 'médico', 'hospital', 'consulta', 'dentista', 'plano de saúde', 'drogaria', 'saude'],
 educacao: ['curso', 'escola', 'faculdade', 'livro', 'udemy', 'alura', 'educação', 'mensalidade'],
 entretenimento: ['netflix', 'spotify', 'cinema', 'show', 'teatro', 'jogo', 'assinatura', 'disney', 'hbo'],
 renda: ['salário', 'freelance', 'rendimento', 'dividendo', 'venda', 'pix recebido', 'transferência recebida'],
 investimentos: ['investimento', 'poupança', 'tesouro', 'ação', 'fundo', 'cdb', 'lci', 'lca'],
};

export function detectCategory(description) {
 const lower = description.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
 for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
 for (const keyword of keywords) {
 const nk = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
 if (lower.includes(nk)) return category;
 }
 }
 return 'outros';
}

// ========== NORMALIZE ROW ==========
function normalizeRow(row) {
 const date = row.data || row.date || row.Data || row.DATE || row.dt || '';
 const description = row.descricao || row.description || row.Descricao || row['Descrição'] || row.DESCRICAO || row.desc || '';
 const rawAmount = row.valor || row.amount || row.Valor || row.AMOUNT || row.vlr || row.val || '';
 let amountStr = String(rawAmount).replace(/[R$\s]/g, '');

 // Detect format: If it has both . and , (e.g. 1.234,56 or 1,234.56)
 if (amountStr.includes('.') && amountStr.includes(',')) {
 const lastDot = amountStr.lastIndexOf('.');
 const lastComma = amountStr.lastIndexOf(',');
 if (lastComma > lastDot) {
 // Brazilian format: 1.234,56 -> remove dots, replace comma with dot
 amountStr = amountStr.replace(/\./g, '').replace(',', '.');
 } else {
 // US format: 1,234.56 -> remove commas
 amountStr = amountStr.replace(/,/g, '');
 }
 } else if (amountStr.includes(',')) {
 // Only comma: 1234,56 -> replace with dot
 amountStr = amountStr.replace(',', '.');
 }
 // If it only has a dot, we assume it's the decimal separator (US format 1234.56)
 // which parseFloat handles correctly.

 const amount = parseFloat(amountStr);
 const category = row.categoria || row.category || row.Categoria || detectCategory(description);

 if (!date || !description || isNaN(amount)) return null;

 let normalizedDate = date;

 // Handle JS Date objects (from read-excel-file)
 if (Object.prototype.toString.call(date) === '[object Date]') {
 normalizedDate = date.toISOString().split('T')[0];
 }
 else if (typeof date === 'string' && date.includes('/')) {
 const parts = date.split('/');
 if (parts.length === 3) {
 normalizedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
 }
 }

 // Handle Excel serial dates (number)
 if (typeof date === 'number') {
 const excelEpoch = new Date(1899, 11, 30);
 const d = new Date(excelEpoch.getTime() + date * 86400000);
 normalizedDate = d.toISOString().split('T')[0];
 }

 return {
 date: normalizedDate,
 description: description.trim(),
 amount,
 category,
 type: amount >= 0 ? 'income' : 'expense',
 status: row.categoria || row.category ? 'categorized' : 'pending',
 };
}

// ========== FORMAT INFO ==========
export const SUPPORTED_FORMATS = {
 // Fully supported - parse transactions
 csv: { label: 'CSV', support: 'full', icon: '📊' },
 xlsx: { label: 'Excel (XLSX)', support: 'full', icon: '📗' },
 xls: { label: 'Excel (XLS)', support: 'full', icon: '📗' },
 json: { label: 'JSON', support: 'full', icon: '📋' },
 txt: { label: 'Texto', support: 'full', icon: '📄' },
 xml: { label: 'XML', support: 'full', icon: '📰' },
 html: { label: 'HTML', support: 'full', icon: '🌐' },
 htm: { label: 'HTML', support: 'full', icon: '🌐' },
 // AI-powered (future) - accept but show message
 pdf: { label: 'PDF', support: 'ai', icon: '📕' },
 docx: { label: 'Word (DOCX)', support: 'ai', icon: '📘' },
 doc: { label: 'Word (DOC)', support: 'ai', icon: '📘' },
 rtf: { label: 'Rich Text', support: 'ai', icon: '📝' },
 odt: { label: 'OpenDocument', support: 'ai', icon: '📝' },
 pptx: { label: 'PowerPoint', support: 'ai', icon: '📙' },
 ppt: { label: 'PowerPoint', support: 'ai', icon: '📙' },
 epub: { label: 'ePub', support: 'ai', icon: '📖' },
 azw3: { label: 'Kindle', support: 'ai', icon: '📖' },
 azw: { label: 'Kindle', support: 'ai', icon: '📖' },
 mobi: { label: 'Mobi', support: 'ai', icon: '📖' },
 // Images (OCR future)
 jpg: { label: 'JPEG', support: 'ocr', icon: '🖼️' },
 jpeg: { label: 'JPEG', support: 'ocr', icon: '🖼️' },
 png: { label: 'PNG', support: 'ocr', icon: '🖼️' },
 gif: { label: 'GIF', support: 'ocr', icon: '🖼️' },
 tiff: { label: 'TIFF', support: 'ocr', icon: '🖼️' },
 bmp: { label: 'BMP', support: 'ocr', icon: '🖼️' },
};

export const ACCEPTED_EXTENSIONS = Object.keys(SUPPORTED_FORMATS).map((e) => `.${e}`).join(',');

function getExtension(filename) {
 return filename.split('.').pop().toLowerCase();
}

// ========== CSV PARSER ==========
function parseCSV(file) {
 return new Promise((resolve, reject) => {
 Papa.parse(file, {
 header: true,
 skipEmptyLines: true,
 complete: (results) => {
 const parsed = results.data.map(normalizeRow).filter(Boolean);
 resolve(parsed);
 },
 error: (err) => reject(new Error(`Erro CSV: ${err.message}`)),
 });
 });
}

// ========== EXCEL PARSER ==========
async function parseExcel(file) {
 try {
 const rows = await readXlsxFile(file);
 // readXlsxFile retorna array de arrays. A primeira linha é o cabeçalho.
 if (rows.length < 2) throw new Error('Arquivo Excel vazio ou sem dados');

 const headers = rows[0].map(h => String(h).toLowerCase().trim());
 const data = rows.slice(1).map(row => {
 const obj = {};
 headers.forEach((h, i) => {
 obj[h] = row[i];
 });
 return normalizeRow(obj);
 }).filter(Boolean);

 return data;
 } catch (err) {
 throw new Error(`Erro Excel: ${err.message}`);
 }
}

// ========== JSON PARSER ==========
function parseJSON(file) {
 return new Promise((resolve, reject) => {
 const reader = new FileReader();
 reader.onload = (e) => {
 try {
 let data = JSON.parse(e.target.result);
 // Handle both array and object with transactions key
 if (!Array.isArray(data)) {
 data = data.transactions || data.data || data.items || Object.values(data)[0];
 }
 if (!Array.isArray(data)) throw new Error('JSON não contém array de transações');
 const parsed = data.map(normalizeRow).filter(Boolean);
 resolve(parsed);
 } catch (err) {
 reject(new Error(`Erro JSON: ${err.message}`));
 }
 };
 reader.onerror = () => reject(new Error('Erro ao ler arquivo JSON'));
 reader.readAsText(file, 'UTF-8');
 });
}

// ========== TXT PARSER ==========
function parseTXT(file) {
 return new Promise((resolve, reject) => {
 const reader = new FileReader();
 reader.onload = (e) => {
 try {
 const text = e.target.result;
 const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

 // Try to detect if it's a delimited file (tab, semicolon, pipe)
 const delimiters = ['\t', ';', '|'];
 let bestDelimiter = null;
 let maxCols = 0;
 for (const d of delimiters) {
 const cols = lines[0].split(d).length;
 if (cols > maxCols) { maxCols = cols; bestDelimiter = d; }
 }

 if (maxCols >= 3 && bestDelimiter) {
 // Parse as delimited
 const headers = lines[0].split(bestDelimiter).map((h) => h.trim().toLowerCase());
 const parsed = lines.slice(1).map((line) => {
 const values = line.split(bestDelimiter).map((v) => v.trim());
 const row = {};
 headers.forEach((h, i) => { row[h] = values[i] || ''; });
 return normalizeRow(row);
 }).filter(Boolean);
 resolve(parsed);
 } else {
 // Try line-by-line pattern: "DATE DESCRIPTION AMOUNT"
 const dateRegex = /(\d{2}\/\d{2}\/\d{4}|\d{4}-\d{2}-\d{2})/;
 const amountRegex = /(-?\d+[.,]\d{2})/;
 const parsed = lines.map((line) => {
 const dateMatch = line.match(dateRegex);
 const amountMatch = line.match(amountRegex);
 if (!dateMatch || !amountMatch) return null;
 const date = dateMatch[1];
 const amount = amountMatch[1];
 const description = line.replace(dateRegex, '').replace(amountRegex, '').trim();
 return normalizeRow({ data: date, descricao: description, valor: amount });
 }).filter(Boolean);
 resolve(parsed);
 }
 } catch (err) {
 reject(new Error(`Erro TXT: ${err.message}`));
 }
 };
 reader.onerror = () => reject(new Error('Erro ao ler arquivo TXT'));
 reader.readAsText(file, 'UTF-8');
 });
}

// ========== XML PARSER ==========
function parseXML(file) {
 return new Promise((resolve, reject) => {
 const reader = new FileReader();
 reader.onload = (e) => {
 try {
 const parser = new DOMParser();
 const doc = parser.parseFromString(e.target.result, 'text/xml');
 const errorNode = doc.querySelector('parsererror');
 if (errorNode) throw new Error('XML inválido');

 // Try common patterns: <transaction>, <record>, <row>, <entry>, <item>
 const tags = ['transaction', 'record', 'row', 'entry', 'item', 'lancamento', 'movimento'];
 let elements = [];
 for (const tag of tags) {
 elements = doc.getElementsByTagName(tag);
 if (elements.length > 0) break;
 }

 if (elements.length === 0) {
 // Try OFX format
 const stmtTrn = doc.getElementsByTagName('STMTTRN');
 if (stmtTrn.length > 0) {
 const parsed = Array.from(stmtTrn).map((el) => {
 const date = el.getElementsByTagName('DTPOSTED')[0]?.textContent || '';
 const amount = el.getElementsByTagName('TRNAMT')[0]?.textContent || '0';
 const description = el.getElementsByTagName('MEMO')[0]?.textContent || el.getElementsByTagName('NAME')[0]?.textContent || '';
 const formattedDate = date.length >= 8 ? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}` : date;
 return normalizeRow({ data: formattedDate, descricao: description, valor: amount });
 }).filter(Boolean);
 resolve(parsed);
 return;
 }
 throw new Error('Nenhum padrão de transação encontrado no XML');
 }

 const parsed = Array.from(elements).map((el) => {
 const row = {};
 for (const child of el.children) {
 row[child.tagName.toLowerCase()] = child.textContent;
 }
 return normalizeRow(row);
 }).filter(Boolean);
 resolve(parsed);
 } catch (err) {
 reject(new Error(`Erro XML: ${err.message}`));
 }
 };
 reader.onerror = () => reject(new Error('Erro ao ler arquivo XML'));
 reader.readAsText(file, 'UTF-8');
 });
}

// ========== HTML PARSER ==========
function parseHTML(file) {
 return new Promise((resolve, reject) => {
 const reader = new FileReader();
 reader.onload = (e) => {
 try {
 const parser = new DOMParser();
 const doc = parser.parseFromString(e.target.result, 'text/html');
 const tables = doc.querySelectorAll('table');
 if (tables.length === 0) throw new Error('Nenhuma tabela encontrada no HTML');

 // Find the table with most rows
 let bestTable = tables[0];
 for (const table of tables) {
 if (table.rows.length > bestTable.rows.length) bestTable = table;
 }

 const headerRow = bestTable.rows[0];
 const headers = Array.from(headerRow.cells).map((c) => c.textContent.trim().toLowerCase());

 const parsed = [];
 for (let i = 1; i < bestTable.rows.length; i++) {
 const cells = bestTable.rows[i].cells;
 const row = {};
 headers.forEach((h, j) => { row[h] = cells[j]?.textContent.trim() || ''; });
 const normalized = normalizeRow(row);
 if (normalized) parsed.push(normalized);
 }
 resolve(parsed);
 } catch (err) {
 reject(new Error(`Erro HTML: ${err.message}`));
 }
 };
 reader.onerror = () => reject(new Error('Erro ao ler arquivo HTML'));
 reader.readAsText(file, 'UTF-8');
 });
}

// ========== MAIN PARSER ==========
export async function parseFile(file) {
 const ext = getExtension(file.name);
 const formatInfo = SUPPORTED_FORMATS[ext];

 if (!formatInfo) {
 throw new Error(`Formato .${ext} não suportado. Formatos aceitos: ${Object.keys(SUPPORTED_FORMATS).join(', ')}`);
 }

 // AI-powered formats (future)
 if (formatInfo.support === 'ai') {
 throw new Error(
 `📄 Formato ${formatInfo.label} (.${ext}) aceito!\n\n` +
 `O processamento de ${formatInfo.label} requer IA para extração de dados.\n` +
 `Use o Assistente IA (menu lateral) para processar este arquivo.\n\n` +
 `Dica: Exporte seus dados como CSV ou Excel para importação direta.`
 );
 }

 // Image formats (OCR future)
 if (formatInfo.support === 'ocr') {
 throw new Error(
 `🖼️ Imagem ${formatInfo.label} (.${ext}) aceita!\n\n` +
 `O processamento de imagens requer OCR + IA.\n` +
 `Use o Assistente IA para extrair dados de comprovantes e extratos.\n\n` +
 `Dica: Exporte seus dados como CSV ou Excel para importação direta.`
 );
 }

 // Full support parsers
 switch (ext) {
 case 'csv': return parseCSV(file);
 case 'xlsx':
 case 'xls': return parseExcel(file);
 case 'json': return parseJSON(file);
 case 'txt': return parseTXT(file);
 case 'xml': return parseXML(file);
 case 'html':
 case 'htm': return parseHTML(file);
 default:
 throw new Error(`Parser não implementado para .${ext}`);
 }
}
