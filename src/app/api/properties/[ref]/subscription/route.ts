import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import {
  deleteSubscription,
  getSubscription,
  upsertSubscription,
} from "@/lib/notifications";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ authenticated: false, subscribed: false });
  }

  const { ref } = await params;
  const subscription = await getSubscription(session.user.sub, decodeURIComponent(ref));
  return NextResponse.json({
    authenticated: true,
    subscribed: Boolean(subscription),
    subscription,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  }

  const { ref } = await params;
  const body = (await request.json().catch(() => ({}))) as {
    propertyLabel?: string;
    propertyAddress?: string;
  };

  const subscription = await upsertSubscription({
    user: session.user,
    propertyRef: decodeURIComponent(ref),
    propertyLabel: body.propertyLabel?.trim() || decodeURIComponent(ref),
    propertyAddress: body.propertyAddress?.trim() || "Adresă necunoscută",
  });

  return NextResponse.json({ subscribed: true, subscription });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  }

  const { ref } = await params;
  await deleteSubscription(session.user.sub, decodeURIComponent(ref));
  return NextResponse.json({ subscribed: false });
}
