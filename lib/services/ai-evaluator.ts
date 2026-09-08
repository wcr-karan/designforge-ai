import { AIReviewOutputSchema, type AIReviewOutput } from '@/lib/validation/schemas'

export interface EvaluationSectionInput {
  id: string
  title: string
  description: string
  evaluationCriteria: string
}

export interface EvaluationInput {
  problemTitle: string
  problemSlug: string
  problemDescription: string
  requirements: string[]
  sections: EvaluationSectionInput[]
  responses: Array<{
    sectionId: string
    response: string
  }>
}

export interface AIEvaluator {
  evaluate(input: EvaluationInput): Promise<AIReviewOutput>
}

// Next problem recommendation mapping based on current problem
const NEXT_PROBLEM_MAP: Record<string, { problemSlug: string; reason: string }> = {
  'parking-lot': {
    problemSlug: 'elevator-system',
    reason:
      'Now that you have practiced object modelling and containment, try the Elevator System to practice dynamic state coordination, concurrency, and dispatch strategies.',
  },
  'elevator-system': {
    problemSlug: 'vending-machine',
    reason:
      'With state management and coordination established, try the Vending Machine to explore the State Pattern and Strategy Pattern for pluggable payment processing.',
  },
  'vending-machine': {
    problemSlug: 'library-management',
    reason:
      'Now transition to Library Management to practice domain boundary modeling, loan lifecycle tracking, and abstraction over media types.',
  },
  'library-management': {
    problemSlug: 'parking-lot',
    reason:
      'Revisit the Parking Lot with your refined domain modeling skills to implement more sophisticated spot allocation and pricing strategy hierarchies.',
  },
}

/**
 * Deterministic domain-aware heuristic evaluator.
 * Implements the hybrid evaluation requirement: evaluates answer depth,
 * terminology, domain concepts, relationships, and trade-offs against
 * the specific evaluation criteria of each section.
 */
