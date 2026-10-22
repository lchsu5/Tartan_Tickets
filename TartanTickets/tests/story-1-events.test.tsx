import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import EventList from "../src/components/event-list";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const now = new Date("2026-10-21T12:00:00-04:00");

const events = [
  {
    id: "autumn-gala",
    title: "Autumn Gala",
    startsAt: "2026-11-06T19:00:00-05:00",
    location: "Cohon University Center",
    priceCents: 1500,
    capacity: 100,
    ticketsSold: 92,
  },
  {
    id: "winter-formal",
    title: "Winter Formal",
    startsAt: "2026-12-12T20:00:00-05:00",
    location: "Rangos Ballroom",
    priceCents: 2500,
    capacity: 50,
    ticketsSold: 50,
  },
  {
    id: "past-concert",
    title: "Past Concert",
    startsAt: "2026-01-01T19:00:00-05:00",
    location: "McConomy Auditorium",
    priceCents: 1000,
    capacity: 80,
    ticketsSold: 80,
  },
];

describe("Story 1: browse upcoming events", () => {
  it("shows the empty state when no upcoming events exist", () => {
    render(<EventList events={[]} now={now} />);
    expect(screen.getByText("No upcoming events yet.")).toBeTruthy();
  });

  it("keeps event text inert instead of executing markup", () => {
    const title = '<script>alert("event")</script>';
    const { container } = render(<EventList events={[{ ...events[0], title }]} now={now} />);
    expect(screen.getByRole("heading", { name: title })).toBeTruthy();
    expect(container.querySelector("script")).toBeNull();
  });

  it("shows upcoming event dates, locations, prices, and seats remaining", () => {
    render(<EventList events={events} now={now} />);

    expect(screen.getByText("Autumn Gala")).toBeTruthy();
    expect(screen.getByText("November 6, 2026")).toBeTruthy();
    expect(screen.getByText("Cohon University Center")).toBeTruthy();
    expect(screen.getByText("$15.00")).toBeTruthy();
    expect(screen.getByText("8 seats remaining")).toBeTruthy();
    expect(screen.queryByText("Past Concert")).toBeNull();
  });

  it("offers a waitlist instead of buying when an event is sold out", () => {
    render(<EventList events={events} now={now} />);

    expect(
      screen.getByRole("button", { name: "Join waitlist for Winter Formal" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Buy tickets for Winter Formal" }),
    ).toBeNull();
    expect(
      screen.getByRole("button", {
        name: "Buy tickets for Autumn Gala (Demo)",
      }),
    ).toBeTruthy();
  });

  it("explains that the available-seat ticket button is a demo and takes no payment", () => {
    render(<EventList events={events} now={now} />);

    fireEvent.click(
      screen.getByRole("button", {
        name: "Buy tickets for Autumn Gala (Demo)",
      }),
    );

    expect(
      screen.getByRole("status").textContent,
    ).toBe(
      "Demo only: ticket purchasing isn't available yet. No ticket was purchased and no payment was taken.",
    );
  });

  it("submits a typed name to join a sold-out event's waitlist", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ position: 1 }),
    });
    vi.stubGlobal("fetch", fetchMock);
    render(<EventList events={events} now={now} />);

    fireEvent.click(
      screen.getByRole("button", { name: "Join waitlist for Winter Formal" }),
    );
    fireEvent.change(screen.getByLabelText("Your name"), {
      target: { value: "Alex Student" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Submit waitlist request" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: "winter-formal",
          name: "Alex Student",
        }),
      });
      expect(
        screen.getByText("You're on the waitlist for Winter Formal."),
      ).toBeTruthy();
    });
  });
});
