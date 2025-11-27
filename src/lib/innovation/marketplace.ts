/**
 * Marketplace Manager
 * Semana 54, Tarea 54.5: Plugin & Marketplace Ecosystem
 */

import { logger } from "@/lib/monitoring";

export interface Marketplace {
  id: string;
  category: string;
  pluginCount: number;
  totalDownloads: number;
  averageRating: number;
  status: "active" | "maintenance";
}

export interface Plugin {
  id: string;
  pluginName: string;
  developer: string;
  category: string;
  rating: number;
  downloads: number;
  version: string;
  status: "published" | "draft" | "deprecated";
}

export class MarketplaceManager {
  private marketplaces: Map<string, Marketplace> = new Map();
  private plugins: Map<string, Plugin> = new Map();

  constructor() {
    logger.debug({ type: "marketplace_init" }, "Manager inicializado");
  }

  publishPlugin(pluginName: string, developer: string, category: string, version: string): Plugin {
    const id = "plugin_" + Date.now();
    const plugin: Plugin = {
      id,
      pluginName,
      developer,
      category,
      rating: 0,
      downloads: 0,
      version,
      status: "published",
    };

    this.plugins.set(id, plugin);
    logger.info({ type: "plugin_published", pluginId: id }, `Plugin publicado: ${pluginName}`);
    return plugin;
  }

  recordDownload(pluginId: string): Plugin | null {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return null;

    plugin.downloads++;
    return plugin;
  }

  getStatistics(): Record<string, any> {
    const plugins = Array.from(this.plugins.values());

    return {
      totalPlugins: plugins.length,
      totalDownloads: plugins.reduce((sum, p) => sum + p.downloads, 0),
      byStatus: {
        published: plugins.filter((p) => p.status === "published").length,
        draft: plugins.filter((p) => p.status === "draft").length,
        deprecated: plugins.filter((p) => p.status === "deprecated").length,
      },
      averageRating:
        plugins.length > 0 ? plugins.reduce((sum, p) => sum + p.rating, 0) / plugins.length : 0,
    };
  }

  generateMarketplaceReport(): string {
    const stats = this.getStatistics();
    return `Marketplace Report\nTotal Plugins: ${stats.totalPlugins}\nDownloads: ${stats.totalDownloads}\nAvg Rating: ${stats.averageRating.toFixed(2)}`;
  }
}

let globalMarketplaceManager: MarketplaceManager | null = null;

export function getMarketplaceManager(): MarketplaceManager {
  if (!globalMarketplaceManager) {
    globalMarketplaceManager = new MarketplaceManager();
  }
  return globalMarketplaceManager;
}
