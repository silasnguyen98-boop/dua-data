"use client";

// Firebase App Check is disabled locally to avoid opening Firebase connections
// during normal page usage. Keep this module as a no-op so existing forms can
// submit without requiring Firebase client initialization.

// import { initializeAppCheck, getToken, ReCaptchaV3Provider, type AppCheck } from "firebase/app-check";
// import { ReCaptchaEnterpriseProvider } from "firebase/app-check";
// import { app } from "./firebase";

// let appCheckInstance: AppCheck | null = null;

function getSiteKey() {
  return process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_SITE_KEY || "";
}

function getProviderType() {
  return (process.env.NEXT_PUBLIC_FIREBASE_APPCHECK_PROVIDER || "v3").toLowerCase();
}

export function isAppCheckEnabled() {
  return false;
}

export function getAppCheckTokenHeaderName() {
  return "X-Firebase-AppCheck";
}

export async function getAppCheckHeaders() {
  return {};

  // const siteKey = getSiteKey();
  // if (!siteKey || typeof window === "undefined") {
  //   return {};
  // }
  //
  // if (!appCheckInstance) {
  //   const providerType = getProviderType();
  //   const provider =
  //     providerType === "enterprise"
  //       ? new ReCaptchaEnterpriseProvider(siteKey)
  //       : new ReCaptchaV3Provider(siteKey);
  //
  //   appCheckInstance = initializeAppCheck(app, {
  //     provider,
  //     isTokenAutoRefreshEnabled: true,
  //   });
  // }
  //
  // const tokenResponse = await getToken(appCheckInstance, false);
  // return {
  //   [getAppCheckTokenHeaderName()]: tokenResponse.token,
  // };
}
