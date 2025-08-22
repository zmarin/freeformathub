import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixUIImports(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixedCount += fixUIImports(filePath);
    } else if (file.endsWith('.tsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      
      // Check if this file has individual UI imports that need to be consolidated
      const individualImports = [];
      const lines = content.split('\n');
      const importLines = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes("from '../ui/") || line.includes("from '../../ui/")) {
          // Extract component name from import
          const match = line.match(/import\s+\{\s*([^}]+)\s*\}\s+from\s+['"]\.\.\/\.\.?\/ui\/[^'"]+['"];?/);
          if (match) {
            individualImports.push(match[1].trim());
            importLines.push(i);
          }
        }
      }
      
      if (individualImports.length > 0) {
        // Remove individual import lines
        const newLines = lines.filter((_, index) => !importLines.includes(index));
        
        // Determine correct import path
        const relativePath = path.relative(path.join(__dirname, 'src/components/tools'), filePath);
        const pathParts = relativePath.split(path.sep);
        const importPath = pathParts.length === 2 ? '../../ui' : '../ui'; // category/component.tsx vs component.tsx
        
        // Add consolidated import at the top after existing imports
        let insertIndex = 0;
        for (let i = 0; i < newLines.length; i++) {
          if (newLines[i].startsWith('import ') || newLines[i].trim() === '') {
            insertIndex = i + 1;
          } else {
            break;
          }
        }
        
        // Check if consolidated import already exists
        const hasConsolidatedImport = newLines.some(line => 
          line.includes(`from '${importPath}'`) && line.includes('InputPanel')
        );
        
        if (!hasConsolidatedImport) {
          const consolidatedImport = `import { ${individualImports.join(', ')} } from '${importPath}';`;
          newLines.splice(insertIndex, 0, consolidatedImport);
        }
        
        content = newLines.join('\n');
        modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(filePath, content);
        const relativePath = path.relative(path.join(__dirname, 'src/components/tools'), filePath);
        console.log(`Fixed UI imports in: ${relativePath}`);
        fixedCount++;
      }
    }
  }
  
  return fixedCount;
}

console.log('Fixing individual UI imports...');
const fixed = fixUIImports(path.join(__dirname, 'src/components/tools'));
console.log(`Fixed UI imports in ${fixed} files.`);