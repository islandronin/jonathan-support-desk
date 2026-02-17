import { internalMutation } from "./_generated/server";

export const seedAdminAndCounter = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Promote jonathan@servenomaster.com to admin if exists
    const admin = await ctx.db
      .query("users")
      .withIndex("by_email", (q) =>
        q.eq("email", "jonathan@servenomaster.com")
      )
      .unique();

    if (admin && admin.role !== "admin") {
      await ctx.db.patch(admin._id, { role: "admin" });
    }

    // Initialize ticket counter if not exists
    const counter = await ctx.db
      .query("counters")
      .withIndex("by_name", (q) => q.eq("name", "ticketNumber"))
      .unique();

    if (!counter) {
      await ctx.db.insert("counters", { name: "ticketNumber", value: 1000 });
    }

    return { adminFound: !!admin, counterInitialized: !counter };
  },
});
