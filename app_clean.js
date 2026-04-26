const http = require('http');

const port = process.env.PORT || 8080;

// Basic request handler
const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);

  // Simple health check endpoint (useful for Azure)
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK' }));
    return;
  }

  // Main response
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from Azure App Service running Docker!\n');
});

// IMPORTANT: bind to 0.0.0.0 for Azure
server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check: /health`);
});

