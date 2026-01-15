import { useEffect } from 'react'

function ControlsDrawer({ isOpen, onToggle, isMobile }) {
  // Disable page zoom when drawer is open on mobile
  useEffect(() => {
    if (!isMobile) return

    const viewport = document.querySelector('meta[name="viewport"]')

    if (isOpen) {
      // Disable pinch zoom when drawer is open
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
      }
      // Also prevent touch gestures on body
      document.body.style.touchAction = 'pan-y'
    } else {
      // Re-enable pinch zoom when drawer is closed
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0')
      }
      document.body.style.touchAction = 'auto'
    }

    return () => {
      // Cleanup: restore defaults
      if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0')
      }
      document.body.style.touchAction = 'auto'
    }
  }, [isOpen, isMobile])

  if (!isMobile) {
    // On desktop, don't modify Leva's default behavior
    return null
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => onToggle(!isOpen)}
        style={{
          position: 'fixed',
          bottom: isOpen ? 'calc(60vh - 40px)' : '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10001,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          padding: '10px 20px',
          fontSize: '14px',
          cursor: 'pointer',
          transition: 'bottom 0.3s ease',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.5)',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        {isOpen ? '▼ Hide Controls' : '▲ Show Controls'}
      </button>

      {/* Drawer overlay class applier */}
      <style>{`
        @media (max-width: 768px) {
          .leva-c-kWgxhW {
            position: fixed !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            top: auto !important;
            width: 100% !important;
            max-width: 100% !important;
            height: 60vh !important;
            max-height: 60vh !important;
            overflow-y: auto !important;
            transform: translateY(${isOpen ? '0' : '100%'}) !important;
            transition: transform 0.3s ease !important;
            border-radius: 20px 20px 0 0 !important;
            box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.5) !important;
          }
        }
      `}</style>
    </>
  )
}

export default ControlsDrawer
