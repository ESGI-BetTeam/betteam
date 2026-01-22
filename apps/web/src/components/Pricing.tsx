import { useState } from 'react'
import { Check, X, Zap, Users, Trophy, Crown } from 'lucide-react'
import Card from './Card'
import Button from './Button'

interface Feature {
  label: string
  available: boolean
}

interface Plan {
  name: string
  icon: React.ReactNode
  priceMonthly: string
  priceYearly: string
  period: string
  description: string
  features: Feature[]
  cta: string
  highlighted: boolean
  badge?: string
}

const plans: Plan[] = [
  {
    name: 'Rookie',
    icon: <Users size={24} />,
    priceMonthly: '0€',
    priceYearly: '0€',
    period: '',
    description: 'Pour découvrir entre amis',
    features: [
      { label: '4 membres par ligue', available: true },
      { label: '1 compétition au choix', available: true },
      { label: 'Changement 1x par semaine', available: true },
      { label: 'Paris : Vainqueur uniquement', available: true },
      { label: 'Historique 30 jours', available: true },
      { label: 'Badges & Trophées', available: true },
      { label: 'Tous types de paris', available: false },
      { label: 'Toutes les compétitions', available: false },
      { label: 'Stats avancées', available: false },
      { label: 'Custom events', available: false }
    ],
    cta: 'Commencer gratuitement',
    highlighted: false
  },
  {
    name: 'Champion',
    icon: <Trophy size={24} />,
    priceMonthly: '5,99€',
    priceYearly: '4,99€',
    period: '/mois',
    description: 'Le choix populaire',
    features: [
      { label: '10 membres par ligue', available: true },
      { label: 'Toutes les compétitions', available: true },
      { label: 'Changement illimité', available: true },
      { label: 'Tous types de paris', available: true },
      { label: 'Historique 6 mois', available: true },
      { label: 'Badges & Trophées', available: true },
      { label: 'Stats avancées', available: false },
      { label: 'Custom events', available: false }
    ],
    cta: 'Choisir Champion',
    highlighted: true,
    badge: 'Populaire'
  },
  {
    name: 'MVP',
    icon: <Crown size={24} />,
    priceMonthly: '11,99€',
    priceYearly: '9,99€',
    period: '/mois',
    description: 'Pour les vrais passionnés',
    features: [
      { label: '30 membres par ligue', available: true },
      { label: 'Toutes les compétitions', available: true },
      { label: 'Custom events (matchs hors API)', available: true },
      { label: 'Tous types de paris + custom', available: true },
      { label: 'Historique illimité', available: true },
      { label: 'Badges & Trophées', available: true },
      { label: 'Stats avancées', available: true }
    ],
    cta: 'Choisir MVP',
    highlighted: false
  }
]

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false)

  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Un tarif pour chaque groupe
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto mb-8">
            L'abonnement est par ligue, pas par utilisateur. Partagez les frais avec votre groupe !
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm font-medium transition-colors ${!isYearly ? 'text-white' : 'text-white/50'}`}>
              Mensuel
            </span>
            <button
              onClick={() => setIsYearly(!isYearly)}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                isYearly ? 'bg-accent' : 'bg-white/20'
              }`}
            >
              <span
                className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full transition-all duration-200 ${
                  isYearly ? 'left-[calc(100%-1.5rem)]' : 'left-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium transition-colors ${isYearly ? 'text-white' : 'text-white/50'}`}>
              Annuel
            </span>
            {isYearly && (
              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full font-medium">
                -20% (2 mois offerts)
              </span>
            )}
          </div>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {plans.map((plan, index) => (
            <div key={index} className={`relative ${plan.highlighted ? 'pt-4' : ''}`}>
              {/* Highlighted Badge */}
              {plan.highlighted && plan.badge && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <div className="flex items-center gap-1 bg-accent text-white text-sm font-semibold px-4 py-1.5 rounded-full shadow-lg">
                    <Zap size={14} />
                    <span>{plan.badge}</span>
                  </div>
                </div>
              )}

              <Card className={`h-full ${plan.highlighted ? 'border-accent/50 shadow-lg shadow-accent/10 scale-105' : ''}`}>
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${plan.highlighted ? 'bg-accent/20 text-accent' : 'bg-white/10 text-white/70'}`}>
                        {plan.icon}
                      </div>
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                    </div>
                    <p className="text-white/60 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline flex-wrap gap-x-2">
                      <span className="text-4xl font-bold">
                        {isYearly ? plan.priceYearly : plan.priceMonthly}
                      </span>
                      {plan.period && (
                        <span className="text-white/60">{plan.period}</span>
                      )}
                      {isYearly && plan.priceMonthly !== '0€' && (
                        <span className="text-sm text-white/40">
                          (Total {plan.name === 'Champion' ? '59.90€' : '119,90€'}/an)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="mb-8 flex-grow">
                    {/* Available Features */}
                    <ul className="space-y-3 mb-4">
                      {plan.features.filter(f => f.available).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <Check className="text-accent flex-shrink-0 mt-0.5" size={20} />
                          <span className="text-white/80">{feature.label}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Unavailable Features */}
                    {plan.features.some(f => !f.available) && (
                      <ul className="space-y-3">
                        {plan.features.filter(f => !f.available).map((feature, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <X className="text-white/20 flex-shrink-0 mt-0.5" size={20} />
                            <span className="text-white/30">{feature.label}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  {/* CTA */}
                  <Button
                    variant={plan.highlighted ? 'primary' : 'outline'}
                    className="w-full"
                  >
                    {plan.cta}
                  </Button>
                </div>
              </Card>
            </div>
          ))}
        </div>

        {/* Pot Commun Info */}
        <Card className="bg-gradient-to-r from-accent/10 to-purple-500/10 border-accent/20">
          <div className="flex flex-col md:flex-row items-center gap-6 p-2">
            <div className="flex-shrink-0">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                <span className="text-3xl">💰</span>
              </div>
            </div>
            <div className="flex-grow text-center md:text-left">
              <h3 className="text-xl font-bold mb-2">Pot commun transparent</h3>
              <p className="text-white/70">
                Chaque membre contribue librement au pot de la ligue. Vous voyez en temps réel
                le solde, les mois couverts et l'historique des contributions.
                <span className="text-white/50"> Contribution minimum : montant de l'abonnement choisi.</span>
              </p>
            </div>
            <div className="flex-shrink-0 text-center">
              <div className="text-sm text-white/50 mb-1">Exemple pour 5 amis</div>
              <div className="text-2xl font-bold text-accent">~1€<span className="text-sm font-normal text-white/50">/mois/pers</span></div>
              <div className="text-xs text-white/40">avec Champion</div>
            </div>
          </div>
        </Card>

        {/* FAQ Pricing */}
        <div className="mt-12 text-center">
          <p className="text-white/50 text-sm">
            Pas de carte bancaire requise pour le plan Rookie. Annulez à tout moment.
          </p>
        </div>
      </div>
    </section>
  )
}
