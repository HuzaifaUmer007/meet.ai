"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition } from "react";
import { PlanLimitModal } from "@/components/plan-limit-modal";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { GeneratedAvatar } from "@/components/generated-avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createAgent, updateAgent, type Agent } from "@/app/actions/agents";
import { agentsInsertSchema } from "../../schemas";

interface AgentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialValues?: Agent;
}

export const AgentForm = ({
  onSuccess,
  onCancel,
  initialValues,
}: AgentFormProps) => {
  const [isPending, startTransition] = useTransition();
  const [limitError, setLimitError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof agentsInsertSchema>>({
    resolver: zodResolver(agentsInsertSchema),
    defaultValues: {
      name: initialValues?.name ?? "",
      instructions: initialValues?.instructions ?? "",
      voice: initialValues?.voice ?? "alloy",
    },
  });

  const isEdit = !!initialValues?.id;

  const onSubmit = (values: z.infer<typeof agentsInsertSchema>) => {
    startTransition(async () => {
      try {
        if (isEdit && initialValues?.id) {
          await updateAgent({ id: initialValues.id, ...values });
        } else {
          await createAgent(values);
        }
        onSuccess?.();
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
      <Form {...form}>
      <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
        <GeneratedAvatar
          seed={form.watch("name")}
          variant="botttsNeutral"
          className="border size-16"
        />
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g. Math tutor" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="instructions"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="You are a helpful math assistant that can answer questions and help with assignments."
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            name="voice"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Voice Gender</FormLabel>
                <Select onValueChange={field.onChange} value={field.value || "alloy"}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select voice" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="alloy">Male (Alloy)</SelectItem>
                    <SelectItem value="shimmer">Female (Shimmer)</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
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
