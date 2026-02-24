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
