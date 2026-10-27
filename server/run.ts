import { createServer } from "http";
import { initSocketServer } from "./socket";

const port = Number(process.env.SOCKET_PORT) || 4000;
const httpServer = createServer();
initSocketServer(httpServer);
httpServer.listen(port, () => {
  console.log(`[neon-arcade-socket] listening on :${port}`);
});
