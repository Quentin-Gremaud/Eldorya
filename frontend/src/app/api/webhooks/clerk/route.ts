import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { type NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3001";

export async function POST(req: NextRequest) {
  try {
    const evt = await verifyWebhook(req);

    if (evt.type !== "user.created") {
      return NextResponse.json({ received: true });
    }

    const { id, email_addresses, first_name, last_name, unsafe_metadata, created_at } =
      evt.data;

    const ageDeclaration = unsafe_metadata?.ageDeclaration;
    if (!ageDeclaration) {
      console.warn(
        `[Clerk Webhook] user.created event for ${id} missing ageDeclaration — skipping backend registration`
      );
      return NextResponse.json({ received: true, skipped: true });
    }

    const primaryEmail = email_addresses?.find(
      (e) => e.id === evt.data.primary_email_address_id
    );

    const response = await fetch(`${BACKEND_URL}/api/users/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clerkUserId: id,
        email: primaryEmail?.email_address || "",
        firstName: first_name || "",
        lastName: last_name || "",
        ageDeclaration: true,
        ageDeclarationTimestamp:
          (unsafe_metadata?.ageDeclarationTimestamp as string) ||
          new Date().toISOString(),
        createdAt: new Date(created_at).toISOString(),
      }),
    });

    if (!response.ok) {
      console.error(
        `[Clerk Webhook] Backend registration failed for user ${id}: ${response.status} ${response.statusText}`
      );
      return NextResponse.json(
        { error: "Backend registration failed" },
        { status: 502 }
      );
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Clerk Webhook] Error:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 400 }
    );
  }
}
