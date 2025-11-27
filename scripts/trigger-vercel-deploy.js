#!/usr/bin/env node

/**
 * Vercel Deployment Trigger Script
 *
 * This script manually triggers a Vercel deployment via the Vercel API
 *
 * Usage:
 *   VERCEL_TOKEN=your_token node scripts/trigger-vercel-deploy.js
 *
 * Get your token from: https://vercel.com/account/tokens
 */

const https = require("https");

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const PROJECT_ID = "SACRINT_Tienda_OnLine"; // Your Vercel project ID
const TEAM_ID = "acme"; // Your Vercel team ID (if applicable)

if (!VERCEL_TOKEN) {
  console.error("ERROR: VERCEL_TOKEN environment variable is not set");
  console.error("Get your token from: https://vercel.com/account/tokens");
  process.exit(1);
}

console.log("🚀 Triggering Vercel deployment...");
console.log(`📦 Project: ${PROJECT_ID}`);
console.log(`🔑 Using token: ${VERCEL_TOKEN.substring(0, 10)}...`);

// Make request to Vercel API
const options = {
  hostname: "api.vercel.com",
  path: `/v1/projects/${PROJECT_ID}/redeploy`,
  method: "POST",
  headers: {
    Authorization: `Bearer ${VERCEL_TOKEN}`,
    "Content-Type": "application/json",
  },
};

const req = https.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log(`\n📊 Response Status: ${res.statusCode}`);

    try {
      const json = JSON.parse(data);

      if (res.statusCode === 201 || res.statusCode === 200) {
        console.log("✅ Deployment triggered successfully!");
        console.log(`📍 Deployment ID: ${json.deploymentId || json.id}`);
        console.log(`🌐 URL: ${json.url || "Check dashboard for details"}`);
        console.log("\n⏳ Your deployment is now building. Check progress at:");
        console.log(`   https://vercel.com/dashboard/project/${PROJECT_ID}`);
        process.exit(0);
      } else {
        console.error("❌ Deployment failed!");
        console.error("Response:", JSON.stringify(json, null, 2));
        process.exit(1);
      }
    } catch (e) {
      console.error("❌ Failed to parse response");
      console.error("Raw response:", data);
      process.exit(1);
    }
  });
});

req.on("error", (e) => {
  console.error("❌ Request failed:", e.message);
  process.exit(1);
});

// Send empty body for POST request
req.write(JSON.stringify({}));
req.end();
