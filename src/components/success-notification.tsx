"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { ZapIcon, CheckCircle2Icon } from "lucide-react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";

export const SuccessNotification = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      setOpen(true);
      // Clean up URL
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete("success");
      const newUrl = window.location.pathname + (newParams.toString() ? `?${newParams.toString()}` : "");
      window.history.replaceState({}, "", newUrl);
    }
  }, [searchParams]);

  return (
    <ResponsiveDialog
      title="Upgrade Successful!"
      description="You are now a Pro member"
      open={open}
      onOpenChange={setOpen}
    >
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="relative">
          <div className="size-20 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2Icon className="size-10 text-green-500" />
          </div>
          <div className="absolute -top-1 -right-1 size-8 rounded-full bg-blue-500 border-4 border-background flex items-center justify-center animate-bounce">
            <ZapIcon className="size-4 text-white fill-white" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight text-white">Welcome to Pro! 🚀</h3>
          <p className="text-muted-foreground text-sm max-w-[280px]">
            Thanks for subscribing! Your limits have been increased to **10 meetings** and **5 agents**.
          </p>
        </div>

        <Button 
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold h-12 text-lg shadow-lg shadow-green-600/20"
          onClick={() => setOpen(false)}
        >
          Let's Go!
        </Button>
      </div>
    </ResponsiveDialog>
  );
};
