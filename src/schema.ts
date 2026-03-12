export interface ComponentSpec {
  meta: {
    name: string
    category: string
    status: string
    versionIntroduced: string
    lastUpdated: string
    links: {
      figma: string
      storybookAngular: string
      storybookReact: string
      playground: string
      docs: string
    }
    relatedComponents: string[]
  }
  overview: {
    description: string
    useCases: string[]
    whenNotToUse: string[]
    alternatives: string[]
  }
  formatting: {
    anatomy: {
      summary: string
      parts: Array<{
        name: string
        role: string
        required: boolean
        slots: string[]
        notes: string
      }>
    }
    variants: Array<{
      name: string
      type: string
      values: (string | boolean)[]
      default: string | boolean
      notes: string
    }>
    alignment: {
      supported: boolean
      options: string[]
      default: string
      notes: string
    }
    placement: {
      supported: boolean
      options: string[]
      default: string
      notes: string
    }
  }
  behavior: {
    interactionModel: string
    states: Array<{
      state: string
      trigger: string
      expectedResponse: string
      notes: string
    }>
    keyboard: {
      focusOrder: string[]
      shortcuts: string[]
      notes: string
    }
    mouse: {
      notes: string
    }
    touch: {
      notes: string
    }
    emptyAndErrorHandling: {
      emptyState: string
      errorState: string
      loadingState: string
      notes: string
    }
  }
  properties: Array<{
    name: string
    type: string
    required: boolean
    default: any
    description: string
    constraints: string[]
    examples: any[]
  }>
  dependencies: Array<{
    if: string
    then: string
    notes: string
  }>
  layoutConstraints: {
    responsiveRules: string[]
    minWidth: string
    maxWidth: string
    heightRules: string
    widthRules: string
    wrappingRules: string
    truncationRules: string
    spacingRules: string
    doNotAllow: string[]
  }
  contentGuidelines: {
    labelRules: string[]
    helperTextRules: string[]
    placeholderRules: string[]
    errorMessageRules: string[]
    toneNotes: string
  }
  accessibility: {
    role: string
    aria: string[]
    keyboardSupport: string[]
    focusVisible: {
      required: boolean
      notes: string
    }
    contrastNotes: string
    nonColorSignalNotes: string
  }
  dosDonts: {
    dos: string[]
    donts: string[]
  }
}

export function createEmptySpec(): ComponentSpec {
  return {
    meta: {
      name: '',
      category: '',
      status: '',
      versionIntroduced: '',
      lastUpdated: '',
      links: {
        figma: '',
        storybookAngular: '',
        storybookReact: '',
        playground: '',
        docs: '',
      },
      relatedComponents: [],
    },
    overview: {
      description: '',
      useCases: [],
      whenNotToUse: [],
      alternatives: [],
    },
    formatting: {
      anatomy: {
        summary: '',
        parts: [],
      },
      variants: [],
      alignment: {
        supported: false,
        options: [],
        default: '',
        notes: '',
      },
      placement: {
        supported: false,
        options: [],
        default: '',
        notes: '',
      },
    },
    behavior: {
      interactionModel: '',
      states: [],
      keyboard: {
        focusOrder: [],
        shortcuts: [],
        notes: '',
      },
      mouse: {
        notes: '',
      },
      touch: {
        notes: '',
      },
      emptyAndErrorHandling: {
        emptyState: '',
        errorState: '',
        loadingState: '',
        notes: '',
      },
    },
    properties: [],
    dependencies: [],
    layoutConstraints: {
      responsiveRules: [],
      minWidth: '',
      maxWidth: '',
      heightRules: '',
      widthRules: '',
      wrappingRules: '',
      truncationRules: '',
      spacingRules: '',
      doNotAllow: [],
    },
    contentGuidelines: {
      labelRules: [],
      helperTextRules: [],
      placeholderRules: [],
      errorMessageRules: [],
      toneNotes: '',
    },
    accessibility: {
      role: '',
      aria: [],
      keyboardSupport: [],
      focusVisible: {
        required: false,
        notes: '',
      },
      contrastNotes: '',
      nonColorSignalNotes: '',
    },
    dosDonts: {
      dos: [],
      donts: [],
    },
  }
}

function isPlainObject(val: unknown): val is Record<string, any> {
  return val !== null && typeof val === 'object' && !Array.isArray(val)
}

export function deepMerge<T extends Record<string, any>>(base: T, ...overlays: Array<Partial<T>>): T {
  const result = { ...base }
  for (const overlay of overlays) {
    if (!overlay) continue
    for (const key of Object.keys(overlay) as Array<keyof T>) {
      const baseVal = result[key]
      const overVal = overlay[key]
      if (overVal === undefined) continue
      if (isPlainObject(baseVal) && isPlainObject(overVal)) {
        result[key] = deepMerge(baseVal, overVal) as any
      } else {
        result[key] = overVal as any
      }
    }
  }
  return result
}
