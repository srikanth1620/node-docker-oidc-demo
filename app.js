const http = require('http');
const { exec } = require('child_process');
const url = require('url');

const port = process.env.PORT || 8080;

// CRITICAL: Hardcoded RSA private key
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA2a2rwplBQLzHPZe5ekSKj/UiGLC4bvdFOFqMnQKv4CFbBhSP
pSqDuqMcJWFuuqzAQWFMn0yFMNXnQbpG2hCQmhFs5tI8BF5OQZKABCDEFGHIJKL
MNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/AAABBBCCCDDDEEE
FFFGGGHHHIIIJJJKKKLLLMMMNNNOOOPPPQQQRRRSSSTTTUUUVVVWWWXXXYYYZZZaaa
bbbcccdddeeefffggghhh==
-----END RSA PRIVATE KEY-----`;

// Hardcoded credentials
const DB_PASSWORD = "admin123";
const apiKey = "sk_live_1234567890abcdef";
const AWS_SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
const ADMIN_USER = "admin";
const ADMIN_PASS = "password123";

const server = http.createServer((req, res) => {
  console.log(`Request received: ${req.method} ${req.url}`);

  const parsedUrl = url.parse(req.url, true);

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK' }));
    return;
  }

  // CRITICAL: Command injection - RCE
  // e.g. /run?cmd=cat+/etc/passwd
  if (parsedUrl.pathname === '/run') {
    const cmd = parsedUrl.query.cmd;
    exec(cmd, (err, stdout) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(stdout || err?.message);
    });
    return;
  }

  // CRITICAL: SQL injection
  if (parsedUrl.pathname === '/user') {
    const userId = parsedUrl.query.id;
    const query = `SELECT * FROM users WHERE id = '${userId}'`;
    console.log("Executing query:", query);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Query: ${query}`);
    return;
  }

  // HIGH: Reflected XSS
  if (parsedUrl.pathname === '/hello') {
    const name = parsedUrl.query.name || 'World';
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`<h1>Hello, ${name}!</h1>`);
    return;
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from Azure App Service running Docker!\n');
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
  console.log(`DB_PASSWORD: ${DB_PASSWORD}`);
  console.log(`API Key: ${apiKey}`);
});
// trigger Sat Apr 25 20:38:05 CDT 2026
// retrigger Sat Apr 25 20:42:50 CDT 2026
