import { homedir } from "node:os";
import { join } from "node:path";

/** Claude Code's own state. We only ever READ from here. */
export const CLAUDE_HOME = process.env.CLAUDE_HOME ?? join(homedir(), ".claude");
export const SESSIONS_DIR = join(CLAUDE_HOME, "sessions");
export const PROJECTS_DIR = join(CLAUDE_HOME, "projects");

/** Our own state, deliberately outside ~/.claude so we never corrupt Claude Code. */
export const DATA_DIR = process.env.DASHBOARD_HOME ?? join(homedir(), ".claude-dashboard");
export const DB_PATH = join(DATA_DIR, "index.db");

export const PORT = Number(process.env.PORT ?? 5757);

/**
 * The environment for any spawn of the `claude` binary.
 *
 * Sessions are meant to behave like a Claude started in the same terminal, so this
 * is `process.env` as-is apart from `XPC_FLAGS`. With the 0x2 bit set — which some
 * terminals (Supacode) export, while Terminal.app uses 0x0 — the binary fails to
 * read the login out of the macOS Keychain and every turn answers "Not logged in"
 * in ~50ms without an API call. The daemon inherits whatever the launching shell
 * happened to have, so it is pinned here rather than left to how it was started.
 */
export function claudeEnv(extra?: Record<string, string>): Record<string, string | undefined> {
  return { ...process.env, ...extra, XPC_FLAGS: "0x0" };
}

/** ~/.claude/projects dirs are the cwd with / replaced by -; recover a display path. */
export function slugToPath(slug: string): string {
  return slug.replace(/^-/, "/").replace(/-/g, "/");
}

/**
 * Home for sessions started without a project. Empty and outside every checkout,
 * so nothing on disk invites the model into a codebase it was not asked about.
 */
export const SCRATCH_DIR = join(DATA_DIR, "scratch");

/**
 * Files pasted or dropped into a composer.
 *
 * A browser never reveals a file's real path — `File` carries a name and bytes and
 * nothing else — so a path can only be produced by storing the bytes ourselves. That
 * is also the only version that works when the dashboard is open on a different
 * machine from the daemon: the session reads the copy that lives next to it, not one
 * that only ever existed on the laptop that did the pasting.
 */
export const DROPPED_DIR = join(DATA_DIR, "dropped");
