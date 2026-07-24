"use client";

import React from "react";
import { Pencil, ShieldAlert, MapPin } from "lucide-react";
import { Button, Badge } from "@/components/ui";

interface HeroSectionProps {
  fellowship: any;
  canEdit: boolean;
  canDeactivate: boolean;
  onEdit?: () => void;
  onDeactivate?: () => void;
}

export function HeroSection({ fellowship, canEdit, canDeactivate, onEdit, onDeactivate }: HeroSectionProps) {
  const f = fellowship as any;
  const initials = (f.name || "F")?.[0]?.toUpperCase() || "?";

  return (
    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-white relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      <div className="relative flex items-start gap-6">
        {/* Avatar */}
        <div className="h-20 w-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center text-4xl font-bold border-2 border-white/30 shadow-lg">
          {initials}
        </div>

        {/* Info */}
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">
              {f.name}
            </h1>
            <Badge variant={f.isActive ? "success" : "danger"} className="bg-white/20 text-white border-white/30 hover:bg-white/30">
              {f.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
            <span className="font-mono bg-white/10 px-2 py-1 rounded">
              {f.certificateNo || "No Certificate"}
            </span>
            {f.region?.name && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {f.region.name}
              </span>
            )}
            {f.city && (
              <span>• {f.city}</span>
            )}
            {f.isInEthiopia !== undefined && (
              <span>• {f.isInEthiopia ? "Ethiopia" : "International"}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {canEdit && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onEdit}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30"
            >
              <Pencil className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canDeactivate && (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={onDeactivate}
              className="bg-red-500/20 hover:bg-red-500/30 text-white border-red-500/30"
            >
              <ShieldAlert className="h-4 w-4 mr-2" />
              Settings
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
