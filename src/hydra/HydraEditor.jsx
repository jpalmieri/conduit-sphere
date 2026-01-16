import { useState, useEffect, useRef } from 'react'
import { hydraPresets } from './hydraPresets'

function HydraEditor({ code, onChange, onRun, error, isMobile, title = 'Hydra Editor', anchor = 'left' }) {
  const [isCollapsed, setIsCollapsed] = useState(isMobile)
  const textareaRef = useRef(null)

  useEffect(() => {
    setIsCollapsed(isMobile)
  }, [isMobile])

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      onRun()
    }
    // Allow Tab to insert spaces
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = e.target.selectionStart
      const end = e.target.selectionEnd
      const newValue = code.substring(0, start) + '  ' + code.substring(end)
      onChange(newValue)
      // Set cursor position after the inserted spaces
      setTimeout(() => {
        textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2
      }, 0)
    }
  }

  const handlePresetChange = (e) => {
    const presetKey = e.target.value
    if (presetKey && hydraPresets[presetKey]) {
      onChange(hydraPresets[presetKey].code)
    }
  }

  const anchorStyle = anchor === 'right' ? { right: 20 } : { left: 20 }

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        style={{
          position: 'fixed',
          bottom: 20,
          ...anchorStyle,
          zIndex: 10000,
          backgroundColor: 'rgba(30, 30, 30, 0.95)',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 8,
          padding: '12px 20px',
          cursor: 'pointer',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: 14,
        }}
      >
        Show Editor
      </button>
    )
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        ...anchorStyle,
        width: isMobile ? 'calc(100vw - 40px)' : 380,
        maxHeight: isMobile ? '60vh' : '70vh',
        backgroundColor: 'rgba(30, 30, 30, 0.95)',
        borderRadius: 12,
        padding: 16,
        zIndex: 10000,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.5)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: '#fff', fontFamily: 'monospace', fontSize: 14, fontWeight: 600 }}>
          {title}
        </span>
        <button
          onClick={() => setIsCollapsed(true)}
          style={{
            background: 'none',
            border: 'none',
            color: '#888',
            cursor: 'pointer',
            fontSize: 18,
            padding: 4,
          }}
        >
          x
        </button>
      </div>

      <select
        onChange={handlePresetChange}
        defaultValue=""
        style={{
          backgroundColor: '#2a2a2a',
          color: '#fff',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: 6,
          padding: '8px 12px',
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        <option value="" disabled>Load preset...</option>
        {Object.entries(hydraPresets).map(([key, preset]) => (
          <option key={key} value={key}>{preset.name}</option>
        ))}
      </select>

      <textarea
        ref={textareaRef}
        value={code}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        style={{
          width: '100%',
          height: isMobile ? 150 : 200,
          fontFamily: 'Monaco, Consolas, monospace',
          fontSize: 13,
          lineHeight: 1.5,
          backgroundColor: '#1e1e1e',
          color: '#d4d4d4',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 6,
          padding: 12,
          resize: 'vertical',
          outline: 'none',
        }}
      />

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={onRun}
          style={{
            flex: 1,
            backgroundColor: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Run (Ctrl+Enter)
        </button>
      </div>

      {error && (
        <div
          style={{
            backgroundColor: 'rgba(255, 0, 0, 0.1)',
            border: '1px solid rgba(255, 0, 0, 0.3)',
            borderRadius: 6,
            padding: 10,
            color: '#ff6b6b',
            fontSize: 12,
            fontFamily: 'monospace',
            whiteSpace: 'pre-wrap',
            maxHeight: 80,
            overflowY: 'auto',
          }}
        >
          {error.message || String(error)}
        </div>
      )}

      <div style={{ color: '#666', fontSize: 11, fontFamily: 'system-ui' }}>
        Tip: Use Hydra DSL - osc(), noise(), shape(), gradient(), etc.
      </div>
    </div>
  )
}

export default HydraEditor
