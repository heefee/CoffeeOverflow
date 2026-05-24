import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth/session";
import { getPropertyByRef } from "@/lib/properties";
import {
  createExpirationNotification,
  getSubscription,
  pickAuthorizationForDemo,
} from "@/lib/notifications";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ ref: string }> },
) {
  const session = await getAuthSession();
  if (!session) {
    return NextResponse.json({ error: "Autentificare necesară." }, { status: 401 });
  }

  const { ref } = await params;
  const propertyRef = decodeURIComponent(ref);
  const subscription = await getSubscription(session.user.sub, propertyRef);
  if (!subscription) {
    return NextResponse.json(
      { error: "Abonează-te la proprietate înainte de simulare." },
      { status: 400 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as { authorizationId?: string };
  const property = getPropertyByRef(propertyRef);
  const authorization =
    property.authorizations.existing.find((item) => item.id === body.authorizationId) ??
    pickAuthorizationForDemo(property);

  if (!authorization) {
    return NextResponse.json(
      { error: "Nu există autorizații pentru care să simulăm expirarea." },
      { status: 400 },
    );
  }

  const result = await createExpirationNotification({
    user: session.user,
    property,
    authorization,
  });

  return NextResponse.json({ ok: true, ...result });
}
