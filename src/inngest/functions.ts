import OpenAI from "openai";
import JSONL from "jsonl-parse-stringify";

import { createAdminClient } from "@/lib/supabase/server";
import { inngest } from "@/inngest/client";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const SUMMARIZER_SYSTEM_PROMPT = `
You are an expert summarizer. You write readable, concise, simple content. You are given a transcript of a meeting and you need to summarize it.

Use the following markdown structure for every output:

### Overview
Provide a detailed, engaging summary of the session's content. Focus on major features, user workflows, and any key takeaways. Write in a narrative style, using full sentences. Highlight unique or powerful aspects of the product, platform, or discussion.

### Notes
Break down key content into thematic sections with timestamp ranges. Each section should summarize key points, actions, or demos in bullet format.

Example:
#### Section Name
- Main point or demo shown here
- Another key insight or interaction
- Follow-up tool or explanation provided

#### Next Section
- Feature X automatically does Y
- Mention of integration with Z
`.trim();

export const meetingsProcessing = inngest.createFunction(
  { id: "meetings/processing" },
  { event: "meetings/processing" },
  async ({ event, step }) => {
    const supabase = createAdminClient();

    const response = await step.run("fetch-transcript", async () => {
      return fetch(event.data.transcriptUrl).then((res) => res.text());
    });

    const transcript = await step.run("parse-transcript", async () => {
      return JSONL.parse<{
        speaker_id: string;
        start_time: number;
        stop_time: number;
        text: string;
      }>(response);
    });

    const transcriptWithSpeakers = await step.run("add-speakers", async () => {
      const speakerIds = [...new Set(transcript.map((item) => item.speaker_id))];

      const { data: agents } = await supabase
        .from("agents")
        .select("id, name")
        .in("id", speakerIds);

      const speakerMap = new Map(
        (agents ?? []).map((a: { id: string; name: string }) => [a.id, a.name])
      );

      return transcript.map((item) => ({
        ...item,
        user: {
          name: speakerMap.get(item.speaker_id) ?? "Unknown",
        },
      }));
    });

    const summary = await step.run("generate-summary", async () => {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SUMMARIZER_SYSTEM_PROMPT },
          {
            role: "user",
            content:
              "Summarize the following transcript: " +
              JSON.stringify(transcriptWithSpeakers),
          },
        ],
      });

      return completion.choices[0].message.content ?? "";
    });

    await step.run("save-summary", async () => {
      // Calculate tokens for the SUMMARY generation (Input + Output)
      const summaryTokens = Math.ceil(
        (JSON.stringify(transcriptWithSpeakers).length + summary.length) / 4
      );

      // Calculate estimate for the LIVE AGENT interactions (based on transcript)
      // Real-time voice agents consume more, so we multiply by a factor (e.g. 1.5)
      const liveAgentEstimate = Math.ceil(
        (JSON.stringify(transcriptWithSpeakers).length / 4) * 1.5
      );

      const totalEstimatedTokens = summaryTokens + liveAgentEstimate;

      await supabase
        .from("meetings")
        .update({
          summary,
          tokens_used: totalEstimatedTokens,
          status: "completed",
        })
        .eq("id", event.data.meetingId);
    });
  }
);
