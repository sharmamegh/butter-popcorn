import { promises as fs } from "fs";
import path from "path";
import type { Room } from "@/lib/room-types";

const TTL_SECONDS = 6 * 60 * 60;

export interface RoomStorage {
  get(code: string): Promise<Room | null>;
  set(room: Room): Promise<void>;
  delete(code: string): Promise<void>;
  prune(): Promise<void>;
}

/**
 * File-backed store for local/dev without Redis.
 * Survives hot reloads and works across route module instances.
 */
class FileStorage implements RoomStorage {
  private dir: string;
  private writeQueues = new Map<string, Promise<void>>();

  constructor(dir: string) {
    this.dir = dir;
  }

  private filePath(code: string) {
    return path.join(this.dir, `${code.toUpperCase()}.json`);
  }

  private async ensureDir() {
    await fs.mkdir(this.dir, { recursive: true });
  }

  async get(code: string): Promise<Room | null> {
    try {
      const raw = await fs.readFile(this.filePath(code), "utf8");
      const room = JSON.parse(raw) as Room;
      const cutoff = Date.now() - TTL_SECONDS * 1000;
      if (room.createdAt < cutoff) {
        await this.delete(code);
        return null;
      }
      return room;
    } catch {
      return null;
    }
  }

  async set(room: Room): Promise<void> {
    const code = room.code.toUpperCase();
    const previous = this.writeQueues.get(code) ?? Promise.resolve();
    const next = previous
      .catch(() => undefined)
      .then(async () => {
        await this.ensureDir();
        const tmp = `${this.filePath(code)}.tmp`;
        await fs.writeFile(tmp, JSON.stringify(room), "utf8");
        await fs.rename(tmp, this.filePath(code));
      });
    this.writeQueues.set(code, next);
    await next;
  }

  async delete(code: string): Promise<void> {
    try {
      await fs.unlink(this.filePath(code));
    } catch {
      // already gone
    }
  }

  async prune(): Promise<void> {
    try {
      await this.ensureDir();
      const files = await fs.readdir(this.dir);
      const cutoff = Date.now() - TTL_SECONDS * 1000;
      await Promise.all(
        files
          .filter((f) => f.endsWith(".json"))
          .map(async (f) => {
            try {
              const raw = await fs.readFile(path.join(this.dir, f), "utf8");
              const room = JSON.parse(raw) as Room;
              if (room.createdAt < cutoff) {
                await fs.unlink(path.join(this.dir, f));
              }
            } catch {
              // skip unreadable files
            }
          })
      );
    } catch {
      // nothing to prune
    }
  }
}

/** In-process store. Local fallback only — never reliable across Vercel instances. */
class MemoryStorage implements RoomStorage {
  private rooms = new Map<string, Room>();

  async get(code: string): Promise<Room | null> {
    return this.rooms.get(code.toUpperCase()) ?? null;
  }

  async set(room: Room): Promise<void> {
    this.rooms.set(room.code.toUpperCase(), room);
  }

  async delete(code: string): Promise<void> {
    this.rooms.delete(code.toUpperCase());
  }

  async prune(): Promise<void> {
    const cutoff = Date.now() - TTL_SECONDS * 1000;
    for (const [code, room] of this.rooms) {
      if (room.createdAt < cutoff) this.rooms.delete(code);
    }
  }
}

class UpstashStorage implements RoomStorage {
  private redis: import("@upstash/redis").Redis;

  constructor(redis: import("@upstash/redis").Redis) {
    this.redis = redis;
  }

  private key(code: string) {
    return `room:${code.toUpperCase()}`;
  }

  async get(code: string): Promise<Room | null> {
    const data = await this.redis.get<Room>(this.key(code));
    return data ?? null;
  }

  async set(room: Room): Promise<void> {
    await this.redis.set(this.key(room.code), room, { ex: TTL_SECONDS });
  }

  async delete(code: string): Promise<void> {
    await this.redis.del(this.key(code));
  }

  async prune(): Promise<void> {
    // Upstash TTL handles expiry
  }
}

function redisRestCredentials(): { url: string; token: string } | null {
  // Standard Upstash names, or Vercel Marketplace store prefixes (e.g. REDIS_KV_*).
  const url =
    process.env.UPSTASH_REDIS_REST_URL ??
    process.env.REDIS_KV_REST_API_URL ??
    process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ??
    process.env.REDIS_KV_REST_API_TOKEN ??
    process.env.KV_REST_API_TOKEN;

  if (!url || !token) return null;
  return { url, token };
}

function createStorage(): RoomStorage {
  const creds = redisRestCredentials();

  if (creds) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
    return new UpstashStorage(new Redis(creds));
  }

  // Vercel filesystem is read-only / ephemeral per instance.
  // Memory "works" for a single warm lambda and then rooms vanish → 404s.
  if (process.env.VERCEL) {
    console.error(
      "[butter-popcorn] Redis REST URL/token missing (UPSTASH_REDIS_* or REDIS_KV_REST_API_*). Rooms will not persist across serverless instances."
    );
    return new MemoryStorage();
  }

  // Local file store survives Next.js HMR.
  return new FileStorage(path.join(process.cwd(), ".data", "rooms"));
}

let storage: RoomStorage | null = null;

export function getStorage(): RoomStorage {
  if (!storage) storage = createStorage();
  return storage;
}

export function storageMode(): "upstash" | "file" | "memory" {
  if (redisRestCredentials()) return "upstash";
  if (process.env.VERCEL) return "memory";
  return "file";
}

/** True when room state will survive across serverless invocations. */
export function hasPersistentStorage(): boolean {
  return storageMode() !== "memory";
}
