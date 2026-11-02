import { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";

export interface ApiKeyItem {
  id: string;
  name: string;
  description: string | null;
  keyPrefix: string;
  scopes: string[];
  isActive: boolean;
  rateLimit: number;
  allowedIps: string | null;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
}

export interface CreateApiKeyPayload {
  name: string;
  description?: string;
  scopes: string[];
  rateLimit?: number;
  allowedIps?: string;
  expiresAt?: string | null;
}

export interface CreateApiKeyResponse {
  apiKey: ApiKeyItem;
  plainKey: string;
}

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKeys = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get("/api-keys");
      setKeys(res.data?.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load API keys.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  const createKey = async (payload: CreateApiKeyPayload): Promise<CreateApiKeyResponse> => {
    const res = await api.post("/api-keys", payload);
    await fetchKeys();
    return res.data.data;
  };

  const updateKey = async (id: string, data: Partial<ApiKeyItem>) => {
    await api.patch(`/api-keys/${id}`, data);
    await fetchKeys();
  };

  const toggleKeyStatus = async (id: string, currentActive: boolean) => {
    await updateKey(id, { isActive: !currentActive });
  };

  const regenerateKey = async (id: string): Promise<{ plainKey: string }> => {
    const res = await api.post(`/api-keys/${id}/regenerate`);
    await fetchKeys();
    return res.data.data;
  };

  const deleteKey = async (id: string) => {
    await api.delete(`/api-keys/${id}`);
    await fetchKeys();
  };

  return {
    keys,
    loading,
    error,
    fetchKeys,
    createKey,
    updateKey,
    toggleKeyStatus,
    regenerateKey,
    deleteKey,
  };
}
