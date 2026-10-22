import { describe, expect, it } from "vitest";
import { GET as getEvents } from "../src/app/api/events/route";
import { POST as joinWaitlist } from "../src/app/api/waitlist/route";
import { events } from "../src/lib/events";

describe("Story 1: event and waitlist server routes", () => {
  it.each([
    ["blank name", { eventId: "winter-formal", name: "   " }, 400],
    ["name over 100 characters", { eventId: "winter-formal", name: "x".repeat(101) }, 400],
    ["wrong input type", { eventId: "winter-formal", name: 42 }, 400],
    ["missing event", { eventId: "missing", name: "Student" }, 409],
    ["available event", { eventId: "autumn-gala", name: "Student" }, 409],
  ])("rejects %s", async (_label, body, status) => {
    const response = await joinWaitlist(new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }));
    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toHaveProperty("error");
  });

  it("rejects malformed JSON", async () => {
    const response = await joinWaitlist(new Request("http://localhost/api/waitlist", {
      method: "POST",
      body: "{",
    }));
    expect(response.status).toBe(400);
  });

  it("returns upcoming events with the required listing details", async () => {
    const response = await getEvents();
    const result: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(Array.isArray(result)).toBe(true);
    expect(result).not.toHaveLength(0);
    for (const event of result as typeof events) {
      expect(new Date(event.startsAt).getTime()).toBeGreaterThan(Date.now());
      expect(event.location).toBeTruthy();
      expect(event.priceCents).toEqual(expect.any(Number));
      expect(event.capacity - event.ticketsSold).toBeGreaterThanOrEqual(0);
    }
  });

  it("accepts a typed name for an upcoming sold-out event in server memory", async () => {
    const soldOutEvent = events.find(
      (event) => event.capacity <= event.ticketsSold,
    );
    expect(soldOutEvent).toBeDefined();

    const request = new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        eventId: soldOutEvent?.id,
        name: "Taylor Student",
      }),
    });
    const response = await joinWaitlist(request);
    const result = await response.json();

    expect(response.status).toBe(201);
    expect(result.position).toBeGreaterThan(0);
  });

  it("rejects invalid waitlist requests instead of silently accepting them", async () => {
    const request = new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId: "", name: "" }),
    });
    const response = await joinWaitlist(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toHaveProperty("error");
  });
});
