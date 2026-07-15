"use client";

import React, { useState } from "react";
import { Church, MapPin, Phone, Mail, Save, Building2 } from "lucide-react";
import { Button, FormField, Input } from "@/components/ui";
import { useAuthStore } from "@/store/auth.store";

export default function ProfilePage() {
  const { church } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: church?.name || "",
    address: "",
    phone: "",
    email: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // TODO: Implement profile update API call
    setTimeout(() => {
      setIsSaving(false);
      setIsEditing(false);
    }, 1000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="text-2xl font-bold text-neutral-900">Church Profile</h4>
          <p className="text-sm text-neutral-500">Manage your church's information and contact details.</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} className="gap-1.5">
            <Building2 className="h-4 w-4" /> Edit Profile
          </Button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField id="name" label="Church Name">
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter church name"
              />
            </FormField>

            <FormField id="certificate" label="Certificate Number">
              <Input
                value={church?.certificateNo || ""}
                disabled
                placeholder="Certificate number"
              />
            </FormField>

            <FormField id="address" label="Address">
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter church address"
              />
            </FormField>

            <FormField id="phone" label="Phone Number">
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter phone number"
              />
            </FormField>

            <FormField id="email" label="Email Address">
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!isEditing}
                placeholder="Enter email address"
              />
            </FormField>

            <FormField id="state" label="State/Region">
              <Input
                value={church?.state || ""}
                disabled
                placeholder="State or region"
              />
            </FormField>
          </div>

          {isEditing && (
            <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
              <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="gap-1.5">
                <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
