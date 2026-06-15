import { readFile, writeFile } from "node:fs/promises";
import { $ } from "bun";
import type { Tool } from "./capability.ts";

/**
 * Minimal starter tools, exposed to the agent through the core-tools capability.
 * The runtime's tool-calling loop will make these callable by the model; for now
 * they exist to extend and to exercise the audit/budget pipeline. Add edit/grep/
 * ls as you go - or ship them as a separate capability.
 */
export const tools: Record<string, Tool> = {
  read: {
    name: "read",
    description: "Read a file. input: path",
    run: (input) => readFile(input.trim(), "utf8"),
  },

  write: {
    name: "write",
    description: "Write a file. input: '<path>\\n<contents>'",
    run: async (input) => {
      const nl = input.indexOf("\n");
      const path = input.slice(0, nl).trim();
      const body = input.slice(nl + 1);
      await writeFile(path, body, "utf8");
      return `wrote ${path}`;
    },
  },

  bash: {
    name: "bash",
    description: "Run a shell command. input: the command",
    run: async (input) => (await $`sh -c ${input}`.text()).trim(),
  },
};
