import { existsSync, readFileSync } from "fs";
import path from "path";
import ssh2 from "ssh2";
import { setupTerminalUI } from "../renderer/tui.js";

function getHostKey() {
  const keyPath = path.resolve(process.cwd(), "host.key");
  if (existsSync(keyPath)) {
    return readFileSync(keyPath);
  }

  console.error(
    "Missing SSH host key. Please generate one using the following command:",
  );
  console.error("ssh-keygen -t rsa -b 2048 -f host.key");
  process.exit(1);
}

export function startSSHServer(port: number) {
  const hostKey = getHostKey();

  const server = new ssh2.Server(
    {
      hostKeys: [hostKey],
    },
    (client) => {
      let ptyInfo: any = null;
      console.log("[SSH SERVER] Client initiated connection handshake.");

      client.on("authentication", (ctx) => {
        console.log(
          `[SSH SERVER] Authenticating user "${ctx.username}" via method "${ctx.method}"...`,
        );
        // accept any credentials for now
        ctx.accept();
      });

      client.on("ready", () => {
        console.log("[SSH SERVER] Client successfully authenticated.");
        client.on("session", (accept) => {
          const session = accept();

          session.on("pty", (acceptPty, rejectPty, info) => {
            ptyInfo = info;
            console.log(
              `[SSH SERVER] PTY requested (Term: ${(info as any).term}, Cols: ${(info as any).cols}, Rows: ${(info as any).rows}).`,
            );
            if (acceptPty) acceptPty();
          });

          session.on("shell", (acceptShell) => {
            console.log(
              "[SSH SERVER] Shell requested. Spawning Blessed terminal TUI...",
            );
            const stream = acceptShell();

            // expose TTY properties required by blessed tui
            (stream as any).isTTY = true;
            (stream as any).columns = ptyInfo ? ptyInfo.cols : 80;
            (stream as any).rows = ptyInfo ? ptyInfo.rows : 24;

            try {
              setupTerminalUI(stream, ptyInfo, session);
            } catch (err) {
              console.error(
                "[SSH SERVER] Error establishing terminal UI for user session:",
                err,
              );
              stream.end();
            }
          });
        });
      });

      client.on("error", (err) => {
        console.log(`[SSH SERVER] Client Connection Error: ${err.message}`);
      });
    },
  );

  server.listen(port, "0.0.0.0", () => {
    console.log(
      `\x1b[32m[VOID SYSTEM ACTIVE]\x1b[0m SSH server listening on 0.0.0.0:${port}`,
    );
  });

  server.on("error", (err: any) => {
    console.error("SSH Server encountered an error:", err);
  });
}
