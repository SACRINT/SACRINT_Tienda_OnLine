/**
 * Referral Program, Social Commerce & Influencer Partnership
 * Semana 37, Tarea 37.7, 37.10, 37.11: Referral, Social Commerce & Influencer
 */

import { logger } from "@/lib/monitoring";

// REFERRAL PROGRAM
export interface ReferralLink {
  id: string;
  referrerId: string;
  code: string;
  clicks: number;
  conversions: number;
  earnings: number;
  createdAt: Date;
}

// SOCIAL COMMERCE
export interface SocialPost {
  id: string;
  platform: "instagram" | "facebook" | "tiktok" | "pinterest";
  content: string;
  imageUrl?: string;
  products: string[];
  engagementMetrics: {
    likes: number;
    comments: number;
    shares: number;
    clicks: number;
  };
  createdAt: Date;
}

// INFLUENCER PARTNERSHIP
export interface InfluencerCollaboration {
  id: string;
  influencerId: string;
  campaignName: string;
  budget: number;
  followers: number;
  engagementRate: number;
  status: "active" | "completed" | "paused";
}

export class ReferralSocialInfluencerManager {
  private referralLinks: Map<string, ReferralLink> = new Map();
  private socialPosts: Map<string, SocialPost> = new Map();
  private influencerCollaborations: Map<string, InfluencerCollaboration> = new Map();

  constructor() {
    logger.debug(
      { type: "referral_social_init" },
      "Referral, Social & Influencer Manager inicializado",
    );
  }

  // ==================== REFERRAL PROGRAM ====================

  /**
   * Crear referral link
   */
  createReferralLink(referrerId: string): ReferralLink {
    const code = `ref_${referrerId}_${Math.random().toString(36).substring(7)}`;

    const link: ReferralLink = {
      id: `reflink_${Date.now()}_${Math.random()}`,
      referrerId,
      code,
      clicks: 0,
      conversions: 0,
      earnings: 0,
      createdAt: new Date(),
    };

    this.referralLinks.set(link.id, link);
    logger.info({ type: "referral_link_created", referrerId, code }, `Link de referencia creado`);

    return link;
  }

  /**
   * Registrar click en referral link
   */
  recordReferralClick(linkId: string): boolean {
    const link = this.referralLinks.get(linkId);
    if (!link) return false;

    link.clicks++;
    return true;
  }

  /**
   * Registrar conversión de referral
   */
  recordReferralConversion(linkId: string, amount: number): boolean {
    const link = this.referralLinks.get(linkId);
    if (!link) return false;

    link.conversions++;
    link.earnings += amount * 0.1; // 10% commission

    logger.info(
      { type: "referral_conversion", linkId, amount, commission: amount * 0.1 },
      "Conversión registrada",
    );

    return true;
  }

  // ==================== SOCIAL COMMERCE ====================

  /**
   * Crear post de social commerce
   */
  createSocialPost(
    platform: SocialPost["platform"],
    content: string,
    products: string[],
    imageUrl?: string,
  ): SocialPost {
    const post: SocialPost = {
      id: `socpost_${Date.now()}_${Math.random()}`,
      platform,
      content,
      products,
      imageUrl,
      engagementMetrics: {
        likes: 0,
        comments: 0,
        shares: 0,
        clicks: 0,
      },
      createdAt: new Date(),
    };

    this.socialPosts.set(post.id, post);
    logger.info(
      { type: "social_post_created", platform, productCount: products.length },
      `Post de social commerce creado`,
    );

    return post;
  }

  /**
   * Registrar engagement
   */
  recordEngagement(postId: string, type: "like" | "comment" | "share" | "click"): boolean {
    const post = this.socialPosts.get(postId);
    if (!post) return false;

    switch (type) {
      case "like":
        post.engagementMetrics.likes++;
        break;
      case "comment":
        post.engagementMetrics.comments++;
        break;
      case "share":
        post.engagementMetrics.shares++;
        break;
      case "click":
        post.engagementMetrics.clicks++;
        break;
    }

    return true;
  }

  // ==================== INFLUENCER PARTNERSHIPS ====================

  /**
   * Crear colaboración con influencer
   */
  createInfluencerCollaboration(
    influencerId: string,
    campaignName: string,
    budget: number,
    followers: number,
  ): InfluencerCollaboration {
    const collaboration: InfluencerCollaboration = {
      id: `inflcollab_${Date.now()}_${Math.random()}`,
      influencerId,
      campaignName,
      budget,
      followers,
      engagementRate: Math.random() * 10, // 0-10%
      status: "active",
    };

    this.influencerCollaborations.set(collaboration.id, collaboration);
    logger.info(
      { type: "influencer_collab_created", influencerId, budget, followers },
      `Colaboración con influencer creada: ${campaignName}`,
    );

    return collaboration;
  }

  /**
   * Obtener estadísticas de influencer
   */
  getInfluencerStats(influencerId: string): {
    totalBudget: number;
    totalFollowers: number;
    averageEngagement: number;
    collaborationsCount: number;
  } {
    const collabs = Array.from(this.influencerCollaborations.values()).filter(
      (c) => c.influencerId === influencerId,
    );

    const totalBudget = collabs.reduce((sum, c) => sum + c.budget, 0);
    const totalFollowers = collabs.reduce((sum, c) => sum + c.followers, 0);
    const avgEngagement =
      collabs.length > 0
        ? collabs.reduce((sum, c) => sum + c.engagementRate, 0) / collabs.length
        : 0;

    return {
      totalBudget,
      totalFollowers,
      averageEngagement: Math.round(avgEngagement * 100) / 100,
      collaborationsCount: collabs.length,
    };
  }

  /**
   * Obtener top performing posts
   */
  getTopSocialPosts(limit: number = 10): SocialPost[] {
    return Array.from(this.socialPosts.values())
      .sort((a, b) => {
        const aEngagement =
          a.engagementMetrics.likes + a.engagementMetrics.comments + a.engagementMetrics.shares;
        const bEngagement =
          b.engagementMetrics.likes + b.engagementMetrics.comments + b.engagementMetrics.shares;
        return bEngagement - aEngagement;
      })
      .slice(0, limit);
  }

  /**
   * Obtener top referrers
   */
  getTopReferrers(
    limit: number = 10,
  ): Array<{ referrerId: string; earnings: number; conversions: number }> {
    const referrerStats: Record<string, { earnings: number; conversions: number }> = {};

    for (const link of this.referralLinks.values()) {
      if (!referrerStats[link.referrerId]) {
        referrerStats[link.referrerId] = { earnings: 0, conversions: 0 };
      }
      referrerStats[link.referrerId].earnings += link.earnings;
      referrerStats[link.referrerId].conversions += link.conversions;
    }

    return Object.entries(referrerStats)
      .map(([referrerId, stats]) => ({ referrerId, ...stats }))
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, limit);
  }
}

let globalManager: ReferralSocialInfluencerManager | null = null;

export function initializeReferralSocialInfluencer(): ReferralSocialInfluencerManager {
  if (!globalManager) {
    globalManager = new ReferralSocialInfluencerManager();
  }
  return globalManager;
}

export function getReferralSocialInfluencer(): ReferralSocialInfluencerManager {
  if (!globalManager) {
    return initializeReferralSocialInfluencer();
  }
  return globalManager;
}
