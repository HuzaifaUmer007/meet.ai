"use client";

import { useEffect, useState, useTransition } from "react";
import { format } from "date-fns";
import { SearchIcon } from "lucide-react";
import Highlighter from "react-highlight-words";

import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { generateAvatarUri } from "@/lib/avatar";
import { getTranscript } from "@/app/actions/meetings";

interface TranscriptItem {
  speaker_id: string;
  start_time: number;
  stop_time: number;
  text: string;
  user: {
    name: string;
    image: string;
  };
}

interface Props {
  meetingId: string;
}

export const Transcript = ({ meetingId }: Props) => {
  const [data, setData] = useState<TranscriptItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getTranscript(meetingId);
      setData(result as TranscriptItem[]);
    });
  }, [meetingId]);

  const filteredData = data.filter((item) =>
    item.text.toString().toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg border px-4 py-5 flex flex-col gap-y-4 w-full">
      <p className="text-sm font-medium">Transcript</p>
      <div className="relative">
        <Input
          placeholder="Search Transcript"
          className="pl-7 h-9 w-[240px]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
      </div>
      <ScrollArea>
        <div className="flex flex-col gap-y-4">
          {filteredData.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col gap-y-2 hover:bg-muted p-4 rounded-md border"
            >
              <div className="flex gap-x-2 items-center">
                <Avatar className="size-6">
                  <AvatarImage
                    src={item.user.image ?? generateAvatarUri({ seed: item.user.name, variant: "initials" })}
                    alt="User Avatar"
                  />
                </Avatar>
                <p className="text-sm font-medium">{item.user.name}</p>
                <p className="text-sm text-blue-500 font-medium">
                  {(() => {
                    try {
                      // Handle relative seconds
                      if (typeof item.start_time === "number" || (item.start_time && !isNaN(Number(item.start_time)))) {
                        return format(new Date(0, 0, 0, 0, 0, Math.floor(Number(item.start_time))), "mm:ss");
                      }
                      // Handle ISO String Date
                      if (item.start_time) {
                        const date = new Date(item.start_time);
                        if (!isNaN(date.getTime())) {
                          return format(date, "HH:mm:ss");
                        }
                      }
                    } catch (e) {
                      // ignore
                    }
                    return "00:00";
                  })()}
                </p>
              </div>
              <Highlighter
                className="text-sm text-neutral-700"
                highlightClassName="bg-yellow-200"
                searchWords={[searchQuery]}
                autoEscape={true}
                textToHighlight={item.text}
              />
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};