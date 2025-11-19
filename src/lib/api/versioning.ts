// API Versioning
// Version management for API endpoints

export type ApiVersion = "v1" | "v2";

export const CURRENT_VERSION: ApiVersion = "v1";
export const SUPPORTED_VERSIONS: ApiVersion[] = ["v1"];
export const DEPRECATED_VERSIONS: ApiVersion[] = [];

export interface VersionInfo {
  version: ApiVersion;
  status: "current" | "supported" | "deprecated" | "unsupported";
  deprecatedAt?: Date;
  sunsetAt?: Date;
  changelog?: string;
}

// Get version info
export function getVersionInfo(version: ApiVersion): VersionInfo {
  if (version === CURRENT_VERSION) {
    return {
      version,
      status: "current",
    };
  }

  if (SUPPORTED_VERSIONS.includes(version)) {
    return {
      version,
      status: "supported",
    };
  }

  if (DEPRECATED_VERSIONS.includes(version)) {
    return {
      version,
      status: "deprecated",
      deprecatedAt: new Date("2024-01-01"),
      sunsetAt: new Date("2025-01-01"),
    };
  }

  return {
    version,
    status: "unsupported",
  };
}

// Extract version from request
export function extractVersion(request: Request): ApiVersion {
  // Check URL path
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/\/api\/(v\d+)\//);
  if (pathMatch && SUPPORTED_VERSIONS.includes(pathMatch[1] as ApiVersion)) {
    return pathMatch[1] as ApiVersion;
  }

  // Check header
  const headerVersion = request.headers.get("X-API-Version");
  if (headerVersion && SUPPORTED_VERSIONS.includes(headerVersion as ApiVersion)) {
    return headerVersion as ApiVersion;
  }

  // Check query param
  const queryVersion = url.searchParams.get("api_version");
  if (queryVersion && SUPPORTED_VERSIONS.includes(queryVersion as ApiVersion)) {
    return queryVersion as ApiVersion;
  }

  return CURRENT_VERSION;
}

// Add version headers to response
export function addVersionHeaders(
  headers: Headers,
  version: ApiVersion
): void {
  headers.set("X-API-Version", version);
  headers.set("X-API-Current-Version", CURRENT_VERSION);

  const info = getVersionInfo(version);
  if (info.status === "deprecated") {
    headers.set("X-API-Deprecated", "true");
    if (info.sunsetAt) {
      headers.set("Sunset", info.sunsetAt.toUTCString());
    }
  }
}

// Check if version is supported
export function isVersionSupported(version: string): boolean {
  return SUPPORTED_VERSIONS.includes(version as ApiVersion);
}

// Version-specific response transformer
export function transformResponse(
  data: unknown,
  version: ApiVersion
): unknown {
  // Transform response based on version
  // Add version-specific transformations here
  switch (version) {
    case "v1":
    default:
      return data;
  }
}
