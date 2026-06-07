<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { TreeNode } from '../types';

const props = defineProps<{
  tree: TreeNode;
  maxDepth?: number;
}>();

const emit = defineEmits<{
  (e: 'select', node: TreeNode): void;
}>();

const expandedNodes = ref<Set<string>>(new Set());

watch(() => props.tree, () => {
  expandedNodes.value = new Set([props.tree.id]);
}, { immediate: true });

function toggleNode(nodeId: string) {
  if (expandedNodes.value.has(nodeId)) {
    expandedNodes.value.delete(nodeId);
  } else {
    expandedNodes.value.add(nodeId);
  }
  expandedNodes.value = new Set(expandedNodes.value);
}

function isExpanded(nodeId: string): boolean {
  return expandedNodes.value.has(nodeId);
}

function isLastChild(index: number, total: number): boolean {
  return index === total - 1;
}

function getDepth(node: TreeNode, currentDepth = 0): number {
  if (!node.children || node.children.length === 0) {
    return currentDepth;
  }
  return Math.max(...node.children.map(child => getDepth(child, currentDepth + 1)));
}

function canExpand(node: TreeNode): boolean {
  return node.children && node.children.length > 0;
}

function getMaxDepth(): number {
  return getDepth(props.tree);
}

const totalNodes = computed(() => {
  function countNodes(node: TreeNode): number {
    return 1 + (node.children?.reduce((sum, child) => sum + countNodes(child), 0) || 0);
  }
  return countNodes(props.tree);
});
</script>

<template>
  <div class="dependency-tree">
    <div class="tree-header">
      <span class="tree-title">Dependencies</span>
      <div class="tree-stats">
        <span class="stat">{{ totalNodes }} nodes</span>
        <span class="stat">{{ getMaxDepth() }} levels</span>
      </div>
    </div>
    <div class="tree-content">
      <div class="tree-node-wrapper">
        <div
          class="tree-node root"
          @click="emit('select', tree)"
        >
          <span class="node-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21,15 16,10 5,21"/>
            </svg>
          </span>
          <span class="node-label">{{ tree.label }}</span>
          <span v-if="tree.namespace" class="node-namespace">{{ tree.namespace }}</span>
        </div>
        
        <div v-if="tree.children && tree.children.length > 0" class="tree-children">
          <template v-for="(child, index) in tree.children" :key="child.id">
            <div class="tree-branch">
              <div
                class="tree-node"
                :class="{ 
                  expanded: isExpanded(child.id),
                  leaf: !canExpand(child)
                }"
                @click="canExpand(child) ? toggleNode(child.id) : emit('select', child)"
              >
                <span v-if="canExpand(child)" class="node-toggle">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                    <path d="M3 2l4 3-4 3V2z"/>
                  </svg>
                </span>
                <span v-else class="node-leaf-icon"></span>
                
                <span class="node-icon">
                  <svg v-if="canExpand(child)" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                  <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                </span>
                <span class="node-label">{{ child.label }}</span>
                <span v-if="child.namespace" class="node-namespace">{{ child.namespace }}</span>
              </div>
              
              <div v-if="isExpanded(child.id) && child.children && child.children.length > 0" class="tree-subtree">
                <div
                  v-for="(grandchild, gIndex) in child.children"
                  :key="grandchild.id"
                  class="tree-node nested"
                  @click="emit('select', grandchild)"
                >
                  <span class="node-connector">
                    <span class="connector-line"></span>
                    <span class="connector-dot"></span>
                  </span>
                  <span class="node-icon file">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14,2 14,8 20,8"/>
                    </svg>
                  </span>
                  <span class="node-label">{{ grandchild.label }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dependency-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--vl-surface);
  border-radius: 8px;
  overflow: hidden;
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vl-border);
}

.tree-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--vl-text);
}

.tree-stats {
  display: flex;
  gap: 12px;
}

.stat {
  font-size: 11px;
  color: var(--vl-text-muted);
}

.tree-content {
  flex: 1;
  overflow: auto;
  padding: 12px;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}

.tree-node:hover {
  background: rgba(59, 130, 246, 0.1);
}

.tree-node.root {
  background: rgba(59, 130, 246, 0.15);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.tree-node.expanded .node-toggle {
  transform: rotate(90deg);
}

.tree-node.leaf {
  opacity: 0.8;
}

.node-toggle {
  width: 14px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--vl-text-muted);
  transition: transform 0.15s;
}

.node-leaf-icon {
  width: 14px;
}

.node-icon {
  display: flex;
  align-items: center;
  color: #3b82f6;
}

.node-icon svg {
  width: 14px;
  height: 14px;
}

.node-icon.folder {
  color: #f59e0b;
}

.node-icon.file {
  color: #3b82f6;
}

.node-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--vl-text);
}

.node-namespace {
  font-size: 10px;
  color: var(--vl-text-muted);
  background: var(--vl-bg);
  padding: 2px 6px;
  border-radius: 4px;
  margin-left: auto;
}

.tree-children {
  margin-left: 24px;
  padding-left: 12px;
  border-left: 1px solid var(--vl-border);
}

.tree-branch {
  margin: 4px 0;
}

.tree-subtree {
  margin-left: 20px;
  padding-left: 12px;
  border-left: 1px dashed var(--vl-border);
}

.tree-node.nested {
  padding: 6px 8px;
  font-size: 12px;
}

.tree-node.nested .node-label {
  font-size: 12px;
  font-weight: 400;
}

.node-connector {
  display: flex;
  align-items: center;
  margin-right: 8px;
}

.connector-line {
  width: 16px;
  height: 1px;
  background: var(--vl-border);
}

.connector-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--vl-accent);
  margin-left: -3px;
}
</style>
