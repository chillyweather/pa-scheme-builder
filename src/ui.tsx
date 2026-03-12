import { Button, Container, render, Textbox, VerticalSpace } from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useCallback, useEffect, useRef, useState } from 'preact/hooks'
import { EVENT } from './types'
import { ComponentSpec } from './schema'
import { callGemini } from './gemini'

const MODEL_OPTIONS = [
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (Standard)' },
  { value: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro (Powerhouse)' },
  { value: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite (Speedster)' },
  { value: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Stable)' },
  { value: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Balanced)' },
]

function Plugin() {
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [token, setToken] = useState('')
  const [model, setModel] = useState('gemini-3-flash-preview')
  const tokenRef = useRef(token)
  const modelRef = useRef(model)
  tokenRef.current = token
  modelRef.current = model
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [specJson, setSpecJson] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    on(EVENT.LOAD_TOKEN, (savedToken: string, savedModel: string) => {
      if (savedToken) setToken(savedToken)
      if (savedModel) setModel(savedModel)
    })

    on(EVENT.EXTRACTED_DATA, async (factualData: Partial<ComponentSpec>, nodeSummary: Record<string, any>) => {
      try {
        if (!tokenRef.current) {
          setError('No API token set. Please save your Google AI Studio token first.')
          setLoading(false)
          return
        }
        const llmResult = await callGemini(tokenRef.current, modelRef.current, factualData, nodeSummary)
        emit(EVENT.GEMINI_RESULT, llmResult)
      } catch (err: any) {
        setError(err.message || 'Gemini API call failed')
        setLoading(false)
      }
    })

    on(EVENT.SPEC_COMPLETE, (spec: ComponentSpec) => {
      setSpecJson(JSON.stringify(spec, null, 2))
      setLoading(false)
      setError('')
    })

    on(EVENT.SPEC_ERROR, (msg: string) => {
      setError(msg)
      setLoading(false)
    })

    emit(EVENT.GET_TOKEN)
  }, [])

  function handleCheckSelection() {
    emit(EVENT.CHECK_SELECTION)
  }

  function handleGenerateSpec() {
    setLoading(true)
    setError('')
    setSpecJson('')
    setCopied(false)
    emit(EVENT.GENERATE_SPEC)
  }

  function handleSaveToken() {
    emit(EVENT.SAVE_TOKEN, token)
    setShowTokenInput(false)
  }

  function handleCopy() {
    if (!specJson) return
    const ta = document.createElement('textarea')
    ta.value = specJson
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleTokenInput = useCallback((newValue: string) => {
    setToken(newValue)
  }, [])

  const handleModelChange = useCallback((e: Event) => {
    const val = (e.target as HTMLSelectElement).value
    setModel(val)
    emit('SAVE_MODEL' as any, val)
  }, [])

  return (
    <Container space="medium">
      <VerticalSpace space="large" />
      <Button fullWidth onClick={handleGenerateSpec} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Spec'}
      </Button>
      <VerticalSpace space="small" />
      <Button fullWidth secondary onClick={handleCheckSelection}>
        Check Selection
      </Button>
      <VerticalSpace space="small" />

      {/* Model selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label style={{ fontSize: '11px', whiteSpace: 'nowrap', color: 'var(--figma-color-text-secondary)' }}>
          Model:
        </label>
        <select
          value={model}
          onChange={handleModelChange}
          style={{
            flex: 1,
            height: '28px',
            fontSize: '11px',
            border: '1px solid var(--figma-color-border)',
            borderRadius: '2px',
            background: 'var(--figma-color-bg)',
            color: 'var(--figma-color-text)',
            padding: '0 4px',
          }}
        >
          {MODEL_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <VerticalSpace space="small" />
      <Button fullWidth secondary onClick={() => setShowTokenInput(!showTokenInput)}>
        AI Token
      </Button>
      {showTokenInput && (
        <div>
          <VerticalSpace space="small" />
          <Textbox
            placeholder="Paste Google AI Studio token"
            value={token}
            onValueInput={handleTokenInput}
          />
          <VerticalSpace space="small" />
          <Button fullWidth onClick={handleSaveToken}>
            Save Token
          </Button>
        </div>
      )}

      {error && (
        <div>
          <VerticalSpace space="small" />
          <div style={{
            padding: '8px',
            background: '#FEE2E2',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#991B1B',
            wordBreak: 'break-word',
          }}>
            {error}
          </div>
        </div>
      )}

      {specJson && (
        <div>
          <VerticalSpace space="small" />
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleCopy}>
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </Button>
          </div>
          <VerticalSpace space="small" />
          <textarea
            readOnly
            value={specJson}
            style={{
              width: '100%',
              height: '240px',
              fontSize: '10px',
              fontFamily: 'monospace',
              border: '1px solid var(--figma-color-border)',
              borderRadius: '4px',
              padding: '8px',
              resize: 'vertical',
              background: 'var(--figma-color-bg-secondary)',
              color: 'var(--figma-color-text)',
              boxSizing: 'border-box',
            }}
          />
        </div>
      )}
      <VerticalSpace space="small" />
    </Container>
  )
}

export default render(Plugin)
