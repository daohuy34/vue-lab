<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import type { ComponentMeta, PropDefinition, EmitDefinition, SlotDefinition } from '@vue-lab/core';
import type { TreeNode, GraphNode, GraphEdge } from '../types';
import UsedByList from './UsedByList.vue';
import DependencyTree from './DependencyTree.vue';
import ImportGraph from './ImportGraph.vue';
import PropsPlayground from './PropsPlayground.vue';

const props = defineProps<{
  component: ComponentMeta;
  allComponents?: ComponentMeta[];
}>();

const activeTab = ref('preview');
const renderStatus = ref<'ready' | 'warning' | 'failed'>('ready');
const componentSource = ref('');
const isLoadingSource = ref(false);
const playgroundProps = ref<Record<string, unknown>>({});

const tabs = [
  { id: 'preview', label: 'Preview' },
  { id: 'playground', label: 'Playground' },
  { id: 'props', label: 'Props' },
  { id: 'slots', label: 'Slots' },
  { id: 'emits', label: 'Emits' },
  { id: 'source', label: 'Source' },
  { id: 'intelligence', label: 'Intelligence' },
];

const componentProps = computed((): PropDefinition[] => {
  return props.component.props || [];
});

const componentSlots = computed((): SlotDefinition[] => {
  return props.component.slots || [];
});

const componentEmits = computed((): EmitDefinition[] => {
  return props.component.emits || [];
});

const componentDependencies = computed((): string[] => {
  return props.component.dependencies || [];
});

onMounted(async () => {
  await loadComponentDetails();
  initializePlaygroundProps();
});

watch(() => props.component, async () => {
  await loadComponentDetails();
  initializePlaygroundProps();
}, { immediate: true });

function initializePlaygroundProps() {
  const defaults: Record<string, unknown> = {};
  for (const prop of componentProps.value) {
    if (prop.default !== undefined) {
      defaults[prop.name] = prop.default;
    } else if (prop.type.toLowerCase().includes('boolean')) {
      defaults[prop.name] = false;
    } else if (prop.type.toLowerCase().includes('number')) {
      defaults[prop.name] = 0;
    } else {
      defaults[prop.name] = '';
    }
  }
  playgroundProps.value = defaults;
}

