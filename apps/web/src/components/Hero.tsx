import { Sparkles, Check } from 'lucide-react'
import Button from './Button'
import PhoneMockup from './PhoneMockup'
import AppStoreButtons from './AppStoreButtons'

export default function Hero() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-4 py-2 mb-8">
            <Sparkles className="text-accent" size={16} />
            <span className="text-sm font-medium text-accent">Nouveau : Pronostics esport disponibles</span>
          </div>

          {/* Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Boostez la cohésion d'équipe avec les{' '}
            <span className="text-accent">pronostics sportifs</span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-white/60 mb-10 max-w-3xl mx-auto leading-relaxed">
            La plateforme de pronostics entre collègues. Sans argent, 100% fun, 100% team building.
            Créez vos leagues privées et pariez sur vos compétitions préférées.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button variant="primary" size="lg">
              Démarrer gratuitement
            </Button>
            <Button variant="outline" size="lg">
              Voir la démo
            </Button>
          </div>

          {/* Reassurance */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-white/50 mb-16">
            <div className="flex items-center gap-2">
              <Check size={16} className="text-accent" />
              <span>Sans carte bancaire</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className="text-accent" />
              <span>Setup en 2 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Check size={16} className="text-accent" />
              <span>Conforme RGPD</span>
            </div>
          </div>
        </div>

        {/* Phone Mockups Section */}
        <div className="relative">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-radial from-accent/10 via-transparent to-transparent blur-3xl"></div>

          <div className="relative">
            {/* Phone Mockups */}
            <div className="flex items-center justify-center gap-8 lg:gap-16 mb-12 flex-wrap">
              <PhoneMockup type="iphone" />
              <PhoneMockup type="android" />
            </div>

            {/* App Store Buttons */}
            <div className="text-center">
              <p className="text-white/60 mb-6">Téléchargez l'application mobile</p>
              <AppStoreButtons
                appleStoreUrl="https://apps.apple.com/app/betteam"
                googlePlayUrl="https://play.google.com/store/apps/details?id=com.betteam"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
