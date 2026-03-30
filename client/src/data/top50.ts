// Top 50 publicly traded companies by market cap (2024-2025 data)
// All revenue/earnings figures in billions USD unless noted
// Operational metrics sourced from company annual reports & analyst coverage

export type Sector =
  | "Technology"
  | "Consumer"
  | "Financial"
  | "Healthcare"
  | "Energy"
  | "Industrial"
  | "Telecom"
  | "Semiconductor"
  | "Luxury"
  | "Auto";

export interface MetricSeries {
  label: string;
  unit: string;
  description: string;
  category: "operational" | "financial" | "user" | "product" | "infrastructure";
  // For cross-company comparison
  compareKey?: string;
  data: { year: number; value: number }[];
}

export interface Company {
  rank: number;
  ticker: string;
  name: string;
  shortName: string;
  sector: Sector;
  country: string;
  marketCap: number; // billions USD
  color: string; // brand accent color
  description: string;
  // Standard financials (billions USD)
  revenue: { year: number; value: number }[];
  netIncome: { year: number; value: number }[];
  grossMargin: { year: number; value: number }[]; // percentage
  operatingMargin: { year: number; value: number }[]; // percentage
  eps: { year: number; value: number }[];
  // Unique operational metrics
  metrics: MetricSeries[];
}

