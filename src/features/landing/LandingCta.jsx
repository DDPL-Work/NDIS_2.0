import { Link } from 'react-router-dom'
import { useLandingCta } from './useLandingCta'

// Landing-page CTA that resolves a portal route to the correct target for the
// visitor's auth state: signed-in users get the real route, anonymous users
// get an in-page anchor or the public login page (see useLandingCta).
export default function LandingCta({ to, className, children, onNavigate, ...rest }) {
  const cta = useLandingCta()
  const target = cta(to)
  if ('href' in target) {
    return (
      <a href={target.href} className={className} onClick={onNavigate} {...rest}>
        {children}
      </a>
    )
  }
  return (
    <Link to={target.to} className={className} onClick={onNavigate} {...rest}>
      {children}
    </Link>
  )
}
