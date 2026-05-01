const http = require('http');

const hostname = '0.0.0.0';
const port = 8080; // Your application's listening port

const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Hello from MY REAL PROJECT!\n'); // This is your project's output
});

server.listen(port, hostname, () => {
  console.log(`My Real Project Server running at http://${hostname}:${port}/`);
});