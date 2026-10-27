import { createServer } from "http";
import next from "next";
import { parse } from "url";
import { initSocketServer } from "./socket";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const port = Number(process.env.PORT) || 3000;

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  initSocketServer(httpServer);

  httpServer.listen(port, () => {
    console.log(`[neon-arcade] Next.js + Socket.IO running on http://localhost:${port}`);
  });
});
