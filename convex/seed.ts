import { internalMutation } from "./_generated/server";

// Temporary: reset auth for a user so they can re-register
export const resetUserAuth = internalMutation({
  args: {},
  handler: async (ctx) => {
    const email = "jonathan@servenomaster.com";

    // Delete auth accounts
    const authAccounts = await ctx.db.query("authAccounts").collect();
    const matching = authAccounts.filter(
      (a: any) => a.providerAccountId?.toLowerCase() === email
    );
    for (const acc of matching) {
      // Delete any auth sessions linked to this account
      const sessions = await ctx.db.query("authSessions").collect();
      for (const s of sessions) {
        if ((s as any).userId === (acc as any).userId) {
          await ctx.db.delete(s._id);
        }
      }
      await ctx.db.delete(acc._id);
    }

    // Delete the user record so they can re-register fresh
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (user) {
      await ctx.db.delete(user._id);
    }

    return { authAccountsDeleted: matching.length, userDeleted: !!user };
  },
});

export const seedAdminAndCounter = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Promote jonathan@servenomaster.com to admin if exists
    // Try both lowercase and original case (Convex indexes are case-sensitive)
    let admin = await ctx.db
      .query("users")
      .withIndex("by_email", (q) =>
        q.eq("email", "jonathan@servenomaster.com")
      )
      .unique();

    if (!admin) {
      admin = await ctx.db
        .query("users")
        .withIndex("by_email", (q) =>
          q.eq("email", "Jonathan@ServeNoMaster.com")
        )
        .unique();
    }

    if (admin) {
      // Normalize email to lowercase and set admin role
      await ctx.db.patch(admin._id, {
        role: "admin",
        email: "jonathan@servenomaster.com",
        name: admin.name || "Jonathan",
      });
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

const PRODUCTS = [
  "Unchained Freedom",
  "Fraction AIO",
  "Advanced AI Monetization",
  "Cyber Staffing Agency",
  "Origami Sites",
  "InfoSuperAgent",
  "Kind Clients",
  "Automation Certification",
  "Future Proof Resume",
  "Consistent Characters",
  "Art Without Masters",
  "Book Description Bot",
  "Coloring Book Formatter",
  "Coloring Book AI",
  "101 Prompts",
  "Networking Empire",
];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const seedProducts = internalMutation({
  args: {},
  handler: async (ctx) => {
    let created = 0;
    let skipped = 0;

    for (let i = 0; i < PRODUCTS.length; i++) {
      const name = PRODUCTS[i];
      const slug = slugify(name);

      const existing = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", slug))
        .first();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("products", {
        name,
        slug,
        active: true,
        sortOrder: i + 1,
      });
      created++;
    }

    return { created, skipped, total: PRODUCTS.length };
  },
});
