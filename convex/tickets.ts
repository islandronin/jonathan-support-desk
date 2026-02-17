import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// ---- Queries ----

export const listProducts = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect()
      .then((products) => products.sort((a, b) => a.sortOrder - b.sortOrder));
  },
});

export const listCustomerTickets = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const tickets = await ctx.db
      .query("tickets")
      .withIndex("by_customer", (q) => q.eq("customerId", userId))
      .collect();

    // Join product names
    const result = await Promise.all(
      tickets.map(async (ticket) => {
        const product = await ctx.db.get(ticket.productId);
        return { ...ticket, productName: product?.name ?? "Unknown" };
      })
    );

    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

export const getTicket = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const user = await ctx.db.get(userId);
    // Customers can only see their own tickets
    if (
      user?.role === "customer" &&
      ticket.customerId.toString() !== userId.toString()
    ) {
      throw new Error("Not authorized");
    }

    // Agents can only see tickets for their assigned products
    if (user?.role === "agent") {
      const agentProducts = await ctx.db
        .query("agentProducts")
        .withIndex("by_agent", (q) => q.eq("agentId", userId))
        .collect();
      const productIds = agentProducts.map((ap) => ap.productId.toString());
      if (!productIds.includes(ticket.productId.toString())) {
        throw new Error("Not authorized");
      }
    }

    const product = await ctx.db.get(ticket.productId);
    const customer = await ctx.db.get(ticket.customerId);
    const assignedAgent = ticket.assignedAgentId
      ? await ctx.db.get(ticket.assignedAgentId)
      : null;

    return {
      ...ticket,
      productName: product?.name ?? "Unknown",
      customerName: customer?.name ?? customer?.email ?? "Unknown",
      customerEmail: customer?.email ?? "",
      assignedAgentName: assignedAgent?.name ?? assignedAgent?.email ?? null,
    };
  },
});

export const getTicketMessages = query({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    const isStaff = user?.role === "agent" || user?.role === "admin";

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_ticket", (q) => q.eq("ticketId", args.ticketId))
      .collect();

    // Filter out internal notes for customers
    const filtered = isStaff
      ? messages
      : messages.filter((m) => !m.isInternal);

    // Join author info and resolve storage URLs
    return await Promise.all(
      filtered.map(async (msg) => {
        const author = await ctx.db.get(msg.authorId);
        const attachmentsWithUrls = msg.attachments
          ? await Promise.all(
              msg.attachments.map(async (att) => ({
                ...att,
                url: await ctx.storage.getUrl(att.storageId),
              }))
            )
          : [];
        return {
          ...msg,
          authorName: author?.name ?? author?.email ?? "Unknown",
          authorRole: author?.role ?? "customer",
          attachmentsWithUrls,
        };
      })
    );
  },
});

