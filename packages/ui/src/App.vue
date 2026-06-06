<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { ComponentMeta, VERSION } from '@vue-lab/core';
import ComponentList from './components/ComponentList.vue';
import ComponentDetail from './components/ComponentDetail.vue';

const components = ref<ComponentMeta[]>([]);
const selectedComponent = ref<ComponentMeta | null>(null);
const searchQuery = ref('');
const isLoading = ref(true);

const filteredComponents = computed(() => {
  if (!searchQuery.value) return components.value;
  
  const query = searchQuery.value.toLowerCase();
  return components.value.filter(
    c => c.name.toLowerCase().includes(query) || 
         c.namespace.toLowerCase().includes(query)
  );
});

onMounted(async () => {
  try {
    const res = await fetch('/api/components');
    const data = await res.json();
    if (data.success) {
      components.value = data.data;
    }
  } catch (error) {
    console.error('Failed to load components:', error);
  } finally {
    isLoading.value = false;
  }
});

function handleSelect(component: ComponentMeta) {
  selectedComponent.value = component;
}

function handleSearch(query: string) {
  searchQuery.value = query;
}
</script>

<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h1>Vue Lab</h1>
        <div class="version">v{{ VERSION }}</div>
      </div>
      <div class="sidebar-search">
        <input 
          type="text" 
          class="input"
          placeholder="Search components..."
          :value="searchQuery"
          @input="handleSearch(($event.target as HTMLInputElement).value)"
        />
      </div>
      <div class="sidebar-content">
        <div v-if="isLoading" class="loading">
          <div class="spinner"></div>
        </div>
        <ComponentList 
          v-else
          :components="filteredComponents"
          :selected="selectedComponent"
          @select="handleSelect"
        />
      </div>
    </aside>
    <main class="main-content">
      <ComponentDetail 
        v-if="selectedComponent"
        :component="selectedComponent"
      />
      <div v-else class="empty-state">
        <div class="icon">📦</div>
        <h3>No component selected</h3>
        <p>Select a component from the sidebar to preview</p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.sidebar-search {
  padding: 12px 16px;
  border-bottom: 1px solid var(--vl-border);
}
</style>
