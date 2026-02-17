import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";
import { MutationCtx } from "./_generated/server";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
  callbacks: {
    async createOrUpdateUser(ctx: MutationCtx, args) {
      if (args.existingUserId) {
        return args.existingUserId;
      }

      // Check if user already exists by email (account linking)
      if (args.profile.email) {
        const existing = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", args.profile.email!))
          .first();
        if (existing) return existing._id;
      }

      // Create new user - default role is "customer"
      return ctx.db.insert("users", {
        email: args.profile.email,
        name: (args.profile.name as string | undefined) ?? "",
        role: "customer",
        emailConfirmed: false,
      });
    },
  },
});
