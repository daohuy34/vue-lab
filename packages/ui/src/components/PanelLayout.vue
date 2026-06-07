<script setup lang="ts">
import { ref } from 'vue';

export type PanelId = 'explorer' | 'preview' | 'inspector';

const props = defineProps<{
  activePanel: PanelId;
}>();

const emit = defineEmits<{
  (e: 'update:activePanel', value: PanelId): void;
}>();

const leftPanelWidth = ref(280);
const rightPanelWidth = ref(320);
let isResizingLeft = false;
let isResizingRight = false;

function setActivePanel(panel: PanelId) {
  emit('update:activePanel', panel);
}

function startResizeLeft(e: MouseEvent) {
  isResizingLeft = true;
  document.addEventListener('mousemove', resizeLeft);
  document.addEventListener('mouseup', stopResize);
  e.preventDefault();
}

function resizeLeft(e: MouseEvent) {
  if (!isResizingLeft) return;
  const newWidth = Math.max(200, Math.min(400, e.clientX));
  leftPanelWidth.value = newWidth;
}

function startResizeRight(e: MouseEvent) {
  isResizingRight = true;
  document.addEventListener('mousemove', resizeRight);
  document.addEventListener('mouseup', stopResize);
  e.preventDefault();
}

function resizeRight(e: MouseEvent) {
  if (!isResizingRight) return;
  const newWidth = Math.max(250, Math.min(500, window.innerWidth - e.clientX));
  rightPanelWidth.value = newWidth;
}

function stopResize() {
  isResizingLeft = false;
  isResizingRight = false;
  document.removeEventListener('mousemove', resizeLeft);
  document.removeEventListener('mousemove', resizeRight);
  document.removeEventListener('mouseup', stopResize);
}
</script>

<template>
  <div class="panel-layout">
    <!-- Left Panel: Explorer -->
    <aside class="panel panel-left" :style="{ width: `${leftPanelWidth}px` }">
      <slot name="explorer"></slot>
      <div class="resize-handle resize-handle-right" @mousedown="startResizeLeft"></div>
    </aside>

    <!-- Center Panel: Preview -->
    <main class="panel panel-center">
      <slot name="preview"></slot>
    </main>

    <!-- Right Panel: Inspector -->
    <aside class="panel panel-right" :style="{ width: `${rightPanelWidth}px` }">
      <div class="resize-handle resize-handle-left" @mousedown="startResizeRight"></div>
      <slot name="inspector"></slot>
    </aside>
  </div>
</template>

<style scoped>
.panel-layout {
  display: flex;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.panel {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--vl-surface);
  overflow: hidden;
}

.panel-left {
  border-right: 1px solid var(--vl-border);
  flex-shrink: 0;
}

.panel-center {
  flex: 1;
  min-width: 300px;
}

.panel-right {
  border-left: 1px solid var(--vl-border);
  flex-shrink: 0;
}

.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  z-index: 10;
  transition: background 0.15s;
}

.resize-handle:hover {
  background: var(--vl-accent);
}

.resize-handle-right {
  right: -2px;
}

.resize-handle-left {
  left: -2px;
}
</style>
