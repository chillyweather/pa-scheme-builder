import { ComponentSpec } from './schema'

interface PropertyDef {
  type: string
  defaultValue?: any
  variantOptions?: string[]
}

export interface FactualData {
  factual: Partial<ComponentSpec>
  nodeSummary: Record<string, any>
}

function mapPropertyType(propDef: PropertyDef): string {
  switch (propDef.type) {
    case 'VARIANT':
      return 'enum'
    case 'BOOLEAN':
      return 'boolean'
    case 'TEXT':
      return 'string'
    case 'INSTANCE_SWAP':
      return 'slot'
    default:
      return 'string'
  }
}

function getDefaultValue(propDef: PropertyDef): any {
  if (propDef.defaultValue !== undefined) return propDef.defaultValue
  if (propDef.type === 'BOOLEAN') return false
  if (propDef.type === 'VARIANT' && propDef.variantOptions?.length) return propDef.variantOptions[0]
  return ''
}

export function extractFactualData(serializedNode: Record<string, any>): FactualData {
  const name = serializedNode.name || ''
  const description = serializedNode.description || ''
  const nodeId = serializedNode.id || ''

  const propDefs: Record<string, PropertyDef> = serializedNode.componentPropertyDefinitions || {}

  // Extract variants
  const variants = Object.entries(propDefs)
    .filter(([, def]) => def.type === 'VARIANT')
    .map(([propName, def]) => ({
      name: propName,
      type: 'enum',
      values: def.variantOptions || [],
      default: getDefaultValue(def),
      notes: '',
    }))

  // Extract states from variant property named "state" (case-insensitive)
  const stateEntry = Object.entries(propDefs).find(
    ([propName, def]) => def.type === 'VARIANT' && propName.toLowerCase() === 'state'
  )
  const states = stateEntry
    ? (stateEntry[1].variantOptions || []).map((s: string) => ({
        state: s,
        trigger: '',
        expectedResponse: '',
        notes: '',
      }))
    : []

  // Extract all properties
  const properties = Object.entries(propDefs).map(([propName, def]) => ({
    name: propName,
    type: mapPropertyType(def),
    required: false,
    default: getDefaultValue(def),
    description: '',
    constraints: def.type === 'VARIANT' ? (def.variantOptions || []) : [],
    examples: [],
  }))

  // Build a trimmed node summary for the LLM (children as name + variant values only)
  const childSummaries = (serializedNode.children || []).map((child: any) => {
    const summary: Record<string, any> = { name: child.name, type: child.type }
    if (child.componentPropertyDefinitions) {
      summary.properties = Object.keys(child.componentPropertyDefinitions)
    }
    return summary
  })

  const nodeSummary = {
    name,
    id: nodeId,
    type: serializedNode.type,
    description,
    componentPropertyDefinitions: propDefs,
    childVariants: childSummaries,
  }

  const today = new Date().toISOString().split('T')[0]

  const factual: Partial<ComponentSpec> = {
    meta: {
      name,
      category: '',
      status: 'draft',
      versionIntroduced: '',
      lastUpdated: today,
      links: {
        figma: `https://www.figma.com/file/?node-id=${encodeURIComponent(nodeId)}`,
        storybookAngular: '',
        storybookReact: '',
        playground: '',
        docs: '',
      },
      relatedComponents: [],
    },
    overview: {
      description: description || '',
      useCases: [],
      whenNotToUse: [],
      alternatives: [],
    },
    formatting: {
      anatomy: { summary: '', parts: [] },
      variants,
      alignment: { supported: false, options: [], default: '', notes: '' },
      placement: { supported: false, options: [], default: '', notes: '' },
    },
    behavior: {
      interactionModel: '',
      states,
      keyboard: { focusOrder: [], shortcuts: [], notes: '' },
      mouse: { notes: '' },
      touch: { notes: '' },
      emptyAndErrorHandling: { emptyState: '', errorState: '', loadingState: '', notes: '' },
    },
    properties,
  }

  return { factual, nodeSummary }
}
