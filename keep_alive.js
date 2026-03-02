const http = require("http");

// Tiny web server so UptimeRobot can ping us and keep the bot awake 24/7
http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Labubu Bot is alive!");
}).listen(3000, () => console.log("✅ Keep-alive server on port 3000"));
