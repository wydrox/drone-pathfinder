import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');

const html = await readFile(indexPath, 'utf8');

async function inlineStyles(input) {
  const styleRegex = /<link\s+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g;

  let output = input;
  let match;
  while ((match = styleRegex.exec(input)) !== null) {
    const [tag, href] = match;
    if (!href.startsWith('/assets/') && !href.startsWith('./assets/')) {
      continue;
    }

    const stylePath = path.join(distDir, href.replace(/^\//, ''));
    const css = await readFile(stylePath, 'utf8');
    output = output.replace(tag, () => `<style>${css}</style>`);
  }

  return output;
}

async function inlineScripts(input) {
  const scriptRegex = /<script\s+type="module"[^>]*src="([^"]+)"[^>]*><\/script>/g;

  let output = input;
  let match;
  while ((match = scriptRegex.exec(input)) !== null) {
    const [tag, src] = match;
    if (!src.startsWith('/assets/') && !src.startsWith('./assets/')) {
      continue;
    }

    const scriptPath = path.join(distDir, src.replace(/^\//, ''));
    const js = await readFile(scriptPath, 'utf8');
    const safeJs = js.replace(/<\/script/gi, '<\\/script');
    output = output.replace(tag, () => `<script type="module">${safeJs}</script>`);
  }

  return output;
}

const withInlineStyles = await inlineStyles(html);
const withInlineAssets = await inlineScripts(withInlineStyles);

await writeFile(indexPath, withInlineAssets);

console.log('Inlined Vite assets into dist/index.html');
