// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

async function api(body: unknown) {
  const { POST } = await import("../src/app/api/orders/route");
  return POST(new Request("http://localhost/api/orders", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }));
}
const reserve = (extra = {}) => api({ action: "reserve", eventId: "autumn-gala", name: "Alex Student", seats: 2, ...extra });

beforeEach(() => { vi.resetModules(); vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-22T12:00:00Z")); });
afterEach(() => { vi.useRealTimers(); });

describe("Story 3: simulated ticket purchases", () => {
  it.each([0, -1, 1.5, 5, "2", null])("rejects invalid quantity %s on the server", async (seats) => {
    expect((await reserve({ seats })).status).toBe(400);
  });
  it.each(["", "   ", "x".repeat(101), 42])("rejects invalid buyer name %s", async (name) => {
    expect((await reserve({ name })).status).toBe(400);
  });
  it("accepts four tickets and ignores a tampered browser price", async () => {
    const response = await reserve({ seats: 4, totalCents: 1 });
    expect(response.status).toBe(201);
    const order = await response.json();
    expect(order.totalCents).toBe(6000);
    expect(order.status).toBe("held");
    expect(new Date(order.expiresAt).getTime() - Date.now()).toBe(600000);
  });
  it("holds seats until exactly ten minutes and then releases them", async () => {
    const { getUpcomingEvents } = await import("../src/lib/events");
    const original = getUpcomingEvents()[0];
    await reserve();
    expect(getUpcomingEvents()[0].ticketsSold).toBe(original.ticketsSold + 2);
    vi.advanceTimersByTime(599999);
    expect(getUpcomingEvents()[0].ticketsSold).toBe(original.ticketsSold + 2);
    vi.advanceTimersByTime(1);
    expect(getUpcomingEvents()[0].ticketsSold).toBe(original.ticketsSold);
  });
  it("produces an immediate simulated receipt with distinct QR tokens and does not double-charge", async () => {
    const order = await (await reserve()).json();
    const paid = await api({ action: "pay", orderId: order.id });
    expect(paid.status).toBe(200);
    const receipt = await paid.json();
    expect(receipt.status).toBe("paid");
    expect(receipt.simulated).toBe(true);
    expect(receipt.tickets).toHaveLength(2);
    expect(new Set(receipt.tickets.map((t: { token: string }) => t.token)).size).toBe(2);
    expect(receipt.tickets[0].qrDataUrl).toMatch(/^data:image\/png;base64,/);
    const again = await (await api({ action: "pay", orderId: order.id })).json();
    expect(again.tickets).toEqual(receipt.tickets);
    expect((await api({ action: "decline", orderId: order.id })).status).toBe(409);
  });
  it("releases declined seats once and refuses later payment", async () => {
    const { getUpcomingEvents } = await import("../src/lib/events");
    const original = getUpcomingEvents()[0].ticketsSold;
    const order = await (await reserve()).json();
    expect((await api({ action: "decline", orderId: order.id })).status).toBe(200);
    expect((await api({ action: "decline", orderId: order.id })).status).toBe(200);
    expect(getUpcomingEvents()[0].ticketsSold).toBe(original);
    expect((await api({ action: "pay", orderId: order.id })).status).toBe(409);
  });
  it("rejects payment at expiry without issuing tickets", async () => {
    const order = await (await reserve()).json();
    vi.advanceTimersByTime(600000);
    const response = await api({ action: "pay", orderId: order.id });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ status: "expired" });
  });
  it("offers the waitlist when checkout finds the event sold out", async () => {
    const response = await reserve({ eventId: "winter-formal" });
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ waitlist: true });
  });
  it("allows only one of fifty simultaneous reservations for the last seat", async () => {
    const { events } = await import("../src/lib/events");
    events[0].ticketsSold = events[0].capacity - 1;
    const results = await Promise.all(Array.from({ length: 50 }, () => reserve({ seats: 1 })));
    expect(results.filter((r) => r.status === 201)).toHaveLength(1);
    expect(results.filter((r) => r.status === 409)).toHaveLength(49);
  });
  it("returns a controlled error for malformed JSON, unknown orders and unknown actions", async () => {
    const { POST } = await import("../src/app/api/orders/route");
    expect((await POST(new Request("http://localhost/api/orders", { method: "POST", body: "{" }))).status).toBe(400);
    expect((await api({ action: "pay", orderId: "missing" })).status).toBe(404);
    expect((await api({ action: "surprise" })).status).toBe(400);
  });
});
