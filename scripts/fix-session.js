import fs from 'fs';
import path from 'path';

const apiDir = path.join(process.cwd(), 'src', 'lib', 'api');

function replaceInFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (content.includes('session.userId')) {
    const updated = content.replace(/session\.userId/g, 'session.user.id');
    fs.writeFileSync(filePath, updated, 'utf-8');
    console.log(`Updated ${filePath}`);
  }
}

fs.readdirSync(apiDir).forEach(file => {
  if (file.endsWith('.ts')) {
    replaceInFile(path.join(apiDir, file));
  }
});