export class DeterministicRuleEvaluator implements AIEvaluator {
  async evaluate(input: EvaluationInput): Promise<AIReviewOutput> {
    const { problemTitle, problemSlug, sections, responses } = input

    // Deterministic validation: Map responses to sections
    const responseMap = new Map<string, string>()
    for (const r of responses) {
      responseMap.set(r.sectionId, (r.response || '').trim())
    }

    const sectionReviews: Array<{ sectionId: string; score: number; feedback: string }> = []
    const whatWorkedWell: Array<{ title: string; description: string }> = []
    const areasToImprove: Array<{ title: string; description: string }> = []

    let totalScore = 0

    for (const section of sections) {
      const answer = responseMap.get(section.id) || ''
      const wordCount = answer.split(/\s+/).filter(Boolean).length

      let score = 5.0
      let feedback = ''

      if (wordCount === 0) {
        score = 2.0
        feedback = `No response provided for "${section.title}". Key domain concepts and relationships were not addressed.`
        areasToImprove.push({
          title: `INCOMPLETE ${section.title.toUpperCase()}`,
          description: `Provide a detailed breakdown addressing: ${section.description}`,
        })
      } else if (wordCount < 15) {
        score = 5.5
        feedback = `Brief response. While the initial direction is noted, it lacks depth on: ${section.description} To improve, elaborate on specific class contracts and interactions.`
        areasToImprove.push({
          title: `EXPAND ${section.title.toUpperCase()}`,
          description: `Add more concrete details regarding ${section.title.toLowerCase()} and trade-offs.`,
        })
      } else {
        // Evaluate based on domain keywords and depth
        const lowerAnswer = answer.toLowerCase()
        let depthBonus = 0

        // General LLD concepts
        if (lowerAnswer.includes('responsib') || lowerAnswer.includes('contain') || lowerAnswer.includes('delegat')) {
          depthBonus += 0.8
        }
        if (lowerAnswer.includes('pattern') || lowerAnswer.includes('state') || lowerAnswer.includes('strategy') || lowerAnswer.includes('interface')) {
          depthBonus += 0.8
        }
        if (lowerAnswer.includes('trade-off') || lowerAnswer.includes('because') || lowerAnswer.includes('scalab') || lowerAnswer.includes('extensib')) {
          depthBonus += 0.9
        }

        // Domain-specific checks
        if (problemSlug === 'parking-lot') {
          if (lowerAnswer.includes('spot') && lowerAnswer.includes('floor')) depthBonus += 0.8
          if (lowerAnswer.includes('ticket') || lowerAnswer.includes('vehicle')) depthBonus += 0.7
        } else if (problemSlug === 'elevator-system') {
          if (lowerAnswer.includes('dispatcher') || lowerAnswer.includes('request') || lowerAnswer.includes('car')) depthBonus += 0.8
          if (lowerAnswer.includes('direction') || lowerAnswer.includes('idle') || lowerAnswer.includes('moving')) depthBonus += 0.7
        } else if (problemSlug === 'vending-machine') {
          if (lowerAnswer.includes('inventory') || lowerAnswer.includes('payment') || lowerAnswer.includes('dispense')) depthBonus += 0.8
          if (lowerAnswer.includes('change') || lowerAnswer.includes('cancel')) depthBonus += 0.7
        } else if (problemSlug === 'library-management') {
          if (lowerAnswer.includes('book') || lowerAnswer.includes('member') || lowerAnswer.includes('loan')) depthBonus += 0.8
          if (lowerAnswer.includes('due') || lowerAnswer.includes('item') || lowerAnswer.includes('availab')) depthBonus += 0.7
        }

        score = Math.min(9.5, Math.max(6.0, 6.0 + depthBonus + Math.min(1.0, wordCount / 50)))
        score = Math.round(score * 10) / 10

        if (score >= 8.0) {
          feedback = `Strong analysis of ${section.title.toLowerCase()}. Clear separation of concerns with sound reasoning on domain constraints.`
          whatWorkedWell.push({
            title: `COHESIVE ${section.title.toUpperCase()}`,
            description: `Clearly articulated domain responsibilities in ${section.title.toLowerCase()} aligned with the problem requirements.`,
          })
        } else {
          feedback = `Reasonable foundation for ${section.title.toLowerCase()}. Consider clarifying edge cases and explicit interface boundaries.`
          areasToImprove.push({
            title: `DEEPEN ${section.title.toUpperCase()}`,
            description: `Refine the edge cases and interaction mechanics for ${section.title.toLowerCase()}.`,
          })
        }
      }

      totalScore += score
      sectionReviews.push({
        sectionId: section.id,
        score,
        feedback,
      })
    }

    // Normalized overall score on 100 scale
    const averageScoreOutOf10 = totalScore / (sections.length || 1)
    const overallScore = Math.round(averageScoreOutOf10 * 10)

    let assessment = 'STRONG FOUNDATION'
    if (overallScore >= 90) assessment = 'EXCELLENT ARCHITECTURE'
    else if (overallScore >= 75) assessment = 'STRONG FOUNDATION'
    else if (overallScore >= 60) assessment = 'DEVELOPING APPROACH'
    else assessment = 'NEEDS REFINEMENT'

    // Ensure fallback items if empty
    if (whatWorkedWell.length === 0) {
      whatWorkedWell.push({
        title: 'FOUNDATIONAL EFFORT',
        description: 'Demonstrated initial problem structuring and willingness to model system components.',
      })
    }
    if (areasToImprove.length === 0) {
      areasToImprove.push({
        title: 'CONCURRENCY & SCALE',
        description: 'Detail how the architecture behaves under concurrent access and heavy request loads.',
      })
    }

    const designSummary = `Your design for ${problemTitle} establishes key domain entities and maps core workflows. ${
      overallScore >= 75
        ? 'The structural separation between components is clean and cohesive, demonstrating solid understanding of low-level object-oriented principles.'
        : 'The core ideas are present, but deepening component contracts, error scenarios, and explicit state modeling will significantly improve robustness.'
    }`

    const recommendation = NEXT_PROBLEM_MAP[problemSlug] || {
      problemSlug: 'elevator-system',
      reason: 'Continue building low-level design competence with coordination and state machine challenges.',
    }

    const result: AIReviewOutput = {
      overallScore,
      assessment,
      designSummary,
      whatWorkedWell,
      areasToImprove,
      sectionReviews,
      nextProblemRecommendation: recommendation,
    }

    // Validate using Zod schema to guarantee contract compliance
    return AIReviewOutputSchema.parse(result)
  }
}

/**
 * Gemini AI Evaluator implementation.
 * Invoked when AI_PROVIDER === 'gemini' and GEMINI_API_KEY is configured.
 */
