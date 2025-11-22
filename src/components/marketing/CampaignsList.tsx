"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Mail,
  Send,
  Calendar,
  Eye,
  MousePointerClick,
  MoreVertical,
  Play,
  Pause,
  Trash2,
  Copy,
  Edit
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

type Campaign = {
  id: string;
  name: string;
  subject: string;
  status: string;
  scheduledFor?: Date | null;
  sentAt?: Date | null;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  createdAt: Date;
};

type Props = {
  campaigns: Campaign[];
  onDelete?: (id: string) => Promise<void>;
  onDuplicate?: (id: string) => Promise<void>;
  onToggleStatus?: (id: string, newStatus: string) => Promise<void>;
};

export function CampaignsList({ campaigns, onDelete, onDuplicate, onToggleStatus }: Props) {
  const [loading, setLoading] = useState<string | null>(null);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      DRAFT: "secondary",
      SCHEDULED: "outline",
      SENDING: "default",
      SENT: "default",
      PAUSED: "destructive",
      CANCELLED: "destructive",
    };

    return (
      <Badge variant={variants[status] || "default"}>
        {status}
      </Badge>
    );
  };

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleAction = async (id: string, action: () => Promise<void>) => {
    setLoading(id);
    try {
      await action();
    } finally {
      setLoading(null);
    }
  };

  if (campaigns.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Mail className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold mb-2">No hay campañas</h3>
          <p className="text-gray-600 mb-4">
            Crea tu primera campaña de email marketing
          </p>
          <Link href="/dashboard/marketing/campaigns/new">
            <Button>
              <Mail className="mr-2 h-4 w-4" />
              Crear Campaña
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <Card key={campaign.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  {getStatusBadge(campaign.status)}
                </div>
                <CardDescription>
                  <strong>Asunto:</strong> {campaign.subject}
                </CardDescription>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/dashboard/marketing/campaigns/${campaign.id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar
                    </Link>
                  </DropdownMenuItem>

                  {campaign.status === "DRAFT" && onToggleStatus && (
                    <DropdownMenuItem
                      onClick={() => handleAction(campaign.id, () => onToggleStatus(campaign.id, "SCHEDULED"))}
                      disabled={loading === campaign.id}
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Programar
                    </DropdownMenuItem>
                  )}

                  {campaign.status === "PAUSED" && onToggleStatus && (
                    <DropdownMenuItem
                      onClick={() => handleAction(campaign.id, () => onToggleStatus(campaign.id, "SENDING"))}
                      disabled={loading === campaign.id}
                    >
                      <Play className="mr-2 h-4 w-4" />
                      Reanudar
                    </DropdownMenuItem>
                  )}

                  {campaign.status === "SENDING" && onToggleStatus && (
                    <DropdownMenuItem
                      onClick={() => handleAction(campaign.id, () => onToggleStatus(campaign.id, "PAUSED"))}
                      disabled={loading === campaign.id}
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      Pausar
                    </DropdownMenuItem>
                  )}

                  {onDuplicate && (
                    <DropdownMenuItem
                      onClick={() => handleAction(campaign.id, () => onDuplicate(campaign.id))}
                      disabled={loading === campaign.id}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Duplicar
                    </DropdownMenuItem>
                  )}

                  {onDelete && campaign.status === "DRAFT" && (
                    <DropdownMenuItem
                      onClick={() => handleAction(campaign.id, () => onDelete(campaign.id))}
                      disabled={loading === campaign.id}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Eliminar
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Send className="h-4 w-4 mr-1" />
                  Enviados
                </div>
                <div className="text-2xl font-bold">{campaign.totalSent.toLocaleString()}</div>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Eye className="h-4 w-4 mr-1" />
                  Abiertos
                </div>
                <div className="text-2xl font-bold">{campaign.totalOpened.toLocaleString()}</div>
                <div className="text-xs text-gray-500">
                  {campaign.openRate.toFixed(1)}%
                </div>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <MousePointerClick className="h-4 w-4 mr-1" />
                  Clicks
                </div>
                <div className="text-2xl font-bold">{campaign.totalClicked.toLocaleString()}</div>
                <div className="text-xs text-gray-500">
                  {campaign.clickRate.toFixed(1)}%
                </div>
              </div>

              <div>
                <div className="flex items-center text-gray-600 mb-1">
                  <Calendar className="h-4 w-4 mr-1" />
                  {campaign.status === "SENT" ? "Enviado" : "Programado"}
                </div>
                <div className="text-sm font-medium">
                  {formatDate(campaign.status === "SENT" ? campaign.sentAt : campaign.scheduledFor)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
