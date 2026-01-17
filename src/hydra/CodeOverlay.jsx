import { useRef, useEffect, useState } from 'react'
import { EditorView, keymap } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { hydraPresets } from './hydraPresets'

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

function CodeOverlay({ code, onChange, onRun, error }) {
  const editorRef = useRef(null)
  const viewRef = useRef(null)
  const [isVisible, setIsVisible] = useState(true)

  // Toggle visibility with Ctrl+Shift+H
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'h') {
        e.preventDefault()
        setIsVisible(v => !v)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!editorRef.current) return

    const runKeymap = keymap.of([{
      key: 'Ctrl-Enter',
      mac: 'Cmd-Enter',
      run: () => {
        onRun()
        return true
      }
    }])

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString())
      }
    })

    const state = EditorState.create({
      doc: code,
      extensions: [
        javascript(),
        hydraTheme,
        oneDark,
        runKeymap,
        updateListener,
        EditorView.lineWrapping,
      ],
    })

    const view = new EditorView({
      state,
      parent: editorRef.current,
    })

    viewRef.current = view

    return () => {
      view.destroy()
    }
  }, [])

  // Update editor content when code prop changes externally
  useEffect(() => {
    if (viewRef.current) {
      const currentContent = viewRef.current.state.doc.toString()
      if (currentContent !== code) {
        viewRef.current.dispatch({
          changes: {
            from: 0,
            to: currentContent.length,
            insert: code,
          },
        })
      }
    }
  }, [code])

  const handlePresetChange = (e) => {
    const presetKey = e.target.value
    if (presetKey && hydraPresets[presetKey]) {
      onChange(hydraPresets[presetKey].code)
    }
    e.target.value = ''
  }

  // Filter to show only postFX-relevant presets
  const postFxPresets = Object.entries(hydraPresets).filter(([key]) =>
    key.startsWith('audio') || key === 'feedback'
  )

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
      <div
        ref={editorRef}
        style={{
          minHeight: 30,
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto',
        }}
      />

      {error && (
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
          {error.message || String(error)}
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
          {postFxPresets.map(([key, preset]) => (
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
          ctrl+enter to run
        </span>
      </div>
    </div>
  )
}

export default CodeOverlay
