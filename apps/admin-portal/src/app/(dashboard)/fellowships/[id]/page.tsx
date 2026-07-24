"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useFellowship } from "@/hooks/useFellowships";

export default function FellowshipDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { data: fellowship, isLoading } = useFellowship(id);

  React.useEffect(() => {
    if (id) {
      router.push(`/fellowships/${id}/overview`);
    }
  }, [id, router]);

  if (isLoading) {
    return <div className="p-10 text-center animate-pulse">Loading...</div>;
  }

  return null;
}
