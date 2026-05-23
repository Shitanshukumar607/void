import { Client } from "ssh2";
import fs from "fs";

console.log("Starting VOID E2E SSH Integration Client...");

const conn = new Client();

conn.on("ready", () => {
  console.log("SSH connection established. Requesting shell...");

  conn.shell({ term: "xterm-256color", cols: 80, rows: 24 }, (err, stream) => {
    if (err) {
      console.error("Error requesting shell:", err);
      conn.end();
      process.exit(1);
    }

    let buffer = "";
    let rawBuffer = Buffer.alloc(0);

    stream.on("data", (data: Buffer) => {
      rawBuffer = Buffer.concat([rawBuffer, data]);
      const chunk = data.toString();
      buffer += chunk;
      // Use clean standard regex for stripping ANSI color codes
      const cleanChunk = chunk.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "");
      process.stdout.write(cleanChunk);
    });

    stream.on("close", () => {
      console.log("\nSSH shell stream closed.");
      fs.writeFileSync("raw_stream.txt", rawBuffer);
      conn.end();
      process.exit(0);
    });

    // Run synchronous command sequences with appropriate delays to let Blessed render and game state progress
    const sequence = [
      { cmd: "help\r", delay: 2000 },
      { cmd: "ls\r", delay: 1000 },
      { cmd: "cat notes.txt\r", delay: 1500 },
      { cmd: "scan\r", delay: 1500 },
      { cmd: "connect archive\r", delay: 3000 },
      { cmd: "ls\r", delay: 1000 },
      { cmd: "cat staff.msg\r", delay: 1500 },
      { cmd: "unlock atlas\r", delay: 2000 },
      { cmd: "scan\r", delay: 1500 },
      { cmd: "connect relay-7\r", delay: 3000 },
      { cmd: "scan\r", delay: 1500 },
      { cmd: "connect lab\r", delay: 3000 },
      { cmd: "ls\r", delay: 1000 },
      { cmd: "cat experiment.log\r", delay: 2000 },
      { cmd: "\u0003", delay: 500 }, // Send Ctrl+C
    ];

    async function runSequence() {
      // Wait for intro sequence to complete
      await new Promise((resolve) => setTimeout(resolve, 3500));

      for (const step of sequence) {
        console.log(
          `\n\x1b[35m[CLIENT INPUT]: Sending keypresses for command: ${step.cmd.trim() || "Ctrl+C"}\x1b[0m`,
        );
        stream.write(step.cmd);
        await new Promise((resolve) => setTimeout(resolve, step.delay));
      }

      console.log(
        "\nAll commands in sequence executed. Terminating connection...",
      );
      fs.writeFileSync("raw_stream.txt", rawBuffer);
      conn.end();
      process.exit(0);
    }

    runSequence().catch(console.error);
  });
});

conn.on("error", (err) => {
  console.error("SSH Client Connection Error:", err);
  process.exit(1);
});

conn.connect({
  host: "127.0.0.1",
  port: 2222,
  username: "anonymous",
  password: "", // any credential
  readyTimeout: 10000,
});
