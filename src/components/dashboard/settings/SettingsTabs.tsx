/**
 * Settings Tabs Component
 * Semana 9.7: Settings Page
 *
 * Pestañas de configuración con diferentes secciones
 */

"use client";

import { useState } from "react";
import { Tenant } from "@prisma/client";
import {
  Store as StoreIcon,
  Mail,
  CreditCard,
  Truck,
  Receipt,
  Users,
  Bell,
} from "lucide-react";
import { StoreInfoForm } from "./StoreInfoForm";
import { ContactInfoForm } from "./ContactInfoForm";
import { PaymentSettingsForm } from "./PaymentSettingsForm";
import { ShippingSettingsForm } from "./ShippingSettingsForm";
import { TaxSettingsForm } from "./TaxSettingsForm";
import { EmailSettingsForm } from "./EmailSettingsForm";
import { UsersManagement } from "./UsersManagement";

interface SettingsTabsProps {
  store: Tenant;
}

type TabId =
  | "store"
  | "contact"
  | "payment"
  | "shipping"
  | "tax"
  | "email"
  | "users";

interface Tab {
  id: TabId;
  label: string;
  icon: any;
  component: React.ComponentType<{ store: Tenant }>;
}

const tabs: Tab[] = [
  {
    id: "store",
    label: "Información de Tienda",
    icon: StoreIcon,
    component: StoreInfoForm,
  },
  {
    id: "contact",
    label: "Contacto",
    icon: Mail,
    component: ContactInfoForm,
  },
  {
    id: "payment",
    label: "Pagos",
    icon: CreditCard,
    component: PaymentSettingsForm,
  },
  {
    id: "shipping",
    label: "Envíos",
    icon: Truck,
    component: ShippingSettingsForm,
  },
  {
    id: "tax",
    label: "Impuestos",
    icon: Receipt,
    component: TaxSettingsForm,
  },
  {
    id: "email",
    label: "Email",
    icon: Bell,
    component: EmailSettingsForm,
  },
  {
    id: "users",
    label: "Usuarios",
    icon: Users,
    component: UsersManagement,
  },
];

export function SettingsTabs({ store }: SettingsTabsProps) {
  const [activeTab, setActiveTab] = useState<TabId>("store");

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
        {ActiveComponent && <ActiveComponent store={store} />}
      </div>
    </div>
  );
}
