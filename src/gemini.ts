import { ComponentSpec } from './schema'

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models'

const SYSTEM_PROMPT = `You are a design system documentation expert. Given a Figma component's factual data and node summary, fill in the remaining fields of a component specification JSON.

You will receive:
1. "factualData" — fields already extracted from Figma (do NOT override these)
2. "nodeSummary" — structural info about the component for context

Return a COMPLETE JSON object matching the ComponentSpec schema. For fields already present in factualData, return them as-is. For empty/missing fields, provide thoughtful, professional design system documentation.

Key guidelines:
- "meta.category" should be one of: Input, Display, Navigation, Feedback, Layout, Action, Container
- "overview.useCases" should list 2-4 real-world use cases
- "overview.whenNotToUse" should list 1-3 anti-patterns with alternatives
- "formatting.anatomy.parts" should describe the visual structure
- "behavior.states" should have trigger and expectedResponse filled in
- "properties" should have descriptions filled in
- "accessibility" fields should follow WCAG 2.1 AA guidelines
- "contentGuidelines" should be practical and specific
- "dosDonts" should have 2-4 items each
- Keep language professional, concise, and consistent with enterprise design system standards`

export async function callGemini(
  token: string,
  model: string,
  factualData: Partial<ComponentSpec>,
  nodeSummary: Record<string, any>
): Promise<Partial<ComponentSpec>> {
  const url = `${GEMINI_BASE_URL}/${model}:generateContent?key=${token}`

  const userPrompt = JSON.stringify({ factualData, nodeSummary }, null, 2)

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] },
      ],
      generationConfig: {
        temperature: 0.3,
        response_mime_type: 'application/json',
      },
    }),
  })

  if (!response.ok) {
    const errBody = await response.text()
    throw new Error(`Gemini API error (${response.status}): ${errBody}`)
  }

  const data = await response.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    throw new Error('No content in Gemini response')
  }

  return JSON.parse(text) as Partial<ComponentSpec>
}
