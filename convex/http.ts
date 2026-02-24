import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

auth.addHttpRoutes(http);

// ---- Inbound Email Webhook (SendGrid Inbound Parse) ----

http.route({
  path: "/api/email/inbound",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    console.log("[inbound-email] Received webhook POST");

    try {
      // Loop prevention: check custom header
      const loopHeader = request.headers.get("X-JonathanSupport-Origin");
      if (loopHeader === "system") {
        console.log("[inbound-email] Dropped: loop prevention header detected");
        return new Response("OK", { status: 200 });
      }

      // Parse multipart form data
      const contentType = request.headers.get("content-type") ?? "";
      let senderEmail = "";
      let subject = "";
      let body = "";
      let toAddress = "";
      let emailMessageId = "";

      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();

        // SendGrid Inbound Parse fields
        const from = formData.get("from") as string | null;
        subject = (formData.get("subject") as string | null) ?? "";
        body = (formData.get("text") as string | null) ?? "";
        toAddress = (formData.get("to") as string | null) ?? "";
        const headers = (formData.get("headers") as string | null) ?? "";

        // Extract email from "Name <email>" format
        if (from) {
          const emailMatch = from.match(/<([^>]+)>/);
          senderEmail = emailMatch ? emailMatch[1] : from;
        }

        // Extract Message-ID from headers
        const msgIdMatch = headers.match(/Message-ID:\s*<?([^>\s]+)>?/i);
        if (msgIdMatch) {
          emailMessageId = msgIdMatch[1];
        }

        // Check for loop prevention in email headers
        if (headers.includes("X-JonathanSupport-Origin: system")) {
          console.log("[inbound-email] Dropped: loop prevention header in email headers");
          return new Response("OK", { status: 200 });
        }
      } else if (contentType.includes("application/json")) {
        // Some configurations send JSON
        const json = await request.json();
        senderEmail = json.from ?? json.sender ?? "";
        subject = json.subject ?? "";
        body = json.text ?? json.body ?? "";
        toAddress = json.to ?? "";
        emailMessageId = json.messageId ?? "";

        const emailMatch = senderEmail.match(/<([^>]+)>/);
        if (emailMatch) senderEmail = emailMatch[1];
      } else {
        console.error(`[inbound-email] Unexpected content-type: ${contentType}`);
        return new Response("Bad Request", { status: 400 });
      }

      senderEmail = senderEmail.toLowerCase().trim();

      if (!senderEmail) {
        console.error("[inbound-email] No sender email found");
        return new Response("Bad Request", { status: 400 });
      }

      // Loop prevention: drop if sender matches system email
      const systemEmail = (process.env.SENDGRID_FROM_EMAIL ?? "").toLowerCase();
      if (systemEmail && senderEmail === systemEmail) {
        console.log(`[inbound-email] Dropped: sender matches system email (${senderEmail})`);
        return new Response("OK", { status: 200 });
      }

      // Strip quoted reply text (best effort — keep only text above first quote marker)
      const strippedBody = stripQuotedReply(body);

      console.log(`[inbound-email] Parsed: from=${senderEmail} to=${toAddress} subject="${subject}" body_len=${strippedBody.length}`);

      // Hand off to internal mutation for DB processing
      await ctx.runMutation(internal.tickets.processInboundEmail, {
        senderEmail,
        subject,
        body: strippedBody,
        toAddress,
        emailMessageId: emailMessageId || undefined,
      });

      return new Response("OK", { status: 200 });
    } catch (error) {
      console.error("[inbound-email] Error processing webhook:", error);
      // Return 200 to prevent SendGrid from retrying (would create duplicates)
      return new Response("OK", { status: 200 });
    }
  }),
});

// Strip quoted reply content from email body
function stripQuotedReply(text: string): string {
  // Common patterns for quoted reply markers
  const markers = [
    /^On .+ wrote:$/m,                    // "On Mon, Jan 1, 2026, X wrote:"
    /^-{2,}\s*Original Message\s*-{2,}/mi, // "--- Original Message ---"
    /^>{1,}\s/m,                           // Lines starting with >
    /^From:\s/m,                           // "From: ..."
    /^Sent:\s/m,                           // "Sent: ..."
  ];

  let result = text;
  for (const marker of markers) {
    const match = result.search(marker);
    if (match > 0) {
      result = result.substring(0, match);
      break;
    }
  }

  return result.trim() || text.trim();
}

export default http;