async function loadComponentDetails() {
  try {
    const res = await fetch(`/api/render/${props.component.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ props: {} }),
    });
    const data = await res.json();
    if (data.success) {
      renderStatus.value = data.data.status || 'ready';
    }
  } catch {
    renderStatus.value = 'failed';
  }
}

async function loadSource() {
  if (componentSource.value) return;
  
  isLoadingSource.value = true;
  try {
    const res = await fetch(`/api/components/${props.component.id}/source`);
    const data = await res.json();
    if (data.success) {
      componentSource.value = data.data.source;
    }
  } catch (e) {
    console.error('Failed to load source:', e);
  } finally {
    isLoadingSource.value = false;
  }
}

function onTabChange(tabId: string) {
  activeTab.value = tabId;
  if (tabId === 'source') {
    loadSource();
  }
}

function onPlaygroundUpdate(newProps: Record<string, unknown>) {
  playgroundProps.value = newProps;
}

const statusLabel = computed(() => {
  switch (renderStatus.value) {
    case 'ready': return 'Ready';
    case 'warning': return 'Warning';
    case 'failed': return 'Failed';
    default: return 'Unknown';
  }
});

const usedByComponents = computed((): ComponentMeta[] => {
  const components = props.allComponents || [];
  return components.filter(c => c.id !== props.component.id).slice(0, 5);
});

const dependencyTree = computed((): TreeNode => {
  return {
    id: props.component.id,
    label: props.component.name,
    namespace: props.component.namespace,
    children: componentDependencies.value.map(dep => ({
      id: dep,
      label: dep,
      children: [],
    })),
  };
});

const graphNodes = computed((): GraphNode[] => {
  const components = props.allComponents || [];
  return components.map((c, index) => ({
    id: c.id,
    label: c.name,
    namespace: c.namespace,
    depth: index % 3,
  }));
});

const graphEdges = computed((): GraphEdge[] => {
  return componentDependencies.value.map(dep => ({
    from: props.component.id,
    to: dep,
    type: 'import' as const,
  }));
});

function handleUsedBySelect(_component: ComponentMeta) {
  // Navigation handled by parent
}

function handleDependencySelect(_node: TreeNode) {
  // Navigation handled by parent
}

function handleGraphSelect(_nodeId: string) {
  // Navigation handled by parent
}

function getPropTypeIcon(type: string): string {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('boolean')) return '✓';
  if (lowerType.includes('string')) return 'Aa';
  if (lowerType.includes('number')) return '#';
  if (lowerType.includes('array') || lowerType.includes('object')) return '{ }';
  return '?';
}

function getEmitPayloadIcon(payload?: string): string {
  if (!payload) return '○';
  return '●';
}

function highlightVue(code: string): string {
  let result = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  result = result.replace(/(\/\/.*$)/gm, '<span class="comment">$1</span>');
  result = result.replace(/(&lt;\/?template&gt;)/g, '<span class="tag">$1</span>');
  result = result.replace(/(&lt;\/?script.*?&gt;)/g, '<span class="tag">$1</span>');
  result = result.replace(/(&lt;\/?style.*?&gt;)/g, '<span class="tag">$1</span>');
  result = result.replace(/(&lt;[A-Z][a-zA-Z]*)/g, '<span class="component">$1</span>');
  result = result.replace(/(<\/)([A-Z][a-zA-Z]*(&gt;))/g, '<span class="component">$1$2</span>');
  result = result.replace(/(:[\w-]+)(=)/g, '<span class="attr">$1</span>$2');
  result = result.replace(/(@[\w-]+)(=)/g, '<span class="event">$1</span>$2');
  
  return result;
}
</script>

<template>
  <div class="component-detail">
    <header class="detail-header">
      <div class="header-info">
        <h2>{{ component.name }}</h2>
        <span class="namespace-tag">{{ component.namespace }}</span>
      </div>
      <div class="header-actions">
        <span class="status-badge" :class="renderStatus">
          <span class="status-dot"></span>
          {{ statusLabel }}
        </span>
      </div>
    </header>

    <div class="tabs">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: activeTab === tab.id }"
        @click="onTabChange(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="detail-content">
      <!-- Preview Tab -->
      <div v-if="activeTab === 'preview'" class="preview-panel">
        <div class="preview-area">
          <div class="preview-placeholder">
            <span class="preview-icon">🎨</span>
            <span class="preview-text">{{ component.name }} Component</span>
            <span class="preview-hint">Preview rendering available in project context mode</span>
          </div>
        </div>
        <div v-if="componentDependencies.length > 0" class="preview-deps">
          <h4>Dependencies</h4>
          <div class="deps-list">
            <span v-for="dep in componentDependencies" :key="dep" class="dep-tag">{{ dep }}</span>
          </div>
        </div>
      </div>

      <!-- Playground Tab -->
      <div v-if="activeTab === 'playground'" class="playground-panel">
        <PropsPlayground
          :prop-definitions="componentProps"
          v-model="playgroundProps"
          @update:model-value="onPlaygroundUpdate"
        />
      </div>

      <!-- Props Tab -->
      <div v-else-if="activeTab === 'props'" class="props-panel">
        <div class="panel">
          <div class="panel-header">Props ({{ componentProps.length }})</div>
          <div class="panel-content">
            <div v-if="componentProps.length === 0" class="empty-props">
              <div class="empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
              </div>
              <span>No props defined</span>
            </div>
            <div v-else class="prop-list">
              <div v-for="prop in componentProps" :key="prop.name" class="prop-item">
                <div class="prop-header">
                  <span class="prop-type-icon">{{ getPropTypeIcon(prop.type) }}</span>
                  <span class="prop-name">{{ prop.name }}</span>
                  <span v-if="prop.required" class="prop-required">required</span>
                  <span v-else class="prop-optional">optional</span>
                </div>
                <div class="prop-details">
                  <span class="prop-type">{{ prop.type }}</span>
                  <span v-if="prop.default !== undefined" class="prop-default">default: {{ prop.default }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Slots Tab -->
      <div v-else-if="activeTab === 'slots'" class="slots-panel">
        <div class="panel">
          <div class="panel-header">Slots ({{ componentSlots.length }})</div>
          <div class="panel-content">
            <div v-if="componentSlots.length === 0" class="empty-message">
              <div class="empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="9" y1="21" x2="9" y2="9"/>
                </svg>
              </div>
              <span>No slots defined</span>
            </div>
            <div v-else class="slot-list">
              <div v-for="slot in componentSlots" :key="slot.name" class="slot-item">
                <span class="slot-icon">◻</span>
                <span class="slot-name">{{ slot.name }}</span>
                <span v-if="slot.props && slot.props.length > 0" class="slot-props">
                  with {{ slot.props.length }} prop(s)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Emits Tab -->
      <div v-else-if="activeTab === 'emits'" class="emits-panel">
        <div class="panel">
          <div class="panel-header">Emits ({{ componentEmits.length }})</div>
          <div class="panel-content">
            <div v-if="componentEmits.length === 0" class="empty-message">
              <div class="empty-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M22 2L11 13"/>
                  <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
                </svg>
              </div>
              <span>No emits defined</span>
            </div>
            <div v-else class="emit-list">
              <div v-for="emit in componentEmits" :key="emit.event" class="emit-item">
                <span class="emit-icon">{{ getEmitPayloadIcon(emit.payload) }}</span>
                <span class="emit-name">{{ emit.event }}</span>
                <span v-if="emit.payload" class="emit-payload">payload: {{ emit.payload }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Source Tab -->
      <div v-else-if="activeTab === 'source'" class="source-panel">
        <div class="panel">
          <div class="panel-header">Source: {{ component.path }}</div>
          <div class="panel-content source-content">
            <div v-if="isLoadingSource" class="loading-source">
              <div class="spinner"></div>
              <span>Loading source...</span>
            </div>
            <pre v-else-if="componentSource" class="source-code" v-html="highlightVue(componentSource)"></pre>
            <div v-else class="empty-source">
              <span>Unable to load source</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Intelligence Tab -->
      <div v-else-if="activeTab === 'intelligence'" class="intelligence-panel">
        <div class="intelligence-section">
          <UsedByList
            :used-by="usedByComponents"
            @select="handleUsedBySelect"
          />
        </div>
        
        <div class="intelligence-section">
          <DependencyTree
            :tree="dependencyTree"
            @select="handleDependencySelect"
          />
        </div>
        
        <div class="intelligence-section full-width">
          <ImportGraph
            :nodes="graphNodes"
            :edges="graphEdges"
            @select="handleGraphSelect"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.component-detail {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-header {
  padding: 16px 24px;
  border-bottom: 1px solid var(--vl-border);
  background: var(--vl-surface);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-info h2 {
  font-size: 20px;
  font-weight: 600;
  font-family: var(--vl-font-mono);
}

.namespace-tag {
  padding: 4px 8px;
  font-size: 12px;
  background: rgba(59, 130, 246, 0.15);
  color: var(--vl-accent);
  border-radius: 4px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.tabs {
  padding: 0 24px;
  background: var(--vl-surface);
  border-bottom: 1px solid var(--vl-border);
  display: flex;
  gap: 4px;
}

.tab {
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--vl-text-muted);
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.tab:hover {
  color: var(--vl-text);
}

.tab.active {
  color: var(--vl-accent);
  border-bottom-color: var(--vl-accent);
}

.detail-content {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

.preview-area {
  background: white;
  border-radius: 8px;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: #1a1a1a;
}

.preview-icon {
  font-size: 48px;
}

.preview-text {
  font-size: 16px;
  font-weight: 500;
}

.preview-hint {
  font-size: 12px;
  color: #71717a;
  margin-top: 8px;
}

.preview-deps {
  margin-top: 16px;
}

.preview-deps h4 {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vl-text-muted);
  margin-bottom: 8px;
}

.deps-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.dep-tag {
  padding: 4px 8px;
  font-size: 11px;
  font-family: var(--vl-font-mono);
  background: var(--vl-bg);
  color: var(--vl-text);
  border-radius: 4px;
  border: 1px solid var(--vl-border);
}

.playground-panel {
  height: 100%;
}

.empty-props,
.empty-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--vl-text-muted);
  text-align: center;
  padding: 32px;
}

.empty-icon {
  opacity: 0.4;
}

.prop-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prop-item {
  padding: 12px 14px;
  background: var(--vl-bg);
  border-radius: 6px;
  border: 1px solid var(--vl-border);
}

.prop-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.prop-type-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  font-size: 10px;
  font-weight: 600;
  background: var(--vl-accent);
  color: white;
  border-radius: 4px;
}

.prop-name {
  font-family: var(--vl-font-mono);
  font-weight: 600;
  font-size: 14px;
  color: var(--vl-text);
}

.prop-required {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(239, 68, 68, 0.15);
  color: var(--vl-error);
  border-radius: 3px;
  text-transform: uppercase;
}

.prop-optional {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(107, 114, 128, 0.15);
  color: var(--vl-text-muted);
  border-radius: 3px;
  text-transform: uppercase;
}

.prop-details {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-left: 28px;
}

.prop-type {
  font-size: 12px;
  font-family: var(--vl-font-mono);
  color: var(--vl-accent);
}

.prop-default {
  font-size: 12px;
  font-family: var(--vl-font-mono);
  color: var(--vl-text-muted);
}

.slot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slot-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--vl-bg);
  border-radius: 6px;
  border: 1px solid var(--vl-border);
}

.slot-icon {
  font-size: 14px;
  color: var(--vl-accent);
}

.slot-name {
  font-family: var(--vl-font-mono);
  font-weight: 500;
  font-size: 13px;
  color: var(--vl-text);
}

.slot-props {
  font-size: 11px;
  color: var(--vl-text-muted);
}

.emit-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.emit-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--vl-bg);
  border-radius: 6px;
  border: 1px solid var(--vl-border);
}

.emit-icon {
  font-size: 12px;
  color: var(--vl-success);
}

.emit-name {
  font-family: var(--vl-font-mono);
  font-weight: 500;
  font-size: 13px;
  color: var(--vl-text);
}

.emit-payload {
  font-size: 11px;
  font-family: var(--vl-font-mono);
  color: var(--vl-text-muted);
}

.source-content {
  max-height: 500px;
  overflow: auto;
}

.loading-source {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 48px;
  color: var(--vl-text-muted);
}

.source-code {
  font-family: var(--vl-font-mono);
  font-size: 12px;
  white-space: pre;
  word-break: break-all;
  color: var(--vl-text);
  line-height: 1.6;
  margin: 0;
}

.source-code :deep(.comment) {
  color: #6b7280;
  font-style: italic;
}

.source-code :deep(.tag) {
  color: #8b5cf6;
}

.source-code :deep(.component) {
  color: #3b82f6;
}

.source-code :deep(.attr) {
  color: #10b981;
}

.source-code :deep(.event) {
  color: #f59e0b;
}

.empty-source {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  color: var(--vl-text-muted);
}

.intelligence-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.intelligence-section {
  flex: 1;
  min-height: 200px;
}

.intelligence-section.full-width {
  height: 300px;
  flex: none;
}

.panel {
  background: var(--vl-surface);
  border: 1px solid var(--vl-border);
  border-radius: 8px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px 16px;
  border-bottom: 1px solid var(--vl-border);
  font-weight: 500;
  font-size: 13px;
  color: var(--vl-text);
}

.panel-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
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

.spinner {
  width: 20px;
  height: 20px;
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
