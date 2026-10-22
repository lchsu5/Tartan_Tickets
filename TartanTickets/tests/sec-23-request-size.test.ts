// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";

const limit = 16384;
const base = { action: "reserve", eventId: "autumn-gala", name: "Security Demo", seats: 1 };
const encoder = new TextEncoder();
function padded(bytes: number) {
  const json = JSON.stringify(base);
  return json + " ".repeat(bytes - encoder.encode(json).byteLength);
}
function request(body: string, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api/orders", { method: "POST", headers, body });
}
beforeEach(() => vi.resetModules());

describe("SEC-23: bounded checkout request bodies", () => {
  it("rejects an oversized checkout request before it can reserve any seats", async () => {
    const { POST } = await import("../src/app/api/orders/route");
    const { orders } = await import("../src/lib/events");
    const response = await POST(request(padded(limit + 1), { "Content-Length": String(limit + 1) }));
    expect(response.status).toBe(413);
    expect(orders.size).toBe(0);
    expect(await response.json()).toHaveProperty("error");
  });
  it("rejects oversized bodies when the content length header is absent", async () => {
    const { POST } = await import("../src/app/api/orders/route");
    expect((await POST(request(padded(limit + 1)))).status).toBe(413);
  });
  it("rejects oversized bodies even when the browser claims they are small", async () => {
    const { POST } = await import("../src/app/api/orders/route");
    expect((await POST(request(padded(limit + 1), { "Content-Length": "10" }))).status).toBe(413);
  });
  it("accepts a valid checkout body exactly at the byte limit", async () => {
    const { POST } = await import("../src/app/api/orders/route");
    expect((await POST(request(padded(limit)))).status).toBe(201);
  });
  it("counts UTF-8 bytes instead of characters", async () => {
    const { POST } = await import("../src/app/api/orders/route");
    const body = JSON.stringify({ ...base, padding: "界".repeat(6000) });
    expect(body.length).toBeLessThan(limit);
    expect(encoder.encode(body).byteLength).toBeGreaterThan(limit);
    expect((await POST(request(body))).status).toBe(413);
  });
  it("cancels a streamed body as soon as its byte count exceeds the limit", async () => {
    const { POST } = await import("../src/app/api/orders/route");
    const { orders } = await import("../src/lib/events");
    const chunks = [padded(limit), " ", "this chunk must never be read"];
    let reads = 0;
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) { controller.enqueue(encoder.encode(chunks[reads++])); if (reads === chunks.length) controller.close(); },
      cancel() { cancelled = true; },
    }, { highWaterMark: 0 });
    const req = new Request("http://localhost/api/orders", {
      method: "POST", body: stream, duplex: "half",
    } as RequestInit & { duplex: "half" });
    expect((await POST(req)).status).toBe(413);
    expect(reads).toBe(2);
    expect(cancelled).toBe(true);
    expect(orders.size).toBe(0);
  });
  it("rejects a declared oversized body without reading its stream", async () => {
    const { POST } = await import("../src/app/api/orders/route");
    let reads = 0;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) { reads++; controller.enqueue(encoder.encode(JSON.stringify(base))); controller.close(); },
    }, { highWaterMark: 0 });
    const req = new Request("http://localhost/api/orders", {
      method: "POST", body: stream, headers: { "Content-Length": String(limit + 1) }, duplex: "half",
    } as RequestInit & { duplex: "half" });
    expect((await POST(req)).status).toBe(413);
    expect(reads).toBe(0);
  });
});
