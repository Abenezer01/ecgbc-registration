"use client";

import React from "react";
import { Bell } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="space-y-0.5">
        <h4 className="text-2xl font-bold text-neutral-900">Notifications</h4>
        <p className="text-sm text-neutral-500">Stay updated with important announcements and reminders.</p>
      </div>

      <div className="bg-white rounded-xl border border-neutral-200 p-8">
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="bg-blue-50 p-4 rounded-full mb-4">
            <Bell className="h-8 w-8 text-blue-500" />
          </div>
          <h3 className="text-lg font-medium text-neutral-900 mb-2">No Notifications</h3>
          <p className="text-sm text-neutral-500 max-w-sm">
            You're all caught up! New notifications will appear here.
          </p>
        </div>
      </div>
    </div>
  );
}
