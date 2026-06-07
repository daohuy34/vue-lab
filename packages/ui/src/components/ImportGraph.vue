<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import type { GraphNode, GraphEdge } from '../types';

const props = defineProps<{
  nodes: GraphNode[];
  edges: GraphEdge[];
}>();

const emit = defineEmits<{
  (e: 'select', nodeId: string): void;
}>();

const svgRef = ref<SVGSVGElement | null>(null);
const containerRef = ref<HTMLDivElement | null>(null);
const transform = ref({ x: 50, y: 50, scale: 1 });
const isDragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });

const nodePositions = computed(() => {
  const positions = new Map<string, { x: number; y: number }>();
  const levels = new Map<string, number>();
  
  // Calculate levels based on depth
  for (const node of props.nodes) {
    const level = node.depth || 0;
    if (!levels.has(String(level))) {
      levels.set(String(level), 0);
    }
  }
  
  // Group nodes by depth
  const byLevel: GraphNode[][] = [];
  for (const node of props.nodes) {
    const level = node.depth || 0;
    if (!byLevel[level]) byLevel[level] = [];
    byLevel[level].push(node);
  }
  
  // Position nodes
  const levelHeight = 80;
  const nodeWidth = 140;
  const levelGap = 180;
  
  for (let i = 0; i < byLevel.length; i++) {
    const nodesAtLevel = byLevel[i];
    if (!nodesAtLevel) continue;
    
    const levelWidth = nodesAtLevel.length * levelGap;
    const startX = -levelWidth / 2 + levelGap / 2;
    
    for (let j = 0; j < nodesAtLevel.length; j++) {
      const node = nodesAtLevel[j];
      positions.set(node.id, {
        x: startX + j * levelGap,
        y: i * levelHeight,
      });
    }
  }
  
  return positions;
});

const viewBox = computed(() => {
  const minX = Math.min(...Array.from(nodePositions.value.values()).map(p => p.x)) - 100;
  const maxX = Math.max(...Array.from(nodePositions.value.values()).map(p => p.x)) + 100;
  const minY = Math.min(...Array.from(nodePositions.value.values()).map(p => p.y)) - 50;
  const maxY = Math.max(...Array.from(nodePositions.value.values()).map(p => p.y)) + 100;
  
  return `${minX} ${minY} ${maxX - minX} ${maxY - minY}`;
});

function getNodePosition(nodeId: string): { x: number; y: number } {
  return nodePositions.value.get(nodeId) || { x: 0, y: 0 };
}

function getEdgePath(edge: GraphEdge): string {
  const from = getNodePosition(edge.from);
  const to = getNodePosition(edge.to);
  
  const midY = (from.y + to.y) / 2;
  
  return `M ${from.x} ${from.y + 20} 
          C ${from.x} ${midY}, 
            ${to.x} ${midY}, 
            ${to.x} ${to.y - 20}`;
}

function handleMouseDown(e: MouseEvent) {
  isDragging.value = true;
  dragStart.value = { x: e.clientX - transform.value.x, y: e.clientY - transform.value.y };
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value) return;
  transform.value.x = e.clientX - dragStart.value.x;
  transform.value.y = e.clientY - dragStart.value.y;
}

function handleMouseUp() {
  isDragging.value = false;
}

function handleWheel(e: WheelEvent) {
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  transform.value.scale = Math.max(0.3, Math.min(2, transform.value.scale * delta));
}

function handleNodeClick(nodeId: string) {
  emit('select', nodeId);
}

function resetView() {
  transform.value = { x: 50, y: 50, scale: 1 };
}

