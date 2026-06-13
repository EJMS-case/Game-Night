import Nav from './Nav.jsx'

export default function Layout({ children }) {
  return (
    <div className="min-h-full">
      <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-5">{children}</main>
      <Nav />
    </div>
  )
}

// Shared page header with optional back button + actions.
export function PageHeader({ title, subtitle, right }) {
  return (
    <header className="mb-5 flex items-end justify-between gap-3">
      <div>
        {subtitle && <p className="label-caps">{subtitle}</p>}
        <h1 className="heading text-3xl leading-tight sm:text-4xl">{title}</h1>
      </div>
      {right}
    </header>
  )
}
