<script setup lang="ts">
export type FilterStatus = 'ready' | 'warning' | 'failed' | 'all';

const props = defineProps<{
  modelValue: FilterStatus;
  counts?: {
    ready: number;
    warning: number;
    failed: number;
    all: number;
  };
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: FilterStatus): void;
}>();

const filters: { id: FilterStatus; label: string; color: string }[] = [
  { id: 'all', label: 'All', color: '' },
  { id: 'ready', label: 'Ready', color: 'ready' },
  { id: 'warning', label: 'Warning', color: 'warning' },
  { id: 'failed', label: 'Failed', color: 'failed' },
];

function selectFilter(status: FilterStatus) {
  emit('update:modelValue', status);
}

function getCount(id: FilterStatus): number {
  if (!props.counts) return 0;
  return props.counts[id];
}
</script>

<template>
  <div class="filter-chips">
    <button
      v-for="filter in filters"
      :key="filter.id"
      class="filter-chip"
      :class="{
        active: modelValue === filter.id,
        [filter.color]: filter.color
      }"
      @click="selectFilter(filter.id)"
    >
      <span v-if="filter.color" class="filter-dot" :class="filter.color"></span>
      <span class="filter-label">{{ filter.label }}</span>
      <span v-if="counts" class="filter-count">{{ getCount(filter.id) }}</span>
    </button>
  </div>
</template>

<style scoped>
.filter-chips {
  display: flex;
  gap: 6px;
  padding: 8px 16px;
  flex-wrap: wrap;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  font-weight: 500;
  background: var(--vl-bg);
  border: 1px solid var(--vl-border);
  border-radius: 16px;
  color: var(--vl-text-muted);
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.filter-chip:hover {
  border-color: var(--vl-accent);
  color: var(--vl-text);
}

.filter-chip.active {
  background: var(--vl-accent);
  border-color: var(--vl-accent);
  color: white;
}

.filter-chip.active.ready {
  background: var(--vl-success);
  border-color: var(--vl-success);
}

.filter-chip.active.warning {
  background: var(--vl-warning);
  border-color: var(--vl-warning);
}

.filter-chip.active.failed {
  background: var(--vl-error);
  border-color: var(--vl-error);
}

.filter-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.filter-dot.ready {
  background: var(--vl-success);
}

.filter-dot.warning {
  background: var(--vl-warning);
}

.filter-dot.failed {
  background: var(--vl-error);
}

.filter-label {
  line-height: 1;
}

.filter-count {
  font-size: 10px;
  opacity: 0.8;
}
</style>
