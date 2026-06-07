<script setup lang="ts">
import { ref, computed } from 'vue';

export interface SnapshotInfo {
  id: string;
  componentId: string;
  componentName: string;
  timestamp: number;
  props: Record<string, unknown>;
}

export interface DiffInfo {
  before: SnapshotInfo;
  after: SnapshotInfo;
  similarity: number;
  added: number;
  removed: number;
  changed: number;
}

const props = defineProps<{
  diff: DiffInfo;
  diffImage?: string;
}>();

const emit = defineEmits<{
  (e: 'approve', snapshot: SnapshotInfo): void;
  (e: 'reject', snapshot: SnapshotInfo): void;
  (e: 'revert'): void;
}>();

const viewMode = ref<'split' | 'before' | 'after' | 'diff'>('split');

const similarityPercent = computed(() => Math.round(props.diff.similarity * 100));

const changeClass = computed(() => {
  if (props.diff.similarity >= 0.99) return 'change-none';
  if (props.diff.similarity >= 0.9) return 'change-minor';
  if (props.diff.similarity >= 0.5) return 'change-major';
  return 'change-breaking';
});

const changeLabel = computed(() => {
  if (props.diff.similarity >= 0.99) return 'No Change';
  if (props.diff.similarity >= 0.9) return 'Minor Change';
  if (props.diff.similarity >= 0.5) return 'Major Change';
  return 'Breaking Change';
});

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString();
}

function handleApprove() {
  emit('approve', props.diff.after);
}

function handleReject() {
  emit('reject', props.diff.after);
}
</script>

<template>
  <div class="diff-viewer">
    <div class="diff-header">
      <div class="diff-info">
        <span class="diff-title">{{ diff.after.componentName }}</span>
        <span class="diff-badge" :class="changeClass">{{ changeLabel }}</span>
        <span class="diff-similarity">{{ similarityPercent }}% similar</span>
      </div>
      <div class="diff-actions">
        <button class="action-btn approve" @click="handleApprove" title="Approve changes">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20,6 9,17 4,12"/>
          </svg>
          Approve
        </button>
        <button class="action-btn reject" @click="handleReject" title="Reject changes">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          Reject
        </button>
      </div>
    </div>

    <div class="diff-stats">
      <div class="stat">
        <span class="stat-value added">+{{ diff.added }}</span>
        <span class="stat-label">Added</span>
      </div>
      <div class="stat">
        <span class="stat-value removed">-{{ diff.removed }}</span>
        <span class="stat-label">Removed</span>
      </div>
      <div class="stat">
        <span class="stat-value changed">{{ diff.changed }}</span>
        <span class="stat-label">Changed</span>
      </div>
    </div>

    <div class="view-toggle">
      <button 
        :class="{ active: viewMode === 'split' }" 
        @click="viewMode = 'split'"
      >Split</button>
      <button 
        :class="{ active: viewMode === 'before' }" 
        @click="viewMode = 'before'"
      >Before</button>
      <button 
        :class="{ active: viewMode === 'after' }" 
        @click="viewMode = 'after'"
      >After</button>
      <button 
        :class="{ active: viewMode === 'diff' }" 
        @click="viewMode = 'diff'"
      >Diff</button>
    </div>

    <div class="diff-content" :class="viewMode">
      <div v-if="viewMode === 'split' || viewMode === 'before'" class="diff-panel before">
        <div class="panel-label">
          <span class="label-text">Before</span>
          <span class="label-time">{{ formatTimestamp(diff.before.timestamp) }}</span>
        </div>
        <div class="panel-image">
          <div class="placeholder-snapshot">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
            <span>Snapshot {{ formatTimestamp(diff.before.timestamp) }}</span>
          </div>
        </div>
      </div>

      <div v-if="viewMode === 'split' || viewMode === 'after'" class="diff-panel after">
        <div class="panel-label">
          <span class="label-text">After</span>
          <span class="label-time">{{ formatTimestamp(diff.after.timestamp) }}</span>
        </div>
        <div class="panel-image">
          <div class="placeholder-snapshot">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
            <span>Snapshot {{ formatTimestamp(diff.after.timestamp) }}</span>
          </div>
        </div>
      </div>

      <div v-if="viewMode === 'diff'" class="diff-panel diff">
        <div class="panel-label">
          <span class="label-text">Diff</span>
          <span class="label-time">Visual differences</span>
        </div>
        <div class="panel-image">
          <div v-if="diffImage" class="diff-image">
            <img :src="diffImage" alt="Diff" />
          </div>
          <div v-else class="placeholder-snapshot">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>No diff available</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.diff-viewer {
  background: var(--vl-surface);
  border-radius: 8px;
  overflow: hidden;
}

.diff-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid var(--vl-border);
}

.diff-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.diff-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--vl-text);
}

.diff-badge {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  text-transform: uppercase;
}

.diff-badge.change-none {
  background: rgba(34, 197, 94, 0.15);
  color: var(--vl-success);
}

.diff-badge.change-minor {
  background: rgba(59, 130, 246, 0.15);
  color: var(--vl-accent);
}

.diff-badge.change-major {
  background: rgba(245, 158, 11, 0.15);
  color: var(--vl-warning);
}

.diff-badge.change-breaking {
  background: rgba(239, 68, 68, 0.15);
  color: var(--vl-error);
}

.diff-similarity {
  font-size: 12px;
  color: var(--vl-text-muted);
}

.diff-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.action-btn.approve {
  background: var(--vl-success);
  color: white;
}

.action-btn.approve:hover {
  background: #1ea54a;
}

.action-btn.reject {
  background: var(--vl-error);
  color: white;
}

.action-btn.reject:hover {
  background: #dc2626;
}

.diff-stats {
  display: flex;
  gap: 24px;
  padding: 12px 16px;
  background: var(--vl-bg);
  border-bottom: 1px solid var(--vl-border);
}

.stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
  font-family: var(--vl-font-mono);
}

.stat-value.added {
  color: var(--vl-success);
}

.stat-value.removed {
  color: var(--vl-error);
}

.stat-value.changed {
  color: var(--vl-warning);
}

.stat-label {
  font-size: 11px;
  color: var(--vl-text-muted);
}

.view-toggle {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vl-border);
}

.view-toggle button {
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  background: transparent;
  border: 1px solid var(--vl-border);
  border-radius: 6px;
  color: var(--vl-text-muted);
  cursor: pointer;
  transition: all 0.15s;
  font-family: inherit;
}

.view-toggle button:hover {
  border-color: var(--vl-accent);
  color: var(--vl-text);
}

.view-toggle button.active {
  background: var(--vl-accent);
  border-color: var(--vl-accent);
  color: white;
}

.diff-content {
  display: flex;
  min-height: 300px;
}

.diff-content.split .diff-panel {
  flex: 1;
}

.diff-content:not(.split) .diff-panel {
  flex: 1;
}

.diff-panel {
  display: flex;
  flex-direction: column;
}

.diff-content.split .diff-panel:first-child {
  border-right: 1px solid var(--vl-border);
}

.panel-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--vl-bg);
  border-bottom: 1px solid var(--vl-border);
}

.label-text {
  font-size: 12px;
  font-weight: 600;
  color: var(--vl-text);
}

.label-time {
  font-size: 11px;
  color: var(--vl-text-muted);
  font-family: var(--vl-font-mono);
}

.panel-image {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1a1a1a;
  padding: 16px;
}

.placeholder-snapshot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--vl-text-muted);
  text-align: center;
}

.placeholder-snapshot svg {
  opacity: 0.5;
}

.placeholder-snapshot span {
  font-size: 12px;
}

.diff-image {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.diff-image img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
