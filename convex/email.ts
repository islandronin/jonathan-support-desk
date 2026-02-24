import { internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

// ---- Helper ----

async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn("SENDGRID_API_KEY not set, skipping email");
    return;
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL ?? "noreply@example.com";
  const fromName = process.env.SENDGRID_FROM_NAME ?? "Support";

  const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: fromName },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`SendGrid error ${response.status}: ${errorText}`);
  }
}

// ---- Internal Queries ----

export const getAgentEmails = internalQuery({
  args: { productId: v.id("products") },
  handler: async (ctx, args) => {
    const assignments = await ctx.db
      .query("agentProducts")
      .withIndex("by_product", (q) => q.eq("productId", args.productId))
      .collect();

    const emails: string[] = [];
    for (const assignment of assignments) {
      const agent = await ctx.db.get(assignment.agentId);
      if (agent?.email) emails.push(agent.email);
    }

    // Also notify all admins
    const admins = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .collect();
    for (const admin of admins) {
      if (admin.email && !emails.includes(admin.email)) {
        emails.push(admin.email);
      }
    }

    return emails;
  },
});

// ---- Internal Actions ----

export const sendTicketConfirmation = internalAction({
  args: {
    customerEmail: v.string(),
    customerName: v.string(),
    ticketNumber: v.number(),
    subject: v.string(),
    ticketId: v.string(),
  },
  handler: async (_ctx, args) => {
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const ticketUrl = `${appUrl}/tickets/${args.ticketId}`;

    await sendEmail({
      to: args.customerEmail,
      subject: `[Ticket #${args.ticketNumber}] ${args.subject}`,
      html: `
        <h2>Your ticket has been received</h2>
        <p>Hi ${args.customerName || "there"},</p>
        <p>We've received your support request and created <strong>Ticket #${args.ticketNumber}</strong>.</p>
        <p><strong>Subject:</strong> ${args.subject}</p>
        <p>Our team will review it and get back to you soon.</p>
        <p><a href="${ticketUrl}">View your ticket</a></p>
      `,
    });
  },
});

export const sendNewTicketAlert = internalAction({
  args: {
    ticketNumber: v.number(),
    subject: v.string(),
    customerName: v.string(),
    productName: v.string(),
    ticketId: v.string(),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    const agentEmails: string[] = await ctx.runQuery(
      internal.email.getAgentEmails,
      { productId: args.productId }
    );

    if (agentEmails.length === 0) return;

    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const ticketUrl = `${appUrl}/agent/tickets/${args.ticketId}`;

    for (const email of agentEmails) {
      await sendEmail({
        to: email,
        subject: `[New Ticket #${args.ticketNumber}] ${args.subject}`,
        html: `
          <h2>New support ticket</h2>
          <p>A new ticket has been submitted:</p>
          <p><strong>Ticket:</strong> #${args.ticketNumber}</p>
          <p><strong>Subject:</strong> ${args.subject}</p>
          <p><strong>Customer:</strong> ${args.customerName}</p>
          <p><strong>Product:</strong> ${args.productName}</p>
          <p><a href="${ticketUrl}">View and assign ticket</a></p>
        `,
      });
    }
  },
});

export const sendReplyNotification = internalAction({
  args: {
    recipientEmail: v.string(),
    recipientName: v.string(),
    senderName: v.string(),
    ticketNumber: v.number(),
    ticketSubject: v.string(),
    messagePreview: v.string(),
    ticketId: v.string(),
    isAgentView: v.boolean(),
  },
  handler: async (_ctx, args) => {
    const appUrl = process.env.APP_URL ?? "http://localhost:3000";
    const ticketUrl = args.isAgentView
      ? `${appUrl}/agent/tickets/${args.ticketId}`
      : `${appUrl}/tickets/${args.ticketId}`;

    const preview =
      args.messagePreview.length > 200
        ? args.messagePreview.slice(0, 200) + "..."
        : args.messagePreview;

    await sendEmail({
      to: args.recipientEmail,
      subject: `Re: [Ticket #${args.ticketNumber}] ${args.ticketSubject}`,
      html: `
        <h2>New reply on Ticket #${args.ticketNumber}</h2>
        <p>Hi ${args.recipientName || "there"},</p>
        <p><strong>${args.senderName}</strong> replied:</p>
        <blockquote style="border-left: 3px solid #ccc; padding-left: 12px; color: #555;">
          ${preview}
        </blockquote>
        <p><a href="${ticketUrl}">View full conversation</a></p>
      `,
    });
  },
});
