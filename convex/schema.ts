import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,

  users: defineTable({
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    image: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(
      v.union(v.literal("customer"), v.literal("agent"), v.literal("admin"))
    ),
    emailConfirmed: v.optional(v.boolean()),
  }).index("by_email", ["email"]).index("by_role", ["role"]),

  products: defineTable({
    name: v.string(),
    slug: v.string(),
    active: v.boolean(),
    sortOrder: v.number(),
  }).index("by_slug", ["slug"]).index("by_active", ["active"]),

  agentProducts: defineTable({
    agentId: v.id("users"),
    productId: v.id("products"),
  }).index("by_agent", ["agentId"]).index("by_product", ["productId"]),

  tickets: defineTable({
    ticketNumber: v.number(),
    subject: v.string(),
    customerId: v.id("users"),
    productId: v.id("products"),
    status: v.union(
      v.literal("open"),
      v.literal("in_progress"),
      v.literal("awaiting_customer"),
      v.literal("resolved"),
      v.literal("closed")
    ),
    assignedAgentId: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_customer", ["customerId"])
    .index("by_status", ["status"])
    .index("by_assignedAgent", ["assignedAgentId"])
    .index("by_product", ["productId"])
    .index("by_ticketNumber", ["ticketNumber"]),

  messages: defineTable({
    ticketId: v.id("tickets"),
    authorId: v.id("users"),
    body: v.string(),
    isInternal: v.boolean(),
    source: v.union(v.literal("web"), v.literal("email"), v.literal("api")),
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
    emailMessageId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_ticket", ["ticketId"])
    .index("by_author", ["authorId"]),

  counters: defineTable({
    name: v.string(),
    value: v.number(),
  }).index("by_name", ["name"]),
});
