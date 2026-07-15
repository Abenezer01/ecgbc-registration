"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui";
import { useMember } from "@/hooks/useMembers";
import { useAuth } from "@/hooks/useAuth";
import { useDocumentCompleteness } from "@/hooks/useDocumentCompleteness";
import { HeroSection } from "../components/HeroSection";
import { StatsGrid } from "../components/StatsGrid";
import { QuickInfoRow } from "../components/QuickInfoRow";

interface MemberDetailLayoutProps {
  children: React.ReactNode;
}

export default function MemberDetailLayout({ children }: MemberDetailLayoutProps) {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: member, isLoading } = useMember(id);
  const { data: documentCompleteness } = useDocumentCompleteness(id);
  const { hasPermission } = useAuth();

  const canEdit = hasPermission("member_change") || hasPermission("member_edit");
  const canDeactivate = hasPermission("member_deactivate") || hasPermission("member_delete");

  if (isLoading) {
    return <div className="p-10 text-center animate-pulse">Loading...</div>;
  }

  if (!member) {
    return (
      <div className="p-10 text-center text-zinc-500">
        Member not found.
        <br />
        <Button variant="outline" className="mt-4" onClick={() => router.push("/members")}>
          Go back
        </Button>
      </div>
    );
  }

  const m = member as any;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Back Button */}
        <Button variant="ghost" size="sm" onClick={() => router.push(`/members`)} className="mb-2">
          ← Back to Members
        </Button>

        {/* Hero Section */}
        <HeroSection 
          member={m} 
          canEdit={canEdit} 
          canDeactivate={canDeactivate}
          onEdit={() => {}}
          onDeactivate={() => router.push(`/members/${id}/settings`)}
        />

        {/* Stats Grid */}
        <StatsGrid member={m} documentCompleteness={documentCompleteness} />

        {/* Quick Info Row */}
        <QuickInfoRow member={m} />

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
