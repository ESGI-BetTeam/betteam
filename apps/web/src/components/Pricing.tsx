import { Check, X, Zap } from 'lucide-react'
import Card from './Card'
import Button from './Button'

interface Feature {
  label: string
  available: boolean
}

interface Plan {
  name: string
  price: string
  period?: string
  description: string
  features: Feature[]
  cta: string
  highlighted: boolean
}

const plans: Plan[] = [
  {
    name: 'Free',
    price: '0€',
    description: 'Tester',
    features: [
      { label: '4 utilisateurs max', available: true },
      { label: '1 league', available: true },
      { label: 'Compétitions majeures uniquement', available: true },
      { label: 'Events custom', available: false },
      { label: 'Classement global', available: false },
      { label: 'Historique 30 jours', available: true },
      { label: 'Branding custom', available: false },
      { label: 'SSO / SAML', available: false },
      { label: 'Intégration Slack/Teams', available: false },
      { label: 'Support FAQ', available: true }
    ],
    cta: 'Démarrer l\'essai gratuit',
    highlighted: true
  },
  {
    name: 'Friends',
    price: '5€',
    period: '/mois',
    description: 'Groupe d\'amis',
    features: [
      { label: '10 utilisateurs', available: true },
      { label: '3 leagues', available: true },
      { label: 'Toutes les compétitions', available: true },
      { label: 'Events custom', available: false },
      { label: 'Classement global', available: true },
      { label: 'Historique 1 an', available: true },
      { label: 'Branding custom', available: false },
      { label: 'SSO / SAML', available: false },
      { label: 'Intégration Slack/Teams', available: false },
      { label: 'Support email', available: true }
    ],
    cta: 'Démarrer',
    highlighted: false
  },
  {
    name: 'Team',
    price: '15€',
    period: '/mois',
    description: 'PME / Équipe',
    features: [
      { label: '50 utilisateurs', available: true },
      { label: '10 leagues', available: true },
      { label: 'Toutes les compétitions', available: true },
      { label: 'Events custom', available: true },
      { label: 'Classement global', available: true },
      { label: 'Historique illimité', available: true },
      { label: 'Branding custom', available: false },
      { label: 'SSO / SAML', available: false },
      { label: 'Intégration Slack/Teams', available: false },
      { label: 'Support prioritaire', available: true }
    ],
    cta: 'Démarrer',
    highlighted: false
  },
  {
    name: 'Enterprise',
    price: 'Sur devis',
    description: 'Grande entreprise',
    features: [
      { label: 'Utilisateurs illimités', available: true },
      { label: 'Leagues illimitées', available: true },
      { label: 'Toutes les compétitions + custom', available: true },
      { label: 'Events custom', available: true },
      { label: 'Classement global', available: true },
      { label: 'Historique illimité', available: true },
      { label: 'Branding custom', available: true },
      { label: 'SSO / SAML', available: true },
      { label: 'Intégration Slack/Teams', available: true },
      { label: 'Account manager', available: true }
    ],
    cta: 'Nous contacter',
    highlighted: false
  }
]

export default function Pricing() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Un tarif pour chaque équipe
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Commencez gratuitement, évoluez selon vos besoins
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <div key={index} className="relative">
              {/* Highlighted Badge */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                  <div className="flex items-center gap-1 bg-accent text-white text-sm font-semibold px-4 py-1 rounded-full">
                    <Zap size={14} />
                    <span>Populaire</span>
                  </div>
                </div>
              )}

              <Card className={`h-full ${plan.highlighted ? 'border-accent/50 shadow-lg shadow-accent/10' : ''}`}>
                <div className="flex flex-col h-full">
                  {/* Header */}
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-white/60 text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && (
                        <span className="text-white/60 ml-1">{plan.period}</span>
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
                            <span className="text-white/30 line-through">{feature.label}</span>
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
      </div>
    </section>
  )
}
