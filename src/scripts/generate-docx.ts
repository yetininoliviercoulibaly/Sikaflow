
import * as fs from 'fs';
import * as path from 'path';
import { marked } from 'marked';
const HTMLtoDOCX = require('html-to-docx');

const docsDir = path.join(__dirname, '../../docs');

async function convertFile(filename: string) {
    if (!filename.endsWith('.md')) return;

    const sourcePath = path.join(docsDir, filename);
    const targetPath = path.join(docsDir, filename.replace('.md', '.docx'));

    console.log(`Converting ${filename} to DOCX...`);

    const content = fs.readFileSync(sourcePath, 'utf-8');
    
    // Simple pre-processing to handle mermaid blocks which don't render well
    // We replace them with a code block indication
    const processedContent = content.replace(/```mermaid([\s\S]*?)```/g, (match, code) => {
        return `<pre><code>[MERMAID DIAGRAM - View in Markdown Viewer]\n${code}</code></pre>`;
    });

    const htmlContent = await marked.parse(processedContent);

    // Basic styling for the docx
    const style = `
        <style>
            body { font-family: 'Arial', sans-serif; font-size: 11pt; }
            h1 { font-size: 24pt; color: #2E86C1; }
            h2 { font-size: 18pt; color: #2E86C1; }
            h3 { font-size: 14pt; color: #1B4F72; }
            code { background-color: #f4f4f4; padding: 2px 5px; font-family: 'Consolas', monospace; }
            pre { background-color: #f4f4f4; padding: 10px; border: 1px solid #ddd; }
            blockquote { border-left: 4px solid #ddd; padding-left: 10px; color: #666; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    `;

    const fullHtml = `<!DOCTYPE html><html><head>${style}</head><body>${htmlContent}</body></html>`;

    try {
        const fileBuffer = await HTMLtoDOCX(fullHtml, null, {
            table: { row: { cantSplit: true } },
            footer: true,
            pageNumber: true,
        });

        fs.writeFileSync(targetPath, fileBuffer);
        console.log(`✅ Created ${targetPath}`);
    } catch (error) {
        console.error(`❌ Error converting ${filename}:`, error);
    }
}

async function main() {
    if (!fs.existsSync(docsDir)) {
        console.error(`Docs directory not found at ${docsDir}`);
        return;
    }

    const files = fs.readdirSync(docsDir);
    
    for (const file of files) {
        await convertFile(file);
    }
}

main();
