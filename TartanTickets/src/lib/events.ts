export type EventRecord = {
  id: string;
  title: string;
  startsAt: string;
  location: string;
  priceCents: number;
  capacity: number;
  ticketsSold: number;
};

export type DemoOrder = {
  id: string;
  eventId: string;
  name: string;
  seats: number;
  totalCents: number;
  expiresAt: string;
  status: "held" | "paid" | "declined" | "expired";
  simulated: true;
  tickets: { token: string; qrDataUrl?: string }[];
};

function dateInDays(daysFromNow: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  date.setUTCHours(23, 0, 0, 0);
  return date.toISOString();
}

const seedEvents: EventRecord[] = [
  {
    id: "autumn-gala",
    title: "Autumn Gala",
    startsAt: dateInDays(7),
    location: "Cohon University Center",
    priceCents: 1500,
    capacity: 100,
    ticketsSold: 42,
  },
  {
    id: "winter-formal",
    title: "Winter Formal",
    startsAt: dateInDays(21),
    location: "Rangos Ballroom",
    priceCents: 2500,
    capacity: 50,
    ticketsSold: 50,
  },
  {
    id: "club-concert",
    title: "Student Club Concert",
    startsAt: dateInDays(35),
    location: "McConomy Auditorium",
    priceCents: 1000,
    capacity: 120,
    ticketsSold: 73,
  },
];

// Share state between route bundles in one Node process, never between instances.
const globalStore = globalThis as typeof globalThis & {
  tartanDemo?: { events: EventRecord[]; orders: Map<string, DemoOrder>; waitlists: Map<string, string[]> };
};
const freshStore = () => ({ events: seedEvents, orders: new Map<string, DemoOrder>(), waitlists: new Map<string, string[]>() });
const store = process.env.NODE_ENV === "test" ? freshStore() : (globalStore.tartanDemo ??= freshStore());
export const events = store.events;
export const orders = store.orders;

export function releaseExpiredHolds(now = new Date()) {
  for (const order of orders.values()) {
    if (order.status === "held" && Date.parse(order.expiresAt) <= now.getTime()) {
      order.status = "expired";
    }
  }
}

export function seatsRemaining(event: EventRecord, now = new Date()) {
  releaseExpiredHolds(now);
  const held = [...orders.values()].filter((o) => o.eventId === event.id && o.status === "held")
    .reduce((sum, o) => sum + o.seats, 0);
  return Math.max(0, event.capacity - event.ticketsSold - held);
}

export function getUpcomingEvents(now = new Date()): EventRecord[] {
  return events
    .filter((event) => new Date(event.startsAt).getTime() > now.getTime())
    .sort(
      (left, right) =>
        new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
    )
    // Listing count includes active reservations as unavailable seats.
    .map((event) => ({ ...event, ticketsSold: event.capacity - seatsRemaining(event, now) }));
}

const waitlists = store.waitlists;

export function joinWaitlist(
  eventId: string,
  name: string,
  now = new Date(),
): { position: number } {
  const event = events.find((candidate) => candidate.id === eventId);

  if (!event || new Date(event.startsAt).getTime() <= now.getTime()) {
    throw new Error("We couldn't find that upcoming event.");
  }

  if (seatsRemaining(event, now) > 0) {
    throw new Error("This event still has seats available.");
  }

  const names = waitlists.get(eventId) ?? [];
  names.push(name);
  waitlists.set(eventId, names);

  return { position: names.length };
}
