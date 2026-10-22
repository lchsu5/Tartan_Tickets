import { NextResponse } from "next/server";
import { getUpcomingEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getUpcomingEvents());
}
