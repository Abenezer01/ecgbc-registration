"use client";

import React, { useState } from "react";
import { Lock, User, Bell, Shield, Save } from "lucide-react";
import { Button, FormField, Input } from "@/components/ui";
import { useAuthStore } from "@/store/auth.store";

export default function SettingsPage() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);

  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    // TODO: Implement profile update API call
    setTimeout(() => {
      setIsSaving(false);
    }, 1000);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("Passwords do not match");
      return;
    }
    setIsSaving(true);
    // TODO: Implement password change API call
    setTimeout(() => {
      setIsSaving(false);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    }, 1000);
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "security", label: "Security", icon: Lock },
    { id: "notifications", label: "Notifications", icon: Bell },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="space-y-0.5">
        <h4 className="text-2xl font-bold text-neutral-900">Settings</h4>
        <p className="text-sm text-neutral-500">Manage your account settings and preferences.</p>
      </div>

      <div className="flex gap-6">
        <div className="w-48 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-white"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-xl border border-neutral-200 p-6">
          {activeTab === "profile" && (
            <form onSubmit={handleProfileSave} className="space-y-6">
              <h5 className="text-lg font-semibold text-neutral-900 mb-4">Profile Information</h5>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField id="firstName" label="First Name">
                  <Input
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                  />
                </FormField>

                <FormField id="lastName" label="Last Name">
                  <Input
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                  />
                </FormField>

                <FormField id="profileEmail" label="Email">
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                  />
                </FormField>

                <FormField id="profilePhone" label="Phone">
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  />
                </FormField>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
                <Button type="submit" disabled={isSaving} className="gap-1.5">
                  <Save className="h-4 w-4" /> {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          )}

          {activeTab === "security" && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <h5 className="text-lg font-semibold text-neutral-900 mb-4">Change Password</h5>
              
              <FormField id="currentPassword" label="Current Password">
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="Enter current password"
                />
              </FormField>

              <FormField id="newPassword" label="New Password">
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
              </FormField>

              <FormField id="confirmPassword" label="Confirm New Password">
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </FormField>

              <div className="flex items-center gap-3 pt-4 border-t border-neutral-200">
                <Button type="submit" disabled={isSaving} className="gap-1.5">
                  <Shield className="h-4 w-4" /> {isSaving ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-4">
              <h5 className="text-lg font-semibold text-neutral-900 mb-4">Notification Preferences</h5>
              <p className="text-sm text-neutral-500 italic">Notification settings coming soon.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
