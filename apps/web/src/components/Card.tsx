import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

export default function Card({ children, className = '', hover = false }: CardProps) {
  const hoverStyles = hover ? 'hover:bg-white/10 hover:scale-105 transition-all duration-300' : ''

  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-6 ${hoverStyles} ${className}`}>
      {children}
    </div>
  )
}
