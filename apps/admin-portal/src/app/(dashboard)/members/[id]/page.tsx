"use client";

import React, { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMember } from "@/hooks/useMembers";

export default function MemberDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: member, isLoading } = useMember(id);

  useEffect(() => {
    // Redirect to overview page
    if (id) {
      router.replace(`/members/${id}/overview`);
    }
  }, [id, router]);

  if (isLoading) {
    return <div className="p-10 text-center animate-pulse">Loading profile...</div>;
  }

  return null;
}