function getNamespaceColor(namespace: string): string {
  const colors = [
    '#3b82f6', // blue
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#f59e0b', // amber
    '#10b981', // emerald
    '#06b6d4', // cyan
  ];
  
  let hash = 0;
  for (let i = 0; i < namespace.length; i++) {
    hash = namespace.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}
</script>

<template>
  <div class="import-graph">
    <div class="graph-header">
      <span class="graph-title">Import Graph</span>
      <div class="graph-controls">
        <button class="control-btn" @click="resetView" title="Reset view">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
        </button>
        <span class="zoom-level">{{ Math.round(transform.scale * 100) }}%</span>
      </div>
    </div>
    
    <div 
      ref="containerRef"
      class="graph-container"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseUp"
      @wheel="handleWheel"
    >
      <div v-if="nodes.length === 0" class="empty-state">
        <span class="empty-icon">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"/>
            <path d="M8 12h8M12 8v8"/>
          </svg>
        </span>
        <span class="empty-text">No dependency data</span>
      </div>
      
      <svg
        v-else
        ref="svgRef"
        class="graph-svg"
        :viewBox="viewBox"
        :style="{
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }"
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--vl-text-muted)" />
          </marker>
        </defs>
        
        <!-- Edges -->
        <g class="edges">
          <path
            v-for="edge in edges"
            :key="`${edge.from}-${edge.to}`"
            :d="getEdgePath(edge)"
            class="edge"
            marker-end="url(#arrowhead)"
          />
        </g>
        
        <!-- Nodes -->
        <g class="nodes">
          <g
            v-for="node in nodes"
            :key="node.id"
            class="node"
            :transform="`translate(${getNodePosition(node.id).x - 60}, ${getNodePosition(node.id).y})`"
            @click="handleNodeClick(node.id)"
          >
            <rect
              width="120"
              height="40"
              rx="6"
              class="node-bg"
              :style="{ fill: getNamespaceColor(node.namespace) + '20' }"
            />
            <rect
              width="120"
              height="40"
              rx="6"
              class="node-border"
              :style="{ stroke: getNamespaceColor(node.namespace) }"
            />
            <text
              x="60"
              y="16"
              text-anchor="middle"
              class="node-label"
            >
              {{ node.label }}
            </text>
            <text
              x="60"
              y="30"
              text-anchor="middle"
              class="node-namespace"
            >
              {{ node.namespace }}
            </text>
          </g>
        </g>
      </svg>
    </div>
    
    <div class="graph-legend">
      <div class="legend-item">
        <span class="legend-color" style="background: #3b82f6;"></span>
        <span class="legend-text">{{ nodes.length }} nodes</span>
      </div>
      <div class="legend-item">
        <span class="legend-color" style="background: #71717a;"></span>
        <span class="legend-text">{{ edges.length }} edges</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.import-graph {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--vl-surface);
  border-radius: 8px;
  overflow: hidden;
}

.graph-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vl-border);
}

.graph-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--vl-text);
}

.graph-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.control-btn {
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

.control-btn:hover {
  background: var(--vl-bg);
  color: var(--vl-text);
}

.zoom-level {
  font-size: 11px;
  color: var(--vl-text-muted);
  font-family: var(--vl-font-mono);
}

.graph-container {
  flex: 1;
  overflow: hidden;
  cursor: grab;
  position: relative;
}

.graph-container:active {
  cursor: grabbing;
}

.empty-state {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  color: var(--vl-text-muted);
}

.empty-icon {
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 13px;
}

.graph-svg {
  width: 100%;
  height: 100%;
  transform-origin: center;
  transition: transform 0.1s ease-out;
}

.edge {
  fill: none;
  stroke: var(--vl-border);
  stroke-width: 1.5;
}

.node {
  cursor: pointer;
}

.node-bg {
  transition: fill 0.15s;
}

.node:hover .node-bg {
  fill-opacity: 0.4;
}

.node-border {
  fill: none;
  stroke-width: 1.5;
}

.node-label {
  font-size: 11px;
  font-weight: 600;
  fill: var(--vl-text);
}

.node-namespace {
  font-size: 9px;
  fill: var(--vl-text-muted);
}

.graph-legend {
  display: flex;
  gap: 16px;
  padding: 8px 16px;
  border-top: 1px solid var(--vl-border);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

.legend-text {
  font-size: 11px;
  color: var(--vl-text-muted);
}
</style>
