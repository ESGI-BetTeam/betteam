import { Check, Zap } from 'lucide-react'
import Card from './Card'
import Button from './Button'

const plans = [
  {
    name: 'Starter',
    price: 'Gratuit',
    description: 'Pour tester avec une petite équipe',
    features: [
      '1 league privée',
      'Jusqu\'à 20 utilisateurs',
      'Toutes les compétitions',
      'Classements temps réel',
      'Support par email'
    ],
    cta: 'Commencer gratuitement',
    highlighted: false
  },
  {
    name: 'Team',
    price: '49€',
    period: '/mois',
    description: 'Pour les équipes qui veulent aller plus loin',
    features: [
      'Leagues illimitées',
      'Jusqu\'à 100 utilisateurs',
      'Events personnalisés',
      'Statistiques avancées',
      'Support prioritaire',
      'Intégrations Slack/Teams'
    ],
    cta: 'Démarrer l\'essai gratuit',
    highlighted: true
  },
  {
    name: 'Enterprise',
    price: 'Sur devis',
    description: 'Pour les grandes organisations',
    features: [
      'Utilisateurs illimités',
      'SSO (Single Sign-On)',
      'API dédiée',
      'Support 24/7',
      'Formation sur mesure',
      'Account manager dédié'
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <ul className="space-y-3 mb-8 flex-grow">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="text-accent flex-shrink-0 mt-0.5" size={20} />
                        <span className="text-white/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

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
