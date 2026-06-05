import { readFile, writeFile } from "node:fs/promises";
import { $ } from "bun";

export interface Tool {
  name: string;
  description: string;
  run(input: string): Promise<string>;
}

/**
 * Minimal starter tools. The agent loop (agent.ts) will eventually expose these
 * to the model as callable tools - for now they're here to extend and to test
 * the audit/budget pipeline against. Add edit/grep/ls as you go.
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
