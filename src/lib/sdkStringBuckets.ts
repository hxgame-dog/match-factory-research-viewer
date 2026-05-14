/**
 * 计费 / 广告字符串：按首条命中的规则分桶（顺序敏感，与 ingest 专题分桶思路对齐）。
 */
export type ParsedSdkLine = { raw: string; tag: string; body: string };

/** DEX 行形如 `[classes.dex] …`；il2cpp 候选多为无前缀裸串 */
export function parseSdkLine(raw: string, fallbackTag: string): ParsedSdkLine {
  const m = raw.match(/^\[([^\]]+)]\s*([\s\S]*)$/);
  if (m) {
    const body = (m[2] ?? "").trim();
    return { raw, tag: m[1], body: body.length > 0 ? body : raw.trim() };
  }
  return { raw, tag: fallbackTag, body: raw.trim() };
}

type Rule = { id: string; re: RegExp };

/** 先匹配更具体的 SDK，避免 purchase / Store 等泛词抢 bucket */
const ORDERED_RULES: Rule[] = [
  { id: "appsflyer", re: /AppsFlyer|AFInApp|AFPurchase|PurchaseConnector|appsflyer/i },
  { id: "applovin", re: /applovin|APPLOVIN_MAX|MaxSdk|MAX_/i },
  { id: "admob", re: /admob|AdRequest|MobileAds|GoogleMobileAds/i },
  { id: "unityads", re: /UnityAds|unityads|UnityEngine\.Advertisements|UnityAdsEngine/i },
  { id: "ironsource", re: /ironsource|IronSource/i },
  { id: "meta", re: /facebook|FBSDK|AudienceNetwork/i },
  {
    id: "placement",
    re: /\b(rewarded|interstitial|banner)\b|placement|ad_unit|AdUnit|BANNER_|REWARDED_/i,
  },
  { id: "unity_iap", re: /UnityPurchasing|UnityEngine\.Purchasing|\bZynga\b|CODASHOP/i },
  {
    id: "billing",
    re:
      /BillingClient|PlayBilling|SkuDetails|\bSku\b|queryPurchases|subscriptionPurchase|productPurchase|linkedPurchaseToken|purchaseToken|InAppBilling|InApp|ACKNOWLEDGE_PURCHASE|BillingResult|ProductDetails|PurchaseType|SubscribeWithGoogle|subscriptionOfferDetails/i,
  },
];

export const BUCKET_ORDER = [
  "appsflyer",
  "applovin",
  "admob",
  "unityads",
  "ironsource",
  "meta",
  "placement",
  "unity_iap",
  "billing",
  "other",
] as const;

export type SdkBucketId = (typeof BUCKET_ORDER)[number];

export const BUCKET_LABELS: Record<SdkBucketId, { title: string; hint: string }> = {
  appsflyer: {
    title: "AppsFlyer / 归因",
    hint: "Purchase Connector、AFInApp 等，用于内购归因回传。",
  },
  applovin: { title: "AppLovin MAX", hint: "聚合与 MAX SDK 相关符号。" },
  admob: { title: "AdMob / Google Mobile Ads", hint: "AdRequest、MobileAds 等。" },
  unityads: { title: "Unity Ads", hint: "Unity 官方激励/插屏等 API 名。" },
  ironsource: { title: "ironSource", hint: "LevelPlay / IronSource 相关。" },
  meta: { title: "Meta / Facebook", hint: "FBSDK、Audience Network 等。" },
  placement: {
    title: "版位与形态",
    hint: "rewarded / interstitial / banner、placement、AdUnit 等命名。",
  },
  unity_iap: { title: "Unity IAP / 第三方收银", hint: "UnityPurchasing、Zynga、CODASHOP 等。" },
  billing: {
    title: "Google Play Billing",
    hint: "BillingClient、订阅/一次性购买字段、Sku 等 Java 层证据。",
  },
  other: {
    title: "未归类",
    hint: "未命中上列规则；可全文搜索或导出 CSV 用表格软件透视。",
  },
};

export function assignSdkBucketId(text: string): SdkBucketId {
  for (const r of ORDERED_RULES) {
    if (r.re.test(text)) return r.id as SdkBucketId;
  }
  return "other";
}
