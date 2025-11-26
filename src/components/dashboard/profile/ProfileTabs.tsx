/**
 * Profile Tabs Component
 * Semana 9.8: Profile Management
 *
 * Pestañas de perfil: información personal, seguridad, sesiones, API
 */

"use client";

import { useState } from "react";
import { User, Session } from "@prisma/client";
import { User as UserIcon, Lock, Monitor, Key } from "lucide-react";
import { PersonalInfoForm } from "./PersonalInfoForm";
import { SecurityForm } from "./SecurityForm";
import { SessionsList } from "./SessionsList";
import { APIKeysManagement } from "./APIKeysManagement";

interface ProfileTabsProps {
  user: User & {
    sessions: Session[];
  };
  storeId: string;
}

type TabId = "personal" | "security" | "sessions" | "api";

interface Tab {
  id: TabId;
  label: string;
  icon: any;
  component: React.ComponentType<any>;
}

const tabs: Tab[] = [
  {
    id: "personal",
    label: "Información Personal",
    icon: UserIcon,
    component: PersonalInfoForm,
  },
  {
    id: "security",
    label: "Seguridad",
    icon: Lock,
    component: SecurityForm,
  },
  {
    id: "sessions",
    label: "Sesiones Activas",
    icon: Monitor,
    component: SessionsList,
  },
  {
    id: "api",
    label: "API Keys",
    icon: Key,
    component: APIKeysManagement,
  },
];

export function ProfileTabs({ user, storeId }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("personal");

  const ActiveComponent = tabs.find((t) => t.id === activeTab)?.component;

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    isActive
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        {ActiveComponent && (
          <ActiveComponent user={user} storeId={storeId} />
        )}
      </div>
    </div>
  );
}
