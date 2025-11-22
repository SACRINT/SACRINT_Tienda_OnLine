import { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Mail, Plus } from "lucide-react";
import { CampaignsList } from "@/components/marketing/CampaignsList";

export const metadata: Metadata = {
  title: "Email Campaigns | Marketing Dashboard",
  description: "Manage your email marketing campaigns",
};

export default async function CampaignsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Get user's tenant
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { tenantId: true },
  });

  if (!user?.tenantId) {
    throw new Error("User has no tenant");
  }

  // Fetch campaigns for this tenant
  const campaigns = await db.emailCampaign.findMany({
    where: {
      tenantId: user.tenantId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      _count: {
        select: {
          sends: true,
        },
      },
    },
  });

  // Calculate stats for each campaign
  const campaignsWithStats = await Promise.all(
    campaigns.map(async (campaign: any) => {
      const stats = await db.emailSend.aggregate({
        where: {
          campaignId: campaign.id,
        },
        _count: true,
        _sum: {
          opened: true,
          clicked: true,
        },
      });

      const totalSent = stats._count || 0;
      const totalOpened = stats._sum.opened || 0;
      const totalClicked = stats._sum.clicked || 0;

      return {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        status: campaign.status,
        scheduledFor: campaign.scheduledFor,
        sentAt: campaign.sentAt,
        createdAt: campaign.createdAt,
        totalSent,
        totalOpened,
        totalClicked,
        openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
        clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
      };
    }),
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Mail className="h-8 w-8" />
            Email Campaigns
          </h1>
          <p className="mt-2 text-gray-600">Create and manage your email marketing campaigns</p>
        </div>

        <Link href="/dashboard/marketing/campaigns/new">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            Nueva Campaña
          </Button>
        </Link>
      </div>

      <CampaignsList campaigns={campaignsWithStats} />
    </div>
  );
}
