// ─── Quiz Layer ───

export interface QuizOption {
  text: string
  scores: Record<string, number>
}

export interface QuizQuestion {
  id: string
  text: string
  options: QuizOption[]
}

export interface QuizResult {
  type: string
  name: string
  recommendation: string
  description: string
  lineJoinUrl: string
}

export interface QuizConfig {
  title: string
  questions: QuizQuestion[]
  results: Record<string, QuizResult>
}

// ─── Brand Layer (TS constants, not AI-generated) ───

export interface BrandConfig {
  name: string
  subtitle: string
  heroImage: string
  logoMindFile: string
  ar: {
    model: string
    videos: {
      stageA: string
      stageB: string
      stageC: string
    }
    ctaText: string
  }
  line: {
    joinUrl: string
  }
}

// ─── Composed Config ───

export interface ProductConfig {
  brand: BrandConfig
  quiz: QuizConfig
}
