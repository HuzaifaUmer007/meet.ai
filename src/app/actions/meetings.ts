"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { streamVideo } from "@/lib/stream-video";
import { streamChat } from "@/lib/stream-chat";
import { generateAvatarUri } from "@/lib/avatar";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
export type MeetingStatus =
  | "upcoming"
  | "active"
  | "completed"
  | "processing"
  | "cancelled";

export type Meeting = {
  id: string;
  user_id: string;
  agent_id: string;
  name: string;
  status: MeetingStatus;
  started_at: string | null;
  ended_at: string | null;
  duration: number | null;
  transcript_url: string | null;
  recording_url: string | null;
  summary: string | null;
  tokens_used: number;
  created_at: string;
  updated_at: string;
  agent?: {
    id: string;
    name: string;
    instructions: string;
  };
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
// getMeetings
// ─────────────────────────────────────────────
export async function getMeetings({
  page = 1,
  pageSize = 10,
  search = "",
  agentId = "",
  status = "",
}: {
  page?: number;
  pageSize?: number;
  search?: string;
  agentId?: string;
  status?: string;
}) {
  const { supabase, user } = await getUser();

  let query = supabase
    .from("meetings")
    .select("*, agent:agents(id, name, instructions)", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (search) query = query.ilike("name", `%${search}%`);
  if (agentId) query = query.eq("agent_id", agentId);
  if (status) query = query.eq("status", status);

  const { data, error, count } = await query;
  if (error) throw new Error(error.message);

  const items = (data ?? []).map((meeting) => {
    let duration: number | undefined;
    if (meeting.started_at && meeting.ended_at) {
      duration =
        (new Date(meeting.ended_at).getTime() -
          new Date(meeting.started_at).getTime()) /
        1000;
    }
    return {
      ...meeting,
      duration,
    } as Meeting;
  });

  return {
    items,
    total: count ?? 0,
    totalPages: Math.ceil((count ?? 0) / pageSize),
  };
}

import { createAdminClient } from "@/lib/supabase/server";

// ─────────────────────────────────────────────
// getPublicMeeting
// ─────────────────────────────────────────────
export async function getPublicMeeting(id: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("meetings")
    .select("*, agent:agents(id, name, instructions)")
    .eq("id", id)
    .single();

  if (error) throw new Error("Meeting not found");

  // Calculate duration
  let duration: number | undefined;
  if (data.started_at && data.ended_at) {
    duration =
      (new Date(data.ended_at).getTime() -
        new Date(data.started_at).getTime()) /
      1000;
  }

  return {
    ...data,
    duration,
  } as Meeting & {
    duration?: number;
    agent?: { id: string; name: string; instructions: string };
  };
}

// ─────────────────────────────────────────────
// getMeeting
// ─────────────────────────────────────────────
export async function getMeeting(id: string) {
  const { supabase, user } = await getUser();

  const { data, error } = await supabase
    .from("meetings")
    .select("*, agent:agents(id, name, instructions)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) throw new Error("Meeting not found");

  // Calculate duration
  let duration: number | undefined;
  if (data.started_at && data.ended_at) {
    duration =
      (new Date(data.ended_at).getTime() -
        new Date(data.started_at).getTime()) /
      1000;
  }

  return { ...data, duration } as Meeting;
}

// ─────────────────────────────────────────────
// createMeeting
// ─────────────────────────────────────────────
export async function createMeeting({
  name,
  agentId,
}: {
  name: string;
  agentId: string;
}) {
  const { supabase, user } = await getUser();

  // Verify the agent belongs to the user
  const { data: agent, error: agentError } = await supabase
    .from("agents")
    .select("*")
    .eq("id", agentId)
    .eq("user_id", user.id)
    .single();

  if (agentError || !agent) throw new Error("Agent not found");

  const { getUserPlan } = await import("./subscriptions");
  const planInfo = await getUserPlan();

  if (planInfo.plan === "Free") {
    // Fetch latest metadata from admin client to avoid stale session data
    const { createAdminClient } = await import("@/lib/supabase/server");
    const adminSupabase = createAdminClient();
    const { data: { user: latestUser } } = await adminSupabase.auth.admin.getUserById(user.id);
    
    const totalMeetingsCreated = latestUser?.user_metadata?.total_meetings_created || 0;

    if (totalMeetingsCreated >= planInfo.maxMeetings) {
      throw new Error(`Free plan limit reached (${planInfo.maxMeetings} meetings). Please upgrade to Pro to create more.`);
    }
  }

  // Check for duplicate meeting name (case-insensitive)
  const { data: existingMeetings } = await supabase
    .from("meetings")
    .select("id")
    .ilike("name", name.trim())
    .eq("user_id", user.id)
    .limit(1);

  if (existingMeetings && existingMeetings.length > 0) {
    throw new Error("A meeting with this name already exists");
  }

  // Insert meeting in Supabase
  const { data: meeting, error } = await supabase
    .from("meetings")
    .insert({ name, agent_id: agentId, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Increment total meetings created in user_metadata
  const { createAdminClient } = await import("@/lib/supabase/server");
  const adminSupabase = createAdminClient();
  await adminSupabase.auth.admin.updateUserById(user.id, {
    user_metadata: {
      ...user.user_metadata,
      total_meetings_created: (user.user_metadata?.total_meetings_created || 0) + 1
    }
  });

  // Create the Stream Video call
  const call = streamVideo.video.call("default", meeting.id);
  await call.create({
    data: {
      created_by_id: user.id,
      custom: {
        meetingId: meeting.id,
        meetingName: meeting.name,
      },
      settings_override: {
        transcription: {
          language: "auto", // Reverted to auto as 'ur' is not in the allowed list
          mode: "auto-on",
          closed_caption_mode: "auto-on",
        },
        recording: {
          mode: "auto-on",
          quality: "1080p",
        },
      },
    },
  });

  // Upsert the agent user in Stream so they can join
  await streamVideo.upsertUsers([
    {
      id: agent.id,
      name: agent.name,
      role: "user",
      image: generateAvatarUri({ seed: agent.name, variant: "botttsNeutral" }),
    },
  ]);

  revalidatePath("/meetings");
  return meeting as Meeting;
}

// ─────────────────────────────────────────────
// updateMeeting
// ─────────────────────────────────────────────
export async function updateMeeting({
  id,
  ...fields
}: {
  id: string;
  name?: string;
  status?: MeetingStatus;
}) {
  const { supabase, user } = await getUser();

  if (fields.name) {
    const { data: existingMeetings } = await supabase
      .from("meetings")
      .select("id")
      .ilike("name", fields.name.trim())
      .neq("id", id)
      .eq("user_id", user.id)
      .limit(1);

    if (existingMeetings && existingMeetings.length > 0) {
      throw new Error("A meeting with this name already exists");
    }
  }

  const { data, error } = await supabase
    .from("meetings")
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/meetings");
  revalidatePath(`/meetings/${id}`);
  return data as Meeting;
}

// ─────────────────────────────────────────────
// deleteMeeting
// ─────────────────────────────────────────────
export async function deleteMeeting(id: string) {
  const { supabase, user } = await getUser();

  const { error } = await supabase
    .from("meetings")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  revalidatePath("/meetings");
}

// ─────────────────────────────────────────────
// generateStreamToken — for video call join
// ─────────────────────────────────────────────
export async function generateStreamToken() {
  const { user } = await getUser();
  const supabase = await createClient();

  // Get user profile
  const { data: profile } = await supabase.auth.getUser();
  const name = profile.user?.user_metadata?.full_name ?? profile.user?.email ?? "User";
  const image = profile.user?.user_metadata?.avatar_url ?? generateAvatarUri({ seed: name, variant: "initials" });

  await streamVideo.upsertUsers([
    {
      id: user.id,
      name,
      role: "admin",
      image,
    },
  ]);

  const expirationTime = Math.floor(Date.now() / 1000) + 3600;
  const issuedAt = Math.floor(Date.now() / 1000) - 60;

  return streamVideo.generateUserToken({
    user_id: user.id,
    exp: expirationTime,
    validity_in_seconds: issuedAt,
  });
}

// ─────────────────────────────────────────────
// generateGuestStreamToken — for public guest join
// ─────────────────────────────────────────────
export async function generateGuestStreamToken(guestId: string, guestName: string) {
  const image = generateAvatarUri({ seed: guestName, variant: "initials" });

  await streamVideo.upsertUsers([
    {
      id: guestId,
      name: guestName,
      role: "guest",
      image,
    },
  ]);

  const expirationTime = Math.floor(Date.now() / 1000) + 3600;
  const issuedAt = Math.floor(Date.now() / 1000) - 60;

  return streamVideo.generateUserToken({
    user_id: guestId,
    exp: expirationTime,
    validity_in_seconds: issuedAt,
  });
}

// ─────────────────────────────────────────────
// generateChatToken — for post-meeting chat
// ─────────────────────────────────────────────
export async function generateChatToken() {
  const { user } = await getUser();

  await streamChat.upsertUser({ id: user.id, role: "admin" });
  return streamChat.createToken(user.id);
}

// ─────────────────────────────────────────────
// getTranscript — for completed meeting view
// ─────────────────────────────────────────────
export async function getTranscript(meetingId: string) {
  const { supabase, user } = await getUser();

  const { data: meeting, error } = await supabase
    .from("meetings")
    .select("transcript_url")
    .eq("id", meetingId)
    .eq("user_id", user.id)
    .single();

  if (error || !meeting?.transcript_url) return [];

  try {
    const res = await fetch(meeting.transcript_url);
    const text = await res.text();
    const JSONL = (await import("jsonl-parse-stringify")).default;
    const transcript = JSONL.parse(text) as Array<{
      speaker_id: string;
      start_time: number;
      stop_time: number;
      text: string;
    }>;

    // Get speaker names
    const speakerIds = [...new Set(transcript.map((t) => t.speaker_id))];
    const { data: agents } = await supabase
      .from("agents")
      .select("id, name")
      .in("id", speakerIds);

    const speakerMap = new Map(
      (agents ?? []).map((a) => [a.id, a.name])
    );

    return transcript.map((item) => ({
      ...item,
      user: {
        name: speakerMap.get(item.speaker_id) ?? user.email ?? "User",
        image: speakerMap.has(item.speaker_id)
          ? generateAvatarUri({ seed: speakerMap.get(item.speaker_id)!, variant: "botttsNeutral" })
          : generateAvatarUri({ seed: user.email ?? "User", variant: "initials" }),
      },
    }));
  } catch {
    return [];
  }
}
