import { Client } from "ssh2";
import fs from "fs";

console.log("Starting ORIGIN E2E SSH Integration Client...");

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
      // Strip ANSI color codes for standard clean logging
      const cleanChunk = chunk.replace(/\u001b\[[0-9;]*[a-zA-Z]/g, "");
      process.stdout.write(cleanChunk);
    });

    stream.on("close", () => {
      console.log("\nSSH shell stream closed.");
      fs.writeFileSync("raw_stream.txt", rawBuffer);
      conn.end();
      process.exit(0);
    });

    // Detailed walkthrough sequence to verify all progression mechanics without manual locks/keys
    const sequence = [
      { cmd: "help\r", delay: 1500 },
      { cmd: "logs\r", delay: 1500 },
      { cmd: "cat day-7.log\r", delay: 2000 },
      { cmd: "scan\r", delay: 1500 },
      { cmd: "connect dock-1\r", delay: 3000 },
      { cmd: "ls\r", delay: 1000 },
      { cmd: "cat camera-feed.txt\r", delay: 2000 },
      { cmd: "connect med-bay\r", delay: 3000 },
      { cmd: "ls\r", delay: 1000 },
      { cmd: "cat injury.log\r", delay: 2000 },
      { cmd: "connect security\r", delay: 3000 },
      { cmd: "ls\r", delay: 1000 },
      { cmd: "cat gate-bypass.txt\r", delay: 2000 },
      { cmd: "scan\r", delay: 1500 },
      { cmd: "connect feeding-zone\r", delay: 3000 },
      { cmd: "ls\r", delay: 1000 },
      { cmd: "cat hatchery-bypass.txt\r", delay: 2000 },
      { cmd: "scan\r", delay: 1500 },
      { cmd: "connect hatchery\r", delay: 3000 },
      { cmd: "ls\r", delay: 1000 },
      { cmd: "cat final.log\r", delay: 2500 },
      { cmd: "cat tower-feed.txt\r", delay: 9000 }, // Generous delay to let the ending display fully and close stream
    ];

    async function runSequence() {
      // Wait for the atmospheric intro sequence to render
      await new Promise((resolve) => setTimeout(resolve, 3500));

      for (const step of sequence) {
        console.log(
          `\n\x1b[35m[CLIENT INPUT]: Sending command: ${step.cmd.trim()}\x1b[0m`,
        );
        stream.write(step.cmd);
        await new Promise((resolve) => setTimeout(resolve, step.delay));
      }

      console.log(
        "\nSequence completed. Terminating test connection...",
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
  password: "",
  readyTimeout: 10000,
});
