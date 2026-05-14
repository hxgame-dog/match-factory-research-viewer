/**
 * 商城 / 礼包 / 内购：从 Il2Cpp 字符串与类名、以及 DEX 行中筛「策划与商城逻辑」相关证据。
 * 与广告版位（Banner*、纯 HTTP 等）分离；不等于线上真实 SKU 全表。
 */

/** 命中任一则视为「可能与商城/内购有关」 */
const SHOP_SIGNAL =
  /Shop|Offer|Starter|Flash|Special|Bundle|Pack|Gift|Purchase|Billing|Sku|\bIAP\b|CODASHOP|FactoryPass|Dialogs\/Shop|Datasets\/(StarterOffer|FlashOffer)|ABTest_(Shop|FlashOffer|StarterOffer|SpecialOffer|Beginner|PackLevelCoin)|Beginner|Legendary|Giant|GetOffer|SetStarter|PurchaseSpecial|AvailableOffer|ItemPack|ShopBundle|MergeGift|SupportGift|FreePack|offer dialog|Applying purchase|Current offer|EditorPending|ConsumePurchase|IsPurchased|GetPurchases|AppsFlyer.*Purchase|PurchaseConnector|ProductDetails|subscriptionOffer|OneTimePurchaseOffer/i;

/** 明显是广告版位或纯网络栈、且无商城关键词时排除 */
const AD_OR_HTTP_NOISE =
  /^(HTTP\/|BestHTTP|Http Request|Http Response|WebSocket|BannerCoin|BannerPre|Banner|AdMob|APPLOVIN|MaxSdk|UnityAds|IronSource|Interstitial|Rewarded)/i;

export function isLikelyShopEvidence(text: string): boolean {
  const t = text.trim();
  if (t.length < 4) return false;
  if (AD_OR_HTTP_NOISE.test(t) && !/Shop|Offer|Purchase|Billing|IAP|Bundle|Sku|CODASHOP|Dialogs\/Shop|Datasets\//i.test(t)) {
    return false;
  }
  return SHOP_SIGNAL.test(t);
}

export function isShopRelatedClassName(name: string): boolean {
  return isLikelyShopEvidence(name);
}

type Rule = { id: string; re: RegExp };

const SHOP_RULES: Rule[] = [
  {
    id: "named_products",
    re: /Beginner Bundle|Legendary Bundle|Giant Bundle|\bFactory World\b|Factory World/i,
  },
  { id: "datasets_ui", re: /Dialogs\/Shop|Datasets\/StarterOffer|Datasets\/FlashOffer|ShopLoading|ShopDialog/i },
  {
    id: "ab_tests",
    re: /ABTest_Shop|ABTest_FlashOffer|ABTest_StarterOffer|ABTest_SpecialOffer|ABTest_Beginner|ABTest_PackLevelCoin/i,
  },
  {
    id: "offer_runtime",
    re: /Current offer|offer dialog|Flash offer|AvailableOfferTypes|FirstTimeOffer|GetOffer|SetStarter|PurchaseSpecial|Cannot find offer|offer is disabled/i,
  },
  {
    id: "pass_gift_pack",
    re: /FactoryPass|SupportGift|MergeGift|ItemPack|PackJourney|FreePack|ComingSoon.*Pack|Downloadable.*Pack|Giftbox|WelcomeBack/i,
  },
  {
    id: "shop_types",
    re: /ShopBundle|ShopItem|GetOffersInfo|GetStarterOffer|GetSpecialOffer|SubscriptionPurchase|ShopData|IAPButton/i,
  },
  {
    id: "attribution_iap",
    re: /AppsFlyer.*Purchase|PurchaseConnector|AFPurchase|OneTimePurchaseOffer|SubscriptionOfferDetails/i,
  },
  {
    id: "billing_tech",
    re: /Billing|SkuDetails|\bSku\b|queryPurchases|InApp|PlayBilling|purchaseToken|productPurchase|subscriptionPurchase|EditorPending|Applying purchase|ConsumePurchase|GetPurchases|IsPurchased/i,
  },
];

export const SHOP_BUCKET_ORDER = [
  "named_products",
  "datasets_ui",
  "ab_tests",
  "offer_runtime",
  "pass_gift_pack",
  "shop_types",
  "attribution_iap",
  "billing_tech",
  "other_shop",
] as const;

export type ShopBucketId = (typeof SHOP_BUCKET_ORDER)[number];

export const SHOP_BUCKET_LABELS: Record<ShopBucketId, { title: string; hint: string }> = {
  named_products: {
    title: "可见商品 / 礼包命名",
    hint: "客户端内嵌或资源里出现的文案型名称，多为展示用；完整商品矩阵仍以服务端为准。",
  },
  datasets_ui: {
    title: "配置路径与商城 UI",
    hint: "Addressables / 预制体路径，如 ShopDialog、StarterOffer 数据集等。",
  },
  ab_tests: {
    title: "商城相关 AB",
    hint: "与商店、闪购、首购、新手包等实验开关相关的字符串。",
  },
  offer_runtime: {
    title: "Offer / 促销逻辑",
    hint: "运行时 offer 文案、禁用提示、拉取失败等日志类线索。",
  },
  pass_gift_pack: {
    title: "通行证 / 礼包 / 合成树",
    hint: "FactoryPass、礼包入口、ItemPack 等与付费内容包装相关。",
  },
  shop_types: {
    title: "商城类型与网络消息名",
    hint: "C# 类型名：如 GetOffersInfo、ShopBundleItemView 等，可回 dump.cs 精读。",
  },
  attribution_iap: {
    title: "归因与内购回传",
    hint: "AppsFlyer Purchase Connector 等与「买完上报」相关，不是广告瀑布流本身。",
  },
  billing_tech: {
    title: "Google Play / Billing 技术字段",
    hint: "Sku、Purchase、BillingClient 等 API 层证据，用于证明内购通道，不是商品中文名列表。",
  },
  other_shop: {
    title: "其它商城相关",
    hint: "命中商城信号但未归入上列；可结合全文搜索继续筛。",
  },
};

export function assignShopBucketId(text: string): ShopBucketId {
  for (const r of SHOP_RULES) {
    if (r.re.test(text)) return r.id as ShopBucketId;
  }
  return "other_shop";
}
