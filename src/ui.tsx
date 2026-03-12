import { Button, Container, render, Textbox, VerticalSpace } from '@create-figma-plugin/ui'
import { emit, on } from '@create-figma-plugin/utilities'
import { h } from 'preact'
import { useCallback, useEffect, useState } from 'preact/hooks'

function Plugin() {
  const [showTokenInput, setShowTokenInput] = useState(false)
  const [token, setToken] = useState('')

  useEffect(() => {
    on('LOAD_TOKEN', (savedToken: string) => {
      if (savedToken) {
        setToken(savedToken)
      }
    })
    emit('GET_TOKEN')
  }, [])

  function handleCheckSelection() {
    emit('CHECK_SELECTION')
  }

  function handleSaveToken() {
    emit('SAVE_TOKEN', token)
    setShowTokenInput(false)
  }

  const handleTokenInput = useCallback((newValue: string) => {
    setToken(newValue)
  }, [])

  return (
    <Container space="medium">
      <VerticalSpace space="large" />
      <Button fullWidth onClick={handleCheckSelection}>
        Check Selection
      </Button>
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
      <VerticalSpace space="small" />
    </Container>
  )
}

export default render(Plugin)
