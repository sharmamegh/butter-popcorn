import type { Room } from "@/lib/room-types";

const TTL_SECONDS = 6 * 60 * 60;

export interface RoomStorage {
  get(code: string): Promise<Room | null>;
  set(room: Room): Promise<void>;
  delete(code: string): Promise<void>;
  prune(): Promise<void>;
}

class MemoryStorage implements RoomStorage {
  private rooms = new Map<string, Room>();

  async get(code: string): Promise<Room | null> {
    return this.rooms.get(code.toUpperCase()) ?? null;
  }

  async set(room: Room): Promise<void> {
    this.rooms.set(room.code, room);
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

function createStorage(): RoomStorage {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (url && token) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
    return new UpstashStorage(new Redis({ url, token }));
  }

  return new MemoryStorage();
}

let storage: RoomStorage | null = null;

export function getStorage(): RoomStorage {
  if (!storage) storage = createStorage();
  return storage;
}

export function storageMode(): "upstash" | "memory" {
  return process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? "upstash"
    : "memory";
}
