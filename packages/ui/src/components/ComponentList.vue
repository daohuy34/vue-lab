<script setup lang="ts">
import { computed } from 'vue';
import type { ComponentMeta } from '@vue-lab/core';

const props = defineProps<{
  components: ComponentMeta[];
  selected: ComponentMeta | null;
}>();

const emit = defineEmits<{
  (e: 'select', component: ComponentMeta): void;
}>();

const groupedComponents = computed(() => {
  const groups: Record<string, ComponentMeta[]> = {};
  
  for (const component of props.components) {
    const ns = component.namespace;
    if (!groups[ns]) {
      groups[ns] = [];
    }
    groups[ns].push(component);
  }
  
  return groups;
});
</script>

<template>
  <div class="component-list-wrapper">
    <div v-if="components.length === 0" class="empty-message">
      No components found
    </div>
    <div v-else>
      <div 
        v-for="(items, namespace) in groupedComponents" 
        :key="namespace"
        class="namespace-group"
      >
        <div class="namespace-header">{{ namespace }}</div>
        <div
          v-for="component in items"
          :key="component.id"
          class="component-item"
          :class="{ active: selected?.id === component.id }"
          @click="emit('select', component)"
        >
          <div class="name">{{ component.name }}</div>
          <div class="path">{{ component.path }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.component-list-wrapper {
  font-size: 13px;
}

.empty-message {
  padding: 16px;
  text-align: center;
  color: var(--vl-text-muted);
}

.namespace-group {
  margin-bottom: 8px;
}

.namespace-header {
  padding: 8px 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vl-text-muted);
  background: rgba(0, 0, 0, 0.2);
}

.component-item {
  padding: 10px 16px;
  cursor: pointer;
  transition: all 0.15s;
  border-left: 3px solid transparent;
}

.component-item:hover {
  background: rgba(59, 130, 246, 0.08);
}

.component-item.active {
  background: rgba(59, 130, 246, 0.15);
  border-left-color: var(--vl-accent);
}

.component-item .name {
  font-weight: 500;
  color: var(--vl-text);
}

.component-item .path {
  font-size: 11px;
  color: var(--vl-text-muted);
  margin-top: 2px;
  font-family: var(--vl-font-mono);
}
</style>
