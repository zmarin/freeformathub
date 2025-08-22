import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Map of categories to determine the correct import path
const categoryMap = {
  'api-rate-limiter-calculator': 'network',
  'password-policy-generator': 'crypto',
  'jwt-generator': 'crypto',
  'svg-editor': 'web',
  'pdf-tools': 'data',
  'ascii-art-generator': 'text',
  'base32-encoder': 'encoders',
  'emoji-converter': 'encoders',
  'html-entity-encoder': 'encoders',
  'json-flattener': 'development',
  'math-expression-evaluator': 'math',
  'database-query-optimizer': 'development'
};

const files = [
  'src/pages/tools/network/api-rate-limiter-calculator.astro',
  'src/pages/tools/crypto/password-policy-generator.astro',
  'src/pages/tools/crypto/jwt-generator.astro',
  'src/pages/tools/web/svg-editor.astro',
  'src/pages/tools/data/pdf-tools.astro',
  'src/pages/tools/text/ascii-art-generator.astro',
  'src/pages/tools/encoders/base32-encoder.astro',
  'src/pages/tools/encoders/emoji-converter.astro',
  'src/pages/tools/encoders/html-entity-encoder.astro',
  'src/pages/tools/development/json-flattener.astro',
  'src/pages/tools/math/math-expression-evaluator.astro'
];

let fixedCount = 0;

for (const filePath of files) {
  const fullPath = path.join(__dirname, filePath);
  
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    
    // Extract component name from the old import
    const importMatch = content.match(/import\(['"]\.\.\/components\/tools\/([^'"]+)['"]\)/);
    if (importMatch) {
      const componentName = importMatch[1];
      
      // Determine the correct category based on file path or component name
      const toolName = path.basename(filePath, '.astro');
      const category = categoryMap[toolName];
      
      if (category) {
        const newImportPath = `../../../components/tools/${category}/${componentName}`;
        content = content.replace(
          /import\(['"]\.\.\/components\/tools\/[^'"]+['"]\)/g,
          `import('${newImportPath}')`
        );
        
        fs.writeFileSync(fullPath, content);
        console.log(`Fixed dynamic import in: ${filePath}`);
        fixedCount++;
      }
    }
  }
}

console.log(`Fixed dynamic imports in ${fixedCount} files.`);