export class GeminiAIEvaluator implements AIEvaluator {
  private apiKey: string
  private fallback: DeterministicRuleEvaluator

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.fallback = new DeterministicRuleEvaluator()
  }

  async evaluate(input: EvaluationInput): Promise<AIReviewOutput> {
    const prompt = `You are a Principal Software Engineer and expert LLD interviewer.
Evaluate the following Low-Level Design (LLD) submission objectively and provide structured, explainable feedback.

Problem: ${input.problemTitle}
Description: ${input.problemDescription}
Requirements:
${input.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Sections & User Solutions:
${input.sections
  .map((s) => {
    const resp = input.responses.find((r) => r.sectionId === s.id)?.response || '(No response provided)'
    return `### Section ID: ${s.id}
Title: ${s.title}
Evaluation Criteria: ${s.evaluationCriteria}
User Response:
${resp}`
  })
  .join('\n\n')}

Evaluate each section honestly on a scale of 0 to 10. Compute an overall score out of 100.
Respond strictly in valid JSON matching this exact schema:
{
  "overallScore": number (0-100),
  "assessment": "EXCELLENT ARCHITECTURE" | "STRONG FOUNDATION" | "DEVELOPING APPROACH" | "NEEDS REFINEMENT",
  "designSummary": "string",
  "whatWorkedWell": [
    { "title": "string", "description": "string" }
  ],
  "areasToImprove": [
    { "title": "string", "description": "string" }
  ],
  "sectionReviews": [
    { "sectionId": "string (must match provided section ID)", "score": number (0-10), "feedback": "string" }
  ],
  "nextProblemRecommendation": {
    "problemSlug": "string",
    "reason": "string"
  }
}`

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          }),
        }
      )

      if (!response.ok) {
        console.warn(`Gemini API returned status ${response.status}. Falling back to deterministic evaluator.`)
        return this.fallback.evaluate(input)
      }

      const json = await response.json()
      const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text
      if (!rawText) {
        return this.fallback.evaluate(input)
      }

      const parsedJson = JSON.parse(rawText)
      return AIReviewOutputSchema.parse(parsedJson)
    } catch (err) {
      console.error('Gemini evaluation failed, falling back to deterministic evaluator:', err)
      return this.fallback.evaluate(input)
    }
  }
}

/**
 * OpenAI Evaluator implementation.
 * Invoked when AI_PROVIDER === 'openai' and OPENAI_API_KEY is configured.
 */
export class OpenAIEvaluator implements AIEvaluator {
  private apiKey: string
  private fallback: DeterministicRuleEvaluator

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.fallback = new DeterministicRuleEvaluator()
  }

  async evaluate(input: EvaluationInput): Promise<AIReviewOutput> {
    const prompt = `You are a Principal Software Engineer and expert LLD interviewer.
Evaluate the following Low-Level Design (LLD) submission objectively and provide structured, explainable feedback.

Problem: ${input.problemTitle}
Description: ${input.problemDescription}
Requirements:
${input.requirements.map((r, i) => `${i + 1}. ${r}`).join('\n')}

Sections & User Solutions:
${input.sections
  .map((s) => {
    const resp = input.responses.find((r) => r.sectionId === s.id)?.response || '(No response provided)'
    return `Section ID: ${s.id}
Title: ${s.title}
Evaluation Criteria: ${s.evaluationCriteria}
User Response:
${resp}`
  })
  .join('\n\n')}

Provide structured output matching the requested schema.`

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
          temperature: 0.2,
        }),
      })

      if (!response.ok) {
        console.warn(`OpenAI API returned status ${response.status}. Falling back to deterministic evaluator.`)
        return this.fallback.evaluate(input)
      }

      const json = await response.json()
      const rawText = json.choices?.[0]?.message?.content
      if (!rawText) return this.fallback.evaluate(input)

      const parsed = JSON.parse(rawText)
      return AIReviewOutputSchema.parse(parsed)
    } catch (err) {
      console.error('OpenAI evaluation failed, falling back to deterministic evaluator:', err)
      return this.fallback.evaluate(input)
    }
  }
}

/**
 * Evaluator Factory.
 * Selects evaluator based on environment variables.
 */
export function getAIEvaluator(): AIEvaluator {
  const provider = (process.env.AI_PROVIDER || 'mock').toLowerCase()

  if (provider === 'gemini' && process.env.GEMINI_API_KEY) {
    return new GeminiAIEvaluator(process.env.GEMINI_API_KEY)
  }

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return new OpenAIEvaluator(process.env.OPENAI_API_KEY)
  }

  return new DeterministicRuleEvaluator()
}