export const listAgentTickets = query({
  args: {
    statusFilter: v.optional(
      v.union(
        v.literal("open"),
        v.literal("in_progress"),
        v.literal("awaiting_customer"),
        v.literal("resolved"),
        v.literal("closed")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.role !== "agent" && user?.role !== "admin") {
      throw new Error("Not authorized");
    }

    let tickets;
    if (user?.role === "admin") {
      // Admin sees all tickets
      tickets = args.statusFilter
        ? await ctx.db
            .query("tickets")
            .withIndex("by_status", (q) =>
              q.eq("status", args.statusFilter!)
            )
            .collect()
        : await ctx.db.query("tickets").collect();
    } else {
      // Agent sees only tickets for assigned products
      const agentProducts = await ctx.db
        .query("agentProducts")
        .withIndex("by_agent", (q) => q.eq("agentId", userId))
        .collect();
      const productIds = new Set(
        agentProducts.map((ap) => ap.productId.toString())
      );

      const allTickets = args.statusFilter
        ? await ctx.db
            .query("tickets")
            .withIndex("by_status", (q) =>
              q.eq("status", args.statusFilter!)
            )
            .collect()
        : await ctx.db.query("tickets").collect();

      tickets = allTickets.filter((t) =>
        productIds.has(t.productId.toString())
      );
    }

    // Join product + customer names
    const result = await Promise.all(
      tickets.map(async (ticket) => {
        const product = await ctx.db.get(ticket.productId);
        const customer = await ctx.db.get(ticket.customerId);
        const agent = ticket.assignedAgentId
          ? await ctx.db.get(ticket.assignedAgentId)
          : null;
        return {
          ...ticket,
          productName: product?.name ?? "Unknown",
          customerName: customer?.name ?? customer?.email ?? "Unknown",
          assignedAgentName: agent?.name ?? agent?.email ?? null,
        };
      })
    );

    return result.sort((a, b) => b.updatedAt - a.updatedAt);
  },
});

// ---- Mutations ----

export const createTicket = mutation({
  args: {
    subject: v.string(),
    productId: v.id("products"),
    body: v.string(),
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          fileName: v.string(),
          contentType: v.string(),
          size: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    // Get next ticket number atomically
    const counter = await ctx.db
      .query("counters")
      .withIndex("by_name", (q) => q.eq("name", "ticketNumber"))
      .unique();

    let ticketNumber: number;
    if (!counter) {
      await ctx.db.insert("counters", { name: "ticketNumber", value: 1001 });
      ticketNumber = 1000;
    } else {
      ticketNumber = counter.value;
      await ctx.db.patch(counter._id, { value: counter.value + 1 });
    }

    const now = Date.now();

    const ticketId = await ctx.db.insert("tickets", {
      ticketNumber,
      subject: args.subject,
      customerId: userId,
      productId: args.productId,
      status: "open",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("messages", {
      ticketId,
      authorId: userId,
      body: args.body,
      isInternal: false,
      source: "web",
      attachments: args.attachments,
      createdAt: now,
    });

    return ticketId;
  },
});

export const addMessage = mutation({
  args: {
    ticketId: v.id("tickets"),
    body: v.string(),
    isInternal: v.optional(v.boolean()),
    attachments: v.optional(
      v.array(
        v.object({
          storageId: v.id("_storage"),
          fileName: v.string(),
          contentType: v.string(),
          size: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const ticket = await ctx.db.get(args.ticketId);
    if (!ticket) throw new Error("Ticket not found");

    const user = await ctx.db.get(userId);
    const isStaff = user?.role === "agent" || user?.role === "admin";

    // Customers can only reply to their own tickets
    if (!isStaff && ticket.customerId.toString() !== userId.toString()) {
      throw new Error("Not authorized");
    }

    // Only staff can create internal notes
    const isInternal = isStaff ? (args.isInternal ?? false) : false;

    const now = Date.now();

    await ctx.db.insert("messages", {
      ticketId: args.ticketId,
      authorId: userId,
      body: args.body,
      isInternal,
      source: "web",
      attachments: args.attachments,
      createdAt: now,
    });

    // Update ticket timestamp
    const updates: { updatedAt: number; status?: "open" } = { updatedAt: now };

    // If customer replies to "awaiting_customer", set back to open
    if (!isStaff && ticket.status === "awaiting_customer") {
      updates.status = "open";
    }

    await ctx.db.patch(args.ticketId, updates);
  },
});

export const updateTicketStatus = mutation({
  args: {
    ticketId: v.id("tickets"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("awaiting_customer"),
      v.literal("resolved"),
      v.literal("closed")
    ),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.role !== "agent" && user?.role !== "admin") {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.ticketId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const assignTicket = mutation({
  args: {
    ticketId: v.id("tickets"),
    agentId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.role !== "agent" && user?.role !== "admin") {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.ticketId, {
      assignedAgentId: args.agentId ?? userId,
      updatedAt: Date.now(),
    });
  },
});

export const unassignTicket = mutation({
  args: { ticketId: v.id("tickets") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (user?.role !== "agent" && user?.role !== "admin") {
      throw new Error("Not authorized");
    }

    await ctx.db.patch(args.ticketId, {
      assignedAgentId: undefined,
      updatedAt: Date.now(),
    });
  },
});
