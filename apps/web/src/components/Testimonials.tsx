import { Quote } from 'lucide-react'
import Card from './Card'

const testimonials = [
  {
    name: 'Marie Dubois',
    role: 'Directrice RH',
    company: 'TechCorp',
    quote: 'BetTeam a complètement transformé l\'ambiance au bureau. Les équipes interagissent davantage et l\'engagement est au plus haut.'
  },
  {
    name: 'Thomas Martin',
    role: 'CTO',
    company: 'StartupXYZ',
    quote: 'En tant que CTO, j\'apprécie la simplicité d\'intégration et la sécurité de la plateforme. Nos développeurs adorent pronostiquer sur l\'esport !'
  },
  {
    name: 'Sophie Laurent',
    role: 'Office Manager',
    company: 'ConsultingPro',
    quote: 'Un vrai levier de cohésion. Les leagues créent du lien entre départements qui ne se parlaient jamais. Résultat : +30% d\'interactions.'
  }
]

export default function Testimonials() {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/[0.02]">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Ils boostent leur cohésion avec BetTeam
          </h2>
          <p className="text-xl text-white/60 max-w-2xl mx-auto">
            Découvrez comment BetTeam transforme la dynamique d'équipe
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index}>
              <div className="flex flex-col h-full">
                {/* Quote Icon */}
                <Quote className="text-accent mb-4" size={32} />

                {/* Quote Text */}
                <p className="text-white/80 mb-6 flex-grow leading-relaxed">
                  "{testimonial.quote}"
                </p>

                {/* Author */}
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-white/50">
                    {testimonial.role} · {testimonial.company}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  )
}
