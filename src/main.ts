import { emit, on, showUI } from '@create-figma-plugin/utilities'

const VALID_TYPES = ['COMPONENT_SET']
const TOKEN_KEY = 'google_ai_studio_token'

// Keys that lead to circular refs or parent traversal
const SKIP_KEYS = new Set([
  'parent', 'mainComponent', 'masterComponent',
  'horizontalPadding', 'verticalPadding',
  'removed',
])

function serializeNode(node: BaseNode, depth = 0, seen = new WeakSet()): any {
  if (depth > 10) return '[max depth]'

  if (node === null || node === undefined) return node

  if (typeof node !== 'object') return node

  if (seen.has(node)) return '[circular]'
  seen.add(node)

  // Arrays (e.g. children, fills, strokes, effects)
  if (Array.isArray(node)) {
    return node.map(item => serializeNode(item, depth + 1, seen))
  }

  const result: Record<string, any> = {}

  // Get own enumerable property names from the object and its prototype chain
  const keys = new Set<string>()
  for (const key in node) {
    keys.add(key)
  }
  // Also grab own properties that might not be enumerable
  try {
    for (const key of Object.keys(node)) {
      keys.add(key)
    }
  } catch (_) { /* ignore */ }

  for (const key of Array.from(keys)) {
    if (SKIP_KEYS.has(key)) continue
    // Skip methods
    try {
      const val = (node as any)[key]
      if (typeof val === 'function') continue

      if (val === null || val === undefined || typeof val !== 'object') {
        result[key] = val
      } else if (val.type && typeof val.type === 'string' && val.id) {
        // It's a Figma node reference - serialize recursively
        result[key] = serializeNode(val, depth + 1, seen)
      } else if (Array.isArray(val)) {
        result[key] = val.map(item => {
          if (item && typeof item === 'object' && item.type && item.id) {
            return serializeNode(item, depth + 1, seen)
          }
          if (item && typeof item === 'object') {
            return serializeNode(item as any, depth + 1, seen)
          }
          return item
        })
      } else {
        // Plain object (e.g. paint, effect, constraint)
        result[key] = serializeNode(val as any, depth + 1, seen)
      }
    } catch (_) {
      result[key] = '[unreadable]'
    }
  }

  return result
}

let lastExtractedData: Record<string, any> | null = null

export default function () {
  showUI({
    height: 240,
    width: 240
  })

  on('CHECK_SELECTION', () => {
    const selection = figma.currentPage.selection

    if (selection.length === 0) {
      console.log('Nothing selected')
      return
    }

    if (selection.length > 1) {
      console.log('Please select a single node')
      return
    }

    const node = selection[0]

    if (!VALID_TYPES.includes(node.type)) {
      console.log(`Selected node is a ${node.type}, expected COMPONENT_SET`)
      return
    }

    console.log(`Extracting props from: ${node.name} (${node.id})`)
    lastExtractedData = serializeNode(node)
    console.log(JSON.stringify(lastExtractedData, null, 2))
  })

  on('GET_TOKEN', async () => {
    const savedToken = await figma.clientStorage.getAsync(TOKEN_KEY)
    emit('LOAD_TOKEN', savedToken || '')
  })

  on('SAVE_TOKEN', async (token: string) => {
    await figma.clientStorage.setAsync(TOKEN_KEY, token)
    console.log('AI token saved to client storage')
  })
}
