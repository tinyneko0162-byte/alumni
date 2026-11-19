import "server-only";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Slip images uploaded by attendees, kept next to the demo database (./.data/slips).
 * For real use, swap these two functions for cloud storage (S3, R2, Supabase Storage).
 */
const TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };
const MAX_BYTES = 3 * 1024 * 1024;

function dir() {
  const d = process.env.DB_FILE ? path.join(path.dirname(process.env.DB_FILE), "slips") : path.join(process.cwd(), ".data", "slips");
  try {
    fs.mkdirSync(d, { recursive: true });
    fs.accessSync(d, fs.constants.W_OK);
    return d;
  } catch {
    const t = path.join(os.tmpdir(), "alumni-slips");
    fs.mkdirSync(t, { recursive: true });
    return t;
  }
}

/** Save a "data:<type>;base64,..." slip under the given id. Returns the URL staff open, or null when there is nothing valid. */
export function saveSlip(id: string, dataUrl: string | undefined): string | null {
  const m = dataUrl?.match(/^data:([\w/+.-]+);base64,([A-Za-z0-9+/=]+)$/);
  if (!m || !TYPES[m[1]]) return null;
  const buf = Buffer.from(m[2], "base64");
  if (!buf.length || buf.length > MAX_BYTES) return null;
  const safe = id.replace(/[^A-Za-z0-9-]/g, "");
  for (const ext of Object.values(TYPES)) fs.rmSync(path.join(dir(), `${safe}.${ext}`), { force: true });
  fs.writeFileSync(path.join(dir(), `${safe}.${TYPES[m[1]]}`), buf);
  return `/api/slip/${safe}`;
}

export function readSlip(id: string): { body: Buffer; type: string } | null {
  const safe = id.replace(/[^A-Za-z0-9-]/g, "");
  for (const [type, ext] of Object.entries(TYPES)) {
    const f = path.join(dir(), `${safe}.${ext}`);
    if (fs.existsSync(f)) return { body: fs.readFileSync(f), type };
  }
  return null;
}