export const TOP50: Company[] = [
  {
    rank: 1,
    ticker: "NVDA",
    name: "NVIDIA Corporation",
    shortName: "NVIDIA",
    sector: "Semiconductor",
    country: "USA",
    marketCap: 3360,
    color: "#76b900",
    description: "Dominant GPU maker, now the backbone of AI compute infrastructure globally.",
    revenue: [
      { year: 2019, value: 11.7 }, { year: 2020, value: 10.9 }, { year: 2021, value: 16.7 },
      { year: 2022, value: 26.9 }, { year: 2023, value: 44.9 }, { year: 2024, value: 130.5 },
    ],
    netIncome: [
      { year: 2019, value: 4.1 }, { year: 2020, value: 4.3 }, { year: 2021, value: 4.3 },
      { year: 2022, value: 4.0 }, { year: 2023, value: 29.7 }, { year: 2024, value: 72.9 },
    ],
    grossMargin: [
      { year: 2019, value: 61.2 }, { year: 2020, value: 62.3 }, { year: 2021, value: 64.9 },
      { year: 2022, value: 56.9 }, { year: 2023, value: 66.8 }, { year: 2024, value: 74.6 },
    ],
    operatingMargin: [
      { year: 2019, value: 23.1 }, { year: 2020, value: 28.5 }, { year: 2021, value: 36.2 },
      { year: 2022, value: 16.1 }, { year: 2023, value: 54.1 }, { year: 2024, value: 62.2 },
    ],
    eps: [
      { year: 2019, value: 1.67 }, { year: 2020, value: 1.73 }, { year: 2021, value: 1.74 },
      { year: 2022, value: 1.62 }, { year: 2023, value: 12.05 }, { year: 2024, value: 29.76 },
    ],
    metrics: [
      {
        label: "Data Center Revenue",
        unit: "B USD",
        description: "Annual revenue from data center segment (AI/HPC GPUs)",
        category: "product",
        compareKey: "datacenter_revenue",
        data: [
          { year: 2021, value: 1.9 }, { year: 2022, value: 3.8 }, { year: 2023, value: 18.4 },
          { year: 2024, value: 115.2 },
        ],
      },
      {
        label: "Gaming Revenue",
        unit: "B USD",
        description: "Annual revenue from gaming GPU segment",
        category: "product",
        data: [
          { year: 2020, value: 7.8 }, { year: 2021, value: 12.5 }, { year: 2022, value: 9.1 },
          { year: 2023, value: 10.4 }, { year: 2024, value: 11.4 },
        ],
      },
      {
        label: "H100 / H200 Shipments",
        unit: "K units",
        description: "Estimated annual shipments of flagship AI GPU (H100/H200 series)",
        category: "product",
        data: [
          { year: 2022, value: 35 }, { year: 2023, value: 550 }, { year: 2024, value: 2200 },
        ],
      },
      {
        label: "R&D Spend",
        unit: "B USD",
        description: "Annual research & development expenditure",
        category: "financial",
        compareKey: "rd_spend",
        data: [
          { year: 2019, value: 2.8 }, { year: 2020, value: 2.8 }, { year: 2021, value: 3.9 },
          { year: 2022, value: 7.0 }, { year: 2023, value: 8.7 }, { year: 2024, value: 12.9 },
        ],
      },
      {
        label: "CUDA Developer Ecosystem",
        unit: "M developers",
        description: "Cumulative registered CUDA developers worldwide",
        category: "user",
        data: [
          { year: 2019, value: 1.5 }, { year: 2020, value: 2.2 }, { year: 2021, value: 3.0 },
          { year: 2022, value: 3.8 }, { year: 2023, value: 4.7 }, { year: 2024, value: 6.0 },
        ],
      },
    ],
  },
  {
    rank: 2,
    ticker: "AAPL",
    name: "Apple Inc.",
    shortName: "Apple",
    sector: "Technology",
    country: "USA",
    marketCap: 3280,
    color: "#a2aaad",
    description: "Consumer electronics giant with the world's most valuable brand. iPhone, Mac, Services empire.",
    revenue: [
      { year: 2019, value: 260.2 }, { year: 2020, value: 274.5 }, { year: 2021, value: 365.8 },
      { year: 2022, value: 394.3 }, { year: 2023, value: 383.3 }, { year: 2024, value: 391.0 },
    ],
    netIncome: [
      { year: 2019, value: 55.3 }, { year: 2020, value: 57.4 }, { year: 2021, value: 94.7 },
      { year: 2022, value: 99.8 }, { year: 2023, value: 97.0 }, { year: 2024, value: 93.7 },
    ],
    grossMargin: [
      { year: 2019, value: 37.8 }, { year: 2020, value: 38.2 }, { year: 2021, value: 41.8 },
      { year: 2022, value: 43.3 }, { year: 2023, value: 44.1 }, { year: 2024, value: 46.2 },
    ],
    operatingMargin: [
      { year: 2019, value: 24.6 }, { year: 2020, value: 24.1 }, { year: 2021, value: 29.8 },
      { year: 2022, value: 30.3 }, { year: 2023, value: 29.8 }, { year: 2024, value: 31.5 },
    ],
    eps: [
      { year: 2019, value: 2.97 }, { year: 2020, value: 3.28 }, { year: 2021, value: 5.61 },
      { year: 2022, value: 6.11 }, { year: 2023, value: 6.13 }, { year: 2024, value: 6.08 },
    ],
    metrics: [
      {
        label: "iPhone Revenue",
        unit: "B USD",
        description: "Annual revenue from iPhone product line",
        category: "product",
        data: [
          { year: 2019, value: 142.4 }, { year: 2020, value: 137.8 }, { year: 2021, value: 191.9 },
          { year: 2022, value: 205.5 }, { year: 2023, value: 200.6 }, { year: 2024, value: 201.2 },
        ],
      },
      {
        label: "Services Revenue",
        unit: "B USD",
        description: "App Store, Apple Music, iCloud, Apple TV+, Apple Pay etc.",
        category: "product",
        compareKey: "subscription_revenue",
        data: [
          { year: 2019, value: 46.3 }, { year: 2020, value: 53.8 }, { year: 2021, value: 68.4 },
          { year: 2022, value: 78.1 }, { year: 2023, value: 85.2 }, { year: 2024, value: 96.2 },
        ],
      },
      {
        label: "Active Installed Base",
        unit: "B devices",
        description: "Total active Apple devices worldwide across all product categories",
        category: "user",
        data: [
          { year: 2020, value: 1.65 }, { year: 2021, value: 1.8 }, { year: 2022, value: 2.0 },
          { year: 2023, value: 2.2 }, { year: 2024, value: 2.35 },
        ],
      },
      {
        label: "Retail + Online Stores",
        unit: "stores",
        description: "Apple retail store count globally",
        category: "infrastructure",
        data: [
          { year: 2019, value: 506 }, { year: 2020, value: 511 }, { year: 2021, value: 516 },
          { year: 2022, value: 518 }, { year: 2023, value: 522 }, { year: 2024, value: 530 },
        ],
      },
      {
        label: "Mac Revenue",
        unit: "B USD",
        description: "Annual revenue from Mac computers including M-series transition",
        category: "product",
        data: [
          { year: 2019, value: 25.7 }, { year: 2020, value: 28.6 }, { year: 2021, value: 35.2 },
          { year: 2022, value: 40.2 }, { year: 2023, value: 29.4 }, { year: 2024, value: 30.0 },
        ],
      },
    ],
  },
  {
    rank: 3,
    ticker: "MSFT",
    name: "Microsoft Corporation",
    shortName: "Microsoft",
    sector: "Technology",
    country: "USA",
    marketCap: 3180,
    color: "#00a4ef",
    description: "Cloud computing leader (Azure), enterprise software, and AI via OpenAI partnership.",
    revenue: [
      { year: 2019, value: 125.8 }, { year: 2020, value: 143.0 }, { year: 2021, value: 168.1 },
      { year: 2022, value: 198.3 }, { year: 2023, value: 211.9 }, { year: 2024, value: 245.1 },
    ],
    netIncome: [
      { year: 2019, value: 39.2 }, { year: 2020, value: 44.3 }, { year: 2021, value: 61.3 },
      { year: 2022, value: 72.7 }, { year: 2023, value: 72.4 }, { year: 2024, value: 88.1 },
    ],
    grossMargin: [
      { year: 2019, value: 67.7 }, { year: 2020, value: 67.8 }, { year: 2021, value: 68.9 },
      { year: 2022, value: 68.4 }, { year: 2023, value: 69.5 }, { year: 2024, value: 70.1 },
    ],
    operatingMargin: [
      { year: 2019, value: 34.1 }, { year: 2020, value: 37.0 }, { year: 2021, value: 41.6 },
      { year: 2022, value: 42.1 }, { year: 2023, value: 41.7 }, { year: 2024, value: 44.6 },
    ],
    eps: [
      { year: 2019, value: 5.06 }, { year: 2020, value: 5.76 }, { year: 2021, value: 8.05 },
      { year: 2022, value: 9.65 }, { year: 2023, value: 9.72 }, { year: 2024, value: 11.80 },
    ],
    metrics: [
      {
        label: "Azure Revenue Growth",
        unit: "% YoY",
        description: "Year-over-year Azure cloud revenue growth rate",
        category: "product",
        compareKey: "cloud_growth",
        data: [
          { year: 2020, value: 59 }, { year: 2021, value: 50 }, { year: 2022, value: 46 },
          { year: 2023, value: 27 }, { year: 2024, value: 31 },
        ],
      },
      {
        label: "Cloud Revenue (Azure + Office 365)",
        unit: "B USD",
        description: "Intelligent Cloud segment + Productivity commercial cloud",
        category: "product",
        compareKey: "cloud_revenue",
        data: [
          { year: 2020, value: 51.7 }, { year: 2021, value: 75.3 }, { year: 2022, value: 91.2 },
          { year: 2023, value: 107.4 }, { year: 2024, value: 135.0 },
        ],
      },
      {
        label: "Microsoft 365 Subscribers",
        unit: "M users",
        description: "Paid Microsoft 365 commercial + consumer seats",
        category: "user",
        data: [
          { year: 2020, value: 258 }, { year: 2021, value: 301 }, { year: 2022, value: 345 },
          { year: 2023, value: 380 }, { year: 2024, value: 400 },
        ],
      },
      {
        label: "Data Center Capacity",
        unit: "GW",
        description: "Estimated total global data center capacity (MW converted to GW)",
        category: "infrastructure",
        compareKey: "datacenter_gw",
        data: [
          { year: 2020, value: 0.7 }, { year: 2021, value: 1.1 }, { year: 2022, value: 1.8 },
          { year: 2023, value: 2.4 }, { year: 2024, value: 3.2 },
        ],
      },
      {
        label: "LinkedIn Revenue",
        unit: "B USD",
        description: "Annual LinkedIn business segment revenue",
        category: "product",
        data: [
          { year: 2020, value: 8.1 }, { year: 2021, value: 10.3 }, { year: 2022, value: 13.8 },
          { year: 2023, value: 15.1 }, { year: 2024, value: 16.4 },
        ],
      },
    ],
  },
  {
    rank: 4,
    ticker: "AMZN",
    name: "Amazon.com, Inc.",
    shortName: "Amazon",
    sector: "Consumer",
    country: "USA",
    marketCap: 2320,
    color: "#ff9900",
    description: "E-commerce titan and AWS cloud leader. Also streaming, advertising, and logistics.",
    revenue: [
      { year: 2019, value: 280.5 }, { year: 2020, value: 386.1 }, { year: 2021, value: 469.8 },
      { year: 2022, value: 513.9 }, { year: 2023, value: 574.8 }, { year: 2024, value: 637.9 },
    ],
    netIncome: [
      { year: 2019, value: 11.6 }, { year: 2020, value: 21.3 }, { year: 2021, value: 33.4 },
      { year: 2022, value: -2.7 }, { year: 2023, value: 30.4 }, { year: 2024, value: 59.2 },
    ],
    grossMargin: [
      { year: 2019, value: 40.3 }, { year: 2020, value: 40.3 }, { year: 2021, value: 42.1 },
      { year: 2022, value: 43.8 }, { year: 2023, value: 46.9 }, { year: 2024, value: 49.0 },
    ],
    operatingMargin: [
      { year: 2019, value: 5.2 }, { year: 2020, value: 5.9 }, { year: 2021, value: 5.3 },
      { year: 2022, value: 2.4 }, { year: 2023, value: 6.4 }, { year: 2024, value: 10.8 },
    ],
    eps: [
      { year: 2019, value: 23.0 }, { year: 2020, value: 41.8 }, { year: 2021, value: 64.8 },
      { year: 2022, value: -0.27 }, { year: 2023, value: 2.90 }, { year: 2024, value: 5.53 },
    ],
    metrics: [
      {
        label: "AWS Revenue",
        unit: "B USD",
        description: "Amazon Web Services cloud revenue annually",
        category: "product",
        compareKey: "cloud_revenue",
        data: [
          { year: 2019, value: 35.0 }, { year: 2020, value: 45.4 }, { year: 2021, value: 62.2 },
          { year: 2022, value: 80.1 }, { year: 2023, value: 90.8 }, { year: 2024, value: 107.6 },
        ],
      },
      {
        label: "Prime Subscribers",
        unit: "M members",
        description: "Estimated global Amazon Prime paid membership",
        category: "user",
        data: [
          { year: 2019, value: 150 }, { year: 2020, value: 200 }, { year: 2021, value: 200 },
          { year: 2022, value: 200 }, { year: 2023, value: 230 }, { year: 2024, value: 240 },
        ],
      },
      {
        label: "Advertising Revenue",
        unit: "B USD",
        description: "Amazon advertising services (fastest-growing segment)",
        category: "product",
        data: [
          { year: 2020, value: 15.7 }, { year: 2021, value: 31.2 }, { year: 2022, value: 37.7 },
          { year: 2023, value: 46.9 }, { year: 2024, value: 56.2 },
        ],
      },
      {
        label: "Active Fulfillment Centers",
        unit: "facilities",
        description: "Number of global fulfillment and distribution centers",
        category: "infrastructure",
        data: [
          { year: 2019, value: 175 }, { year: 2020, value: 250 }, { year: 2021, value: 400 },
          { year: 2022, value: 520 }, { year: 2023, value: 600 }, { year: 2024, value: 650 },
        ],
      },
      {
        label: "Third-Party Seller Services",
        unit: "B USD",
        description: "Revenue from marketplace commissions & Fulfilled by Amazon fees",
        category: "product",
        data: [
          { year: 2019, value: 54.0 }, { year: 2020, value: 80.5 }, { year: 2021, value: 103.4 },
          { year: 2022, value: 117.7 }, { year: 2023, value: 140.1 }, { year: 2024, value: 157.2 },
        ],
      },
    ],
  },
  {
    rank: 5,
    ticker: "GOOG",
    name: "Alphabet Inc.",
    shortName: "Alphabet",
    sector: "Technology",
    country: "USA",
    marketCap: 2190,
    color: "#4285f4",
    description: "Google's parent. Search monopoly, YouTube, Android, GCP, and DeepMind AI.",
    revenue: [
      { year: 2019, value: 161.9 }, { year: 2020, value: 182.5 }, { year: 2021, value: 257.6 },
      { year: 2022, value: 282.8 }, { year: 2023, value: 307.4 }, { year: 2024, value: 350.0 },
    ],
    netIncome: [
      { year: 2019, value: 34.3 }, { year: 2020, value: 40.3 }, { year: 2021, value: 76.0 },
      { year: 2022, value: 59.9 }, { year: 2023, value: 73.8 }, { year: 2024, value: 100.1 },
    ],
    grossMargin: [
      { year: 2019, value: 55.6 }, { year: 2020, value: 53.6 }, { year: 2021, value: 56.9 },
      { year: 2022, value: 55.4 }, { year: 2023, value: 56.5 }, { year: 2024, value: 58.0 },
    ],
    operatingMargin: [
      { year: 2019, value: 21.2 }, { year: 2020, value: 22.6 }, { year: 2021, value: 30.6 },
      { year: 2022, value: 26.5 }, { year: 2023, value: 27.4 }, { year: 2024, value: 32.0 },
    ],
    eps: [
      { year: 2019, value: 49.6 }, { year: 2020, value: 58.6 }, { year: 2021, value: 112.2 },
      { year: 2022, value: 4.56 }, { year: 2023, value: 5.80 }, { year: 2024, value: 8.04 },
    ],
    metrics: [
      {
        label: "Search & Other Revenue",
        unit: "B USD",
        description: "Google Search advertising revenue (core business)",
        category: "product",
        data: [
          { year: 2020, value: 104.1 }, { year: 2021, value: 148.9 }, { year: 2022, value: 162.5 },
          { year: 2023, value: 175.0 }, { year: 2024, value: 198.1 },
        ],
      },
      {
        label: "YouTube Ad Revenue",
        unit: "B USD",
        description: "YouTube advertising revenue",
        category: "product",
        data: [
          { year: 2020, value: 19.8 }, { year: 2021, value: 28.8 }, { year: 2022, value: 29.2 },
          { year: 2023, value: 31.5 }, { year: 2024, value: 36.1 },
        ],
      },
      {
        label: "Google Cloud Revenue",
        unit: "B USD",
        description: "GCP (Google Cloud Platform) revenue",
        category: "product",
        compareKey: "cloud_revenue",
        data: [
          { year: 2020, value: 13.1 }, { year: 2021, value: 19.2 }, { year: 2022, value: 26.3 },
          { year: 2023, value: 33.1 }, { year: 2024, value: 43.2 },
        ],
      },
      {
        label: "Google Data Centers",
        unit: "GW",
        description: "Estimated total global data center capacity",
        category: "infrastructure",
        compareKey: "datacenter_gw",
        data: [
          { year: 2020, value: 1.0 }, { year: 2021, value: 1.4 }, { year: 2022, value: 1.9 },
          { year: 2023, value: 2.5 }, { year: 2024, value: 3.5 },
        ],
      },
      {
        label: "Monthly Active YouTube Users",
        unit: "B users",
        description: "Global YouTube monthly active users",
        category: "user",
        data: [
          { year: 2020, value: 2.0 }, { year: 2021, value: 2.29 }, { year: 2022, value: 2.5 },
          { year: 2023, value: 2.7 }, { year: 2024, value: 2.85 },
        ],
      },
    ],
  },
  {
    rank: 6,
    ticker: "META",
    name: "Meta Platforms, Inc.",
    shortName: "Meta",
    sector: "Technology",
    country: "USA",
    marketCap: 1760,
    color: "#0866ff",
    description: "Social media empire (Facebook, Instagram, WhatsApp) funding the metaverse and AI.",
    revenue: [
      { year: 2019, value: 70.7 }, { year: 2020, value: 86.0 }, { year: 2021, value: 117.9 },
      { year: 2022, value: 116.6 }, { year: 2023, value: 134.9 }, { year: 2024, value: 164.5 },
    ],
    netIncome: [
      { year: 2019, value: 18.5 }, { year: 2020, value: 29.1 }, { year: 2021, value: 39.4 },
      { year: 2022, value: 23.2 }, { year: 2023, value: 39.1 }, { year: 2024, value: 62.4 },
    ],
    grossMargin: [
      { year: 2019, value: 80.5 }, { year: 2020, value: 80.6 }, { year: 2021, value: 80.8 },
      { year: 2022, value: 78.5 }, { year: 2023, value: 80.8 }, { year: 2024, value: 81.8 },
    ],
    operatingMargin: [
      { year: 2019, value: 33.9 }, { year: 2020, value: 37.6 }, { year: 2021, value: 36.5 },
      { year: 2022, value: 19.9 }, { year: 2023, value: 34.8 }, { year: 2024, value: 42.8 },
    ],
    eps: [
      { year: 2019, value: 6.43 }, { year: 2020, value: 10.09 }, { year: 2021, value: 13.77 },
      { year: 2022, value: 8.59 }, { year: 2023, value: 14.87 }, { year: 2024, value: 23.86 },
    ],
    metrics: [
      {
        label: "Daily Active People (DAP)",
        unit: "B users",
        description: "Daily active people across all Meta family apps (FB, IG, WhatsApp, Messenger)",
        category: "user",
        data: [
          { year: 2019, value: 1.66 }, { year: 2020, value: 1.84 }, { year: 2021, value: 1.93 },
          { year: 2022, value: 2.0 }, { year: 2023, value: 2.11 }, { year: 2024, value: 3.35 },
        ],
      },
      {
        label: "Average Revenue Per User (ARPU)",
        unit: "USD",
        description: "Global average advertising revenue per daily active person",
        category: "user",
        data: [
          { year: 2019, value: 29.25 }, { year: 2020, value: 32.03 }, { year: 2021, value: 41.73 },
          { year: 2022, value: 40.26 }, { year: 2023, value: 44.57 }, { year: 2024, value: 54.29 },
        ],
      },
      {
        label: "Reality Labs Losses",
        unit: "B USD",
        description: "Cumulative operating losses from Meta's VR/AR Reality Labs division",
        category: "product",
        data: [
          { year: 2020, value: 6.6 }, { year: 2021, value: 10.2 }, { year: 2022, value: 13.7 },
          { year: 2023, value: 16.1 }, { year: 2024, value: 17.7 },
        ],
      },
      {
        label: "Llama Model Downloads",
        unit: "M downloads",
        description: "Cumulative downloads of Meta's open-source Llama AI models",
        category: "product",
        data: [
          { year: 2023, value: 30 }, { year: 2024, value: 600 },
        ],
      },
      {
        label: "Instagram MAU",
        unit: "B users",
        description: "Instagram monthly active users",
        category: "user",
        data: [
          { year: 2020, value: 1.16 }, { year: 2021, value: 1.39 }, { year: 2022, value: 1.48 },
          { year: 2023, value: 1.65 }, { year: 2024, value: 2.0 },
        ],
      },
    ],
  },
  {
    rank: 7,
    ticker: "TSLA",
    name: "Tesla, Inc.",
    shortName: "Tesla",
    sector: "Auto",
    country: "USA",
    marketCap: 1050,
    color: "#e82127",
    description: "EV pioneer transforming energy storage, solar, and autonomous driving.",
    revenue: [
      { year: 2019, value: 24.6 }, { year: 2020, value: 31.5 }, { year: 2021, value: 53.8 },
      { year: 2022, value: 81.5 }, { year: 2023, value: 97.7 }, { year: 2024, value: 97.8 },
    ],
    netIncome: [
      { year: 2019, value: -0.86 }, { year: 2020, value: 0.72 }, { year: 2021, value: 5.52 },
      { year: 2022, value: 12.6 }, { year: 2023, value: 15.0 }, { year: 2024, value: 7.09 },
    ],
    grossMargin: [
      { year: 2019, value: 16.6 }, { year: 2020, value: 21.3 }, { year: 2021, value: 25.3 },
      { year: 2022, value: 25.6 }, { year: 2023, value: 18.2 }, { year: 2024, value: 17.9 },
    ],
    operatingMargin: [
      { year: 2019, value: -0.3 }, { year: 2020, value: 6.3 }, { year: 2021, value: 12.1 },
      { year: 2022, value: 16.8 }, { year: 2023, value: 9.2 }, { year: 2024, value: 7.3 },
    ],
    eps: [
      { year: 2019, value: -0.33 }, { year: 2020, value: 0.25 }, { year: 2021, value: 1.64 },
      { year: 2022, value: 4.07 }, { year: 2023, value: 4.30 }, { year: 2024, value: 2.04 },
    ],
    metrics: [
      {
        label: "Vehicle Deliveries",
        unit: "K units",
        description: "Annual Tesla vehicle deliveries worldwide",
        category: "product",
        data: [
          { year: 2019, value: 367 }, { year: 2020, value: 499 }, { year: 2021, value: 936 },
          { year: 2022, value: 1313 }, { year: 2023, value: 1808 }, { year: 2024, value: 1789 },
        ],
      },
      {
        label: "Supercharger Stations",
        unit: "stations",
        description: "Cumulative global Supercharger station count",
        category: "infrastructure",
        data: [
          { year: 2019, value: 1870 }, { year: 2020, value: 2564 }, { year: 2021, value: 3476 },
          { year: 2022, value: 4947 }, { year: 2023, value: 5952 }, { year: 2024, value: 6878 },
        ],
      },
      {
        label: "Supercharger Connectors",
        unit: "K connectors",
        description: "Cumulative individual Supercharger connector count globally",
        category: "infrastructure",
        data: [
          { year: 2019, value: 16.6 }, { year: 2020, value: 23.3 }, { year: 2021, value: 31.5 },
          { year: 2022, value: 45.2 }, { year: 2023, value: 55.0 }, { year: 2024, value: 63.7 },
        ],
      },
      {
        label: "Energy Storage Deployed",
        unit: "GWh",
        description: "Cumulative energy storage deployed (Powerwall, Megapack) per year",
        category: "product",
        data: [
          { year: 2019, value: 1.65 }, { year: 2020, value: 3.02 }, { year: 2021, value: 3.99 },
          { year: 2022, value: 6.5 }, { year: 2023, value: 14.7 }, { year: 2024, value: 31.4 },
        ],
      },
      {
        label: "Autopilot / FSD Miles Driven",
        unit: "B miles",
        description: "Cumulative miles driven with Autopilot or FSD engaged",
        category: "product",
        data: [
          { year: 2020, value: 3.0 }, { year: 2021, value: 5.0 }, { year: 2022, value: 7.0 },
          { year: 2023, value: 10.0 }, { year: 2024, value: 14.0 },
        ],
      },
      {
        label: "Gigafactory Production Capacity",
        unit: "K units/yr",
        description: "Annualized nameplate production capacity across all Gigafactories",
        category: "infrastructure",
        data: [
          { year: 2019, value: 400 }, { year: 2020, value: 500 }, { year: 2021, value: 750 },
          { year: 2022, value: 1900 }, { year: 2023, value: 2400 }, { year: 2024, value: 2600 },
        ],
      },
    ],
  },
  {
    rank: 8,
    ticker: "BRK.B",
    name: "Berkshire Hathaway Inc.",
    shortName: "Berkshire",
    sector: "Financial",
    country: "USA",
    marketCap: 1060,
    color: "#c5a028",
    description: "Warren Buffett's holding company. Insurance, railroads, utilities, and a massive equity portfolio.",
    revenue: [
      { year: 2019, value: 254.6 }, { year: 2020, value: 245.5 }, { year: 2021, value: 276.1 },
      { year: 2022, value: 302.1 }, { year: 2023, value: 364.5 }, { year: 2024, value: 371.4 },
    ],
    netIncome: [
      { year: 2019, value: 81.4 }, { year: 2020, value: 42.5 }, { year: 2021, value: 89.8 },
      { year: 2022, value: -22.8 }, { year: 2023, value: 96.2 }, { year: 2024, value: 88.9 },
    ],
    grossMargin: [
      { year: 2020, value: 38.5 }, { year: 2021, value: 39.2 }, { year: 2022, value: 36.9 },
      { year: 2023, value: 38.1 }, { year: 2024, value: 39.0 },
    ],
    operatingMargin: [
      { year: 2020, value: 12.1 }, { year: 2021, value: 13.2 }, { year: 2022, value: 11.9 },
      { year: 2023, value: 13.5 }, { year: 2024, value: 14.1 },
    ],
    eps: [
      { year: 2019, value: 49889 }, { year: 2020, value: 27098 }, { year: 2021, value: 59460 },
      { year: 2022, value: -15068 }, { year: 2023, value: 65703 }, { year: 2024, value: 58784 },
    ],
    metrics: [
      {
        label: "Cash & Equivalents",
        unit: "B USD",
        description: "Berkshire's famous 'war chest' of cash and treasury bills",
        category: "financial",
        data: [
          { year: 2019, value: 128 }, { year: 2020, value: 138 }, { year: 2021, value: 144 },
          { year: 2022, value: 128 }, { year: 2023, value: 164 }, { year: 2024, value: 334 },
        ],
      },
      {
        label: "Operating Earnings",
        unit: "B USD",
        description: "Buffett's preferred metric: earnings ex investment gains/losses",
        category: "financial",
        data: [
          { year: 2020, value: 21.9 }, { year: 2021, value: 27.5 }, { year: 2022, value: 28.7 },
          { year: 2023, value: 37.4 }, { year: 2024, value: 47.4 },
        ],
      },
      {
        label: "BNSF Railway Revenue",
        unit: "B USD",
        description: "Annual revenue of Burlington Northern Santa Fe railroad",
        category: "product",
        data: [
          { year: 2020, value: 20.6 }, { year: 2021, value: 23.0 }, { year: 2022, value: 27.2 },
          { year: 2023, value: 23.6 }, { year: 2024, value: 23.0 },
        ],
      },
      {
        label: "Insurance Float",
        unit: "B USD",
        description: "Insurance float — 'other people's money' Berkshire invests cost-free",
        category: "financial",
        data: [
          { year: 2019, value: 129 }, { year: 2020, value: 138 }, { year: 2021, value: 147 },
          { year: 2022, value: 164 }, { year: 2023, value: 169 }, { year: 2024, value: 174 },
        ],
      },
      {
        label: "Apple Holdings Value",
        unit: "B USD",
        description: "Value of Berkshire's Apple stake (largest equity holding)",
        category: "financial",
        data: [
          { year: 2020, value: 120 }, { year: 2021, value: 161 }, { year: 2022, value: 117 },
          { year: 2023, value: 174 }, { year: 2024, value: 75 },
        ],
      },
    ],
  },
  {
    rank: 9,
    ticker: "TSM",
    name: "Taiwan Semiconductor Manufacturing Co.",
    shortName: "TSMC",
    sector: "Semiconductor",
    country: "Taiwan",
    marketCap: 980,
    color: "#00b4d8",
    description: "The world's most critical chip foundry. Makes chips for Apple, NVIDIA, AMD and more.",
    revenue: [
      { year: 2019, value: 35.8 }, { year: 2020, value: 45.5 }, { year: 2021, value: 56.8 },
      { year: 2022, value: 75.9 }, { year: 2023, value: 69.3 }, { year: 2024, value: 88.8 },
    ],
    netIncome: [
      { year: 2019, value: 11.5 }, { year: 2020, value: 17.6 }, { year: 2021, value: 22.0 },
      { year: 2022, value: 26.8 }, { year: 2023, value: 25.5 }, { year: 2024, value: 34.5 },
    ],
    grossMargin: [
      { year: 2019, value: 46.0 }, { year: 2020, value: 53.1 }, { year: 2021, value: 51.6 },
      { year: 2022, value: 59.6 }, { year: 2023, value: 54.4 }, { year: 2024, value: 56.1 },
    ],
    operatingMargin: [
      { year: 2019, value: 35.0 }, { year: 2020, value: 42.5 }, { year: 2021, value: 41.7 },
      { year: 2022, value: 49.5 }, { year: 2023, value: 42.6 }, { year: 2024, value: 45.7 },
    ],
    eps: [
      { year: 2019, value: 0.44 }, { year: 2020, value: 0.68 }, { year: 2021, value: 0.85 },
      { year: 2022, value: 1.03 }, { year: 2023, value: 0.98 }, { year: 2024, value: 1.33 },
    ],
    metrics: [
      {
        label: "3nm & Below Revenue Share",
        unit: "% of wafer revenue",
        description: "Percentage of wafer revenue from leading-edge nodes (3nm, 2nm)",
        category: "product",
        data: [
          { year: 2022, value: 0 }, { year: 2023, value: 6 }, { year: 2024, value: 26 },
        ],
      },
      {
        label: "Advanced Node Capacity",
        unit: "K wafers/month",
        description: "Monthly capacity for advanced nodes (7nm and below)",
        category: "infrastructure",
        data: [
          { year: 2020, value: 120 }, { year: 2021, value: 150 }, { year: 2022, value: 185 },
          { year: 2023, value: 210 }, { year: 2024, value: 245 },
        ],
      },
      {
        label: "CoWoS Packaging Capacity",
        unit: "K wafers/month",
        description: "Chip-on-Wafer-on-Substrate advanced packaging capacity (needed for AI GPUs)",
        category: "infrastructure",
        data: [
          { year: 2022, value: 5 }, { year: 2023, value: 12 }, { year: 2024, value: 25 },
        ],
      },
      {
        label: "Capex",
        unit: "B USD",
        description: "Annual capital expenditure on fab construction and equipment",
        category: "financial",
        compareKey: "capex",
        data: [
          { year: 2019, value: 14.9 }, { year: 2020, value: 17.2 }, { year: 2021, value: 30.0 },
          { year: 2022, value: 36.3 }, { year: 2023, value: 32.1 }, { year: 2024, value: 38.0 },
        ],
      },
      {
        label: "HPC Revenue Share",
        unit: "% of revenue",
        description: "High-performance computing (AI/GPU) as % of TSMC total revenue",
        category: "product",
        data: [
          { year: 2021, value: 41 }, { year: 2022, value: 41 }, { year: 2023, value: 43 },
          { year: 2024, value: 53 },
        ],
      },
    ],
  },
  {
    rank: 10,
    ticker: "WMT",
    name: "Walmart Inc.",
    shortName: "Walmart",
    sector: "Consumer",
    country: "USA",
    marketCap: 890,
    color: "#0071ce",
    description: "World's largest retailer by revenue. 10,500+ stores, growing e-commerce and advertising.",
    revenue: [
      { year: 2020, value: 523.9 }, { year: 2021, value: 555.2 }, { year: 2022, value: 572.8 },
      { year: 2023, value: 611.3 }, { year: 2024, value: 648.1 }, { year: 2025, value: 680.0 },
    ],
    netIncome: [
      { year: 2020, value: 14.9 }, { year: 2021, value: 13.5 }, { year: 2022, value: 13.7 },
      { year: 2023, value: 11.7 }, { year: 2024, value: 15.5 }, { year: 2025, value: 19.4 },
    ],
    grossMargin: [
      { year: 2020, value: 24.1 }, { year: 2021, value: 24.5 }, { year: 2022, value: 24.9 },
      { year: 2023, value: 24.0 }, { year: 2024, value: 24.3 }, { year: 2025, value: 24.5 },
    ],
    operatingMargin: [
      { year: 2020, value: 4.0 }, { year: 2021, value: 3.6 }, { year: 2022, value: 3.9 },
      { year: 2023, value: 3.2 }, { year: 2024, value: 3.7 }, { year: 2025, value: 4.0 },
    ],
    eps: [
      { year: 2020, value: 5.19 }, { year: 2021, value: 4.75 }, { year: 2022, value: 4.87 },
      { year: 2023, value: 1.71 }, { year: 2024, value: 2.28 }, { year: 2025, value: 2.41 },
    ],
    metrics: [
      {
        label: "US E-Commerce Sales Growth",
        unit: "% YoY",
        description: "Walmart US e-commerce net sales year-over-year growth",
        category: "product",
        data: [
          { year: 2020, value: 37 }, { year: 2021, value: 70 }, { year: 2022, value: 1 },
          { year: 2023, value: 24 }, { year: 2024, value: 22 }, { year: 2025, value: 21 },
        ],
      },
      {
        label: "Global Store Count",
        unit: "stores",
        description: "Total Walmart + Sam's Club + international store count",
        category: "infrastructure",
        data: [
          { year: 2020, value: 11501 }, { year: 2021, value: 10524 }, { year: 2022, value: 10585 },
          { year: 2023, value: 10623 }, { year: 2024, value: 10624 }, { year: 2025, value: 10750 },
        ],
      },
      {
        label: "Walmart+ Subscribers",
        unit: "M members",
        description: "Estimated Walmart+ paid membership (launched Sept 2020)",
        category: "user",
        data: [
          { year: 2021, value: 8 }, { year: 2022, value: 11 }, { year: 2023, value: 16 },
          { year: 2024, value: 22 }, { year: 2025, value: 30 },
        ],
      },
      {
        label: "Global Employees",
        unit: "M employees",
        description: "Total global Walmart associates",
        category: "operational",
        data: [
          { year: 2020, value: 2.3 }, { year: 2021, value: 2.3 }, { year: 2022, value: 2.3 },
          { year: 2023, value: 2.1 }, { year: 2024, value: 2.1 },
        ],
      },
      {
        label: "Walmart Advertising Revenue",
        unit: "B USD",
        description: "Walmart Connect advertising business revenue",
        category: "product",
        data: [
          { year: 2022, value: 2.1 }, { year: 2023, value: 3.4 }, { year: 2024, value: 4.4 },
          { year: 2025, value: 5.1 },
        ],
      },
    ],
  },
  {
    rank: 11,
    ticker: "V",
    name: "Visa Inc.",
    shortName: "Visa",
    sector: "Financial",
    country: "USA",
    marketCap: 680,
    color: "#1a1f71",
    description: "World's largest payments network. Doesn't lend money — just moves it.",
    revenue: [
      { year: 2020, value: 21.8 }, { year: 2021, value: 24.1 }, { year: 2022, value: 29.3 },
      { year: 2023, value: 32.7 }, { year: 2024, value: 35.9 },
    ],
    netIncome: [
      { year: 2020, value: 10.9 }, { year: 2021, value: 12.3 }, { year: 2022, value: 14.9 },
      { year: 2023, value: 17.3 }, { year: 2024, value: 19.7 },
    ],
    grossMargin: [
      { year: 2020, value: 79.5 }, { year: 2021, value: 79.7 }, { year: 2022, value: 79.9 },
      { year: 2023, value: 80.3 }, { year: 2024, value: 80.5 },
    ],
    operatingMargin: [
      { year: 2020, value: 60.5 }, { year: 2021, value: 60.8 }, { year: 2022, value: 64.8 },
      { year: 2023, value: 65.2 }, { year: 2024, value: 65.9 },
    ],
    eps: [
      { year: 2020, value: 5.44 }, { year: 2021, value: 5.63 }, { year: 2022, value: 7.5 },
      { year: 2023, value: 8.77 }, { year: 2024, value: 9.71 },
    ],
    metrics: [
      {
        label: "Payment Volume",
        unit: "T USD",
        description: "Total payment volume processed on Visa network",
        category: "operational",
        data: [
          { year: 2020, value: 8.8 }, { year: 2021, value: 10.4 }, { year: 2022, value: 13.0 },
          { year: 2023, value: 14.8 }, { year: 2024, value: 15.9 },
        ],
      },
      {
        label: "Transactions Processed",
        unit: "B transactions",
        description: "Total number of payment transactions processed annually",
        category: "operational",
        data: [
          { year: 2020, value: 164.7 }, { year: 2021, value: 192.5 }, { year: 2022, value: 222.5 },
          { year: 2023, value: 232.5 }, { year: 2024, value: 243.8 },
        ],
      },
      {
        label: "Cards in Circulation",
        unit: "B cards",
        description: "Total Visa-branded credit, debit & prepaid cards in use",
        category: "user",
        data: [
          { year: 2020, value: 3.6 }, { year: 2021, value: 3.76 }, { year: 2022, value: 4.0 },
          { year: 2023, value: 4.3 }, { year: 2024, value: 4.6 },
        ],
      },
      {
        label: "Cross-Border Volume",
        unit: "B USD",
        description: "Cross-border transaction volume (ex. intra-Europe)",
        category: "operational",
        data: [
          { year: 2020, value: 1200 }, { year: 2021, value: 1640 }, { year: 2022, value: 2270 },
          { year: 2023, value: 2760 }, { year: 2024, value: 3010 },
        ],
      },
    ],
  },
  {
    rank: 12,
    ticker: "JPM",
    name: "JPMorgan Chase & Co.",
    shortName: "JPMorgan",
    sector: "Financial",
    country: "USA",
    marketCap: 730,
    color: "#003087",
    description: "America's largest bank by assets. Investment banking, consumer banking, asset management.",
    revenue: [
      { year: 2020, value: 119.5 }, { year: 2021, value: 121.7 }, { year: 2022, value: 128.7 },
      { year: 2023, value: 162.4 }, { year: 2024, value: 175.1 },
    ],
    netIncome: [
      { year: 2020, value: 29.1 }, { year: 2021, value: 48.3 }, { year: 2022, value: 37.7 },
      { year: 2023, value: 49.6 }, { year: 2024, value: 58.5 },
    ],
    grossMargin: [
      { year: 2021, value: 59.5 }, { year: 2022, value: 55.7 }, { year: 2023, value: 58.1 }, { year: 2024, value: 59.5 },
    ],
    operatingMargin: [
      { year: 2020, value: 26.3 }, { year: 2021, value: 44.4 }, { year: 2022, value: 31.8 },
      { year: 2023, value: 35.1 }, { year: 2024, value: 38.3 },
    ],
    eps: [
      { year: 2020, value: 8.88 }, { year: 2021, value: 15.36 }, { year: 2022, value: 12.09 },
      { year: 2023, value: 16.23 }, { year: 2024, value: 19.75 },
    ],
    metrics: [
      {
        label: "Assets Under Management",
        unit: "T USD",
        description: "Total AUM in JPMorgan Asset Management",
        category: "financial",
        data: [
          { year: 2020, value: 2.4 }, { year: 2021, value: 3.1 }, { year: 2022, value: 2.6 },
          { year: 2023, value: 3.2 }, { year: 2024, value: 3.7 },
        ],
      },
      {
        label: "Investment Banking Revenue",
        unit: "B USD",
        description: "Annual investment banking fees (M&A advisory, underwriting)",
        category: "product",
        data: [
          { year: 2020, value: 9.5 }, { year: 2021, value: 13.5 }, { year: 2022, value: 7.2 },
          { year: 2023, value: 6.6 }, { year: 2024, value: 10.2 },
        ],
      },
      {
        label: "Net Interest Income",
        unit: "B USD",
        description: "Interest earned minus interest paid — core banking metric",
        category: "financial",
        data: [
          { year: 2020, value: 55.1 }, { year: 2021, value: 52.3 }, { year: 2022, value: 66.6 },
          { year: 2023, value: 89.3 }, { year: 2024, value: 92.6 },
        ],
      },
      {
        label: "Consumer Banking Deposits",
        unit: "T USD",
        description: "Total consumer and business deposits in JPM banking",
        category: "financial",
        data: [
          { year: 2020, value: 1.6 }, { year: 2021, value: 2.0 }, { year: 2022, value: 2.1 },
          { year: 2023, value: 2.1 }, { year: 2024, value: 2.4 },
        ],
      },
    ],
  },
  {
    rank: 13,
    ticker: "LLY",
    name: "Eli Lilly and Company",
    shortName: "Eli Lilly",
    sector: "Healthcare",
    country: "USA",
    marketCap: 680,
    color: "#d52b1e",
    description: "Pharmaceutical giant riding the GLP-1 obesity drug wave (Mounjaro, Zepbound).",
    revenue: [
      { year: 2020, value: 24.5 }, { year: 2021, value: 28.3 }, { year: 2022, value: 28.5 },
      { year: 2023, value: 34.1 }, { year: 2024, value: 45.0 },
    ],
    netIncome: [
      { year: 2020, value: 6.2 }, { year: 2021, value: 5.6 }, { year: 2022, value: 6.2 },
      { year: 2023, value: 5.2 }, { year: 2024, value: 10.6 },
    ],
    grossMargin: [
      { year: 2020, value: 75.5 }, { year: 2021, value: 74.6 }, { year: 2022, value: 74.0 },
      { year: 2023, value: 78.4 }, { year: 2024, value: 81.2 },
    ],
    operatingMargin: [
      { year: 2020, value: 25.9 }, { year: 2021, value: 19.5 }, { year: 2022, value: 19.4 },
      { year: 2023, value: 18.7 }, { year: 2024, value: 32.6 },
    ],
    eps: [
      { year: 2020, value: 6.79 }, { year: 2021, value: 6.73 }, { year: 2022, value: 6.93 },
      { year: 2023, value: 5.80 }, { year: 2024, value: 11.65 },
    ],
    metrics: [
      {
        label: "Mounjaro / Zepbound Revenue",
        unit: "B USD",
        description: "Combined GLP-1 tirzepatide revenue (diabetes + obesity indications)",
        category: "product",
        data: [
          { year: 2022, value: 0.48 }, { year: 2023, value: 5.16 }, { year: 2024, value: 22.3 },
        ],
      },
      {
        label: "Ozempic Competitor Market Share",
        unit: "% GLP-1 market",
        description: "Estimated tirzepatide share of total GLP-1 receptor agonist market",
        category: "product",
        data: [
          { year: 2023, value: 20 }, { year: 2024, value: 42 },
        ],
      },
      {
        label: "R&D Spend",
        unit: "B USD",
        description: "Annual research & development investment",
        category: "financial",
        compareKey: "rd_spend",
        data: [
          { year: 2020, value: 6.1 }, { year: 2021, value: 7.3 }, { year: 2022, value: 7.2 },
          { year: 2023, value: 9.4 }, { year: 2024, value: 11.3 },
        ],
      },
      {
        label: "Verzenio (Abemaciclib) Revenue",
        unit: "B USD",
        description: "Annual revenue from breast cancer drug Verzenio",
        category: "product",
        data: [
          { year: 2021, value: 1.37 }, { year: 2022, value: 2.59 }, { year: 2023, value: 3.61 },
          { year: 2024, value: 4.29 },
        ],
      },
    ],
  },
  {
    rank: 14,
    ticker: "XOM",
    name: "Exxon Mobil Corporation",
    shortName: "ExxonMobil",
    sector: "Energy",
    country: "USA",
    marketCap: 510,
    color: "#cc1f28",
    description: "World's largest publicly traded energy company. Oil, gas, petrochemicals, and low-carbon ventures.",
    revenue: [
      { year: 2020, value: 178.6 }, { year: 2021, value: 276.7 }, { year: 2022, value: 398.7 },
      { year: 2023, value: 334.7 }, { year: 2024, value: 331.5 },
    ],
    netIncome: [
      { year: 2020, value: -22.4 }, { year: 2021, value: 23.0 }, { year: 2022, value: 55.7 },
      { year: 2023, value: 36.0 }, { year: 2024, value: 33.7 },
    ],
    grossMargin: [
      { year: 2021, value: 41.5 }, { year: 2022, value: 44.3 }, { year: 2023, value: 38.8 }, { year: 2024, value: 38.5 },
    ],
    operatingMargin: [
      { year: 2021, value: 14.5 }, { year: 2022, value: 20.6 }, { year: 2023, value: 13.5 }, { year: 2024, value: 13.2 },
    ],
    eps: [
      { year: 2020, value: -5.25 }, { year: 2021, value: 5.39 }, { year: 2022, value: 14.02 },
      { year: 2023, value: 8.89 }, { year: 2024, value: 8.25 },
    ],
    metrics: [
      {
        label: "Oil Production",
        unit: "K barrels/day",
        description: "Net oil equivalent production (barrels per day)",
        category: "operational",
        data: [
          { year: 2020, value: 3680 }, { year: 2021, value: 3700 }, { year: 2022, value: 3700 },
          { year: 2023, value: 3900 }, { year: 2024, value: 4550 },
        ],
      },
      {
        label: "Capex",
        unit: "B USD",
        description: "Annual capital and exploration expenditures",
        category: "financial",
        compareKey: "capex",
        data: [
          { year: 2020, value: 21.4 }, { year: 2021, value: 16.6 }, { year: 2022, value: 21.8 },
          { year: 2023, value: 26.3 }, { year: 2024, value: 28.0 },
        ],
      },
      {
        label: "Carbon Capture Capacity",
        unit: "M tons CO2/yr",
        description: "Annual CO2 capture and storage capacity",
        category: "operational",
        data: [
          { year: 2022, value: 9 }, { year: 2023, value: 9 }, { year: 2024, value: 10 },
        ],
      },
      {
        label: "Permian Basin Production",
        unit: "K boe/day",
        description: "Permian Basin (Texas/New Mexico) barrels of oil equivalent per day",
        category: "operational",
        data: [
          { year: 2020, value: 400 }, { year: 2021, value: 456 }, { year: 2022, value: 560 },
          { year: 2023, value: 621 }, { year: 2024, value: 1300 },
        ],
      },
    ],
  },
  {
    rank: 15,
    ticker: "MA",
    name: "Mastercard Incorporated",
    shortName: "Mastercard",
    sector: "Financial",
    country: "USA",
    marketCap: 510,
    color: "#eb001b",
    description: "Global payments technology company. Visa's main rival. ~40% of global card network share.",
    revenue: [
      { year: 2020, value: 15.3 }, { year: 2021, value: 18.9 }, { year: 2022, value: 22.2 },
      { year: 2023, value: 25.1 }, { year: 2024, value: 28.2 },
    ],
    netIncome: [
      { year: 2020, value: 6.4 }, { year: 2021, value: 8.7 }, { year: 2022, value: 9.9 },
      { year: 2023, value: 11.2 }, { year: 2024, value: 12.9 },
    ],
    grossMargin: [
      { year: 2020, value: 71.0 }, { year: 2021, value: 72.3 }, { year: 2022, value: 73.5 },
      { year: 2023, value: 74.7 }, { year: 2024, value: 75.0 },
    ],
    operatingMargin: [
      { year: 2020, value: 47.1 }, { year: 2021, value: 53.8 }, { year: 2022, value: 55.9 },
      { year: 2023, value: 56.1 }, { year: 2024, value: 57.2 },
    ],
    eps: [
      { year: 2020, value: 6.37 }, { year: 2021, value: 8.76 }, { year: 2022, value: 10.22 },
      { year: 2023, value: 11.84 }, { year: 2024, value: 13.89 },
    ],
    metrics: [
      {
        label: "Gross Dollar Volume",
        unit: "T USD",
        description: "Total dollar volume of transactions on Mastercard network",
        category: "operational",
        data: [
          { year: 2020, value: 6.3 }, { year: 2021, value: 7.7 }, { year: 2022, value: 8.2 },
          { year: 2023, value: 9.0 }, { year: 2024, value: 9.8 },
        ],
      },
      {
        label: "Switched Transactions",
        unit: "B transactions",
        description: "Number of switched payment transactions processed",
        category: "operational",
        data: [
          { year: 2020, value: 103.3 }, { year: 2021, value: 120.5 }, { year: 2022, value: 131.3 },
          { year: 2023, value: 143.3 }, { year: 2024, value: 157.3 },
        ],
      },
    ],
  },
  {
    rank: 16,
    ticker: "AVGO",
    name: "Broadcom Inc.",
    shortName: "Broadcom",
    sector: "Semiconductor",
    country: "USA",
    marketCap: 910,
    color: "#cc0000",
    description: "Semiconductor + infrastructure software giant. Custom AI chips for Google, Meta, Apple.",
    revenue: [
      { year: 2021, value: 27.5 }, { year: 2022, value: 33.2 }, { year: 2023, value: 35.8 },
      { year: 2024, value: 51.6 },
    ],
    netIncome: [
      { year: 2021, value: 6.7 }, { year: 2022, value: 11.5 }, { year: 2023, value: 14.1 },
      { year: 2024, value: 5.9 },
    ],
    grossMargin: [
      { year: 2021, value: 73.6 }, { year: 2022, value: 74.3 }, { year: 2023, value: 74.6 },
      { year: 2024, value: 64.8 },
    ],
    operatingMargin: [
      { year: 2021, value: 36.1 }, { year: 2022, value: 43.6 }, { year: 2023, value: 48.8 },
      { year: 2024, value: 28.9 },
    ],
    eps: [
      { year: 2021, value: 28.57 }, { year: 2022, value: 37.85 }, { year: 2023, value: 39.25 },
      { year: 2024, value: 24.18 },
    ],
    metrics: [
      {
        label: "AI/XPU Revenue",
        unit: "B USD",
        description: "Revenue from AI-specific chips (custom AI accelerators for hyperscalers)",
        category: "product",
        data: [
          { year: 2023, value: 4.2 }, { year: 2024, value: 12.2 },
        ],
      },
      {
        label: "VMware Infrastructure Software Revenue",
        unit: "B USD",
        description: "Revenue from VMware segment (acquired 2023)",
        category: "product",
        data: [
          { year: 2024, value: 13.8 },
        ],
      },
    ],
  },
  {
    rank: 17,
    ticker: "COST",
    name: "Costco Wholesale Corporation",
    shortName: "Costco",
    sector: "Consumer",
    country: "USA",
    marketCap: 430,
    color: "#005daa",
    description: "Membership-based warehouse club. Legendary for low prices, $1.50 hot dogs, and high ROIC.",
    revenue: [
      { year: 2020, value: 166.8 }, { year: 2021, value: 195.9 }, { year: 2022, value: 226.9 },
      { year: 2023, value: 242.3 }, { year: 2024, value: 254.0 },
    ],
    netIncome: [
      { year: 2020, value: 4.0 }, { year: 2021, value: 5.0 }, { year: 2022, value: 5.8 },
      { year: 2023, value: 6.3 }, { year: 2024, value: 7.4 },
    ],
    grossMargin: [
      { year: 2020, value: 13.0 }, { year: 2021, value: 12.9 }, { year: 2022, value: 12.5 },
      { year: 2023, value: 12.3 }, { year: 2024, value: 12.6 },
    ],
    operatingMargin: [
      { year: 2020, value: 3.2 }, { year: 2021, value: 3.4 }, { year: 2022, value: 3.3 },
      { year: 2023, value: 3.4 }, { year: 2024, value: 3.8 },
    ],
    eps: [
      { year: 2020, value: 9.02 }, { year: 2021, value: 11.27 }, { year: 2022, value: 13.14 },
      { year: 2023, value: 14.16 }, { year: 2024, value: 16.56 },
    ],
    metrics: [
      {
        label: "Membership Fee Revenue",
        unit: "B USD",
        description: "Annual membership fee income (nearly 100% operating income)",
        category: "product",
        data: [
          { year: 2020, value: 3.88 }, { year: 2021, value: 3.88 }, { year: 2022, value: 4.22 },
          { year: 2023, value: 4.58 }, { year: 2024, value: 4.83 },
        ],
      },
      {
        label: "Paid Memberships",
        unit: "M households",
        description: "Global paid Costco membership count",
        category: "user",
        data: [
          { year: 2020, value: 58.1 }, { year: 2021, value: 61.7 }, { year: 2022, value: 65.8 },
          { year: 2023, value: 69.1 }, { year: 2024, value: 76.2 },
        ],
      },
      {
        label: "Renewal Rate",
        unit: "% US/Canada",
        description: "Membership renewal rate in US & Canada",
        category: "user",
        data: [
          { year: 2020, value: 91.0 }, { year: 2021, value: 91.3 }, { year: 2022, value: 92.5 },
          { year: 2023, value: 92.9 }, { year: 2024, value: 93.0 },
        ],
      },
      {
        label: "Warehouse Count",
        unit: "locations",
        description: "Global Costco warehouse count",
        category: "infrastructure",
        data: [
          { year: 2020, value: 803 }, { year: 2021, value: 815 }, { year: 2022, value: 838 },
          { year: 2023, value: 861 }, { year: 2024, value: 897 },
        ],
      },
    ],
  },
  {
    rank: 18,
    ticker: "NVO",
    name: "Novo Nordisk A/S",
    shortName: "Novo Nordisk",
    sector: "Healthcare",
    country: "Denmark",
    marketCap: 410,
    color: "#003b71",
    description: "Danish pharma giant. Ozempic/Wegovy GLP-1 drugs define the obesity treatment market.",
    revenue: [
      { year: 2020, value: 17.6 }, { year: 2021, value: 18.0 }, { year: 2022, value: 22.1 },
      { year: 2023, value: 33.7 }, { year: 2024, value: 40.1 },
    ],
    netIncome: [
      { year: 2020, value: 5.5 }, { year: 2021, value: 6.3 }, { year: 2022, value: 8.3 },
      { year: 2023, value: 12.6 }, { year: 2024, value: 15.0 },
    ],
    grossMargin: [
      { year: 2021, value: 83.2 }, { year: 2022, value: 82.7 }, { year: 2023, value: 84.4 }, { year: 2024, value: 84.7 },
    ],
    operatingMargin: [
      { year: 2021, value: 38.4 }, { year: 2022, value: 39.7 }, { year: 2023, value: 46.2 }, { year: 2024, value: 44.6 },
    ],
    eps: [
      { year: 2021, value: 1.39 }, { year: 2022, value: 1.83 }, { year: 2023, value: 2.77 }, { year: 2024, value: 3.29 },
    ],
    metrics: [
      {
        label: "Ozempic / Wegovy Revenue",
        unit: "B USD",
        description: "Combined semaglutide GLP-1 revenue (diabetes + obesity)",
        category: "product",
        data: [
          { year: 2021, value: 3.0 }, { year: 2022, value: 7.2 }, { year: 2023, value: 17.8 },
          { year: 2024, value: 23.0 },
        ],
      },
      {
        label: "Wegovy Obesity Market Share",
        unit: "% GLP-1 market",
        description: "Semaglutide share of GLP-1 receptor agonist market",
        category: "product",
        data: [
          { year: 2022, value: 35 }, { year: 2023, value: 48 }, { year: 2024, value: 42 },
        ],
      },
    ],
  },
  {
    rank: 19,
    ticker: "ORCL",
    name: "Oracle Corporation",
    shortName: "Oracle",
    sector: "Technology",
    country: "USA",
    marketCap: 480,
    color: "#c74634",
    description: "Enterprise software and cloud database giant. Growing fast in AI cloud infrastructure.",
    revenue: [
      { year: 2021, value: 40.5 }, { year: 2022, value: 42.4 }, { year: 2023, value: 50.0 },
      { year: 2024, value: 53.0 },
    ],
    netIncome: [
      { year: 2021, value: 13.7 }, { year: 2022, value: 6.7 }, { year: 2023, value: 8.5 },
      { year: 2024, value: 10.5 },
    ],
    grossMargin: [
      { year: 2021, value: 79.8 }, { year: 2022, value: 75.2 }, { year: 2023, value: 72.5 }, { year: 2024, value: 74.4 },
    ],
    operatingMargin: [
      { year: 2021, value: 38.2 }, { year: 2022, value: 25.8 }, { year: 2023, value: 22.2 }, { year: 2024, value: 27.8 },
    ],
    eps: [
      { year: 2021, value: 4.67 }, { year: 2022, value: 2.48 }, { year: 2023, value: 3.11 }, { year: 2024, value: 3.93 },
    ],
    metrics: [
      {
        label: "Cloud Revenue",
        unit: "B USD",
        description: "Oracle Cloud Infrastructure (OCI) + SaaS revenue",
        category: "product",
        compareKey: "cloud_revenue",
        data: [
          { year: 2022, value: 10.8 }, { year: 2023, value: 19.8 }, { year: 2024, value: 25.0 },
        ],
      },
      {
        label: "Remaining Performance Obligations",
        unit: "B USD",
        description: "Contracted future revenue (backlog) — key AI demand signal",
        category: "financial",
        data: [
          { year: 2023, value: 65 }, { year: 2024, value: 98 },
        ],
      },
    ],
  },
  {
    rank: 20,
    ticker: "AMD",
    name: "Advanced Micro Devices, Inc.",
    shortName: "AMD",
    sector: "Semiconductor",
    country: "USA",
    marketCap: 200,
    color: "#ed1c24",
    description: "NVIDIA's main GPU rival. MI300X AI chips + EPYC server CPUs are surging.",
    revenue: [
      { year: 2020, value: 9.8 }, { year: 2021, value: 16.4 }, { year: 2022, value: 23.6 },
      { year: 2023, value: 22.7 }, { year: 2024, value: 25.8 },
    ],
    netIncome: [
      { year: 2020, value: 2.5 }, { year: 2021, value: 3.2 }, { year: 2022, value: 1.3 },
      { year: 2023, value: 0.85 }, { year: 2024, value: 1.6 },
    ],
    grossMargin: [
      { year: 2020, value: 44.5 }, { year: 2021, value: 48.3 }, { year: 2022, value: 44.0 },
      { year: 2023, value: 46.1 }, { year: 2024, value: 49.1 },
    ],
    operatingMargin: [
      { year: 2020, value: 20.8 }, { year: 2021, value: 22.2 }, { year: 2022, value: 4.2 },
      { year: 2023, value: 1.7 }, { year: 2024, value: 5.6 },
    ],
    eps: [
      { year: 2020, value: 1.45 }, { year: 2021, value: 2.57 }, { year: 2022, value: 0.84 },
      { year: 2023, value: 0.53 }, { year: 2024, value: 1.0 },
    ],
    metrics: [
      {
        label: "Data Center Revenue",
        unit: "B USD",
        description: "Data center segment revenue (EPYC CPUs + MI-series GPUs)",
        category: "product",
        compareKey: "datacenter_revenue",
        data: [
          { year: 2022, value: 6.0 }, { year: 2023, value: 6.5 }, { year: 2024, value: 12.6 },
        ],
      },
      {
        label: "MI300X AI GPU Revenue",
        unit: "B USD",
        description: "Estimated revenue from MI300X / MI300A AI accelerators",
        category: "product",
        data: [
          { year: 2024, value: 5.1 },
        ],
      },
    ],
  },
  {
    rank: 21,
    ticker: "NFLX",
    name: "Netflix, Inc.",
    shortName: "Netflix",
    sector: "Consumer",
    country: "USA",
    marketCap: 400,
    color: "#e50914",
    description: "Global streaming leader. Password sharing crackdown and ad-supported tier reignited growth.",
    revenue: [
      { year: 2020, value: 25.0 }, { year: 2021, value: 29.7 }, { year: 2022, value: 31.6 },
      { year: 2023, value: 33.7 }, { year: 2024, value: 39.0 },
    ],
    netIncome: [
      { year: 2020, value: 2.76 }, { year: 2021, value: 5.12 }, { year: 2022, value: 1.44 },
      { year: 2023, value: 5.41 }, { year: 2024, value: 8.71 },
    ],
    grossMargin: [
      { year: 2020, value: 38.9 }, { year: 2021, value: 41.6 }, { year: 2022, value: 42.6 },
      { year: 2023, value: 45.6 }, { year: 2024, value: 48.7 },
    ],
    operatingMargin: [
      { year: 2020, value: 18.3 }, { year: 2021, value: 20.6 }, { year: 2022, value: 17.8 },
      { year: 2023, value: 20.6 }, { year: 2024, value: 26.7 },
    ],
    eps: [
      { year: 2020, value: 6.26 }, { year: 2021, value: 11.24 }, { year: 2022, value: 3.2 },
      { year: 2023, value: 12.03 }, { year: 2024, value: 19.83 },
    ],
    metrics: [
      {
        label: "Paid Subscribers",
        unit: "M subscribers",
        description: "Global paid Netflix memberships",
        category: "user",
        compareKey: "paid_subscribers",
        data: [
          { year: 2020, value: 203.7 }, { year: 2021, value: 221.8 }, { year: 2022, value: 220.7 },
          { year: 2023, value: 260.3 }, { year: 2024, value: 301.6 },
        ],
      },
      {
        label: "Content Spend",
        unit: "B USD",
        description: "Annual cash content spending (licensed + original)",
        category: "financial",
        data: [
          { year: 2020, value: 11.8 }, { year: 2021, value: 17.7 }, { year: 2022, value: 16.8 },
          { year: 2023, value: 13.0 }, { year: 2024, value: 17.0 },
        ],
      },
      {
        label: "Ad-Supported Tier Users",
        unit: "M users",
        description: "Global monthly active users on ad-supported tier",
        category: "user",
        data: [
          { year: 2023, value: 23 }, { year: 2024, value: 70 },
        ],
      },
      {
        label: "Average Revenue Per Membership",
        unit: "USD/month",
        description: "Global ARM (Average Revenue per Membership)",
        category: "user",
        data: [
          { year: 2020, value: 10.8 }, { year: 2021, value: 11.67 }, { year: 2022, value: 11.67 },
          { year: 2023, value: 11.7 }, { year: 2024, value: 17.31 },
        ],
      },
    ],
  },
  {
    rank: 22,
    ticker: "SAP",
    name: "SAP SE",
    shortName: "SAP",
    sector: "Technology",
    country: "Germany",
    marketCap: 290,
    color: "#0070f2",
    description: "World's largest enterprise resource planning (ERP) software vendor.",
    revenue: [
      { year: 2020, value: 27.3 }, { year: 2021, value: 27.8 }, { year: 2022, value: 30.9 },
      { year: 2023, value: 31.2 }, { year: 2024, value: 36.0 },
    ],
    netIncome: [
      { year: 2020, value: 4.6 }, { year: 2021, value: 5.0 }, { year: 2022, value: 1.7 },
      { year: 2023, value: 6.1 }, { year: 2024, value: 5.9 },
    ],
    grossMargin: [
      { year: 2021, value: 72.3 }, { year: 2022, value: 71.4 }, { year: 2023, value: 72.8 }, { year: 2024, value: 74.6 },
    ],
    operatingMargin: [
      { year: 2021, value: 16.2 }, { year: 2022, value: 11.8 }, { year: 2023, value: 18.1 }, { year: 2024, value: 19.5 },
    ],
    eps: [
      { year: 2021, value: 4.27 }, { year: 2022, value: 1.35 }, { year: 2023, value: 5.12 }, { year: 2024, value: 4.97 },
    ],
    metrics: [
      {
        label: "Cloud Revenue",
        unit: "B USD",
        description: "SAP cloud backlog and subscription revenue",
        category: "product",
        compareKey: "cloud_revenue",
        data: [
          { year: 2021, value: 9.4 }, { year: 2022, value: 11.6 }, { year: 2023, value: 14.1 },
          { year: 2024, value: 17.1 },
        ],
      },
    ],
  },
  {
    rank: 23,
    ticker: "CRM",
    name: "Salesforce, Inc.",
    shortName: "Salesforce",
    sector: "Technology",
    country: "USA",
    marketCap: 275,
    color: "#00a1e0",
    description: "Leading CRM cloud platform. Agentforce AI is the newest growth bet.",
    revenue: [
      { year: 2021, value: 21.3 }, { year: 2022, value: 26.5 }, { year: 2023, value: 31.4 },
      { year: 2024, value: 34.9 }, { year: 2025, value: 37.9 },
    ],
    netIncome: [
      { year: 2021, value: 0.47 }, { year: 2022, value: 1.44 }, { year: 2023, value: 0.21 },
      { year: 2024, value: 4.14 }, { year: 2025, value: 6.2 },
    ],
    grossMargin: [
      { year: 2021, value: 73.0 }, { year: 2022, value: 72.9 }, { year: 2023, value: 73.5 },
      { year: 2024, value: 76.5 }, { year: 2025, value: 77.0 },
    ],
    operatingMargin: [
      { year: 2021, value: 2.1 }, { year: 2022, value: 2.1 }, { year: 2023, value: 3.3 },
      { year: 2024, value: 14.4 }, { year: 2025, value: 19.1 },
    ],
    eps: [
      { year: 2021, value: 4.38 }, { year: 2022, value: 1.48 }, { year: 2023, value: 0.21 },
      { year: 2024, value: 4.20 }, { year: 2025, value: 6.48 },
    ],
    metrics: [
      {
        label: "Subscription & Support Revenue",
        unit: "B USD",
        description: "Recurring SaaS subscription revenue",
        category: "product",
        compareKey: "subscription_revenue",
        data: [
          { year: 2021, value: 19.9 }, { year: 2022, value: 24.6 }, { year: 2023, value: 29.4 },
          { year: 2024, value: 32.8 }, { year: 2025, value: 35.5 },
        ],
      },
      {
        label: "Remaining Performance Obligations",
        unit: "B USD",
        description: "Contracted future revenue (backlog) — forward demand signal",
        category: "financial",
        data: [
          { year: 2023, value: 48.6 }, { year: 2024, value: 56.9 }, { year: 2025, value: 63.4 },
        ],
      },
    ],
  },
  {
    rank: 24,
    ticker: "ASML",
    name: "ASML Holding N.V.",
    shortName: "ASML",
    sector: "Semiconductor",
    country: "Netherlands",
    marketCap: 290,
    color: "#0082cb",
    description: "The only maker of EUV lithography machines. A monopoly on advanced chip manufacturing tools.",
    revenue: [
      { year: 2020, value: 14.0 }, { year: 2021, value: 18.6 }, { year: 2022, value: 21.2 },
      { year: 2023, value: 27.6 }, { year: 2024, value: 28.3 },
    ],
    netIncome: [
      { year: 2020, value: 2.97 }, { year: 2021, value: 5.88 }, { year: 2022, value: 5.62 },
      { year: 2023, value: 7.85 }, { year: 2024, value: 7.47 },
    ],
    grossMargin: [
      { year: 2020, value: 48.5 }, { year: 2021, value: 52.7 }, { year: 2022, value: 49.5 },
      { year: 2023, value: 51.3 }, { year: 2024, value: 51.1 },
    ],
    operatingMargin: [
      { year: 2020, value: 25.7 }, { year: 2021, value: 35.2 }, { year: 2022, value: 30.2 },
      { year: 2023, value: 32.6 }, { year: 2024, value: 32.3 },
    ],
    eps: [
      { year: 2020, value: 7.47 }, { year: 2021, value: 14.64 }, { year: 2022, value: 14.02 },
      { year: 2023, value: 20.00 }, { year: 2024, value: 19.12 },
    ],
    metrics: [
      {
        label: "EUV Systems Shipped",
        unit: "units/year",
        description: "Annual EUV (Extreme Ultraviolet) lithography machine shipments",
        category: "product",
        data: [
          { year: 2020, value: 31 }, { year: 2021, value: 42 }, { year: 2022, value: 55 },
          { year: 2023, value: 53 }, { year: 2024, value: 52 },
        ],
      },
      {
        label: "High-NA EUV Shipped",
        unit: "units/year",
        description: "Next-gen High-NA EUV systems (for sub-2nm nodes) shipped",
        category: "product",
        data: [
          { year: 2024, value: 4 },
        ],
      },
      {
        label: "Order Backlog",
        unit: "B EUR",
        description: "Total ASML confirmed order backlog",
        category: "financial",
        data: [
          { year: 2021, value: 28.3 }, { year: 2022, value: 40.4 }, { year: 2023, value: 38.7 },
          { year: 2024, value: 36.0 },
        ],
      },
    ],
  },
  {
    rank: 25,
    ticker: "ABBV",
    name: "AbbVie Inc.",
    shortName: "AbbVie",
    sector: "Healthcare",
    country: "USA",
    marketCap: 330,
    color: "#071d49",
    description: "Pharma giant known for Humira. Now pivoting to Skyrizi, Rinvoq, and aesthetics (Botox).",
    revenue: [
      { year: 2020, value: 45.8 }, { year: 2021, value: 56.2 }, { year: 2022, value: 58.1 },
      { year: 2023, value: 55.6 }, { year: 2024, value: 56.3 },
    ],
    netIncome: [
      { year: 2020, value: 4.6 }, { year: 2021, value: 11.5 }, { year: 2022, value: 11.8 },
      { year: 2023, value: 4.0 }, { year: 2024, value: 4.3 },
    ],
    grossMargin: [
      { year: 2021, value: 69.9 }, { year: 2022, value: 69.7 }, { year: 2023, value: 69.6 }, { year: 2024, value: 70.2 },
    ],
    operatingMargin: [
      { year: 2021, value: 27.9 }, { year: 2022, value: 24.5 }, { year: 2023, value: 13.5 }, { year: 2024, value: 12.8 },
    ],
    eps: [
      { year: 2021, value: 6.45 }, { year: 2022, value: 6.65 }, { year: 2023, value: 2.28 }, { year: 2024, value: 2.51 },
    ],
    metrics: [
      {
        label: "Skyrizi + Rinvoq Revenue",
        unit: "B USD",
        description: "Combined growth drugs replacing Humira's lost exclusivity",
        category: "product",
        data: [
          { year: 2021, value: 3.4 }, { year: 2022, value: 6.5 }, { year: 2023, value: 11.5 },
          { year: 2024, value: 17.6 },
        ],
      },
    ],
  },
  {
    rank: 26,
    ticker: "TCEHY",
    name: "Tencent Holdings Limited",
    shortName: "Tencent",
    sector: "Technology",
    country: "China",
    marketCap: 520,
    color: "#12b7f5",
    description: "China's social media & gaming titan. WeChat, Honor of Kings, and cloud services.",
    revenue: [
      { year: 2020, value: 74.0 }, { year: 2021, value: 87.6 }, { year: 2022, value: 83.0 },
      { year: 2023, value: 86.9 }, { year: 2024, value: 101.1 },
    ],
    netIncome: [
      { year: 2020, value: 19.7 }, { year: 2021, value: 22.8 }, { year: 2022, value: 18.6 },
      { year: 2023, value: 27.7 }, { year: 2024, value: 33.6 },
    ],
    grossMargin: [
      { year: 2021, value: 44.5 }, { year: 2022, value: 44.6 }, { year: 2023, value: 50.8 }, { year: 2024, value: 53.0 },
    ],
    operatingMargin: [
      { year: 2021, value: 26.0 }, { year: 2022, value: 19.3 }, { year: 2023, value: 28.4 }, { year: 2024, value: 32.0 },
    ],
    eps: [
      { year: 2021, value: 2.38 }, { year: 2022, value: 1.94 }, { year: 2023, value: 2.88 }, { year: 2024, value: 3.51 },
    ],
    metrics: [
      {
        label: "WeChat Monthly Active Users",
        unit: "B users",
        description: "Weixin/WeChat combined monthly active users",
        category: "user",
        data: [
          { year: 2020, value: 1.23 }, { year: 2021, value: 1.27 }, { year: 2022, value: 1.31 },
          { year: 2023, value: 1.34 }, { year: 2024, value: 1.38 },
        ],
      },
    ],
  },
  {
    rank: 27,
    ticker: "BABA",
    name: "Alibaba Group Holding Limited",
    shortName: "Alibaba",
    sector: "Consumer",
    country: "China",
    marketCap: 290,
    color: "#ff6a00",
    description: "China's e-commerce and cloud giant. Taobao, Tmall, Alibaba Cloud (Aliyun).",
    revenue: [
      { year: 2021, value: 109.5 }, { year: 2022, value: 134.6 }, { year: 2023, value: 126.5 },
      { year: 2024, value: 130.3 },
    ],
    netIncome: [
      { year: 2021, value: 22.9 }, { year: 2022, value: 9.4 }, { year: 2023, value: 10.0 },
      { year: 2024, value: 12.9 },
    ],
    grossMargin: [
      { year: 2021, value: 42.9 }, { year: 2022, value: 37.0 }, { year: 2023, value: 35.7 }, { year: 2024, value: 38.4 },
    ],
    operatingMargin: [
      { year: 2021, value: 18.9 }, { year: 2022, value: 4.5 }, { year: 2023, value: 9.0 }, { year: 2024, value: 13.5 },
    ],
    eps: [
      { year: 2021, value: 8.53 }, { year: 2022, value: 3.45 }, { year: 2023, value: 3.87 }, { year: 2024, value: 5.32 },
    ],
    metrics: [
      {
        label: "Alibaba Cloud Revenue",
        unit: "B USD",
        description: "Aliyun (Alibaba Cloud) annual revenue",
        category: "product",
        compareKey: "cloud_revenue",
        data: [
          { year: 2021, value: 9.24 }, { year: 2022, value: 11.5 }, { year: 2023, value: 13.5 },
          { year: 2024, value: 14.5 },
        ],
      },
    ],
  },
  {
    rank: 28,
    ticker: "PG",
    name: "Procter & Gamble Co.",
    shortName: "P&G",
    sector: "Consumer",
    country: "USA",
    marketCap: 365,
    color: "#003087",
    description: "Consumer goods giant behind Tide, Pampers, Gillette, Pantene, Old Spice.",
    revenue: [
      { year: 2021, value: 76.1 }, { year: 2022, value: 80.2 }, { year: 2023, value: 82.0 },
      { year: 2024, value: 84.0 },
    ],
    netIncome: [
      { year: 2021, value: 14.3 }, { year: 2022, value: 14.7 }, { year: 2023, value: 14.6 },
      { year: 2024, value: 14.9 },
    ],
    grossMargin: [
      { year: 2021, value: 52.3 }, { year: 2022, value: 49.0 }, { year: 2023, value: 50.9 }, { year: 2024, value: 52.2 },
    ],
    operatingMargin: [
      { year: 2021, value: 23.5 }, { year: 2022, value: 22.5 }, { year: 2023, value: 23.0 }, { year: 2024, value: 23.6 },
    ],
    eps: [
      { year: 2021, value: 5.66 }, { year: 2022, value: 5.81 }, { year: 2023, value: 5.90 }, { year: 2024, value: 6.02 },
    ],
    metrics: [
      {
        label: "Organic Sales Growth",
        unit: "% YoY",
        description: "P&G organic sales growth rate (ex currency, acquisitions)",
        category: "operational",
        data: [
          { year: 2021, value: 6 }, { year: 2022, value: 7 }, { year: 2023, value: 7 }, { year: 2024, value: 4 },
        ],
      },
    ],
  },
  {
    rank: 29,
    ticker: "JNJ",
    name: "Johnson & Johnson",
    shortName: "J&J",
    sector: "Healthcare",
    country: "USA",
    marketCap: 365,
    color: "#cc0000",
    description: "Healthcare conglomerate. Pharma (Stelara, Darzalex) + MedTech after consumer health spinoff.",
    revenue: [
      { year: 2021, value: 93.8 }, { year: 2022, value: 94.9 }, { year: 2023, value: 85.2 },
      { year: 2024, value: 88.8 },
    ],
    netIncome: [
      { year: 2021, value: 20.9 }, { year: 2022, value: 17.9 }, { year: 2023, value: 13.8 },
      { year: 2024, value: 14.1 },
    ],
    grossMargin: [
      { year: 2021, value: 68.0 }, { year: 2022, value: 67.3 }, { year: 2023, value: 69.0 }, { year: 2024, value: 70.3 },
    ],
    operatingMargin: [
      { year: 2021, value: 25.4 }, { year: 2022, value: 24.6 }, { year: 2023, value: 22.9 }, { year: 2024, value: 23.8 },
    ],
    eps: [
      { year: 2021, value: 7.93 }, { year: 2022, value: 7.02 }, { year: 2023, value: 5.24 }, { year: 2024, value: 5.79 },
    ],
    metrics: [
      {
        label: "Pharmaceutical Revenue",
        unit: "B USD",
        description: "Innovative Medicine (pharma) segment revenue",
        category: "product",
        data: [
          { year: 2022, value: 52.6 }, { year: 2023, value: 54.8 }, { year: 2024, value: 57.7 },
        ],
      },
    ],
  },
  {
    rank: 30,
    ticker: "UNH",
    name: "UnitedHealth Group Incorporated",
    shortName: "UnitedHealth",
    sector: "Healthcare",
    country: "USA",
    marketCap: 390,
    color: "#316bbf",
    description: "America's largest health insurer. UnitedHealthcare insurance + Optum health services.",
    revenue: [
      { year: 2021, value: 287.6 }, { year: 2022, value: 324.2 }, { year: 2023, value: 371.6 },
      { year: 2024, value: 400.3 },
    ],
    netIncome: [
      { year: 2021, value: 17.3 }, { year: 2022, value: 20.1 }, { year: 2023, value: 22.4 },
      { year: 2024, value: 14.0 },
    ],
    grossMargin: [
      { year: 2021, value: 25.5 }, { year: 2022, value: 25.6 }, { year: 2023, value: 26.2 }, { year: 2024, value: 24.8 },
    ],
    operatingMargin: [
      { year: 2021, value: 8.0 }, { year: 2022, value: 8.1 }, { year: 2023, value: 8.4 }, { year: 2024, value: 5.8 },
    ],
    eps: [
      { year: 2021, value: 18.08 }, { year: 2022, value: 21.18 }, { year: 2023, value: 23.86 },
      { year: 2024, value: 15.02 },
    ],
    metrics: [
      {
        label: "Optum Revenue",
        unit: "B USD",
        description: "Optum health services segment (pharmacy, care delivery, data analytics)",
        category: "product",
        data: [
          { year: 2021, value: 155.6 }, { year: 2022, value: 177.4 }, { year: 2023, value: 222.0 },
          { year: 2024, value: 239.0 },
        ],
      },
      {
        label: "People Served",
        unit: "M people",
        description: "Total people served across UnitedHealthcare plans",
        category: "user",
        data: [
          { year: 2021, value: 49.0 }, { year: 2022, value: 50.2 }, { year: 2023, value: 52.5 },
          { year: 2024, value: 49.1 },
        ],
      },
    ],
  },
  {
    rank: 31,
    ticker: "HD",
    name: "The Home Depot, Inc.",
    shortName: "Home Depot",
    sector: "Consumer",
    country: "USA",
    marketCap: 360,
    color: "#f96302",
    description: "World's largest home improvement retailer.",
    revenue: [
      { year: 2021, value: 151.2 }, { year: 2022, value: 157.4 }, { year: 2023, value: 157.4 },
      { year: 2024, value: 159.5 },
    ],
    netIncome: [
      { year: 2021, value: 16.4 }, { year: 2022, value: 17.1 }, { year: 2023, value: 15.1 },
      { year: 2024, value: 14.8 },
    ],
    grossMargin: [
      { year: 2021, value: 33.7 }, { year: 2022, value: 33.6 }, { year: 2023, value: 33.4 }, { year: 2024, value: 33.5 },
    ],
    operatingMargin: [
      { year: 2021, value: 15.2 }, { year: 2022, value: 15.7 }, { year: 2023, value: 14.1 }, { year: 2024, value: 13.5 },
    ],
    eps: [
      { year: 2021, value: 15.53 }, { year: 2022, value: 16.69 }, { year: 2023, value: 15.11 },
      { year: 2024, value: 14.91 },
    ],
    metrics: [
      {
        label: "Store Count",
        unit: "stores",
        description: "Total Home Depot store count in US, Canada, Mexico",
        category: "infrastructure",
        data: [
          { year: 2021, value: 2317 }, { year: 2022, value: 2322 }, { year: 2023, value: 2335 },
          { year: 2024, value: 2345 },
        ],
      },
      {
        label: "Average Ticket",
        unit: "USD",
        description: "Average customer transaction value",
        category: "operational",
        data: [
          { year: 2021, value: 82.41 }, { year: 2022, value: 90.89 }, { year: 2023, value: 88.87 },
          { year: 2024, value: 88.65 },
        ],
      },
    ],
  },
  {
    rank: 32,
    ticker: "LVMUY",
    name: "LVMH Moët Hennessy Louis Vuitton SE",
    shortName: "LVMH",
    sector: "Luxury",
    country: "France",
    marketCap: 310,
    color: "#b8860b",
    description: "World's largest luxury goods conglomerate. 75 brands including Louis Vuitton, Dior, Moët.",
    revenue: [
      { year: 2020, value: 49.0 }, { year: 2021, value: 64.2 }, { year: 2022, value: 79.2 },
      { year: 2023, value: 86.2 }, { year: 2024, value: 84.7 },
    ],
    netIncome: [
      { year: 2020, value: 4.7 }, { year: 2021, value: 12.0 }, { year: 2022, value: 14.1 },
      { year: 2023, value: 15.2 }, { year: 2024, value: 12.4 },
    ],
    grossMargin: [
      { year: 2021, value: 68.5 }, { year: 2022, value: 68.5 }, { year: 2023, value: 68.7 }, { year: 2024, value: 67.8 },
    ],
    operatingMargin: [
      { year: 2021, value: 26.8 }, { year: 2022, value: 26.5 }, { year: 2023, value: 26.0 }, { year: 2024, value: 22.8 },
    ],
    eps: [
      { year: 2021, value: 24.01 }, { year: 2022, value: 28.09 }, { year: 2023, value: 30.32 }, { year: 2024, value: 24.30 },
    ],
    metrics: [
      {
        label: "Fashion & Leather Goods Revenue",
        unit: "B EUR",
        description: "LVMH's biggest and most profitable segment (LV, Dior, Celine)",
        category: "product",
        data: [
          { year: 2020, value: 21.2 }, { year: 2021, value: 30.9 }, { year: 2022, value: 38.6 },
          { year: 2023, value: 42.2 }, { year: 2024, value: 40.9 },
        ],
      },
      {
        label: "Number of Stores",
        unit: "stores",
        description: "Total global LVMH retail stores across all brands",
        category: "infrastructure",
        data: [
          { year: 2020, value: 5003 }, { year: 2021, value: 5556 }, { year: 2022, value: 5664 },
          { year: 2023, value: 6116 }, { year: 2024, value: 6338 },
        ],
      },
    ],
  },
  {
    rank: 33,
    ticker: "MRK",
    name: "Merck & Co., Inc.",
    shortName: "Merck",
    sector: "Healthcare",
    country: "USA",
    marketCap: 220,
    color: "#009999",
    description: "Pharma giant. Keytruda (cancer immunotherapy) is the world's best-selling drug.",
    revenue: [
      { year: 2021, value: 48.7 }, { year: 2022, value: 59.3 }, { year: 2023, value: 60.1 },
      { year: 2024, value: 63.6 },
    ],
    netIncome: [
      { year: 2021, value: 13.0 }, { year: 2022, value: 14.5 }, { year: 2023, value: 365.0 },
      { year: 2024, value: 15.6 },
    ],
    grossMargin: [
      { year: 2021, value: 71.8 }, { year: 2022, value: 71.4 }, { year: 2023, value: 73.1 }, { year: 2024, value: 75.0 },
    ],
    operatingMargin: [
      { year: 2021, value: 26.7 }, { year: 2022, value: 30.2 }, { year: 2023, value: 60.7 }, { year: 2024, value: 28.2 },
    ],
    eps: [
      { year: 2021, value: 5.12 }, { year: 2022, value: 5.67 }, { year: 2023, value: 14.48 }, { year: 2024, value: 6.15 },
    ],
    metrics: [
      {
        label: "Keytruda Revenue",
        unit: "B USD",
        description: "Pembrolizumab (Keytruda) annual sales — world's top-selling drug",
        category: "product",
        data: [
          { year: 2021, value: 17.2 }, { year: 2022, value: 20.9 }, { year: 2023, value: 25.0 },
          { year: 2024, value: 29.5 },
        ],
      },
    ],
  },
  {
    rank: 34,
    ticker: "BAC",
    name: "Bank of America Corporation",
    shortName: "Bank of America",
    sector: "Financial",
    country: "USA",
    marketCap: 345,
    color: "#e31837",
    description: "America's second-largest bank. Consumer, commercial banking, wealth management, and trading.",
    revenue: [
      { year: 2021, value: 89.1 }, { year: 2022, value: 94.9 }, { year: 2023, value: 98.6 },
      { year: 2024, value: 101.9 },
    ],
    netIncome: [
      { year: 2021, value: 31.9 }, { year: 2022, value: 27.5 }, { year: 2023, value: 26.5 },
      { year: 2024, value: 27.1 },
    ],
    grossMargin: [
      { year: 2022, value: 54.2 }, { year: 2023, value: 53.6 }, { year: 2024, value: 54.8 },
    ],
    operatingMargin: [
      { year: 2021, value: 38.3 }, { year: 2022, value: 32.5 }, { year: 2023, value: 29.8 }, { year: 2024, value: 29.5 },
    ],
    eps: [
      { year: 2021, value: 3.57 }, { year: 2022, value: 3.19 }, { year: 2023, value: 3.08 }, { year: 2024, value: 3.21 },
    ],
    metrics: [
      {
        label: "Net Interest Income",
        unit: "B USD",
        description: "Interest income minus interest expense",
        category: "financial",
        data: [
          { year: 2021, value: 42.9 }, { year: 2022, value: 52.5 }, { year: 2023, value: 56.9 },
          { year: 2024, value: 56.7 },
        ],
      },
    ],
  },
  {
    rank: 35,
    ticker: "INTU",
    name: "Intuit Inc.",
    shortName: "Intuit",
    sector: "Technology",
    country: "USA",
    marketCap: 175,
    color: "#236cff",
    description: "TurboTax, QuickBooks, Mailchimp, Credit Karma. The financial software stack for SMBs.",
    revenue: [
      { year: 2021, value: 9.6 }, { year: 2022, value: 12.7 }, { year: 2023, value: 14.4 },
      { year: 2024, value: 16.3 },
    ],
    netIncome: [
      { year: 2021, value: 2.06 }, { year: 2022, value: 2.07 }, { year: 2023, value: 2.38 },
      { year: 2024, value: 2.96 },
    ],
    grossMargin: [
      { year: 2021, value: 79.7 }, { year: 2022, value: 79.1 }, { year: 2023, value: 79.0 }, { year: 2024, value: 79.5 },
    ],
    operatingMargin: [
      { year: 2021, value: 22.1 }, { year: 2022, value: 17.2 }, { year: 2023, value: 18.7 }, { year: 2024, value: 19.9 },
    ],
    eps: [
      { year: 2021, value: 7.31 }, { year: 2022, value: 7.30 }, { year: 2023, value: 8.52 }, { year: 2024, value: 10.53 },
    ],
    metrics: [
      {
        label: "Small Business & Self-Employed Revenue",
        unit: "B USD",
        description: "QuickBooks Online + Payments + Payroll revenue",
        category: "product",
        compareKey: "subscription_revenue",
        data: [
          { year: 2021, value: 4.6 }, { year: 2022, value: 5.6 }, { year: 2023, value: 7.2 },
          { year: 2024, value: 8.9 },
        ],
      },
      {
        label: "Online Ecosystem Revenue",
        unit: "B USD",
        description: "Recurring online services revenue (TurboTax Online, QBO)",
        category: "product",
        data: [
          { year: 2022, value: 10.0 }, { year: 2023, value: 11.9 }, { year: 2024, value: 13.8 },
        ],
      },
    ],
  },
  {
    rank: 36,
    ticker: "TM",
    name: "Toyota Motor Corporation",
    shortName: "Toyota",
    sector: "Auto",
    country: "Japan",
    marketCap: 230,
    color: "#eb0a1e",
    description: "World's largest automaker. Hybrid pioneer (Prius) pivoting to EVs slowly but profitably.",
    revenue: [
      { year: 2021, value: 256.9 }, { year: 2022, value: 274.5 }, { year: 2023, value: 307.8 },
      { year: 2024, value: 321.4 },
    ],
    netIncome: [
      { year: 2021, value: 20.6 }, { year: 2022, value: 20.0 }, { year: 2023, value: 24.0 },
      { year: 2024, value: 28.4 },
    ],
    grossMargin: [
      { year: 2021, value: 17.6 }, { year: 2022, value: 17.1 }, { year: 2023, value: 19.8 }, { year: 2024, value: 21.2 },
    ],
    operatingMargin: [
      { year: 2021, value: 7.3 }, { year: 2022, value: 5.9 }, { year: 2023, value: 10.4 }, { year: 2024, value: 12.3 },
    ],
    eps: [
      { year: 2021, value: 1.45 }, { year: 2022, value: 1.41 }, { year: 2023, value: 1.71 }, { year: 2024, value: 2.00 },
    ],
    metrics: [
      {
        label: "Vehicle Sales",
        unit: "M units",
        description: "Global Toyota + Lexus vehicle sales annually",
        category: "product",
        data: [
          { year: 2021, value: 10.5 }, { year: 2022, value: 9.5 }, { year: 2023, value: 11.2 },
          { year: 2024, value: 10.8 },
        ],
      },
      {
        label: "Hybrid Sales",
        unit: "M units",
        description: "Annual hybrid vehicle sales globally",
        category: "product",
        data: [
          { year: 2020, value: 1.8 }, { year: 2021, value: 2.3 }, { year: 2022, value: 2.6 },
          { year: 2023, value: 3.4 }, { year: 2024, value: 4.0 },
        ],
      },
      {
        label: "BEV Sales",
        unit: "K units",
        description: "Battery Electric Vehicle (BEV) sales — pure EV segment",
        category: "product",
        data: [
          { year: 2022, value: 24 }, { year: 2023, value: 104 }, { year: 2024, value: 140 },
        ],
      },
    ],
  },
  {
    rank: 37,
    ticker: "INTC",
    name: "Intel Corporation",
    shortName: "Intel",
    sector: "Semiconductor",
    country: "USA",
    marketCap: 95,
    color: "#0071c5",
    description: "Fallen PC/server CPU giant. Fighting back with foundry services and AI PCs.",
    revenue: [
      { year: 2020, value: 77.9 }, { year: 2021, value: 79.0 }, { year: 2022, value: 63.1 },
      { year: 2023, value: 54.2 }, { year: 2024, value: 53.1 },
    ],
    netIncome: [
      { year: 2020, value: 20.9 }, { year: 2021, value: 19.9 }, { year: 2022, value: 8.0 },
      { year: 2023, value: 1.7 }, { year: 2024, value: -18.8 },
    ],
    grossMargin: [
      { year: 2020, value: 55.7 }, { year: 2021, value: 55.4 }, { year: 2022, value: 42.6 },
      { year: 2023, value: 40.0 }, { year: 2024, value: 32.7 },
    ],
    operatingMargin: [
      { year: 2020, value: 30.0 }, { year: 2021, value: 27.3 }, { year: 2022, value: 3.0 },
      { year: 2023, value: 1.7 }, { year: 2024, value: -24.1 },
    ],
    eps: [
      { year: 2020, value: 4.94 }, { year: 2021, value: 4.86 }, { year: 2022, value: 1.84 },
      { year: 2023, value: 0.40 }, { year: 2024, value: -4.38 },
    ],
    metrics: [
      {
        label: "Data Center & AI Revenue",
        unit: "B USD",
        description: "DCAI segment — server CPUs and AI accelerator sales",
        category: "product",
        compareKey: "datacenter_revenue",
        data: [
          { year: 2021, value: 26.1 }, { year: 2022, value: 19.2 }, { year: 2023, value: 15.5 },
          { year: 2024, value: 12.8 },
        ],
      },
      {
        label: "Intel Foundry Revenue",
        unit: "B USD",
        description: "Intel Foundry Services (IFS) — making chips for other companies",
        category: "product",
        data: [
          { year: 2023, value: 0.95 }, { year: 2024, value: 4.7 },
        ],
      },
    ],
  },
  {
    rank: 38,
    ticker: "RTX",
    name: "RTX Corporation",
    shortName: "RTX",
    sector: "Industrial",
    country: "USA",
    marketCap: 185,
    color: "#005eb8",
    description: "Aerospace & defense. Pratt & Whitney jet engines + Raytheon missiles + Collins aerospace.",
    revenue: [
      { year: 2021, value: 64.4 }, { year: 2022, value: 67.1 }, { year: 2023, value: 68.9 },
      { year: 2024, value: 80.2 },
    ],
    netIncome: [
      { year: 2021, value: 3.9 }, { year: 2022, value: 5.2 }, { year: 2023, value: 3.2 },
      { year: 2024, value: 4.8 },
    ],
    grossMargin: [
      { year: 2022, value: 20.1 }, { year: 2023, value: 18.9 }, { year: 2024, value: 20.5 },
    ],
    operatingMargin: [
      { year: 2022, value: 8.4 }, { year: 2023, value: 7.7 }, { year: 2024, value: 8.2 },
    ],
    eps: [
      { year: 2022, value: 3.51 }, { year: 2023, value: 1.88 }, { year: 2024, value: 3.28 },
    ],
    metrics: [
      {
        label: "Defense Revenue",
        unit: "B USD",
        description: "Raytheon missiles & defense segment revenue",
        category: "product",
        data: [
          { year: 2022, value: 26.0 }, { year: 2023, value: 26.5 }, { year: 2024, value: 27.1 },
        ],
      },
    ],
  },
  {
    rank: 39,
    ticker: "PFE",
    name: "Pfizer Inc.",
    shortName: "Pfizer",
    sector: "Healthcare",
    country: "USA",
    marketCap: 145,
    color: "#0093c8",
    description: "Big pharma. COVID vaccine/pill revenues collapsing — pivoting to oncology.",
    revenue: [
      { year: 2021, value: 81.3 }, { year: 2022, value: 100.3 }, { year: 2023, value: 58.5 },
      { year: 2024, value: 63.6 },
    ],
    netIncome: [
      { year: 2021, value: 21.9 }, { year: 2022, value: 31.4 }, { year: 2023, value: -2.8 },
      { year: 2024, value: 8.0 },
    ],
    grossMargin: [
      { year: 2021, value: 68.0 }, { year: 2022, value: 65.0 }, { year: 2023, value: 62.5 }, { year: 2024, value: 63.5 },
    ],
    operatingMargin: [
      { year: 2021, value: 26.7 }, { year: 2022, value: 32.3 }, { year: 2023, value: -11.3 }, { year: 2024, value: 12.9 },
    ],
    eps: [
      { year: 2021, value: 3.85 }, { year: 2022, value: 5.47 }, { year: 2023, value: -0.49 },
      { year: 2024, value: 1.41 },
    ],
    metrics: [
      {
        label: "COVID Product Revenue",
        unit: "B USD",
        description: "Comirnaty vaccine + Paxlovid antiviral combined revenue",
        category: "product",
        data: [
          { year: 2021, value: 36.8 }, { year: 2022, value: 56.7 }, { year: 2023, value: 11.2 },
          { year: 2024, value: 8.6 },
        ],
      },
    ],
  },
  {
    rank: 40,
    ticker: "QCOM",
    name: "QUALCOMM Incorporated",
    shortName: "Qualcomm",
    sector: "Semiconductor",
    country: "USA",
    marketCap: 160,
    color: "#3253dc",
    description: "Mobile chip king (Snapdragon). Pivoting to PCs, cars, and edge AI.",
    revenue: [
      { year: 2021, value: 33.6 }, { year: 2022, value: 44.2 }, { year: 2023, value: 35.8 },
      { year: 2024, value: 38.9 },
    ],
    netIncome: [
      { year: 2021, value: 9.0 }, { year: 2022, value: 12.9 }, { year: 2023, value: 7.2 },
      { year: 2024, value: 10.1 },
    ],
    grossMargin: [
      { year: 2021, value: 57.4 }, { year: 2022, value: 58.1 }, { year: 2023, value: 55.5 }, { year: 2024, value: 56.7 },
    ],
    operatingMargin: [
      { year: 2021, value: 26.2 }, { year: 2022, value: 29.3 }, { year: 2023, value: 17.5 }, { year: 2024, value: 23.9 },
    ],
    eps: [
      { year: 2021, value: 8.13 }, { year: 2022, value: 11.40 }, { year: 2023, value: 6.40 },
      { year: 2024, value: 9.06 },
    ],
    metrics: [
      {
        label: "Automotive Revenue",
        unit: "B USD",
        description: "Qualcomm automotive (Snapdragon Digital Chassis) design-in pipeline",
        category: "product",
        data: [
          { year: 2022, value: 1.38 }, { year: 2023, value: 1.86 }, { year: 2024, value: 2.9 },
        ],
      },
    ],
  },
  {
    rank: 41,
    ticker: "HON",
    name: "Honeywell International Inc.",
    shortName: "Honeywell",
    sector: "Industrial",
    country: "USA",
    marketCap: 130,
    color: "#e11d27",
    description: "Industrial technology conglomerate. Aerospace, building automation, performance materials.",
    revenue: [
      { year: 2021, value: 34.4 }, { year: 2022, value: 35.5 }, { year: 2023, value: 36.7 },
      { year: 2024, value: 36.7 },
    ],
    netIncome: [
      { year: 2021, value: 5.5 }, { year: 2022, value: 4.9 }, { year: 2023, value: 5.7 },
      { year: 2024, value: 5.4 },
    ],
    grossMargin: [
      { year: 2022, value: 32.5 }, { year: 2023, value: 33.2 }, { year: 2024, value: 33.8 },
    ],
    operatingMargin: [
      { year: 2022, value: 20.5 }, { year: 2023, value: 20.9 }, { year: 2024, value: 20.2 },
    ],
    eps: [
      { year: 2022, value: 7.28 }, { year: 2023, value: 8.47 }, { year: 2024, value: 8.52 },
    ],
    metrics: [
      {
        label: "Aerospace Revenue",
        unit: "B USD",
        description: "Honeywell Aerospace Technologies segment",
        category: "product",
        data: [
          { year: 2022, value: 12.7 }, { year: 2023, value: 14.2 }, { year: 2024, value: 15.3 },
        ],
      },
    ],
  },
  {
    rank: 42,
    ticker: "GE",
    name: "GE Aerospace",
    shortName: "GE Aerospace",
    sector: "Industrial",
    country: "USA",
    marketCap: 225,
    color: "#0069b4",
    description: "Commercial and defense jet engines. LEAP engines power Boeing 737 MAX and Airbus A320neo.",
    revenue: [
      { year: 2022, value: 26.0 }, { year: 2023, value: 32.2 }, { year: 2024, value: 38.7 },
    ],
    netIncome: [
      { year: 2022, value: 0.4 }, { year: 2023, value: 9.4 }, { year: 2024, value: 6.8 },
    ],
    grossMargin: [
      { year: 2023, value: 29.1 }, { year: 2024, value: 32.0 },
    ],
    operatingMargin: [
      { year: 2023, value: 15.1 }, { year: 2024, value: 17.6 },
    ],
    eps: [
      { year: 2023, value: 9.29 }, { year: 2024, value: 6.77 },
    ],
    metrics: [
      {
        label: "LEAP Engine Deliveries",
        unit: "units",
        description: "Annual LEAP jet engine deliveries (Boeing 737 MAX, Airbus A320neo)",
        category: "product",
        data: [
          { year: 2022, value: 1508 }, { year: 2023, value: 2095 }, { year: 2024, value: 2320 },
        ],
      },
      {
        label: "Services Revenue",
        unit: "B USD",
        description: "Engine services, MRO, and aftermarket parts revenue",
        category: "product",
        data: [
          { year: 2022, value: 16.4 }, { year: 2023, value: 20.9 }, { year: 2024, value: 25.1 },
        ],
      },
    ],
  },
  {
    rank: 43,
    ticker: "SPGI",
    name: "S&P Global Inc.",
    shortName: "S&P Global",
    sector: "Financial",
    country: "USA",
    marketCap: 155,
    color: "#e31837",
    description: "Financial data, credit ratings (Moody's rival), and market indices like the S&P 500.",
    revenue: [
      { year: 2021, value: 8.3 }, { year: 2022, value: 11.2 }, { year: 2023, value: 12.5 },
      { year: 2024, value: 14.2 },
    ],
    netIncome: [
      { year: 2021, value: 3.0 }, { year: 2022, value: 3.2 }, { year: 2023, value: 3.6 },
      { year: 2024, value: 3.9 },
    ],
    grossMargin: [
      { year: 2022, value: 68.5 }, { year: 2023, value: 69.2 }, { year: 2024, value: 71.0 },
    ],
    operatingMargin: [
      { year: 2022, value: 28.5 }, { year: 2023, value: 31.8 }, { year: 2024, value: 36.2 },
    ],
    eps: [
      { year: 2022, value: 8.10 }, { year: 2023, value: 10.85 }, { year: 2024, value: 12.28 },
    ],
    metrics: [
      {
        label: "Ratings Revenue",
        unit: "B USD",
        description: "Credit ratings segment revenue",
        category: "product",
        data: [
          { year: 2022, value: 2.6 }, { year: 2023, value: 3.4 }, { year: 2024, value: 4.4 },
        ],
      },
    ],
  },
  {
    rank: 44,
    ticker: "DE",
    name: "Deere & Company",
    shortName: "John Deere",
    sector: "Industrial",
    country: "USA",
    marketCap: 115,
    color: "#367c2b",
    description: "Agricultural and construction equipment. Precision agriculture AI is the differentiator.",
    revenue: [
      { year: 2021, value: 44.0 }, { year: 2022, value: 52.6 }, { year: 2023, value: 61.3 },
      { year: 2024, value: 51.7 },
    ],
    netIncome: [
      { year: 2021, value: 5.96 }, { year: 2022, value: 7.13 }, { year: 2023, value: 10.17 },
      { year: 2024, value: 7.1 },
    ],
    grossMargin: [
      { year: 2022, value: 33.7 }, { year: 2023, value: 36.0 }, { year: 2024, value: 31.0 },
    ],
    operatingMargin: [
      { year: 2022, value: 16.7 }, { year: 2023, value: 19.4 }, { year: 2024, value: 14.9 },
    ],
    eps: [
      { year: 2022, value: 22.45 }, { year: 2023, value: 34.63 }, { year: 2024, value: 23.82 },
    ],
    metrics: [
      {
        label: "Precision Agriculture Connected Machines",
        unit: "K machines",
        description: "John Deere Operations Center connected machines globally",
        category: "product",
        data: [
          { year: 2021, value: 330 }, { year: 2022, value: 400 }, { year: 2023, value: 510 },
          { year: 2024, value: 570 },
        ],
      },
      {
        label: "See & Spray Coverage",
        unit: "M acres",
        description: "Acres covered by autonomous See & Spray herbicide system",
        category: "product",
        data: [
          { year: 2022, value: 0.5 }, { year: 2023, value: 2.5 }, { year: 2024, value: 5.0 },
        ],
      },
    ],
  },
  {
    rank: 45,
    ticker: "IBM",
    name: "International Business Machines Corp.",
    shortName: "IBM",
    sector: "Technology",
    country: "USA",
    marketCap: 200,
    color: "#1f70c1",
    description: "Legacy IT giant reinventing itself through hybrid cloud (Red Hat) and AI (watsonx).",
    revenue: [
      { year: 2021, value: 57.4 }, { year: 2022, value: 60.5 }, { year: 2023, value: 61.9 },
      { year: 2024, value: 62.8 },
    ],
    netIncome: [
      { year: 2021, value: 5.7 }, { year: 2022, value: 1.6 }, { year: 2023, value: 7.5 },
      { year: 2024, value: 6.5 },
    ],
    grossMargin: [
      { year: 2022, value: 54.1 }, { year: 2023, value: 55.5 }, { year: 2024, value: 56.2 },
    ],
    operatingMargin: [
      { year: 2022, value: 3.2 }, { year: 2023, value: 13.5 }, { year: 2024, value: 12.0 },
    ],
    eps: [
      { year: 2022, value: 1.76 }, { year: 2023, value: 8.23 }, { year: 2024, value: 7.05 },
    ],
    metrics: [
      {
        label: "Software Revenue",
        unit: "B USD",
        description: "IBM software including Red Hat and watsonx",
        category: "product",
        data: [
          { year: 2022, value: 23.5 }, { year: 2023, value: 25.0 }, { year: 2024, value: 26.7 },
        ],
      },
    ],
  },
  {
    rank: 46,
    ticker: "UBER",
    name: "Uber Technologies, Inc.",
    shortName: "Uber",
    sector: "Technology",
    country: "USA",
    marketCap: 170,
    color: "#000000",
    description: "Global ride-hailing and food delivery platform. First profitable year in 2023.",
    revenue: [
      { year: 2021, value: 17.5 }, { year: 2022, value: 31.9 }, { year: 2023, value: 37.3 },
      { year: 2024, value: 43.9 },
    ],
    netIncome: [
      { year: 2021, value: -0.5 }, { year: 2022, value: -9.1 }, { year: 2023, value: 1.9 },
      { year: 2024, value: 9.9 },
    ],
    grossMargin: [
      { year: 2022, value: 37.8 }, { year: 2023, value: 42.0 }, { year: 2024, value: 45.0 },
    ],
    operatingMargin: [
      { year: 2022, value: -18.4 }, { year: 2023, value: 0.8 }, { year: 2024, value: 6.0 },
    ],
    eps: [
      { year: 2022, value: -4.65 }, { year: 2023, value: 0.87 }, { year: 2024, value: 4.82 },
    ],
    metrics: [
      {
        label: "Monthly Active Platform Consumers",
        unit: "M users",
        description: "Monthly active consumers across Uber's ride and delivery platforms",
        category: "user",
        data: [
          { year: 2021, value: 118 }, { year: 2022, value: 131 }, { year: 2023, value: 150 },
          { year: 2024, value: 171 },
        ],
      },
      {
        label: "Gross Bookings",
        unit: "B USD",
        description: "Total gross bookings across ride-hailing and Uber Eats",
        category: "operational",
        data: [
          { year: 2021, value: 90.4 }, { year: 2022, value: 115.4 }, { year: 2023, value: 137.9 },
          { year: 2024, value: 162.2 },
        ],
      },
      {
        label: "Trips Completed",
        unit: "B trips",
        description: "Annual completed Uber trips (ride + delivery)",
        category: "operational",
        data: [
          { year: 2021, value: 6.3 }, { year: 2022, value: 7.6 }, { year: 2023, value: 9.4 },
          { year: 2024, value: 11.2 },
        ],
      },
    ],
  },
  {
    rank: 47,
    ticker: "SHOP",
    name: "Shopify Inc.",
    shortName: "Shopify",
    sector: "Technology",
    country: "Canada",
    marketCap: 125,
    color: "#96bf48",
    description: "Commerce infrastructure for 1M+ merchants. Payments, logistics, and AI-assisted selling.",
    revenue: [
      { year: 2021, value: 4.6 }, { year: 2022, value: 5.6 }, { year: 2023, value: 7.1 },
      { year: 2024, value: 8.9 },
    ],
    netIncome: [
      { year: 2021, value: 2.9 }, { year: 2022, value: -3.5 }, { year: 2023, value: 0.13 },
      { year: 2024, value: 1.3 },
    ],
    grossMargin: [
      { year: 2021, value: 57.4 }, { year: 2022, value: 50.3 }, { year: 2023, value: 49.3 }, { year: 2024, value: 51.1 },
    ],
    operatingMargin: [
      { year: 2021, value: 10.3 }, { year: 2022, value: -14.2 }, { year: 2023, value: 0.6 }, { year: 2024, value: 11.2 },
    ],
    eps: [
      { year: 2021, value: 2.36 }, { year: 2022, value: -2.74 }, { year: 2023, value: 0.10 }, { year: 2024, value: 0.97 },
    ],
    metrics: [
      {
        label: "Gross Merchandise Volume",
        unit: "B USD",
        description: "Total merchandise sold through Shopify merchants",
        category: "operational",
        data: [
          { year: 2021, value: 175.4 }, { year: 2022, value: 197.2 }, { year: 2023, value: 235.9 },
          { year: 2024, value: 278.6 },
        ],
      },
      {
        label: "Merchant Count",
        unit: "M merchants",
        description: "Number of active Shopify merchants globally",
        category: "user",
        data: [
          { year: 2021, value: 1.7 }, { year: 2022, value: 2.0 }, { year: 2023, value: 2.5 },
          { year: 2024, value: 3.0 },
        ],
      },
      {
        label: "Shopify Payments Adoption",
        unit: "% of GMV",
        description: "Percentage of GMV processed through Shopify Payments",
        category: "product",
        data: [
          { year: 2021, value: 49 }, { year: 2022, value: 54 }, { year: 2023, value: 59 },
          { year: 2024, value: 64 },
        ],
      },
    ],
  },
  {
    rank: 48,
    ticker: "NOW",
    name: "ServiceNow, Inc.",
    shortName: "ServiceNow",
    sector: "Technology",
    country: "USA",
    marketCap: 210,
    color: "#81b5a1",
    description: "Enterprise IT workflow automation. Now Platform + AI agents for IT, HR, and operations.",
    revenue: [
      { year: 2021, value: 5.9 }, { year: 2022, value: 7.2 }, { year: 2023, value: 8.97 },
      { year: 2024, value: 10.98 },
    ],
    netIncome: [
      { year: 2021, value: 0.49 }, { year: 2022, value: 0.72 }, { year: 2023, value: 1.69 },
      { year: 2024, value: 2.13 },
    ],
    grossMargin: [
      { year: 2021, value: 77.5 }, { year: 2022, value: 77.7 }, { year: 2023, value: 78.7 }, { year: 2024, value: 78.9 },
    ],
    operatingMargin: [
      { year: 2021, value: 6.0 }, { year: 2022, value: 5.0 }, { year: 2023, value: 10.8 }, { year: 2024, value: 11.9 },
    ],
    eps: [
      { year: 2021, value: 2.35 }, { year: 2022, value: 3.52 }, { year: 2023, value: 8.22 }, { year: 2024, value: 10.19 },
    ],
    metrics: [
      {
        label: "Subscription Revenue",
        unit: "B USD",
        description: "Annual subscription revenue (nearly all revenue is recurring)",
        category: "product",
        compareKey: "subscription_revenue",
        data: [
          { year: 2021, value: 5.6 }, { year: 2022, value: 6.9 }, { year: 2023, value: 8.58 },
          { year: 2024, value: 10.48 },
        ],
      },
      {
        label: "Customers >$1M ACV",
        unit: "customers",
        description: "Enterprise customers with >$1M annual contract value",
        category: "user",
        data: [
          { year: 2021, value: 1359 }, { year: 2022, value: 1724 }, { year: 2023, value: 1987 },
          { year: 2024, value: 2109 },
        ],
      },
    ],
  },
  {
    rank: 49,
    ticker: "SQ",
    name: "Block, Inc.",
    shortName: "Block",
    sector: "Financial",
    country: "USA",
    marketCap: 40,
    color: "#000000",
    description: "Square payments + Cash App. Bitcoin ecosystem and SMB payments platform.",
    revenue: [
      { year: 2021, value: 17.7 }, { year: 2022, value: 17.5 }, { year: 2023, value: 21.9 },
      { year: 2024, value: 24.1 },
    ],
    netIncome: [
      { year: 2021, value: 0.17 }, { year: 2022, value: -0.54 }, { year: 2023, value: 0.88 },
      { year: 2024, value: 0.64 },
    ],
    grossMargin: [
      { year: 2022, value: 36.1 }, { year: 2023, value: 37.1 }, { year: 2024, value: 38.0 },
    ],
    operatingMargin: [
      { year: 2022, value: -5.4 }, { year: 2023, value: 2.4 }, { year: 2024, value: 3.9 },
    ],
    eps: [
      { year: 2022, value: -0.87 }, { year: 2023, value: 1.37 }, { year: 2024, value: 1.01 },
    ],
    metrics: [
      {
        label: "Cash App Monthly Actives",
        unit: "M users",
        description: "Cash App monthly active users",
        category: "user",
        data: [
          { year: 2021, value: 44 }, { year: 2022, value: 51 }, { year: 2023, value: 56 },
          { year: 2024, value: 57 },
        ],
      },
      {
        label: "Cash App Gross Profit",
        unit: "B USD",
        description: "Cash App gross profit (consumer fintech metric)",
        category: "financial",
        data: [
          { year: 2021, value: 2.07 }, { year: 2022, value: 2.45 }, { year: 2023, value: 3.0 },
          { year: 2024, value: 3.55 },
        ],
      },
    ],
  },
  {
    rank: 50,
    ticker: "SNOW",
    name: "Snowflake Inc.",
    shortName: "Snowflake",
    sector: "Technology",
    country: "USA",
    marketCap: 45,
    color: "#29b5e8",
    description: "Cloud data warehousing platform. Consumption-based revenue model loved by analysts.",
    revenue: [
      { year: 2022, value: 1.2 }, { year: 2023, value: 2.1 }, { year: 2024, value: 3.2 },
    ],
    netIncome: [
      { year: 2022, value: -0.68 }, { year: 2023, value: -0.83 }, { year: 2024, value: -0.84 },
    ],
    grossMargin: [
      { year: 2022, value: 63.5 }, { year: 2023, value: 68.3 }, { year: 2024, value: 67.7 },
    ],
    operatingMargin: [
      { year: 2022, value: -39.4 }, { year: 2023, value: -27.2 }, { year: 2024, value: -18.3 },
    ],
    eps: [
      { year: 2022, value: -2.19 }, { year: 2023, value: -2.63 }, { year: 2024, value: -2.51 },
    ],
    metrics: [
      {
        label: "Product Revenue",
        unit: "B USD",
        description: "Consumption-based product revenue (ex. professional services)",
        category: "product",
        data: [
          { year: 2022, value: 1.1 }, { year: 2023, value: 2.0 }, { year: 2024, value: 3.1 },
        ],
      },
      {
        label: "Net Revenue Retention",
        unit: "% NRR",
        description: "Net revenue retention rate — measures expansion in existing accounts",
        category: "user",
        data: [
          { year: 2022, value: 178 }, { year: 2023, value: 158 }, { year: 2024, value: 131 },
        ],
      },
      {
        label: "Remaining Performance Obligations",
        unit: "B USD",
        description: "Contracted future revenue",
        category: "financial",
        data: [
          { year: 2022, value: 3.0 }, { year: 2023, value: 5.2 }, { year: 2024, value: 6.9 },
        ],
      },
    ],
  },
];

