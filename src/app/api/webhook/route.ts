import OpenAI from "openai";

import { NextRequest, NextResponse } from "next/server";
import { ChatCompletionMessageParam } from "openai/resources/index.mjs";
import {
  MessageNewEvent,
  CallEndedEvent,
  CallTranscriptionReadyEvent,
  CallRecordingReadyEvent,
  CallSessionParticipantLeftEvent,
  CallSessionStartedEvent,
} from "@stream-io/node-sdk";

import { createAdminClient } from "@/lib/supabase/server";
import { streamVideo } from "@/lib/stream-video";
import { inngest } from "@/inngest/client";
import { generateAvatarUri } from "@/lib/avatar";
import { streamChat } from "@/lib/stream-chat";

const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

function verifySignatureWithSDK(body: string, signature: string): boolean {
  return streamVideo.verifyWebhook(body, signature);
}

export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-signature");
  const apiKey = req.headers.get("x-api-key");

  if (!signature || !apiKey) {
    return NextResponse.json(
      { error: "Missing signature or API key" },
      { status: 400 }
    );
  }

  const arrayBuf = await req.arrayBuffer();
  const body = Buffer.from(arrayBuf).toString("utf-8");

  if (!verifySignatureWithSDK(body, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventType = (payload as Record<string, unknown>)?.type;
  const supabase = createAdminClient();

  if (eventType === "call.session_started") {
    const event = payload as CallSessionStartedEvent;
    const meetingId = event.call.custom?.meetingId;

    if (!meetingId) {
      return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
    }

    // Atomic update: only proceed if status is still "upcoming"
    // This prevents duplicate agent joins from concurrent webhooks
    const { data: updatedMeeting } = await supabase
      .from("meetings")
      .update({ status: "active", started_at: new Date().toISOString() })
      .eq("id", meetingId)
      .eq("status", "upcoming")
      .select("*, agent:agents(*)")
      .single();

    if (!updatedMeeting) {
      // Already active or being processed by another webhook
      console.log("[Webhook] Meeting already active or processing, skipping agent join");
      return NextResponse.json({ status: "ignored" }, { status: 200 });
    }

    const agent = updatedMeeting.agent;
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    try {
      const call = streamVideo.video.call("default", meetingId);

      // Check if agent is already in the call to prevent duplicate joins
      const callState = await call.get();
      const participants = callState.members || [];
      const agentAlreadyInCall = participants.some(
        (member: { user_id?: string }) => member.user_id === agent.id
      );

      if (agentAlreadyInCall) {
        console.log("[Webhook] Agent already in call, skipping duplicate join");
        return NextResponse.json({ status: "agent-already-present" }, { status: 200 });
      }

      const realtimeClient = await streamVideo.video.connectOpenAi({
        call,
        openAiApiKey: process.env.OPENAI_API_KEY!,
        agentUserId: agent.id,
      });

      // Global Multilingual Support Instructions
      const globalInstructions = `
        Your name is "${agent.name}". 
        If anyone asks who you are, introduce yourself by this name.
        
        Your capabilities and behavior are defined by the following core instructions:
        ${agent.instructions}

        LANGUAGE RULES:
        1. You MUST understand and respond in English, Urdu (Script), and Roman Urdu.
        2. Always detect the user's language and respond in the SAME language they are using.
        3. If the user speaks in Roman Urdu, you must respond in Roman Urdu or Urdu as per their preference.
        4. Do not ignore the core instructions above, even if they are in Urdu or Roman Urdu.
      `.trim();

      realtimeClient.updateSession({
        instructions: globalInstructions,
        voice: agent.voice as any || "alloy",
        turn_detection: { type: "server_vad" },
      });
    } catch (err) {
      console.error("Error connecting OpenAI agent:", err);
    }

  } else if (eventType === "call.session_participant_left") {
    const event = payload as CallSessionParticipantLeftEvent;
    const meetingId = event.call_cid.split(":")[1];

    if (!meetingId) {
      return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
    }

    const call = streamVideo.video.call("default", meetingId);
    await call.end();

  } else if (eventType === "call.session_ended") {
    const event = payload as CallEndedEvent;
    const meetingId = event.call.custom?.meetingId;

    if (!meetingId) {
      return NextResponse.json({ error: "Missing meetingId" }, { status: 400 });
    }

    await supabase
      .from("meetings")
      .update({ status: "processing", ended_at: new Date().toISOString() })
      .eq("id", meetingId)
      .eq("status", "active");

  } else if (eventType === "call.transcription_ready") {
    const event = payload as CallTranscriptionReadyEvent;
    const meetingId = event.call_cid.split(":")[1];

    const { data: updatedMeeting } = await supabase
      .from("meetings")
      .update({ transcript_url: event.call_transcription.url })
      .eq("id", meetingId)
      .select()
      .single();

    if (!updatedMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    await inngest.send({
      name: "meetings/processing",
      data: {
        meetingId: updatedMeeting.id,
        transcriptUrl: updatedMeeting.transcript_url,
      },
    });

  } else if (eventType === "call.recording_ready") {
    const event = payload as CallRecordingReadyEvent;
    const meetingId = event.call_cid.split(":")[1];

    await supabase
      .from("meetings")
      .update({ recording_url: event.call_recording.url })
      .eq("id", meetingId);

  } else if (eventType === "message.new") {
    const event = payload as MessageNewEvent;

    const userId = event.user?.id;
    const channelId = event.channel_id;
    const text = event.message?.text;

    if (!userId || !channelId || !text) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data: existingMeeting } = await supabase
      .from("meetings")
      .select("*, agent:agents(*)")
      .eq("id", channelId)
      .eq("status", "completed")
      .single();

    if (!existingMeeting) {
      return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const agent = existingMeeting.agent;
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }

    if (userId !== agent.id) {
      const instructions = `
      You are "${agent.name}", an AI assistant helping the user revisit a recently completed meeting.
      If the user asks who you are, introduce yourself as "${agent.name}".

      IMPORTANT: You MUST understand and respond in both Urdu and English. 
      Always detect the user's language and respond in the SAME language they are using (Urdu or English).

      Below is a summary of the meeting, generated from the transcript:
      
      ${existingMeeting.summary}
      
      The following are your original instructions and capabilities. Please follow these behavioral guidelines as you assist the user:
      
      ${agent.instructions}
      
      The user may ask questions about the meeting, request clarifications, or ask for follow-up actions.
      Always base your responses on the meeting summary above.
      
      If the summary does not contain enough information to answer a question, politely let the user know.
      
      Be concise, helpful, and focus on providing accurate information from the meeting.
      `;

      const channel = streamChat.channel("messaging", channelId);
      await channel.watch();

      const previousMessages = channel.state.messages
        .slice(-5)
        .filter((msg) => msg.text && msg.text.trim() !== "")
        .map<ChatCompletionMessageParam>((message) => ({
          role: message.user?.id === agent.id ? "assistant" : "user",
          content: message.text || "",
        }));

      const GPTResponse = await openaiClient.chat.completions.create({
        messages: [
          { role: "system", content: instructions },
          ...previousMessages,
          { role: "user", content: text },
        ],
        model: "gpt-4o-mini",
      });

      const GPTResponseText = GPTResponse.choices[0].message.content;
      const totalTokens = GPTResponse.usage?.total_tokens || 0;

      if (!GPTResponseText) {
        return NextResponse.json(
          { error: "No response from GPT" },
          { status: 400 }
        );
      }

      // Increment tokens used in database
      await supabase.rpc("increment_tokens", { 
        meeting_id: channelId, 
        tokens: totalTokens 
      });

      const avatarUrl = generateAvatarUri({
        seed: agent.name,
        variant: "botttsNeutral",
      });

      streamChat.upsertUser({
        id: agent.id,
        name: agent.name,
        image: avatarUrl,
      });

      channel.sendMessage({
        text: GPTResponseText,
        user: { id: agent.id, name: agent.name, image: avatarUrl },
      });
    }
  }

  return NextResponse.json({ status: "ok" });
}
