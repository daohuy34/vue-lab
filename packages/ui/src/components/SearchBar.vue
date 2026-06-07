<script setup lang="ts">
import { ref, watch } from 'vue';

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
}>();

const localValue = ref(props.modelValue);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(() => props.modelValue, (newValue) => {
  localValue.value = newValue;
});

watch(localValue, (newValue) => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    emit('update:modelValue', newValue);
  }, 200);
});

function clearSearch() {
  localValue.value = '';
  emit('update:modelValue', '');
}
</script>

<template>
  <div class="search-bar">
    <div class="search-input-wrapper">
      <svg class="search-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8"/>
        <path d="m21 21-4.35-4.35"/>
      </svg>
      <input
        v-model="localValue"
        type="text"
        class="search-input"
        :placeholder="placeholder || 'Search components...'"
      />
      <button
        v-if="localValue"
        class="search-clear"
        @click="clearSearch"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<style scoped>
.search-bar {
  padding: 12px 16px;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--vl-text-muted);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 8px 32px 8px 36px;
  font-size: 13px;
  background: var(--vl-bg);
  border: 1px solid var(--vl-border);
  border-radius: 6px;
  color: var(--vl-text);
  font-family: inherit;
}

.search-input:focus {
  outline: none;
  border-color: var(--vl-accent);
}

.search-input::placeholder {
  color: var(--vl-text-muted);
}

.search-clear {
  position: absolute;
  right: 8px;
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

.search-clear:hover {
  background: var(--vl-border);
  color: var(--vl-text);
}
</style>
