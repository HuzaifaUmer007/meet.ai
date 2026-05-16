"use client";

import Link from "next/link";
import { ZapIcon } from "lucide-react";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { Button } from "@/components/ui/button";

interface PlanLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: string;
}

export const PlanLimitModal = ({
  open,
  onOpenChange,
  message,
}: PlanLimitModalProps) => {
  return (
    <ResponsiveDialog
      title="Plan Limit Reached"
      description="Upgrade your plan to continue"
      open={open}
      onOpenChange={onOpenChange}
    >
      <div className="flex flex-col items-center justify-center p-6 text-center space-y-6">
        <div className="size-16 rounded-full bg-blue-500/10 flex items-center justify-center">
          <ZapIcon className="size-8 text-blue-500 fill-blue-500" />
        </div>
        
        <div className="space-y-2">
          <h3 className="text-xl font-bold">Time to Upgrade!</h3>
          <p className="text-muted-foreground">
            {message}
          </p>
        </div>

        <div className="grid grid-cols-1 w-full gap-y-3">
          <Button asChild size="lg" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold">
            <Link href="/pricing" onClick={() => onOpenChange(false)}>
              Upgrade to Pro
            </Link>
          </Button>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
        </div>
      </div>
    </ResponsiveDialog>
  );
};
