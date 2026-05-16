"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useState, useTransition, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { createMeeting, updateMeeting, type Meeting } from "@/app/actions/meetings";
import { getAgents, type Agent } from "@/app/actions/agents";
import { meetingsInsertSchema } from "../../schemas";
import { NewAgentDialog } from "@/modules/agents/ui/components/new-agent-dialog";
import { PlanLimitModal } from "@/components/plan-limit-modal";

interface MeetingFormProps {
  onSuccess?: (id?: string) => void;
  onCancel?: () => void;
  initialValues?: Meeting;
}

export const MeetingForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: MeetingFormProps) => {
  const [isPending, startTransition] = useTransition();
  const [openNewAgentDialog, setOpenNewAgentDialog] = useState(false);
  const [limitError, setLimitError] = useState<string | null>(null);
  const [agentSearch, setAgentSearch] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);

  useEffect(() => {
    getAgents({ pageSize: 100, search: agentSearch }).then((r) =>
      setAgents(r.items)
    );
  }, [agentSearch]);

  const form = useForm<z.infer<typeof meetingsInsertSchema>>({
    resolver: zodResolver(meetingsInsertSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      agentId: initialValues?.agent_id ?? "",
    },
  });

  const isEdit = !!initialValues?.id;

  const onSubmit = (values: z.infer<typeof meetingsInsertSchema>) => {
    startTransition(async () => {
      try {
        if (isEdit && initialValues?.id) {
          await updateMeeting({ id: initialValues.id, name: values.name });
          onSuccess?.();
        } else {
          const meeting = await createMeeting(values);
          onSuccess?.(meeting.id);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Something went wrong";
        if (message.includes("limit reached")) {
          setLimitError(message);
        } else {
          toast.error(message);
        }
      }
    });
  };

  return (
    <>
      <PlanLimitModal 
        open={!!limitError} 
        onOpenChange={(open) => !open && setLimitError(null)} 
        message={limitError ?? ""} 
      />
      <NewAgentDialog
        open={openNewAgentDialog}
        onOpenChange={setOpenNewAgentDialog}
      />
      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <FormField
            name="name"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g. Math Consultations" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="agentId"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Agent</FormLabel>
                <FormControl>
                  <CommandSelect
                    options={agents.map((agent) => ({
                      id: agent.id,
                      value: agent.id,
                      children: (
                        <div className="flex items-center gap-x-2">
                          <GeneratedAvatar
                            seed={agent.name}
                            variant="botttsNeutral"
                            className="border size-6"
                          />
                          <span>{agent.name}</span>
                        </div>
                      ),
                    }))}
                    onSelect={field.onChange}
                    onSearch={setAgentSearch}
                    value={field.value}
                    placeholder="Select an agent"
                  />
                </FormControl>
                <FormDescription>
                  Not found what you&apos;re looking for?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setOpenNewAgentDialog(true)}
                  >
                    Create new agent
                  </button>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex justify-between gap-x-2">
            {onCancel && (
              <Button
                variant="ghost"
                disabled={isPending}
                type="button"
                onClick={() => onCancel()}
              >
                Cancel
              </Button>
            )}
            <Button disabled={isPending} type="submit">
              {isEdit ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};
