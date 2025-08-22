import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixLibImports(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixedCount += fixLibImports(filePath);
    } else if (file.endsWith('.tsx')) {
      // Check if this is a component in a category subdirectory
      const relativePath = path.relative(path.join(__dirname, 'src/components/tools'), filePath);
      const pathParts = relativePath.split(path.sep);
      
      if (pathParts.length === 2) { // e.g., ['crypto', 'PasswordGenerator.tsx']
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // Fix lib imports - components in category dirs need ../../../lib/ not ../../lib/
        if (content.includes("from '../../lib/")) {
          content = content.replace(/from '\.\.\/\.\.\/lib\//g, "from '../../../lib/");
          modified = true;
        }
        
        if (modified) {
          fs.writeFileSync(filePath, content);
          console.log(`Fixed lib imports in: ${relativePath}`);
          fixedCount++;
        }
      }
    }
  }
  
  return fixedCount;
}

console.log('Fixing lib import paths in category subdirectories...');
const fixed = fixLibImports(path.join(__dirname, 'src/components/tools'));
console.log(`Fixed lib import paths in ${fixed} files.`);