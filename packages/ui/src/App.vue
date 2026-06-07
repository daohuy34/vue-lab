<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { ComponentMeta, VERSION } from '@vue-lab/core';
import ComponentTree from './components/ComponentTree.vue';
import SearchBar from './components/SearchBar.vue';
import FilterChips, { type FilterStatus } from './components/FilterChips.vue';
import ComponentDetail from './components/ComponentDetail.vue';

const components = ref<ComponentMeta[]>([]);
const selectedComponent = ref<ComponentMeta | null>(null);
const searchQuery = ref('');
const statusFilter = ref<FilterStatus>('all');
const renderStatuses = ref<Record<string, 'ready' | 'warning' | 'failed'>>({});
const isLoading = ref(true);

const filteredComponents = computed(() => {
  let result = components.value;
  
  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(
      c => c.name.toLowerCase().includes(query) || 
           c.namespace.toLowerCase().includes(query) ||
           c.path.toLowerCase().includes(query)
    );
  }
  
  // Apply status filter
  if (statusFilter.value !== 'all') {
    result = result.filter(c => {
      const status = renderStatuses.value[c.id] || 'ready';
      return status === statusFilter.value;
    });
  }
  
  return result;
});

const filterCounts = computed(() => {
  const counts = { ready: 0, warning: 0, failed: 0, all: components.value.length };
  
  for (const component of components.value) {
    const status = renderStatuses.value[component.id] || 'ready';
    counts[status]++;
  }
  
  return counts;
});

onMounted(async () => {
  try {
    const res = await fetch('/api/components');
    const data = await res.json();
    if (data.success) {
      components.value = data.data;
      
      // Load render statuses for each component
      for (const component of components.value) {
        loadRenderStatus(component.id);
      }
    }
  } catch (error) {
    console.error('Failed to load components:', error);
  } finally {
    isLoading.value = false;
  }
});

async function loadRenderStatus(componentId: string) {
  try {
    const res = await fetch(`/api/render/${componentId}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      renderStatuses.value[componentId] = data.data.status;
    }
  } catch (error) {
    renderStatuses.value[componentId] = 'failed';
  }
}

function handleSelect(component: ComponentMeta) {
  selectedComponent.value = component;
}

function handleSearch(query: string) {
  searchQuery.value = query;
}

function handleStatusFilter(filter: FilterStatus) {
  statusFilter.value = filter;
}
</script>

<template>
  <div class="explorer-ui">
    <!-- Header -->
    <header class="explorer-header">
      <div class="header-left">
        <h1 class="logo">Vue Lab</h1>
        <span class="version">v{{ VERSION }}</span>
      </div>
      <div class="header-center">
        <SearchBar v-model="searchQuery" placeholder="Search components..." />
      </div>
      <div class="header-right">
        <span class="component-count">{{ filteredComponents.length }} / {{ components.length }}</span>
      </div>
    </header>

    <!-- Main Content -->
    <div class="explorer-content">
      <!-- Left Panel: Explorer -->
      <aside class="panel panel-explorer">
        <div class="panel-header">
          <FilterChips v-model="statusFilter" :counts="filterCounts" />
        </div>
        <div class="panel-content">
          <div v-if="isLoading" class="loading">
            <div class="spinner"></div>
          </div>
          <ComponentTree 
            v-else
            :components="filteredComponents"
            :selected="selectedComponent"
            @select="handleSelect"
          />
        </div>
      </aside>

      <!-- Center Panel: Preview -->
      <main class="panel panel-preview">
        <div v-if="selectedComponent" class="preview-container">
          <ComponentDetail :component="selectedComponent" />
        </div>
        <div v-else class="empty-state">
          <div class="empty-icon">📦</div>
          <h3>Select a component</h3>
          <p>Choose a component from the explorer to preview</p>
        </div>
      </main>

      <!-- Right Panel: Inspector -->
      <aside class="panel panel-inspector">
        <div v-if="selectedComponent" class="inspector-content">
          <div class="inspector-header">
            <h3>Inspector</h3>
          </div>
          <div class="inspector-section">
            <div class="section-label">File Path</div>
            <div class="section-value mono">{{ selectedComponent.path }}</div>
          </div>
          <div class="inspector-section">
            <div class="section-label">Namespace</div>
            <div class="section-value">{{ selectedComponent.namespace }}</div>
          </div>
          <div class="inspector-section">
            <div class="section-label">Component ID</div>
            <div class="section-value mono">{{ selectedComponent.id }}</div>
          </div>
          <div class="inspector-section">
            <div class="section-label">Status</div>
            <div class="section-value">
              <span class="status-badge" :class="renderStatuses[selectedComponent.id] || 'ready'">
                <span class="status-dot"></span>
                {{ renderStatuses[selectedComponent.id] || 'ready' }}
              </span>
            </div>
          </div>
        </div>
        <div v-else class="empty-inspector">
          <p>No component selected</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.explorer-ui {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--vl-bg);
}

.explorer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--vl-surface);
  border-bottom: 1px solid var(--vl-border);
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo {
  font-size: 18px;
  font-weight: 700;
  color: var(--vl-text);
  font-family: var(--vl-font-mono);
}

.version {
  font-size: 11px;
  color: var(--vl-text-muted);
  background: var(--vl-bg);
  padding: 2px 8px;
  border-radius: 4px;
}

.header-center {
  flex: 1;
  max-width: 400px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.component-count {
  font-size: 12px;
  color: var(--vl-text-muted);
  font-family: var(--vl-font-mono);
}

.explorer-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-explorer {
  width: 280px;
  min-width: 200px;
  max-width: 400px;
  background: var(--vl-surface);
  border-right: 1px solid var(--vl-border);
}

.panel-preview {
  flex: 1;
  min-width: 300px;
  background: var(--vl-bg);
}

.panel-inspector {
  width: 300px;
  min-width: 250px;
  max-width: 400px;
  background: var(--vl-surface);
  border-left: 1px solid var(--vl-border);
}

.panel-header {
  padding: 8px 0;
  border-bottom: 1px solid var(--vl-border);
}

.panel-content {
  flex: 1;
  overflow-y: auto;
}

.preview-container {
  height: 100%;
  overflow: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--vl-text-muted);
  text-align: center;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 500;
  color: var(--vl-text);
  margin-bottom: 8px;
}

.empty-state p {
  font-size: 14px;
}

.inspector-content {
  padding: 16px;
}

.inspector-header {
  margin-bottom: 16px;
}

.inspector-header h3 {
  font-size: 14px;
  font-weight: 600;
  color: var(--vl-text);
}

.inspector-section {
  margin-bottom: 16px;
}

.section-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vl-text-muted);
  margin-bottom: 6px;
}

.section-value {
  font-size: 13px;
  color: var(--vl-text);
}

.section-value.mono {
  font-family: var(--vl-font-mono);
  font-size: 12px;
  word-break: break-all;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  text-transform: capitalize;
}

.status-badge.ready {
  background: rgba(34, 197, 94, 0.15);
  color: var(--vl-success);
}

.status-badge.warning {
  background: rgba(245, 158, 11, 0.15);
  color: var(--vl-warning);
}

.status-badge.failed {
  background: rgba(239, 68, 68, 0.15);
  color: var(--vl-error);
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.empty-inspector {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: var(--vl-text-muted);
  font-size: 13px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--vl-border);
  border-top-color: var(--vl-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
