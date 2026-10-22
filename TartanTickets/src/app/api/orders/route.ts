import { randomBytes } from "node:crypto";
import QRCode from "qrcode";
import { events, orders, releaseExpiredHolds, seatsRemaining, type DemoOrder } from "@/lib/events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const json = (data: unknown, status = 200) => Response.json(data, { status, headers: { "Cache-Control": "no-store" } });

const MAX_BODY_BYTES = 16384;
class RequestTooLarge extends Error {}

async function readBoundedJson(request: Request): Promise<unknown> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength && /^\d+$/.test(declaredLength) && Number(declaredLength) > MAX_BODY_BYTES) {
    await request.body?.cancel().catch(() => {});
    throw new RequestTooLarge();
  }
  if (!request.body) throw new SyntaxError("Missing JSON body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel().catch(() => {});
        throw new RequestTooLarge();
      }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks, bytes)));
}

async function receipt(order: DemoOrder) {
  return { ...order, tickets: await Promise.all(order.tickets.map(async (ticket) => ({
    token: ticket.token,
    qrDataUrl: await QRCode.toDataURL(ticket.token, { width: 192, margin: 2 }),
  }))) };
}

export async function POST(request: Request) {
  let payload: unknown;
  try { payload = await readBoundedJson(request); }
  catch (error) {
    if (error instanceof RequestTooLarge) return json({ error: "Checkout request exceeds the 16 KiB limit." }, 413);
    return json({ error: "Please send valid JSON." }, 400);
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return json({ error: "Invalid request." }, 400);
  const body = payload as Record<string, unknown>;
  releaseExpiredHolds();

  if (body.action === "reserve") {
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 100) {
      return json({ error: "Enter a buyer name from 1 to 100 characters." }, 400);
    }
    if (typeof body.seats !== "number" || !Number.isInteger(body.seats) || body.seats < 1 || body.seats > 4) {
      return json({ error: "Choose a whole number from 1 to 4 tickets." }, 400);
    }
    const event = events.find((e) => e.id === body.eventId && Date.parse(e.startsAt) > Date.now());
    if (!event) return json({ error: "Upcoming event not found." }, 404);
    const remaining = seatsRemaining(event);
    if (remaining < body.seats) return json({
      error: remaining === 0 ? "Sold out. You can join the waitlist." : `Only ${remaining} seats remain. Choose fewer tickets.`,
      waitlist: remaining === 0,
    }, 409);
    // Inventory check and reservation have no await between them.
    const order: DemoOrder = {
      id: randomBytes(24).toString("hex"), eventId: event.id, name: body.name.trim(), seats: body.seats,
      totalCents: event.priceCents * body.seats, expiresAt: new Date(Date.now() + 600000).toISOString(),
      status: "held", simulated: true, tickets: [],
    };
    orders.set(order.id, order);
    return json(order, 201);
  }
  if (body.action !== "pay" && body.action !== "decline" && body.action !== "status") {
    return json({ error: "Unknown checkout action." }, 400);
  }
  const order = typeof body.orderId === "string" ? orders.get(body.orderId) : undefined;
  if (!order) return json({ error: "Order not found. Demo data may have reset; start a new checkout." }, 404);
  if (body.action === "status") return json(await receipt(order));
  if (order.status === "paid" && body.action === "pay") return json(await receipt(order));
  if (order.status === "declined" && body.action === "decline") return json(order);
  if (order.status !== "held") return json({ error: `This order is ${order.status}. Start a new checkout if needed.`, status: order.status }, 409);
  if (body.action === "decline") {
    order.status = "declined";
    return json(order);
  }
  // Commit once before asynchronous QR rendering, so retries cannot issue twice.
  order.status = "paid";
  events.find((e) => e.id === order.eventId)!.ticketsSold += order.seats;
  order.tickets = Array.from({ length: order.seats }, () => ({ token: randomBytes(16).toString("hex") }));
  return json(await receipt(order));
}
