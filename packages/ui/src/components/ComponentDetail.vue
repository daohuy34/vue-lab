<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ComponentMeta, RenderResult } from '@vue-lab/core';

const props = defineProps<{
  component: ComponentMeta;
}>();

const activeTab = ref('preview');
const renderStatus = ref<'ready' | 'warning' | 'failed'>('ready');
const propsData = ref<Record<string, any>>({});

const tabs = [
  { id: 'preview', label: 'Preview' },
  { id: 'props', label: 'Props' },
  { id: 'slots', label: 'Slots' },
  { id: 'dependencies', label: 'Dependencies' },
  { id: 'source', label: 'Source' },
];

async function loadComponentDetails() {
  try {
    const res = await fetch(`/api/render/${props.component.id}`);
    const data = await res.json();
    if (data.success) {
      renderStatus.value = data.data.status;
    }
  } catch (error) {
    renderStatus.value = 'failed';
  }
}

loadComponentDetails();

const statusLabel = computed(() => {
  switch (renderStatus.value) {
    case 'ready': return 'Ready';
    case 'warning': return 'Warning';
    case 'failed': return 'Failed';
    default: return 'Unknown';
  }
});
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
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
      </button>
    </div>

    <div class="detail-content">
      <div v-if="activeTab === 'preview'" class="preview-panel">
        <div class="preview-area">
          <div class="preview-placeholder">
            <span class="preview-icon">🎨</span>
            <span class="preview-text">{{ component.name }} Component</span>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'props'" class="props-panel">
        <div class="panel">
          <div class="panel-header">Props</div>
          <div class="panel-content">
            <div v-if="Object.keys(propsData).length === 0" class="empty-props">
              No props defined
            </div>
            <div v-else class="prop-list">
              <div v-for="(value, key) in propsData" :key="key" class="prop-item">
                <span class="prop-name">{{ key }}</span>
                <span class="prop-type">{{ typeof value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'slots'" class="slots-panel">
        <div class="panel">
          <div class="panel-header">Slots</div>
          <div class="panel-content">
            <div class="empty-message">
              No slots defined
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'dependencies'" class="dependencies-panel">
        <div class="panel">
          <div class="panel-header">Dependencies</div>
          <div class="panel-content">
            <div class="empty-message">
              No dependencies detected
            </div>
          </div>
        </div>
      </div>

      <div v-else-if="activeTab === 'source'" class="source-panel">
        <div class="panel">
          <div class="panel-header">Source: {{ component.path }}</div>
          <div class="panel-content">
            <pre class="source-code">{{ component }}</pre>
          </div>
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

.empty-props,
.empty-message {
  color: var(--vl-text-muted);
  text-align: center;
  padding: 24px;
}

.prop-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.prop-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--vl-bg);
  border-radius: 4px;
}

.prop-name {
  font-family: var(--vl-font-mono);
  font-weight: 500;
}

.prop-type {
  color: var(--vl-text-muted);
  font-size: 12px;
}

.source-code {
  font-family: var(--vl-font-mono);
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--vl-text);
}
</style>
