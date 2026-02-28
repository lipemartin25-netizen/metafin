module.exports = {
    files: [
        'src/pages/**/*.jsx',
        'src/components/**/*.jsx',
        'src/App.jsx'
    ],
    from: [
        /className="(.*?)\bbg-white\b(.*?)"/g,
        /className="(.*?)\bbg-gray-50\b(.*?)"/g,
        /className="(.*?)\bbg-gray-100\b(.*?)"/g,
        /className="(.*?)\bbg-gray-200\b(.*?)"/g,
        /className="(.*?)\bbg-gray-300\b(.*?)"/g,
        /className="(.*?)\btext-black\b(.*?)"/g,
        /className="(.*?)\btext-gray-900\b(.*?)"/g,
        /className="(.*?)\btext-gray-800\b(.*?)"/g,
        /className="(.*?)\btext-gray-700\b(.*?)"/g,
        /className="(.*?)\borders-gray-200\b(.*?)"/g,
        /className="(.*?)\borders-gray-300\b(.*?)"/g,
        /className="(.*?)\bshadow-sm\b(.*?)"/g,
        /className="(.*?)\bshadow-md\b(.*?)"/g,
        /className="(.*?)\bdivide-gray-200\b(.*?)"/g,
        /className="(.*?)\bring-gray-300\b(.*?)"/g,
        /import/ // we will do import substitution manually
    ],
    to: [
        'className="$1bg-gray-800/40$2"',
        'className="$1bg-gray-800/30$2"',
        'className="$1bg-gray-800/40$2"',
        'className="$1bg-gray-800/50$2"',
        'className="$1bg-gray-700/50$2"',
        'className="$1text-white$2"',
        'className="$1text-white$2"',
        'className="$1text-gray-100$2"',
        'className="$1text-gray-300$2"',
        'className="$1border-gray-700/40$2"',
        'className="$1border-gray-700/50$2"',
        'className="$1shadow-lg shadow-black/10$2"',
        'className="$1shadow-lg shadow-black/10$2"',
        'className="$1divide-gray-800/50$2"',
        'className="$1ring-gray-700/40$2"',
        'import'
    ],
};
