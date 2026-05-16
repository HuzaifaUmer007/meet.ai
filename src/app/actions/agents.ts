"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type Agent = {
  id: string;
  user_id: string;
  name: string;
  instructions: string;
  voice: string;
  created_at: string;
  updated_at: string;
  meeting_count?: number;
};

// ─────────────────────────────────────────────
// Get current user (helper)
// ─────────────────────────────────────────────
async function getUser() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error("Unauthorized");
  return { supabase, user };
}

// ─────────────────────────────────────────────
// getAgents
// ─────────────────────────────────────────────
export async function getAgents({
  page = 1,
  pageSize = 10,
  search = "",
}: {
  page?: number;
  pageSize?: number;
  search?: string;
}) {
  const { supabase, user } = await getUser();

  let query = supabase
    .from("agents")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  // Get meeting counts for each agent
  const agentsWithCount = await Promise.all(
    (data ?? []).map(async (agent) => {
      const { count: meetingCount } = await supabase
        .from("meetings")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", agent.id);
      return { ...agent, meeting_count: meetingCount ?? 0 };
    })
  );

  return {
    items: agentsWithCount as Agent[],
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

// ─────────────────────────────────────────────
// getAgent
// ─────────────────────────────────────────────
export async function getAgent(id: string) {
  const { supabase, user } = await getUser();

  const { data, error } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) throw new Error("Agent not found");

  const { count: meetingCount } = await supabase
    .from("meetings")
    .select("id", { count: "exact", head: true })
    .eq("agent_id", id);

  return { ...data, meeting_count: meetingCount ?? 0 } as Agent;
}

// ─────────────────────────────────────────────
// createAgent
// ─────────────────────────────────────────────
export async function createAgent({
  name,
  instructions,
  voice = "alloy",
}: {
  name: string;
  instructions: string;
  voice?: string;
}) {
  const { supabase, user } = await getUser();

  // Check for duplicate agent name (case-insensitive)
  const { data: existingAgent } = await supabase
    .from("agents")
    .select("id")
    .eq("user_id", user.id)
    .ilike("name", name)
    .single();

  if (existingAgent) {
    throw new Error("An agent with this name already exists. Please use a unique name.");
  }

  const { getUserPlan } = await import("./subscriptions");
  const planInfo = await getUserPlan();

  if (planInfo.plan === "Free") {
    // Fetch latest metadata from admin client to avoid stale session data
    const { createAdminClient } = await import("@/lib/supabase/server");
    const adminSupabase = createAdminClient();
    const { data: { user: latestUser } } = await adminSupabase.auth.admin.getUserById(user.id);

    const totalAgentsCreated = latestUser?.user_metadata?.total_agents_created || 0;

    if (totalAgentsCreated >= planInfo.maxAgents) {
      throw new Error(`Free plan limit reached (${planInfo.maxAgents} agents). Please upgrade to Pro to create more.`);
    }
  }

  const { data, error } = await supabase
    .from("agents")
    .insert({ name, instructions, voice, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Increment the total agents created counter in user_metadata
  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();
  await adminSupabase.auth.admin.updateUserById(user.id, {
    user_metadata: { 
      ...user.user_metadata,
      total_agents_created: (user.user_metadata?.total_agents_created || 0) + 1 
    }
  });

  revalidatePath("/agents");
  return data as Agent;
}

// ─────────────────────────────────────────────
// updateAgent
// ─────────────────────────────────────────────
export async function updateAgent({
  id,
  name,
  instructions,
  voice,
}: {
  id: string;
  name: string;
  instructions: string;
  voice?: string;
}) {
  const { supabase, user } = await getUser();

  // Check if name is already taken by ANOTHER agent
  const { data: existingAgent } = await supabase
    .from("agents")
    .select("id")
    .eq("user_id", user.id)
    .ilike("name", name)
    .neq("id", id)
    .single();

  if (existingAgent) {
    throw new Error("An agent with this name already exists. Please use a unique name.");
  }

  const { data, error } = await supabase
    .from("agents")
    .update({ name, instructions, voice, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/agents");
  revalidatePath(`/agents/${id}`);
  return data as Agent;
}

// ─────────────────────────────────────────────
// deleteAgent
// ─────────────────────────────────────────────
export async function deleteAgent(id: string) {
  const { supabase, user } = await getUser();

  const { error } = await supabase
    .from("agents")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/agents");
}
