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
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { createAgent } from "@/app/actions/agents";

const companyAgentSchema = z.object({
  name: z.string().min(1, "Agent name is required"),
  companyName: z.string().min(1, "Company name is required"),
  industry: z.string().min(1, "Industry is required"),
  services: z.string().min(1, "Services/Products are required"),
  tone: z.string().min(1, "Tone is required"),
  voice: z.string().min(1, "Voice is required"),
  supportPolicy: z.string().optional(),
  extraInfo: z.string().optional(),
});

interface CompanyAgentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const CompanyAgentForm = ({
  onSuccess,
  onCancel,
}: CompanyAgentFormProps) => {
  const [isPending, startTransition] = useTransition();
  const [limitError, setLimitError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof companyAgentSchema>>({
    resolver: zodResolver(companyAgentSchema),
    defaultValues: {
      name: "",
      companyName: "",
      industry: "",
      services: "",
      tone: "professional",
      voice: "alloy",
      supportPolicy: "",
      extraInfo: "",
    },
  });

  const onSubmit = (values: z.infer<typeof companyAgentSchema>) => {
    // Construct structured instructions
    const structuredInstructions = `
You are the official AI Assistant for "${values.companyName}".
Industry: ${values.industry}
Tone: ${values.tone}

YOUR SERVICES/PRODUCTS:
${values.services}

SUPPORT POLICY/GUIDELINES:
${values.supportPolicy || "Provide helpful and accurate information about our services."}

ADDITIONAL COMPANY INFO:
${values.extraInfo || "None."}

BEHAVIORAL RULES:
- Always represent the company professionally.
- If you don't know something, ask the user to contact us directly.
- Follow the tone specified above.
    `.trim();

    startTransition(async () => {
      try {
        await createAgent({
          name: values.name,
          instructions: structuredInstructions,
          voice: values.voice,
        });
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
        <form className="space-y-4 max-h-[70vh] overflow-y-auto px-1" onSubmit={form.handleSubmit(onSubmit)}>
          <div className="flex items-center gap-x-4 mb-4">
            <GeneratedAvatar
              seed={form.watch("name")}
              variant="botttsNeutral"
              className="border size-16 shrink-0"
            />
            <div className="flex-1">
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agent Display Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="e.g. Meet.AI Support" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="companyName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Tech Solutions Inc." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="industry"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Industry</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="e.g. Software, Real Estate" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="tone"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>AI Tone</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="professional">Professional & Formal</SelectItem>
                      <SelectItem value="friendly">Friendly & Casual</SelectItem>
                      <SelectItem value="helpful">Helpful & Patient</SelectItem>
                      <SelectItem value="sales">Sales-Oriented & Persuasive</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="voice"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voice Gender</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
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

          <FormField
            name="services"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Services & Products</FormLabel>
                <FormDescription>What does your company offer?</FormDescription>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="List your main services or products here..."
                    className="min-h-[100px]"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="supportPolicy"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Support / Refund Policy</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="e.g. 24/7 support via email, 30-day money-back guarantee..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="extraInfo"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Company Info</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="Any other details the agent should know about your business?"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-x-2 pt-4">
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
            <Button disabled={isPending} type="submit" className="min-w-[120px]">
              {isPending ? "Creating..." : "Create Company Agent"}
            </Button>
          </div>
        </form>
      </Form>
    </>
  );
};
