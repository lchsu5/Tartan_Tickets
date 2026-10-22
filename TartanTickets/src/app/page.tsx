import EventList from "@/components/event-list";
import { getUpcomingEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const events = getUpcomingEvents();

  return (
    <main className="page-shell">
      <header className="site-header">
        <a aria-label="Tartan Tickets home" className="brand" href="/">
          <span aria-hidden="true" className="brand-mark">
            TT
          </span>
          Tartan Tickets
        </a>
        <span className="header-note">Student club events</span>
      </header>
      <section className="hero" aria-labelledby="page-title">
        <p className="eyebrow">Find your next campus moment</p>
        <h1 id="page-title">Upcoming events</h1>
        <p className="hero-copy">
          Discover what&apos;s happening around campus and save your spot.
        </p>
      </section>
      <EventList events={events} />
      <footer className="site-footer">
        <p>Made for the moments that bring us together.</p>
        <p>Ticket purchases are not enabled in this demo.</p>
      </footer>
    </main>
  );
}
