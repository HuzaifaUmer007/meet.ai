"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { BotIcon, VideoIcon, ZapIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { Progress } from "@/components/ui/progress";

const SubscriptionStatus = ({ data }: { data: any }) => {
  const name = data.user?.full_name ?? "Cyber Expert";
  const email = data.user?.email ?? "user@example.com";

  return (
    <div className="flex flex-col gap-y-4">
      {/* Usage Card - Matching DashboardUserButton Style */}
      <div className="rounded-lg border border-border/10 p-3 w-full bg-white/5 flex flex-col gap-y-4">
        <div className="flex flex-col gap-y-3">
          <div className="flex items-center gap-x-2">
            <div className="size-8 rounded-md bg-blue-500/10 flex items-center justify-center">
              <ZapIcon className={cn("size-4", data.plan === "Pro" ? "fill-blue-500 text-blue-500" : "text-muted-foreground")} />
            </div>
            <div className="flex flex-col">
              <p className="text-xs font-bold leading-none mb-1">Usage</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-tight">{data.plan} Plan</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {/* Meetings Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-medium">
              <span className="text-muted-foreground">Meetings</span>
              <span>{data.meetings} / {data.maxMeetings}</span>
            </div>
            <Progress value={(data.meetings / data.maxMeetings) * 100} className="h-1 bg-white/10" />
          </div>

          {/* Agents Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] font-medium">
              <span className="text-muted-foreground">Agents</span>
              <span>{data.agents} / {data.maxAgents}</span>
            </div>
            <Progress value={(data.agents / data.maxAgents) * 100} className="h-1 bg-white/10" />
          </div>

          {data.plan === "Free" ? (
            <Button asChild variant="outline" size="sm" className="w-full h-8 text-[11px] font-bold bg-blue-500 text-white hover:bg-blue-600 border-0 mt-2 shadow-md shadow-blue-500/10 group">
              <Link href="/pricing" className="flex items-center justify-center gap-x-1">
                Upgrade to Pro
                <ZapIcon className="size-3 fill-white transition-transform group-hover:scale-110" />
              </Link>
            </Button>
          ) : (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full h-8 text-[11px] font-bold bg-white/5 border-border/10 mt-2 hover:bg-white/10 transition-colors"
              onClick={async () => {
                const { createCustomerPortalSession } = await import("@/app/actions/subscriptions");
                const { url } = await createCustomerPortalSession();
                if (url) window.location.href = url;
              }}
            >
              Manage Plan
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import { DashboardUserButton } from "./dashboard-user-button";

const navItems = [
  {
    icon: VideoIcon,
    label: "Meetings",
    href: "/meetings",
  },
  {
    icon: BotIcon,
    label: "Agents",
    href: "/agents",
  },
];

interface DashboardSidebarProps {
  initialUsage: any;
}

export const DashboardSidebar = ({ initialUsage }: DashboardSidebarProps) => {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="text-sidebar-accent-foreground">
        <Link href="/" className="flex items-center gap-2 px-2 pt-2">
          <Image src="/logo.png" height={36} width={36} alt="Meet.AI" style={{ width: 'auto', height: 'auto' }} />
          <p className="text-2xl font-semibold">Meet.AI</p>
        </Link>
      </SidebarHeader>
      <div className="px-4 py-2">
        <Separator className="opacity-10 text-[#5D6B68]" />
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    className={cn(
                      "h-10 hover:bg-linear-to-r/oklch border border-transparent hover:border-[#5D6B68]/10 from-sidebar-accent from-5% via-30% via-sidebar/50 to-sidebar/50",
                      pathname === item.href && "bg-linear-to-r/oklch border-[#5D6B68]/10"
                    )}
                    isActive={pathname === item.href}
                  >
                    <Link href={item.href}>
                      <item.icon className="size-5" />
                      <span className="text-sm font-medium tracking-tight">
                        {item.label}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
      <SidebarFooter className="gap-y-4 p-3 pt-0">
        <SubscriptionStatus data={initialUsage} />
        <DashboardUserButton />
      </SidebarFooter>
    </Sidebar>
  );
};