enum InternalStatus {
  Ready = 'ready',
  Disabled = 'disabled',
  Archived = 'archived',
}

const ROUTE_SCHEMA = {
  dashboard: '/dashboard',
  profile: '/profile',
  reports: '/reports',
  nested: {
    users: '/users',
    teams: '/teams',
    settings: '/settings',
  },
} as const

const API_SCHEMA = {
  baseUrl: '/api/v1',
  endpoints: {
    search: '/search',
    export: '/export',
    import: '/import',
  },
} as const

export function StressDashboard() {
  const banner = `Weekly overview
for all departments`
  const subtitle = 'Track health metrics and delivery quality'
  const cta = 'Open detailed report'

  return (
    <main>
      <header>
        <h1 title="Operations dashboard">Operations dashboard</h1>
        <p>{banner}</p>
        <p>{subtitle}</p>
        <button title="Open detailed report">{cta}</button>
      </header>

      <section>
        <h2 title="Team alpha">Team alpha</h2>
        <p>Velocity is stable this sprint.</p>
        <p>Deployment risk is low.</p>
      </section>
      <section>
        <h2 title="Team beta">Team beta</h2>
        <p>Velocity is recovering this sprint.</p>
        <p>Deployment risk is moderate.</p>
      </section>
      <section>
        <h2 title="Team gamma">Team gamma</h2>
        <p>Velocity is above target this sprint.</p>
        <p>Deployment risk is low.</p>
      </section>
      <section>
        <h2 title="Team delta">Team delta</h2>
        <p>Velocity is below target this sprint.</p>
        <p>Deployment risk is high.</p>
      </section>
      <section>
        <h2 title="Team epsilon">Team epsilon</h2>
        <p>Velocity is stable this sprint.</p>
        <p>Deployment risk is moderate.</p>
      </section>
      <section>
        <h2 title="Team zeta">Team zeta</h2>
        <p>Velocity is stable this sprint.</p>
        <p>Deployment risk is low.</p>
      </section>
      <section>
        <h2 title="Team eta">Team eta</h2>
        <p>Velocity is improving this sprint.</p>
        <p>Deployment risk is low.</p>
      </section>
      <section>
        <h2 title="Team theta">Team theta</h2>
        <p>Velocity is unstable this sprint.</p>
        <p>Deployment risk is high.</p>
      </section>
      <section>
        <h2 title="Team iota">Team iota</h2>
        <p>Velocity is stable this sprint.</p>
        <p>Deployment risk is moderate.</p>
      </section>
      <section>
        <h2 title="Team kappa">Team kappa</h2>
        <p>Velocity is stable this sprint.</p>
        <p>Deployment risk is low.</p>
      </section>
      <section>
        <h2 title="Team lambda">Team lambda</h2>
        <p>Velocity is above target this sprint.</p>
        <p>Deployment risk is low.</p>
      </section>
      <section>
        <h2 title="Team mu">Team mu</h2>
        <p>Velocity is stable this sprint.</p>
        <p>Deployment risk is moderate.</p>
      </section>
      <section>
        <h2 title="Team nu">Team nu</h2>
        <p>Velocity is recovering this sprint.</p>
        <p>Deployment risk is moderate.</p>
      </section>
      <section>
        <h2 title="Team xi">Team xi</h2>
        <p>Velocity is below target this sprint.</p>
        <p>Deployment risk is high.</p>
      </section>
      <section>
        <h2 title="Team omicron">Team omicron</h2>
        <p>Velocity is stable this sprint.</p>
        <p>Deployment risk is low.</p>
      </section>
      <section>
        <h2 title="Team pi">Team pi</h2>
        <p>Velocity is stable this sprint.</p>
        <p>Deployment risk is moderate.</p>
      </section>
      <section>
        <h2 title="Team rho">Team rho</h2>
        <p>Velocity is improving this sprint.</p>
        <p>Deployment risk is low.</p>
      </section>
      <section>
        <h2 title="Team sigma">Team sigma</h2>
        <p>Velocity is unstable this sprint.</p>
        <p>Deployment risk is high.</p>
      </section>
      <section>
        <h2 title="Team tau">Team tau</h2>
        <p>Velocity is stable this sprint.</p>
        <p>Deployment risk is moderate.</p>
      </section>
      <section>
        <h2 title="Team upsilon">Team upsilon</h2>
        <p>Velocity is stable this sprint.</p>
        <p>Deployment risk is low.</p>
      </section>
      <section>
        <h2 title="Team phi">Team phi</h2>
        <p>Velocity is above target this sprint.</p>
        <p>Deployment risk is low.</p>
      </section>
      <section>
        <h2 title="Team chi">Team chi</h2>
        <p>Velocity is stable this sprint.</p>
        <p>Deployment risk is moderate.</p>
      </section>
      <section>
        <h2 title="Team psi">Team psi</h2>
        <p>Velocity is recovering this sprint.</p>
        <p>Deployment risk is moderate.</p>
      </section>
      <section>
        <h2 title="Team omega">Team omega</h2>
        <p>Velocity is below target this sprint.</p>
        <p>Deployment risk is high.</p>
      </section>
      <section>
        <h2 title="Team north">Team north</h2>
        <p>Velocity is stable this sprint.</p>
        <p>Deployment risk is low.</p>
      </section>
      <section>
        <h2 title="Team south">Team south</h2>
        <p>Velocity is stable this sprint.</p>
        <p>Deployment risk is moderate.</p>
      </section>
      <section>
        <h2 title="Team east">Team east</h2>
        <p>Velocity is improving this sprint.</p>
        <p>Deployment risk is low.</p>
      </section>
      <section>
        <h2 title="Team west">Team west</h2>
        <p>Velocity is unstable this sprint.</p>
        <p>Deployment risk is high.</p>
      </section>
      <section>
        <h2 title="Team central">Team central</h2>
        <p>Velocity is stable this sprint.</p>
        <p>Deployment risk is moderate.</p>
      </section>
      <section>
        <h2 title="Team support">Team support</h2>
        <p>Velocity is stable this sprint.</p>
        <p>Deployment risk is low.</p>
      </section>

      <footer>
        <small>Data is refreshed every 15 minutes.</small>
      </footer>
    </main>
  )
}

export { API_SCHEMA, InternalStatus, ROUTE_SCHEMA }
