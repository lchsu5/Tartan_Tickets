import { NextResponse } from "next/server";
import { joinWaitlist } from "@/lib/events";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Please send a valid request." }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("eventId" in body) ||
    !("name" in body) ||
    typeof body.eventId !== "string" ||
    typeof body.name !== "string" ||
    !body.eventId.trim() ||
    !body.name.trim() ||
    body.name.trim().length > 100
  ) {
    return NextResponse.json(
      { error: "Enter your name to join the waitlist." },
      { status: 400 },
    );
  }

  try {
    const result = joinWaitlist(body.eventId, body.name.trim());
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "We couldn't add you to the waitlist.";
    return NextResponse.json({ error: message }, { status: 409 });
  }
}
