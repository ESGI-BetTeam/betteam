import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Log current directory and dist path
const distPath = join(__dirname, 'dist');
console.log('Current directory:', __dirname);
console.log('Dist path:', distPath);
console.log('Dist exists:', existsSync(distPath));
console.log('Index.html exists:', existsSync(join(distPath, 'index.html')));

// Health check endpoint (MUST be before static files)
app.get('/health', (req, res) => {
  console.log('Health check received');
  res.status(200).json({ status: 'ok', port: PORT });
});

// Serve static files from dist directory
app.use(express.static(distPath));

// Handle client-side routing - return index.html for all routes
app.get('*', (req, res, next) => {
  const indexPath = join(distPath, 'index.html');
  console.log(`Request for: ${req.url}`);

  if (!existsSync(indexPath)) {
    console.error('index.html not found at:', indexPath);
    return res.status(404).send('Application files not found');
  }

  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('Error sending file:', err);
      next(err);
    }
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Internal Server Error');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
