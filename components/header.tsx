'use client'

import { Plane } from 'lucide-react'
import * as React from 'react'

interface HeaderProps {
  backLinkHref?: string
  backLabel?: string
}

export function Header(props?: HeaderProps) {
  const { backLinkHref, backLabel } = props ?? {}
  const [hidden, setHidden] = React.useState(false)
  const lastScrollY = React.useRef(0)

  React.useEffect(() => {
    if (typeof window === 'undefined') return

    lastScrollY.current = window.scrollY

    const handleScroll = () => {
      const current = window.scrollY
      const goingDown = current > lastScrollY.current
      const isAtTop = current <= 0

      // Oculta al hacer scroll hacia abajo, muestra al subir o al volver arriba
      setHidden(goingDown && !isAtTop)
      lastScrollY.current = current
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full bg-transparent transition-transform duration-300 ${
        hidden ? '-translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="container mx-auto flex h-16 items-center px-4 justify-between w-full">
        <div className="flex items-center gap-4 w-full justify-between">
          <a href="/" className="flex items-center gap-2">
            <div className="flex size-9 items-center justify-center rounded-lg bg-primary">
              <Plane className="size-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">SkySearch</span>
          </a>

          {backLinkHref && (
            <a
              href={backLinkHref}
              className="hidden sm:inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              <span aria-hidden="true">←</span>
              <span>{backLabel ?? 'Volver'}</span>
            </a>
          )}
        </div>
      </div>
    </header>
  )
}
