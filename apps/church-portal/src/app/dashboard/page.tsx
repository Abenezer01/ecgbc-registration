"use client";

import { useAuthStore } from "@/store/auth.store";
import { Church, MapPin, Hash, UserCheck } from "lucide-react";

export default function DashboardPage() {
  const { church, user } = useAuthStore();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-6 flex items-center">
          <Church className="w-5 h-5 mr-2 text-primary" />
          Church Profile
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-500 flex items-center">
              <Church className="w-4 h-4 mr-1.5" />
              Church Name
            </span>
            <p className="text-base font-semibold text-neutral-900">{church?.name}</p>
          </div>

          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-500 flex items-center">
              <Hash className="w-4 h-4 mr-1.5" />
              Certificate No.
            </span>
            <p className="text-base font-semibold text-neutral-900">{church?.certificateNo}</p>
          </div>

          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-500 flex items-center">
              <MapPin className="w-4 h-4 mr-1.5" />
              State / Region
            </span>
            <p className="text-base font-semibold text-neutral-900">{church?.state}</p>
          </div>

          <div className="space-y-1">
            <span className="text-sm font-medium text-neutral-500 flex items-center">
              <UserCheck className="w-4 h-4 mr-1.5" />
              Church Type
            </span>
            <p className="text-base font-semibold text-neutral-900">{church?.type}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Recent Activity
          </h3>
          <p className="text-sm text-neutral-500 italic">
            Activity logging will appear here soon.
          </p>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">
            Required Documents
          </h3>
          <p className="text-sm text-neutral-500 italic">
            Document completeness checks will appear here soon.
          </p>
        </div>
      </div>
    </div>
  );
}