// Helper: get all companies that share a compareKey metric
export function getComparableCompanies(compareKey: string): {
  company: Company;
  metric: MetricSeries;
}[] {
  const results: { company: Company; metric: MetricSeries }[] = [];
  for (const co of TOP50) {
    for (const m of co.metrics) {
      if (m.compareKey === compareKey) {
        results.push({ company: co, metric: m });
      }
    }
  }
  return results;
}

// Get all unique compareKeys
export function getAllCompareKeys(): string[] {
  const keys = new Set<string>();
  for (const co of TOP50) {
    for (const m of co.metrics) {
      if (m.compareKey) keys.add(m.compareKey);
    }
  }
  return Array.from(keys);
}

export const COMPARE_KEY_LABELS: Record<string, string> = {
  cloud_revenue: "Cloud Revenue",
  cloud_growth: "Cloud Revenue Growth",
  datacenter_revenue: "Data Center Revenue",
  datacenter_gw: "Data Center Power Capacity",
  rd_spend: "R&D Spend",
  capex: "Capital Expenditure",
  subscription_revenue: "Subscription Revenue",
  paid_subscribers: "Paid Subscribers",
};

export const SECTORS: Sector[] = [
  "Technology", "Consumer", "Financial", "Healthcare", "Energy",
  "Industrial", "Telecom", "Semiconductor", "Luxury", "Auto",
];

export const SECTOR_COLORS: Record<Sector, string> = {
  Technology: "#4285f4",
  Consumer: "#ff9900",
  Financial: "#003087",
  Healthcare: "#d52b1e",
  Energy: "#cc1f28",
  Industrial: "#367c2b",
  Telecom: "#6f42c1",
  Semiconductor: "#76b900",
  Luxury: "#b8860b",
  Auto: "#eb0a1e",
};
