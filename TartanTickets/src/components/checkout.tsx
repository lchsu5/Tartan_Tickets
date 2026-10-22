"use client";

import React, { useEffect, useRef, useState } from "react";
import type { DemoOrder, EventRecord } from "@/lib/events";

export default function Checkout({ event, onInventoryChange, onSoldOut, onClose }: {
  event: EventRecord;
  onInventoryChange: () => Promise<void>;
  onSoldOut: () => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [seats, setSeats] = useState("1");
  const [order, setOrder] = useState<DemoOrder | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const inFlight = useRef(false);
  useEffect(() => {
    if (order?.status !== "held") return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [order?.status]);
  const expired = order?.status === "held" && Date.parse(order.expiresAt) <= now;
  useEffect(() => {
    if (expired) void onInventoryChange();
  }, [expired, onInventoryChange]);

  async function submit(action: "reserve" | "pay" | "decline") {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true); setError("");
    try {
      const payload = action === "reserve"
        ? { action, eventId: event.id, name: name.trim(), seats: Number(seats) }
        : { action, orderId: order?.id };
      const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) {
        if (result.waitlist) onSoldOut();
        if (result.status === "expired") setOrder((current) => current ? { ...current, status: "expired" } : current);
        throw new Error(result.error || "Checkout failed. Please try again.");
      }
      setOrder(result); setNow(Date.now());
      await onInventoryChange();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Connection failed. Please try again.");
    } finally { setBusy(false); inFlight.current = false; }
  }

  return <section className="checkout" aria-label={`Checkout for ${event.title}`}>
    <h3>Buy tickets for {event.title}</h3>
    <p>Simulation only. No real payment or email.</p>
    {!order && <form className="waitlist-form" onSubmit={(e) => { e.preventDefault(); void submit("reserve"); }}>
      <label htmlFor={`buyer-${event.id}`}>Buyer name</label>
      <input id={`buyer-${event.id}`} autoComplete="name" required maxLength={100} value={name} disabled={busy} onChange={(e) => setName(e.target.value)} />
      <label htmlFor={`quantity-${event.id}`}>Number of tickets</label>
      <input id={`quantity-${event.id}`} type="number" min="1" max="4" step="1" required value={seats} disabled={busy} onChange={(e) => setSeats(e.target.value)} />
      <button className="button" disabled={busy} type="submit">{busy ? "Reserving..." : "Reserve tickets"}</button>
    </form>}
    {order && <>
      <p>Total: ${(order.totalCents / 100).toFixed(2)}</p>
      {order.status === "held" && !expired && <>
        <p role="timer">Seats held for {Math.max(0, Math.ceil((Date.parse(order.expiresAt) - now) / 1000))} seconds.</p>
        <div className="checkout-actions">
          <button className="button" disabled={busy} onClick={() => void submit("pay")}>Simulated payment</button>
          <button className="button button-secondary" disabled={busy} onClick={() => void submit("decline")}>Simulate decline</button>
        </div>
      </>}
      {(expired || order.status === "expired") && <p>Your reservation expired. The seats have been released.</p>}
      {order.status === "declined" && <p>Simulated payment declined. Your seats have been released.</p>}
      {order.status === "paid" && <section aria-label="Receipt">
        <h3>Simulated receipt</h3>
        <p>{order.name}: {order.seats} {order.seats === 1 ? "ticket" : "tickets"} for {event.title}. No money was charged. No email was sent.</p>
        {order.tickets.map((ticket, index) => <figure key={ticket.token}>
          {/* Local data URL generated on the server; no external image service. */}
          <img src={ticket.qrDataUrl} width={192} height={192} alt={`QR code for ticket ${index + 1}`} />
          <figcaption>Ticket {index + 1}: <code>{ticket.token}</code></figcaption>
        </figure>)}
      </section>}
      {order.status !== "held" || expired ? <div className="checkout-actions">
        <button className="button button-secondary" onClick={() => { setOrder(null); setError(""); }}>Start another order</button>
        <button className="button button-secondary" onClick={onClose}>Back to events</button>
      </div> : null}
    </>}
    <p role="status" aria-live="polite">{error}</p>
  </section>;
}
