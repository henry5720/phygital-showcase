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

export interface ProductConfig {
  theme: {
    primaryColor: string
    backgroundColor: string
    textColor: string
  }
  brand: {
    name: string
    subtitle: string
    heroImage: string
    logoMindFile: string
  }
  ar: {
    model: string
    videos: {
      stageA: string
      stageB: string
      stageC: string
    }
    ctaText: string
  }
  quiz: {
    title: string
    questions: QuizQuestion[]
    results: Record<string, QuizResult>
  }
  line: {
    joinUrl: string
  }
}
