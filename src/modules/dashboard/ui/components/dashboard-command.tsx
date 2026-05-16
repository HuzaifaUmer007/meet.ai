"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dispatch, SetStateAction } from "react";

import {
  CommandResponsiveDialog,
  CommandInput,
  CommandItem,
  CommandList,
  CommandGroup,
  CommandEmpty,
} from "@/components/ui/command";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { getMeetings, type Meeting } from "@/app/actions/meetings";
import { getAgents, type Agent } from "@/app/actions/agents";

interface Props {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export const DashboardCommand = ({ open, setOpen }: Props) => {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    startTransition(async () => {
      const [m, a] = await Promise.all([
        getMeetings({ search, pageSize: 100 }),
        getAgents({ search, pageSize: 100 }),
      ]);
      setMeetings(m.items);
      setAgents(a.items);
    });
  }, [search, open]);

  return (
    <CommandResponsiveDialog shouldFilter={false} open={open} onOpenChange={setOpen}>
      <CommandInput
        placeholder="Find a meeting or agent..."
        value={search}
        onValueChange={(value) => setSearch(value)}
      />
      <CommandList>
        <CommandGroup heading="Meetings">
          <CommandEmpty>
            <span className="text-muted-foreground text-sm">No meetings found</span>
          </CommandEmpty>
          {meetings.map((meeting) => (
            <CommandItem
              onSelect={() => {
                router.push(`/meetings/${meeting.id}`);
                setOpen(false);
              }}
              key={meeting.id}
            >
              {meeting.name}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandGroup heading="Agents">
          <CommandEmpty>
            <span className="text-muted-foreground text-sm">No agents found</span>
          </CommandEmpty>
          {agents.map((agent) => (
            <CommandItem
              onSelect={() => {
                router.push(`/agents/${agent.id}`);
                setOpen(false);
              }}
              key={agent.id}
            >
              <GeneratedAvatar seed={agent.name} variant="botttsNeutral" className="size-5" />
              {agent.name}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandResponsiveDialog>
  );
};
