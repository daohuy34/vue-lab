<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ComponentMeta } from '@vue-lab/core';

const props = defineProps<{
  components: ComponentMeta[];
  selected: ComponentMeta | null;
}>();

const emit = defineEmits<{
  (e: 'select', component: ComponentMeta): void;
}>();

const expandedNamespaces = ref<Set<string>>(new Set());

function toggleNamespace(namespace: string) {
  if (expandedNamespaces.value.has(namespace)) {
    expandedNamespaces.value.delete(namespace);
  } else {
    expandedNamespaces.value.add(namespace);
  }
  expandedNamespaces.value = new Set(expandedNamespaces.value);
}

function isExpanded(namespace: string): boolean {
  return expandedNamespaces.value.has(namespace);
}

function expandAll() {
  const namespaces = new Set<string>();
  for (const component of props.components) {
    namespaces.add(component.namespace);
  }
  expandedNamespaces.value = namespaces;
}

function collapseAll() {
  expandedNamespaces.value = new Set();
}

const groupedComponents = computed(() => {
  const groups: Record<string, ComponentMeta[]> = {};
  
  for (const component of props.components) {
    const ns = component.namespace || 'Uncategorized';
    if (!groups[ns]) {
      groups[ns] = [];
    }
    groups[ns].push(component);
  }
  
  // Auto-expand first namespace
  if (expandedNamespaces.value.size === 0) {
    const firstNs = Object.keys(groups)[0];
    if (firstNs) {
      expandedNamespaces.value = new Set([firstNs]);
    }
  }
  
  return groups;
});

function getStatusClass(_component: ComponentMeta): string {
  return 'status-ready';
}
</script>

<template>
  <div class="component-tree">
    <div class="tree-header">
      <span class="tree-title">Components</span>
      <div class="tree-actions">
        <button class="tree-btn" @click="expandAll" title="Expand all">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 10l5 5 5-5M7 14l5-5 5 5"/>
          </svg>
        </button>
        <button class="tree-btn" @click="collapseAll" title="Collapse all">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M7 14l5-5 5 5"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div v-if="components.length === 0" class="empty-message">
      No components found
    </div>
    <div v-else class="tree-content">
      <div
        v-for="(items, namespace) in groupedComponents"
        :key="namespace"
        class="tree-group"
      >
        <div
          class="tree-node namespace"
          :class="{ expanded: isExpanded(namespace) }"
          @click="toggleNamespace(namespace)"
        >
          <span class="tree-toggle">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
              <path d="M3 2l4 3-4 3V2z"/>
            </svg>
          </span>
          <span class="tree-icon folder">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M10 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-8l-2-2z"/>
            </svg>
          </span>
          <span class="tree-label">{{ namespace }}</span>
          <span class="tree-count">{{ items.length }}</span>
        </div>
        
        <div v-if="isExpanded(namespace)" class="tree-children">
          <div
            v-for="component in items"
            :key="component.id"
            class="tree-node component"
            :class="{ active: selected?.id === component.id }"
            @click="emit('select', component)"
          >
            <span class="tree-toggle"></span>
            <span class="tree-icon file">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
            </span>
            <span class="tree-label">{{ component.name }}</span>
            <span class="tree-status" :class="getStatusClass(component)"></span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.component-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid var(--vl-border);
}

.tree-title {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vl-text-muted);
}

.tree-actions {
  display: flex;
  gap: 4px;
}

.tree-btn {
  padding: 4px;
  background: transparent;
  border: none;
  color: var(--vl-text-muted);
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tree-btn:hover {
  background: var(--vl-bg);
  color: var(--vl-text);
}

.empty-message {
  padding: 16px;
  text-align: center;
  color: var(--vl-text-muted);
  font-size: 13px;
}

.tree-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.tree-group {
  margin-bottom: 2px;
}

.tree-node {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  transition: background 0.1s;
  user-select: none;
}

.tree-node:hover {
  background: rgba(59, 130, 246, 0.08);
}

.tree-node.active {
  background: rgba(59, 130, 246, 0.15);
}

.tree-toggle {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vl-text-muted);
  transition: transform 0.15s;
  flex-shrink: 0;
}

.tree-node.namespace.expanded .tree-toggle {
  transform: rotate(90deg);
}

.tree-node.namespace {
  font-weight: 600;
  color: var(--vl-text);
  font-size: 13px;
}

.tree-icon {
  margin-right: 8px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.tree-icon.folder {
  color: #f59e0b;
}

.tree-icon.file {
  color: #3b82f6;
}

.tree-label {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.tree-count {
  font-size: 10px;
  color: var(--vl-text-muted);
  background: var(--vl-bg);
  padding: 2px 6px;
  border-radius: 10px;
  margin-left: 8px;
}

.tree-children {
  margin-left: 8px;
}

.tree-node.component {
  padding-left: 32px;
  font-weight: 400;
}

.tree-node.component .tree-toggle {
  width: 14px;
}

.tree-status {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  margin-left: 8px;
  flex-shrink: 0;
}

.tree-status.status-ready {
  background: var(--vl-success);
}

.tree-status.status-warning {
  background: var(--vl-warning);
}

.tree-status.status-failed {
  background: var(--vl-error);
}
</style>
