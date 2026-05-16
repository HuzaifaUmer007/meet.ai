"use client";

import { useEffect, useState, useTransition } from "react";

import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";
import { getAgents, type Agent } from "@/app/actions/agents";
import { useMeetingsFilters } from "../../hooks/use-meetings-filters";

export const AgentIdFilter = () => {
  const [filters, setFilters] = useMeetingsFilters();
  const [agentSearch, setAgentSearch] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const result = await getAgents({ pageSize: 100, search: agentSearch });
      setAgents(result.items);
    });
  }, [agentSearch]);

  return (
    <CommandSelect
      className="h-9"
      placeholder="Agent"
      options={agents.map((agent) => ({
        id: agent.id,
        value: agent.id,
        children: (
          <div className="flex items-center gap-x-2">
            <GeneratedAvatar seed={agent.name} variant="botttsNeutral" className="size-4" />
            {agent.name}
          </div>
        ),
      }))}
      onSelect={(value) => setFilters({ agentId: value })}
      onSearch={setAgentSearch}
      value={filters.agentId ?? ""}
    />
  );
};
