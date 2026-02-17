"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../../../../convex/_generated/api";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import type { Id } from "../../../../../convex/_generated/dataModel";

export default function AgentsPage() {
  const agentsWithProducts = useQuery(api.admin.listAgentsWithProducts);
  const allProducts = useQuery(api.admin.listAllProducts);
  const updateUserRole = useMutation(api.users.updateUserRole);
  const searchByEmail = useQuery(api.users.searchByEmail, {
    email: "",
  });
  const assignProduct = useMutation(api.admin.assignProductToAgent);
  const removeProduct = useMutation(api.admin.removeProductFromAgent);

  const [searchEmail, setSearchEmail] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);

  if (agentsWithProducts === undefined || allProducts === undefined)
    return <LoadingSpinner />;

  const activeProducts = allProducts.filter((p) => p.active);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setSearching(true);
    // We'll use the search query reactively instead
    setSearching(false);
  };

  const handlePromote = async (userId: Id<"users">) => {
    await updateUserRole({ userId, role: "agent" });
  };

  const handleDemote = async (userId: Id<"users">) => {
    await updateUserRole({ userId, role: "customer" });
  };

  const isProductAssigned = (
    agent: any,
    productId: Id<"products">
  ): boolean => {
    return agent.products.some(
      (p: any) => p?._id.toString() === productId.toString()
    );
  };

  const toggleProduct = async (
    agentId: Id<"users">,
    productId: Id<"products">,
    currentlyAssigned: boolean
  ) => {
    if (currentlyAssigned) {
      await removeProduct({ agentId, productId });
    } else {
      await assignProduct({ agentId, productId });
    }
  };

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-4">
        Agent Management
      </h1>

      {/* Add Agent Section */}
      <div className="mb-8 p-4 bg-white rounded-lg border border-gray-200">
        <h2 className="text-sm font-medium text-gray-900 mb-3">
          Promote User to Agent
        </h2>
        <SearchAndPromote onPromote={handlePromote} />
      </div>

      {/* Agent List */}
      {agentsWithProducts.length === 0 ? (
        <p className="text-sm text-gray-500">
          No agents yet. Search for a user above to promote them.
        </p>
      ) : (
        <div className="space-y-4">
          {agentsWithProducts.map((agent) => (
            <div
              key={agent._id}
              className="bg-white rounded-lg border border-gray-200 p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">
                    {agent.name || agent.email}
                  </h3>
                  <p className="text-xs text-gray-500">{agent.email}</p>
                </div>
                <button
                  onClick={() => handleDemote(agent._id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove Agent Role
                </button>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-2 uppercase">
                  Product Assignments
                </p>
                <div className="flex flex-wrap gap-2">
                  {activeProducts.map((product) => {
                    const assigned = isProductAssigned(agent, product._id);
                    return (
                      <button
                        key={product._id}
                        onClick={() =>
                          toggleProduct(agent._id, product._id, assigned)
                        }
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          assigned
                            ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {assigned ? "✓ " : ""}
                        {product.name}
                      </button>
                    );
                  })}
                </div>
                {activeProducts.length === 0 && (
                  <p className="text-xs text-gray-400">
                    No active products. Add products first.
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SearchAndPromote({
  onPromote,
}: {
  onPromote: (userId: Id<"users">) => void;
}) {
  const [email, setEmail] = useState("");
  const results = useQuery(
    api.users.searchByEmail,
    email.trim() ? { email: email.trim() } : "skip"
  );

  return (
    <div>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter exact email address..."
        />
      </div>
      {results && results.length > 0 && (
        <div className="mt-2 space-y-1">
          {results.map((user) => (
            <div
              key={user._id}
              className="flex items-center justify-between p-2 bg-gray-50 rounded"
            >
              <div>
                <span className="text-sm text-gray-900">
                  {user.name || user.email}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  ({user.role})
                </span>
              </div>
              {user.role === "customer" && (
                <button
                  onClick={() => onPromote(user._id)}
                  className="text-sm text-blue-600 hover:underline"
                >
                  Promote to Agent
                </button>
              )}
              {user.role === "agent" && (
                <span className="text-xs text-gray-400">Already an agent</span>
              )}
            </div>
          ))}
        </div>
      )}
      {results && results.length === 0 && email.trim() && (
        <p className="mt-2 text-sm text-gray-500">
          No user found with that email.
        </p>
      )}
    </div>
  );
}
