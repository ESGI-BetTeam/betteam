import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import QRCode from 'react-qr-code'

interface DownloadModalProps {
  isOpen: boolean
  onClose: () => void
  appleStoreUrl?: string
  googlePlayUrl?: string
}

export default function DownloadModal({
  isOpen,
  onClose,
  appleStoreUrl = 'https://apps.apple.com/app/betteam',
  googlePlayUrl = 'https://play.google.com/store/apps/details?id=com.betteam'
}: DownloadModalProps) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Calculate scrollbar width to prevent layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

      // Apply styles to both html and body for better browser compatibility
      const originalOverflow = document.documentElement.style.overflow
      const originalPaddingRight = document.body.style.paddingRight

      document.documentElement.style.overflow = 'hidden'
      document.body.style.paddingRight = `${scrollbarWidth}px`

      return () => {
        // Restore original styles
        document.documentElement.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-background border border-white/10 rounded-2xl p-8 max-w-2xl w-full shadow-2xl relative animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
        >
          <X size={24} />
        </button>

        {/* Title */}
        <h2 className="text-3xl font-bold mb-2 text-center">Téléchargez BetTeam</h2>
        <p className="text-white/60 text-center mb-8">
          Scannez le QR code avec votre téléphone pour télécharger l'application
        </p>

        {/* QR Codes */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* iOS QR Code */}
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-2xl mb-4 shadow-lg">
              <QRCode value={appleStoreUrl} size={180} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09999 22C7.78999 22.05 6.79999 20.68 5.95999 19.47C4.24999 17 2.93999 12.45 4.69999 9.39C5.56999 7.87 7.12999 6.91 8.81999 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
              </svg>
              <span className="font-semibold">iOS - App Store</span>
            </div>
            <p className="text-sm text-white/50 text-center">Pour iPhone et iPad</p>
          </div>

          {/* Android QR Code */}
          <div className="flex flex-col items-center">
            <div className="bg-white p-4 rounded-2xl mb-4 shadow-lg">
              <QRCode value={googlePlayUrl} size={180} />
            </div>
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              <span className="font-semibold">Android - Google Play</span>
            </div>
            <p className="text-sm text-white/50 text-center">Pour appareils Android</p>
          </div>
        </div>

        {/* Alternative text links */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <p className="text-sm text-white/60 text-center mb-4">Ou cliquez directement sur les liens :</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={appleStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
            >
              Ouvrir l'App Store
            </a>
            <a
              href={googlePlayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-sm"
            >
              Ouvrir Google Play
            </a>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
