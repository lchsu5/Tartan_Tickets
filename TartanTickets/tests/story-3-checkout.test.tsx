import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import EventList from "../src/components/event-list";

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
const event = { id: "autumn-gala", title: "Autumn Gala", startsAt: "2099-11-01T12:00:00Z", location: "Campus", priceCents: 1500, capacity: 10, ticketsSold: 0 };
const held = { id: "opaque-order", status: "held", eventId: event.id, name: "Alex", seats: 2, totalCents: 3000, expiresAt: "2099-11-01T12:00:00Z", tickets: [], simulated: true };

describe("Story 3: checkout browser interface", () => {
  it("reserves seats, displays the server total, and shows a simulated receipt after payment", async () => {
    const mock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => held })
      .mockResolvedValueOnce({ ok: true, json: async () => [event] })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ ...held, status: "paid", tickets: [{ token: "ticket-token", qrDataUrl: "data:image/png;base64,AA==" }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => [event] });
    vi.stubGlobal("fetch", mock);
    render(<EventList events={[event]} />);
    fireEvent.click(screen.getByRole("button", { name: "Buy tickets for Autumn Gala" }));
    fireEvent.change(screen.getByLabelText("Buyer name"), { target: { value: "Alex" } });
    fireEvent.change(screen.getByLabelText("Number of tickets"), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Reserve tickets" }));
    await screen.findByRole("button", { name: "Simulated payment" });
    expect(screen.getByText("Total: $30.00")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Simulated payment" }));
    expect(await screen.findByRole("heading", { name: "Simulated receipt" })).toBeTruthy();
    expect(screen.getByAltText("QR code for ticket 1")).toBeTruthy();
    expect(mock.mock.calls[0][1].body).toBe(JSON.stringify({ action: "reserve", eventId: event.id, name: "Alex", seats: 2 }));
    fireEvent.click(screen.getByRole("button", { name: "Back to events" }));
    expect(screen.queryByRole("heading", { name: "Simulated receipt" })).toBeNull();
    expect(screen.getByRole("button", { name: "Buy tickets for Autumn Gala" }).hasAttribute("disabled")).toBe(false);
  });
  it("offers the waitlist when another buyer takes the last seats", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: async () => ({ error: "Sold out.", waitlist: true }) }));
    render(<EventList events={[event]} />);
    fireEvent.click(screen.getByRole("button", { name: "Buy tickets for Autumn Gala" }));
    fireEvent.change(screen.getByLabelText("Buyer name"), { target: { value: "Alex" } });
    fireEvent.click(screen.getByRole("button", { name: "Reserve tickets" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Join waitlist for Autumn Gala" })).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Join waitlist for Autumn Gala" }));
    expect(screen.getByLabelText("Your name")).toBeTruthy();
  });
});
