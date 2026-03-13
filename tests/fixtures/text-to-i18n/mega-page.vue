<template>
  <main class="settings-page">
    <!-- Must remain untouched: Plain commented string -->
    <header>
      <h1>Application settings</h1>
      <p>Configure your workspace preferences and defaults.</p>
      <button title="Save all changes">Save</button>
    </header>

    <section>
      <h2>General</h2>
      <label title="Project display name">Project name</label>
      <input placeholder="Enter project name" />
      <label title="Default timezone">Timezone</label>
      <input placeholder="Select timezone" />
    </section>

    <section>
      <h2>Localization</h2>
      <label title="Default locale">Locale</label>
      <input placeholder="Choose locale" />
      <label title="Fallback locale">Fallback locale</label>
      <input placeholder="Choose fallback locale" />
      <p>Translations can be synchronized automatically.</p>
    </section>

    <section>
      <h2>Notifications</h2>
      <label title="Email notifications">Email updates</label>
      <input placeholder="Type email address" />
      <label title="Slack integration">Slack webhook</label>
      <input placeholder="Paste Slack URL" />
      <p>Critical alerts are always delivered immediately.</p>
    </section>

    <section>
      <h2>Security</h2>
      <label title="Session timeout">Session timeout</label>
      <input placeholder="Set timeout in minutes" />
      <label title="Two-factor auth">Two-factor authentication</label>
      <input placeholder="Enable or disable" />
      <p>Security events are logged for auditing purposes.</p>
    </section>

    <section>
      <h2>Billing</h2>
      <label title="Billing contact">Billing email</label>
      <input placeholder="name@example.com" />
      <label title="Invoice address">Invoice address</label>
      <input placeholder="Enter company address" />
      <p>Invoices are generated on the first day of each month.</p>
    </section>

    <section>
      <h2>Advanced</h2>
      <label title="API endpoint">Custom API base URL</label>
      <input placeholder="https://api.example.com" />
      <label title="Request timeout">Request timeout</label>
      <input placeholder="3000" />
      <p>Use advanced settings only if you understand the impact.</p>
    </section>

    <footer>
      <small>Need help? Contact support.</small>
    </footer>
  </main>
</template>

<script setup lang="ts">
const schema = {
  route: '/settings',
  action: 'update_settings',
}

void schema
</script>
