import { Rocket, UserPlus, Target } from 'lucide-react'

const steps = [
  {
    icon: Rocket,
    number: '01',
    title: 'Créez votre espace',
    description: 'En quelques clics, créez votre espace BetTeam personnalisé pour votre entreprise.'
  },
  {
    icon: UserPlus,
    number: '02',
    title: 'Invitez vos collègues',
    description: 'Partagez le lien d\'invitation et constituez vos leagues entre équipes ou départements.'
  },
  {
    icon: Target,
    number: '03',
    title: 'Pronostiquez !',
    description: 'Pariez sur vos matchs préférés et suivez le classement en temps réel.'
  }
]

export default function HowItWorks() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Lancez-vous en moins de 5 minutes
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <div key={index} className="relative">
                {/* Connector Line - hidden on mobile */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-16 left-1/2 w-full h-0.5 bg-gradient-to-r from-accent/50 to-white/10" />
                )}

                {/* Card */}
                <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 text-center hover:bg-white/10 transition-all duration-300">
                  {/* Number Badge */}
                  <div className="absolute -top-4 right-8 bg-accent text-white font-bold text-sm px-3 py-1 rounded-full">
                    {step.number}
                  </div>

                  {/* Icon */}
                  <div className="inline-flex items-center justify-center bg-accent/10 p-4 rounded-full mb-6">
                    <Icon className="text-accent" size={32} />
                  </div>

                  {/* Content */}
                  <h3 className="text-2xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-white/60 leading-relaxed">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
