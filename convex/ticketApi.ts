import { internalQuery } from "./_generated/server";

// Internal query used by the HTTP action — no auth required
export const getOpenTicketsWithBody = internalQuery({
  args: {},
  handler: async (ctx) => {
    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_status", (q) => q.eq("status", "open"))
      .collect();

    return Promise.all(
      tickets.map(async (ticket) => {
        const customer = await ctx.db.get(ticket.customerId);
        const product = await ctx.db.get(ticket.productId);

        // Get the first message (the original ticket body)
        const firstMessage = await ctx.db
          .query("messages")
          .withIndex("by_ticket", (q) => q.eq("ticketId", ticket._id))
          .first();

        return {
          _id: ticket._id,
          ticketNumber: ticket.ticketNumber,
          subject: ticket.subject,
          status: ticket.status,
          customerEmail: customer?.email ?? "unknown",
          customerName: customer?.name ?? "",
          productName: product?.name ?? "Unknown",
          productSlug: product?.slug ?? "",
          body: firstMessage?.body ?? "",
          createdAt: ticket.createdAt,
        };
      })
    );
  },
});
