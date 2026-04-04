const http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Bot is running!");
});

server.listen(process.env.PORT || 3000, () => {
  console.log("✅ Keep-alive server running");
});