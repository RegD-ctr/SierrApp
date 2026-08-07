import fs from 'fs';
import path from 'path';

const files = [
  'src/pages/RepartidorPanel.tsx',
  'src/pages/Perfil.tsx',
  'src/pages/Pedidos.tsx',
  'src/pages/Login.tsx',
  'src/pages/LocalPanel.tsx',
  'src/pages/Explorar.tsx',
  'src/index.css',
  'src/App.tsx',
  'src/components/RestaurantPage.tsx',
  'src/components/CustomizeModal.tsx',
  'src/components/CartDrawer.tsx'
];

const dir = 'c:/Users/diego/OneDrive/Desktop/Sierrapp';

const replacements = {
  '#0d1a0f': '#1a1b1e',
  '#142a17': '#232427',
  '#2a4830': '#35373b',
  '#7aaa70': '#9a9da3',
  '#a8d89a': '#c4c6ca'
};

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [oldColor, newColor] of Object.entries(replacements)) {
      content = content.split(oldColor).join(newColor);
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  }
});
