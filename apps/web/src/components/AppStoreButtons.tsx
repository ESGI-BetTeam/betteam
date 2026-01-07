interface AppStoreButtonsProps {
  appleStoreUrl?: string
  googlePlayUrl?: string
  className?: string
}

export default function AppStoreButtons({
  appleStoreUrl = '#',
  googlePlayUrl = '#',
  className = ''
}: AppStoreButtonsProps) {
  return (
    <div className={`flex flex-col sm:flex-row items-center justify-center gap-4 ${className}`}>
      {/* App Store Button */}
      <a
        href={appleStoreUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-3 bg-black hover:bg-gray-900 text-white rounded-xl px-6 py-3.5 transition-all duration-200 hover:scale-105 border border-white/10"
      >
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.09999 22C7.78999 22.05 6.79999 20.68 5.95999 19.47C4.24999 17 2.93999 12.45 4.69999 9.39C5.56999 7.87 7.12999 6.91 8.81999 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 8.88 17.39 10.1 17.41 12.63C17.44 15.65 20.06 16.66 20.09 16.67C20.06 16.74 19.67 18.11 18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z"/>
        </svg>
        <div className="flex flex-col items-start">
          <span className="text-xs opacity-80">Télécharger sur</span>
          <span className="text-lg font-semibold -mt-0.5">App Store</span>
        </div>
      </a>

      {/* Google Play Button */}
      <a
        href={googlePlayUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group inline-flex items-center gap-3 bg-black hover:bg-gray-900 text-white rounded-xl px-6 py-3.5 transition-all duration-200 hover:scale-105 border border-white/10"
      >
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
        </svg>
        <div className="flex flex-col items-start">
          <span className="text-xs opacity-80">Disponible sur</span>
          <span className="text-lg font-semibold -mt-0.5">Google Play</span>
        </div>
      </a>
    </div>
  )
}
