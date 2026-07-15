"use client";

import React from "react";
import { useAuth } from "../../context/AuthContext";

interface RequirePermissionProps {
  permission: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequirePermission({ permission, children, fallback = null }: RequirePermissionProps) {
  const { hasPermission, isLoading } = useAuth();

  if (isLoading) {
    // Return an empty fragment or an optional loading skeleton 
    // depending on where this is used.
    return <></>; 
  }

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
