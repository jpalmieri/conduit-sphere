import { useRef, useEffect, useState } from 'react'
import { EditorView, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { hydraPresets } from './hydraPresets'
import { getAudioDevices } from './AudioManager'

// Custom Hydra-style theme with transparent background and per-line highlighting
const hydraTheme = EditorView.theme({
  '&': {
    backgroundColor: 'transparent',
    fontSize: '16px',
    fontFamily: '"Fira Code", "SF Mono", Monaco, Consolas, monospace',
  },
  '.cm-content': {
    caretColor: '#fff',
    padding: '0',
  },
  '.cm-line': {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: '3px',
    padding: '2px 8px',
    marginBottom: '2px',
    width: 'fit-content',
  },
  '.cm-gutters': {
    display: 'none',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'transparent',
  },
  '.cm-activeLine': {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(255, 255, 255, 0.2) !important',
  },
  '&.cm-focused .cm-selectionBackground': {
    backgroundColor: 'rgba(255, 255, 255, 0.3) !important',
  },
  '.cm-cursor': {
    borderLeftColor: '#fff',
    borderLeftWidth: '2px',
  },
  '.cm-scroller': {
    overflow: 'auto',
  },
})

// modes: 'postfx' | 'displacement'
function CodeOverlay({
  postFxCode,
  onPostFxChange,
  onPostFxRun,
  postFxError,
  displacementCode,
  onDisplacementChange,
  onDisplacementRun,
  displacementError,
  audioDeviceId,
  onAudioDeviceChange,
}) {
  const postFxEditorRef = useRef(null)
  const displacementEditorRef = useRef(null)
  const postFxViewRef = useRef(null)
  const displacementViewRef = useRef(null)
  const [isVisible, setIsVisible] = useState(true)
  const [mode, setMode] = useState('postfx') // 'postfx' | 'displacement'
  const [audioDevices, setAudioDevices] = useState([])

  // Auto-request audio permission and load devices on mount
  useEffect(() => {
    getAudioDevices().then(devices => {
      setAudioDevices(devices)
      // Auto-select first device if none selected
      if (devices.length > 0 && !audioDeviceId) {
        onAudioDeviceChange(devices[0].deviceId)
      }
    })
  }, [])

  // Toggle visibility with Ctrl+Shift+H, toggle mode with Ctrl+Shift+E
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        setIsVisible(v => !v)
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'e') {
        e.preventDefault()
        setMode(m => m === 'postfx' ? 'displacement' : 'postfx')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Create PostFX editor
  useEffect(() => {
    if (!postFxEditorRef.current || postFxViewRef.current) return

    const runKeymap = keymap.of([{
      key: 'Ctrl-Enter',
      mac: 'Cmd-Enter',
      run: () => {
        onPostFxRun()
        return true
      }
    }])

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onPostFxChange(update.state.doc.toString())
      }
    })

    const state = EditorState.create({
      doc: postFxCode,
      extensions: [
        javascript(),
        hydraTheme,
        oneDark,
        runKeymap,
        updateListener,
        EditorView.lineWrapping,
      ],
    })

    postFxViewRef.current = new EditorView({
      state,
      parent: postFxEditorRef.current,
    })

    return () => {
      postFxViewRef.current?.destroy()
      postFxViewRef.current = null
    }
  }, [])

  // Create Displacement editor
  useEffect(() => {
    if (!displacementEditorRef.current || displacementViewRef.current) return

    const runKeymap = keymap.of([{
      key: 'Ctrl-Enter',
      mac: 'Cmd-Enter',
      run: () => {
        onDisplacementRun()
        return true
      }
    }])

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onDisplacementChange(update.state.doc.toString())
      }
    })

    const state = EditorState.create({
      doc: displacementCode,
      extensions: [
        javascript(),
        hydraTheme,
        oneDark,
        runKeymap,
        updateListener,
        EditorView.lineWrapping,
      ],
    })

    displacementViewRef.current = new EditorView({
      state,
      parent: displacementEditorRef.current,
    })

    return () => {
      displacementViewRef.current?.destroy()
      displacementViewRef.current = null
    }
  }, [])

  // Update postfx editor content when code prop changes externally
  useEffect(() => {
    if (postFxViewRef.current) {
      const currentContent = postFxViewRef.current.state.doc.toString()
      if (currentContent !== postFxCode) {
        postFxViewRef.current.dispatch({
          changes: { from: 0, to: currentContent.length, insert: postFxCode },
        })
      }
    }
  }, [postFxCode])

  // Update displacement editor content when code prop changes externally
  useEffect(() => {
    if (displacementViewRef.current) {
      const currentContent = displacementViewRef.current.state.doc.toString()
      if (currentContent !== displacementCode) {
        displacementViewRef.current.dispatch({
          changes: { from: 0, to: currentContent.length, insert: displacementCode },
        })
      }
    }
  }, [displacementCode])

  const handlePresetChange = (e) => {
    const presetKey = e.target.value
    if (presetKey && hydraPresets[presetKey]) {
      if (mode === 'postfx') {
        onPostFxChange(hydraPresets[presetKey].code)
      } else {
        onDisplacementChange(hydraPresets[presetKey].code)
      }
    }
    e.target.value = ''
  }

  // Filter presets based on mode
  const getPresets = () => {
    if (mode === 'postfx') {
      return Object.entries(hydraPresets).filter(([key]) =>
        key.startsWith('audio') || key === 'feedback'
      )
    } else {
      return Object.entries(hydraPresets)
    }
  }

  const currentError = mode === 'postfx' ? postFxError : displacementError

  return (
    <div
      style={{
        position: 'absolute',
        top: 40,
        left: 40,
        right: 40,
        zIndex: 100,
        maxHeight: 'calc(100vh - 120px)',
        display: isVisible ? 'flex' : 'none',
        flexDirection: 'column',
      }}
    >
      {/* Mode indicator / toggle + audio device */}
      <div
        style={{
          marginBottom: 8,
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <button
          onClick={() => setMode('postfx')}
          style={{
            backgroundColor: mode === 'postfx' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.6)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 4,
            padding: '4px 12px',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          postfx
        </button>
        <button
          onClick={() => setMode('displacement')}
          style={{
            backgroundColor: mode === 'displacement' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.6)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: 4,
            padding: '4px 12px',
            fontSize: 12,
            cursor: 'pointer',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          displacement
        </button>

        {audioDevices.length > 0 && (
          <select
            value={audioDeviceId || ''}
            onChange={(e) => onAudioDeviceChange(e.target.value || null)}
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.6)',
              color: '#fff',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'system-ui, sans-serif',
              maxWidth: 200,
            }}
          >
            <option value="">No audio</option>
            {audioDevices.map(device => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* PostFX Editor */}
      <div
        ref={postFxEditorRef}
        style={{
          minHeight: 30,
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
          display: mode === 'postfx' ? 'block' : 'none',
        }}
      />

      {/* Displacement Editor */}
      <div
        ref={displacementEditorRef}
        style={{
          minHeight: 30,
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
          display: mode === 'displacement' ? 'block' : 'none',
        }}
      />

      {currentError && (
        <div
          style={{
            marginTop: 8,
            padding: '8px 12px',
            backgroundColor: 'rgba(255, 50, 50, 0.8)',
            color: '#fff',
            fontFamily: 'monospace',
            fontSize: 13,
            borderRadius: 4,
          }}
        >
          {currentError.message || String(currentError)}
        </div>
      )}

      <div
        style={{
          marginTop: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <select
          onChange={handlePresetChange}
          defaultValue=""
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 4,
            padding: '6px 10px',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <option value="" disabled>Load preset...</option>
          {getPresets().map(([key, preset]) => (
            <option key={key} value={key}>{preset.name}</option>
          ))}
        </select>
        <span
          style={{
            color: 'rgba(255, 255, 255, 0.5)',
            fontSize: 12,
            fontFamily: 'system-ui, sans-serif',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
          }}
        >
          ctrl+enter: run | ctrl+shift+e: switch | ctrl+shift+h: hide
        </span>
      </div>
    </div>
  )
}

export default CodeOverlay
