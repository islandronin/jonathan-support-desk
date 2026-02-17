import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";

// Helper to verify admin
async function requireAdmin(ctx: { db: any; auth: any }) {
  const userId = await getAuthUserId(ctx as any);
  if (!userId) throw new Error("Not authenticated");
  const user = await ctx.db.get(userId);
  if (user?.role !== "admin") throw new Error("Not authorized");
  return user;
}

// ---- Dashboard Stats ----

export const getDashboardStats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const allTickets = await ctx.db.query("tickets").collect();
    const customers = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "customer"))
      .collect();
    const agents = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "agent"))
      .collect();

    const open = allTickets.filter((t) => t.status === "open").length;
    const inProgress = allTickets.filter(
      (t) => t.status === "in_progress"
    ).length;
    const awaitingCustomer = allTickets.filter(
      (t) => t.status === "awaiting_customer"
    ).length;
    const resolved = allTickets.filter((t) => t.status === "resolved").length;
    const closed = allTickets.filter((t) => t.status === "closed").length;

    return {
      totalTickets: allTickets.length,
      open,
      inProgress,
      awaitingCustomer,
      resolved,
      closed,
      totalCustomers: customers.length,
      totalAgents: agents.length,
    };
  },
});

export const listRecentTickets = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const tickets = await ctx.db.query("tickets").collect();
    const sorted = tickets.sort((a, b) => b.updatedAt - a.updatedAt);
    const limited = sorted.slice(0, args.limit ?? 10);

    return await Promise.all(
      limited.map(async (ticket) => {
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
  },
});

// ---- Products ----

export const listAllProducts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const products = await ctx.db.query("products").collect();
    return products.sort((a, b) => a.sortOrder - b.sortOrder);
  },
});

export const createProduct = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Check for duplicate slug
    const existing = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    if (existing) throw new Error("Product with this slug already exists");

    return await ctx.db.insert("products", {
      name: args.name,
      slug: args.slug,
      active: true,
      sortOrder: args.sortOrder ?? 0,
    });
  },
});

export const updateProduct = mutation({
  args: {
    productId: v.id("products"),
    name: v.optional(v.string()),
    slug: v.optional(v.string()),
    active: v.optional(v.boolean()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { productId, ...updates } = args;
    const filtered = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    await ctx.db.patch(productId, filtered);
  },
});

// ---- Agent Management ----

export const listAgentsWithProducts = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const agents = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "agent"))
      .collect();

    return await Promise.all(
      agents.map(async (agent) => {
        const assignments = await ctx.db
          .query("agentProducts")
          .withIndex("by_agent", (q) => q.eq("agentId", agent._id))
          .collect();
        const products = await Promise.all(
          assignments.map(async (a) => {
            const product = await ctx.db.get(a.productId);
            return product
              ? { _id: product._id, name: product.name }
              : null;
          })
        );
        return {
          ...agent,
          products: products.filter(Boolean),
        };
      })
    );
  },
});

export const assignProductToAgent = mutation({
  args: {
    agentId: v.id("users"),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    // Check not already assigned
    const existing = await ctx.db
      .query("agentProducts")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    if (existing.some((ap) => ap.productId.toString() === args.productId.toString())) {
      return; // Already assigned
    }

    await ctx.db.insert("agentProducts", {
      agentId: args.agentId,
      productId: args.productId,
    });
  },
});

export const removeProductFromAgent = mutation({
  args: {
    agentId: v.id("users"),
    productId: v.id("products"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const assignments = await ctx.db
      .query("agentProducts")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    const toRemove = assignments.find(
      (ap) => ap.productId.toString() === args.productId.toString()
    );
    if (toRemove) {
      await ctx.db.delete(toRemove._id);
    }
  },
});
