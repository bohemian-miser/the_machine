const fs = require('fs');

const lines = fs.readFileSync('./the-machine.html', 'utf8').split('\n');

function writeLines(name, startStr, endStr, includeEnd = false) {
    let startIdx = lines.findIndex(l => l.includes(startStr));
    let endIdx = lines.findIndex((l, i) => i > startIdx && l.includes(endStr));
    if (startIdx === -1 || endIdx === -1) {
        console.error("Could not find bounds for", name); return;
    }
    const chunk = lines.slice(startIdx, includeEnd ? endIdx + 1 : endIdx).join('\n');
    fs.writeFileSync(name, chunk + '\n');
}

// 1. index.html
// From start up to <script>
let startIdx = 0;
let endIdx = lines.findIndex(l => l.includes('<script>'));
let htmlPart = lines.slice(startIdx, endIdx).join('\n');
htmlPart += '\n<script type="module" src="./main.js"></script>\n</body></html>';
fs.writeFileSync('index.html', htmlPart);

// We need to be careful with ES Modules.
// Let's create proper modules.
fs.writeFileSync('modularize.js', 'Done');
