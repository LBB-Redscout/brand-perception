export interface SearchResult {
  sentimentSummary: string;
  keyStrengths: string[];
  keyConcerns: string[];
  audienceInsights: string;
  socialInsights: string;
  sources: string[];
}

export interface ThemeScore {
  score: number;
  insight: string;
}

export interface AudienceSegment {
  label: string;
  percentage: number;
  description: string;
  sentiment: 'Positive' | 'Mixed' | 'Negative';
}

export interface SocialPlatform {
  name: string;
  followers: string;
  frequency: string;
  engagement: 'Low' | 'Medium' | 'High' | 'Very High';
  active: boolean;
}

export interface Recommendation {
  action: string;
  rationale: string;
  learnFrom: Array<{ brand: string; reason: string }>;
}

export interface TeamRecommendation {
  action: string;
  rationale: string;
  priority: 'High' | 'Medium' | 'Low';
  learnFrom: Array<{ brand: string; reason: string }>;
}

export interface TeamRecsResult {
  team: string;
  question: string;
  context: string;
  recommendations: TeamRecommendation[];
}

export interface BrandReport {
  overallScore: number;
  sentiment: { positive: number; neutral: number; negative: number };
  summary: string;
  sources: string[];
  themes: {
    product_quality: ThemeScore;
    customer_service: ThemeScore;
    value: ThemeScore;
    brand_image: ThemeScore;
    innovation: ThemeScore;
  };
  topStrengths: string[];
  topConcerns: string[];
  audience: {
    summary: string;
    segments: AudienceSegment[];
    ageRange: string;
    topChannels: string[];
    influencerPresence: 'Low' | 'Medium' | 'High' | 'Very High';
    influencerNote: string;
    loyaltySignal: 'Low' | 'Medium' | 'High' | 'Very High';
    loyaltyNote: string;
  };
  socialPresence: {
    overallScore: number;
    summary: string;
    platforms: SocialPlatform[];
    strengths: string[];
    gaps: string[];
  };
  recommendations: Recommendation[];
}

export interface BrandAnalysis {
  brand: string;
  industry?: string;
  report: BrandReport;
  teamRecs?: TeamRecsResult[];
}

export interface AnalysisState {
  primary: BrandAnalysis | null;
  competitors: BrandAnalysis[];
  teamRecs: TeamRecsResult[];
}

export interface TeamArea {
  team: string;
  question: string;
}

export interface ProgressStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
}
