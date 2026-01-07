interface PhoneMockupProps {
  type: 'iphone' | 'android'
  className?: string
}

export default function PhoneMockup({ type, className = '' }: PhoneMockupProps) {
  return (
    <div className={`relative ${className}`}>
      <div className="phone-mockup-wrapper">
        {/* Phone Frame */}
        <div className={`phone-frame ${type === 'iphone' ? 'phone-iphone' : 'phone-android'}`}>
          {/* Notch/Camera for iPhone */}
          {type === 'iphone' && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-black rounded-b-3xl z-10">
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-gray-800 rounded-full"></div>
            </div>
          )}

          {/* Screen Content */}
          <div className="phone-screen">
            <div className="w-full h-full bg-gradient-to-br from-accent/20 via-background to-accent/10 rounded-[2.5rem] p-6 flex flex-col">
              {/* Status Bar */}
              <div className="flex justify-between items-center mb-4 text-xs text-white/60">
                <span>9:41</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 border border-white/60 rounded-sm"></div>
                  <div className="w-4 h-4 border border-white/60 rounded-sm"></div>
                  <div className="w-4 h-4 border border-white/60 rounded-sm"></div>
                </div>
              </div>

              {/* App Preview */}
              <div className="flex-1 bg-white/5 rounded-2xl p-4 backdrop-blur-sm border border-white/10">
                <div className="h-full flex flex-col gap-3">
                  <div className="h-12 bg-accent/30 rounded-lg"></div>
                  <div className="h-20 bg-white/10 rounded-lg"></div>
                  <div className="h-16 bg-white/10 rounded-lg"></div>
                  <div className="flex gap-2">
                    <div className="flex-1 h-24 bg-white/10 rounded-lg"></div>
                    <div className="flex-1 h-24 bg-white/10 rounded-lg"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
