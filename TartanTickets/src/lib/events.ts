export type EventRecord = {
  id: string;
  title: string;
  startsAt: string;
  location: string;
  priceCents: number;
  capacity: number;
  ticketsSold: number;
};

function dateInDays(daysFromNow: number): string {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromNow);
  date.setUTCHours(23, 0, 0, 0);
  return date.toISOString();
}

export const events: EventRecord[] = [
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

export function getUpcomingEvents(now = new Date()): EventRecord[] {
  return events
    .filter((event) => new Date(event.startsAt).getTime() > now.getTime())
    .sort(
      (left, right) =>
        new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
    );
}

const waitlists = new Map<string, string[]>();

export function joinWaitlist(
  eventId: string,
  name: string,
  now = new Date(),
): { position: number } {
  const event = events.find((candidate) => candidate.id === eventId);

  if (!event || new Date(event.startsAt).getTime() <= now.getTime()) {
    throw new Error("We couldn't find that upcoming event.");
  }

  if (event.capacity > event.ticketsSold) {
    throw new Error("This event still has seats available.");
  }

  const names = waitlists.get(eventId) ?? [];
  names.push(name);
  waitlists.set(eventId, names);

  return { position: names.length };
}
