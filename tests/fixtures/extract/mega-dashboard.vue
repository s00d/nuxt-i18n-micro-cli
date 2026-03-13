<template>
  <main class="dashboard-page">
    <!-- $t('hidden.comment.key') -->
    <header class="page-header">
      <h1>{{ $t('dashboard.page.title') }}</h1>
      <p>{{ $t(
        'dashboard.page.subtitle',
      ) }}</p>
      <button :title="$t('dashboard.actions.refreshTooltip')">
        {{ $t('dashboard.actions.refresh') }}
      </button>
    </header>

    <section class="stats-grid">
      <article>
        <h2>{{ $t('dashboard.stats.users.title') }}</h2>
        <p>{{ $tc('dashboard.stats.users.count', usersCount) }}</p>
      </article>
      <article>
        <h2>{{ $t('dashboard.stats.orders.title') }}</h2>
        <p>{{ $tc('dashboard.stats.orders.count', ordersCount) }}</p>
      </article>
      <article>
        <h2>{{ $t('dashboard.stats.revenue.title') }}</h2>
        <p>{{ $t('dashboard.stats.revenue.value') }}</p>
      </article>
      <article>
        <h2>{{ $t('dashboard.stats.tickets.title') }}</h2>
        <p>{{ $tc('dashboard.stats.tickets.count', ticketsCount) }}</p>
      </article>
    </section>

    <section class="filters">
      <label :title="$t('dashboard.filters.period.tooltip')">
        {{ $t('dashboard.filters.period.label') }}
      </label>
      <select :aria-label="$t('dashboard.filters.period.aria')">
        <option>{{ $t('dashboard.filters.period.today') }}</option>
        <option>{{ $t('dashboard.filters.period.week') }}</option>
        <option>{{ $t('dashboard.filters.period.month') }}</option>
      </select>
    </section>

    <section class="panels">
      <div class="panel">
        <h3>{{ $t('dashboard.panels.activity.title') }}</h3>
        <p>{{ $t('dashboard.panels.activity.empty') }}</p>
      </div>
      <div class="panel">
        <h3>{{ $t('dashboard.panels.alerts.title') }}</h3>
        <p>{{ $t('dashboard.panels.alerts.empty') }}</p>
      </div>
      <div class="panel">
        <h3>{{ $t('dashboard.panels.tasks.title') }}</h3>
        <p>{{ $tc('dashboard.panels.tasks.pending', pendingTasks) }}</p>
      </div>
    </section>

    <footer>
      <small>{{ $t('dashboard.footer.copyright') }}</small>
    </footer>
  </main>
</template>

<script setup lang="ts">
const usersCount = 120
const ordersCount = 48
const ticketsCount = 9
const pendingTasks = 4

const primaryCta = $t('dashboard.actions.primary')
const secondaryCta = $t(
  'dashboard.actions.secondary',
)
const pluralMessage = $tc(
  'dashboard.messages.notifications',
  usersCount,
)
const infoBlock = $t('dashboard.messages.info')

// $t('hidden.script.comment')
void primaryCta
void secondaryCta
void pluralMessage
void infoBlock
</script>
