import { stdin, stdout } from "node:process";
import * as readline from "node:readline/promises";

/** Visible line prompt. */
export async function ask(query: string): Promise<string> {
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    return (await rl.question(query)).trim();
  } finally {
    rl.close();
  }
}

/** Hidden prompt (password) — reads raw, never echoes the typed characters. */
export function askHidden(query: string): Promise<string> {
  return new Promise((resolve, reject) => {
    stdout.write(query);
    let buf = "";
    stdin.resume();
    stdin.setRawMode?.(true);
    const onData = (chunk: Buffer) => {
      const s = chunk.toString("utf8");
      if (s === "\r" || s === "\n") {
        cleanup();
        resolve(buf);
      } else if (s === "\u0003") {
        cleanup();
        reject(new Error("cancelled"));
      } else if (s === "\u007f" || s === "\b") {
        buf = buf.slice(0, -1);
      } else {
        buf += s;
      }
    };
    const cleanup = () => {
      stdin.setRawMode?.(false);
      stdin.pause();
      stdin.off("data", onData);
      stdout.write("\n");
    };
    stdin.on("data", onData);
  });
}
