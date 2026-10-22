"use client";

import React, { FormEvent, useCallback, useState } from "react";
import Checkout from "./checkout";
import type { EventRecord } from "@/lib/events";

type EventListProps = {
  events: EventRecord[];
  now?: Date;
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

export default function EventList({
  events,
  now = new Date(),
}: EventListProps) {
  const [selectedEvent, setSelectedEvent] = useState<EventRecord | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inventory, setInventory] = useState(events);
  const [checkoutId, setCheckoutId] = useState<string | null>(null);
  const refreshInventory = useCallback(async () => {
    try {
      const response = await fetch("/api/events", { cache: "no-store" });
      if (!response.ok) throw new Error("Inventory unavailable");
      setInventory(await response.json());
    } catch { setMessage("Could not refresh seat availability. Reload the page to check it."); }
  }, []);
  const upcomingEvents = inventory
    .filter((event) => new Date(event.startsAt).getTime() > now.getTime())
    .sort(
      (left, right) =>
        new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
    );

  async function submitWaitlist(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedEvent || !name.trim()) {
      setMessage("Enter your name to join the waitlist.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ eventId: selectedEvent.id, name: name.trim() }),
      });
      const result: unknown = await response.json();
      if (!response.ok) {
        const errorMessage =
          result &&
          typeof result === "object" &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "We couldn't add you to the waitlist. Please try again.";
        throw new Error(errorMessage);
      }
      setMessage(`You're on the waitlist for ${selectedEvent.title}.`);
      setSelectedEvent(null);
      setName("");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "We couldn't add you to the waitlist. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (upcomingEvents.length === 0) {
    return <p className="empty-state">No upcoming events yet.</p>;
  }

  return (
    <section aria-label="Upcoming events" className="event-list">
      {upcomingEvents.map((event) => {
        const seatsRemaining = Math.max(event.capacity - event.ticketsSold, 0);
        const soldOut = seatsRemaining === 0;

        return (
          <article className="event-card" key={event.id}>
            <div className="event-details">
              <p className="event-date">{formatDate(event.startsAt)}</p>
              <h2>{event.title}</h2>
              <p>{event.location}</p>
              <div className="event-meta">
                <span>${(event.priceCents / 100).toFixed(2)}</span>
                <span>
                  {seatsRemaining} {seatsRemaining === 1 ? "seat" : "seats"}{" "}
                  remaining
                </span>
              </div>
            </div>
            <div className="event-action">
              {soldOut ? (
                <button
                  className="button button-secondary"
                  onClick={() => {
                    setSelectedEvent(event);
                    setMessage("");
                  }}
                  type="button"
                >
                  Join waitlist for {event.title}
                </button>
              ) : (
                <button
                  className="button"
                  disabled={checkoutId !== null}
                  onClick={() => { setCheckoutId(event.id); setSelectedEvent(null); setMessage(""); }}
                  type="button"
                >
                  Buy tickets for {event.title} (Demo)
                </button>
              )}
              {checkoutId === event.id && <Checkout event={event} onInventoryChange={refreshInventory} onClose={() => setCheckoutId(null)} onSoldOut={() => {
                setCheckoutId(null);
                setInventory((current) => current.map((item) => item.id === event.id ? { ...item, ticketsSold: item.capacity } : item));
              }} />}
              {selectedEvent?.id === event.id && (
                <form className="waitlist-form" onSubmit={submitWaitlist}>
                  <label htmlFor={`waitlist-name-${event.id}`}>Your name</label>
                  <input
                    autoComplete="name"
                    id={`waitlist-name-${event.id}`}
                    maxLength={100}
                    onChange={(inputEvent) => setName(inputEvent.target.value)}
                    required
                    value={name}
                  />
                  <button
                    className="button button-secondary"
                    disabled={submitting}
                    type="submit"
                  >
                    {submitting ? "Joining..." : "Submit waitlist request"}
                  </button>
                </form>
              )}
            </div>
          </article>
        );
      })}
      <p aria-live="polite" className="status-message" role="status">
        {message}
      </p>
    </section>
  );
}
