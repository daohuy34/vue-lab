<script setup lang="ts">
import type { ComponentMeta } from '@vue-lab/core';

const props = defineProps<{
  usedBy: ComponentMeta[];
  title?: string;
}>();

const emit = defineEmits<{
  (e: 'select', component: ComponentMeta): void;
}>();

function handleSelect(component: ComponentMeta) {
  emit('select', component);
}
</script>

<template>
  <div class="used-by-list">
    <div class="list-header">
      <span class="list-title">{{ title || 'Used By' }}</span>
      <span class="list-count">{{ usedBy.length }}</span>
    </div>
    
    <div class="list-content">
      <div v-if="usedBy.length === 0" class="empty-state">
        <span class="empty-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </span>
        <span class="empty-text">No components use this</span>
      </div>
      
      <div v-else class="component-list">
        <div
          v-for="component in usedBy"
          :key="component.id"
          class="component-item"
          @click="handleSelect(component)"
        >
          <span class="item-icon">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
            </svg>
          </span>
          <div class="item-content">
            <span class="item-name">{{ component.name }}</span>
            <span class="item-namespace">{{ component.namespace }}</span>
          </div>
          <span class="item-arrow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9,18 15,12 9,6"/>
            </svg>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.used-by-list {
  background: var(--vl-surface);
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vl-border);
}

.list-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--vl-text);
}

.list-count {
  font-size: 11px;
  color: var(--vl-text-muted);
  background: var(--vl-bg);
  padding: 2px 8px;
  border-radius: 10px;
}

.list-content {
  max-height: 200px;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: var(--vl-text-muted);
  text-align: center;
}

.empty-icon {
  margin-bottom: 8px;
  opacity: 0.5;
}

.empty-text {
  font-size: 12px;
}

.component-list {
  padding: 8px;
}

.component-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
}

.component-item:hover {
  background: rgba(59, 130, 246, 0.1);
}

.component-item:hover .item-arrow {
  opacity: 1;
  transform: translateX(0);
}

.item-icon {
  display: flex;
  align-items: center;
  color: #3b82f6;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-name {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--vl-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.item-namespace {
  display: block;
  font-size: 11px;
  color: var(--vl-text-muted);
  margin-top: 2px;
}

.item-arrow {
  color: var(--vl-text-muted);
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.15s;
}
</style>
