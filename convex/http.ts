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

        // Debug: log all form data field names and value lengths
        const fieldNames: string[] = [];
        formData.forEach((_value, key) => {
          const val = _value as string;
          fieldNames.push(`${key}(${typeof val === "string" ? val.length : "non-string"})`);
        });
        console.log(`[inbound-email] Form fields: ${fieldNames.join(", ")}`);

        // SendGrid Inbound Parse fields
        const from = formData.get("from") as string | null;
        subject = (formData.get("subject") as string | null) ?? "";
        const textField = formData.get("text") as string | null;
        const htmlField = formData.get("html") as string | null;
        const emailField = formData.get("email") as string | null;
        toAddress = (formData.get("to") as string | null) ?? "";

        console.log(`[inbound-email] Raw fields: text=${textField ? textField.length : "null"} html=${htmlField ? htmlField.length : "null"} email=${emailField ? emailField.length : "null"}`);

        // Try plain text first
        body = textField ?? "";

        // Fall back to html field if text is empty
        if (!body.trim() && htmlField) {
          body = stripHtml(htmlField);
          console.log(`[inbound-email] Used html field, extracted ${body.length} chars`);
        }

        // Fall back to raw email MIME parsing if both text and html are empty
        if (!body.trim() && emailField) {
          body = extractBodyFromRawEmail(emailField);
          console.log(`[inbound-email] Used raw email field, extracted ${body.length} chars`);
        }

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

// Strip HTML tags to extract plain text
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// Decode quoted-printable encoding (=XX hex codes and =\r\n soft line breaks)
function decodeQuotedPrintable(text: string): string {
  return text
    .replace(/=\r?\n/g, "")  // Remove soft line breaks
    .replace(/=([0-9A-Fa-f]{2})/g, (_match, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    );
}

// Extract body from raw MIME email (SendGrid Raw mode sends full email as "email" field)
function extractBodyFromRawEmail(raw: string): string {
  // Detect if this is a multipart email
  const boundaryMatch = raw.match(/boundary="?([^\s"]+)"?/i);

  if (boundaryMatch) {
    const boundary = boundaryMatch[1];
    const parts = raw.split(new RegExp(`--${boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));

    let plainText = "";
    let htmlText = "";

    for (const part of parts) {
      const isQP = /Content-Transfer-Encoding:\s*quoted-printable/i.test(part);
      // Find content after the part headers (double newline)
      const bodyStart = part.search(/\r?\n\r?\n/);
      if (bodyStart < 0) continue;
      let content = part.substring(bodyStart).trim();
      if (isQP) content = decodeQuotedPrintable(content);

      if (/Content-Type:\s*text\/plain/i.test(part)) {
        plainText = content;
      } else if (/Content-Type:\s*text\/html/i.test(part)) {
        htmlText = content;
      }
    }

    if (plainText) return plainText;
    if (htmlText) return stripHtml(htmlText);
  }

  // Non-multipart: just get the body after headers
  const isQP = /Content-Transfer-Encoding:\s*quoted-printable/i.test(raw);
  const headerEnd = raw.search(/\r?\n\r?\n/);
  if (headerEnd > 0) {
    let bodyPart = raw.substring(headerEnd + 2).trim();
    if (isQP) bodyPart = decodeQuotedPrintable(bodyPart);

    if (bodyPart.includes("<html") || bodyPart.includes("<body") || bodyPart.includes("<div")) {
      return stripHtml(bodyPart);
    }
    return bodyPart;
  }

  return "";
}

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
