"use client";

import { useState } from "react";
import { PlusIcon, XCircleIcon } from "lucide-react";

import { DEFAULT_PAGE } from "@/constants";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

import { NewAgentDialog } from "./new-agent-dialog";
import { NewCompanyAgentDialog } from "./new-company-agent-dialog";
import { AgentsSearchFilter } from "./agents-search-filter";
import { useAgentsFilters } from "../../hooks/use-agents-filters";

export const AgentsListHeader = () => {
  const [filters, setFilters] = useAgentsFilters();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);

  const isAnyFilterModified = !!filters.search;

  const onClearFilters = () => {
    setFilters({
      search: "",
      page: DEFAULT_PAGE,
    });
  }

  return (
    <>
      <NewAgentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      <NewCompanyAgentDialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen} />
      <div className="py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-y-4">
          <h5 className="font-medium text-xl">My Agents</h5>
          <div className="flex items-center gap-x-2">
            <Button variant="outline" onClick={() => setIsCompanyDialogOpen(true)} className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20">
              <PlusIcon className="size-4 mr-2" />
              New Company Agent
            </Button>
            <Button onClick={() => setIsDialogOpen(true)}>
              <PlusIcon className="size-4 mr-2" />
              New Agent
            </Button>
          </div>
        </div>
        <ScrollArea>
          <div className="flex items-center gap-x-2 p-1">
            <AgentsSearchFilter />
            {isAnyFilterModified && (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                <XCircleIcon />
                Clear
              </Button>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </>
  );
};
