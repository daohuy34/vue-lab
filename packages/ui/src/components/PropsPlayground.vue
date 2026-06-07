<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { PropDefinition } from '@vue-lab/core';

const props = defineProps<{
  propDefinitions: PropDefinition[];
  modelValue: Record<string, unknown>;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: Record<string, unknown>): void;
}>();

const propValues = ref<Record<string, unknown>>({});

watch(() => props.modelValue, (newVal) => {
  propValues.value = { ...newVal };
}, { immediate: true, deep: true });

function getControlType(type: string): 'boolean' | 'string' | 'number' | 'select' | 'color' | 'date' {
  const lowerType = type.toLowerCase();
  if (lowerType.includes('boolean')) return 'boolean';
  if (lowerType.includes('number')) return 'number';
  if (lowerType.includes('color')) return 'color';
  if (lowerType.includes('date')) return 'date';
  if (lowerType.includes('enum') || lowerType.includes("'")) return 'select';
  return 'string';
}

function getDefaultValue(prop: PropDefinition): unknown {
  if (prop.default !== undefined) return prop.default;
  const type = getControlType(prop.type);
  switch (type) {
    case 'boolean': return false;
    case 'number': return 0;
    case 'color': return '#000000';
    case 'date': return '';
    default: return '';
  }
}

function updateProp(name: string, value: unknown) {
  propValues.value[name] = value;
  emit('update:modelValue', { ...propValues.value });
}

function parseEnumOptions(type: string): { label: string; value: string }[] {
  const match = type.match(/enum\s*\{([^}]+)\}/i) || type.match(/'([^']+)'/g);
  if (match) {
    const values = type.match(/'([^']+)'/g) || [];
    return values.map(v => ({
      label: v.replace(/'/g, ''),
      value: v.replace(/'/g, ''),
    }));
  }
  return [];
}

function resetToDefaults() {
  const defaults: Record<string, unknown> = {};
  for (const prop of props.propDefinitions) {
    defaults[prop.name] = getDefaultValue(prop);
  }
  propValues.value = defaults;
  emit('update:modelValue', defaults);
}
</script>

<template>
  <div class="props-playground">
    <div class="playground-header">
      <h4>Props Playground</h4>
      <button class="reset-btn" @click="resetToDefaults">Reset</button>
    </div>
    
    <div class="controls">
      <div v-if="propDefinitions.length === 0" class="no-props">
        <span>No props to configure</span>
      </div>
      
      <div v-for="prop in propDefinitions" :key="prop.name" class="control-item">
        <label class="control-label">
          <span class="prop-name">{{ prop.name }}</span>
          <span v-if="prop.required" class="required-badge">required</span>
          <span v-else class="type-badge">{{ prop.type }}</span>
        </label>
        
        <!-- Boolean Control -->
        <div v-if="getControlType(prop.type) === 'boolean'" class="control-input">
          <label class="toggle">
            <input
              type="checkbox"
              :checked="propValues[prop.name] as boolean"
              @change="updateProp(prop.name, ($event.target as HTMLInputElement).checked)"
            />
            <span class="toggle-slider"></span>
          </label>
          <span class="toggle-value">{{ propValues[prop.name] ? 'true' : 'false' }}</span>
        </div>
        
        <!-- String Control -->
        <div v-else-if="getControlType(prop.type) === 'string'" class="control-input">
          <input
            type="text"
            class="text-input"
            :value="propValues[prop.name] as string"
            :placeholder="`Enter ${prop.name}...`"
            @input="updateProp(prop.name, ($event.target as HTMLInputElement).value)"
          />
        </div>
        
        <!-- Number Control -->
        <div v-else-if="getControlType(prop.type) === 'number'" class="control-input">
          <input
            type="number"
            class="number-input"
            :value="propValues[prop.name] as number"
            @input="updateProp(prop.name, Number(($event.target as HTMLInputElement).value))"
          />
        </div>
        
        <!-- Select Control -->
        <div v-else-if="getControlType(prop.type) === 'select'" class="control-input">
          <select
            class="select-input"
            :value="propValues[prop.name] as string"
            @change="updateProp(prop.name, ($event.target as HTMLSelectElement).value)"
          >
            <option v-for="opt in parseEnumOptions(prop.type)" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        
        <!-- Color Control -->
        <div v-else-if="getControlType(prop.type) === 'color'" class="control-input">
          <input
            type="color"
            class="color-input"
            :value="propValues[prop.name] as string"
            @input="updateProp(prop.name, ($event.target as HTMLInputElement).value)"
          />
          <span class="color-value">{{ propValues[prop.name] }}</span>
        </div>
        
        <!-- Date Control -->
        <div v-else-if="getControlType(prop.type) === 'date'" class="control-input">
          <input
            type="date"
            class="date-input"
            :value="propValues[prop.name] as string"
            @input="updateProp(prop.name, ($event.target as HTMLInputElement).value)"
          />
        </div>
        
        <!-- Default: String -->
        <div v-else class="control-input">
          <input
            type="text"
            class="text-input"
            :value="propValues[prop.name] as string"
            :placeholder="`Enter ${prop.name}...`"
            @input="updateProp(prop.name, ($event.target as HTMLInputElement).value)"
          />
        </div>
        
        <div v-if="prop.default !== undefined" class="prop-default">
          default: {{ prop.default }}
        </div>
      </div>
    </div>
    
    <div class="playground-output">
      <h5>Current Values</h5>
      <pre class="output-code">{{ JSON.stringify(propValues, null, 2) }}</pre>
    </div>
  </div>
</template>

<style scoped>
.props-playground {
  background: var(--vl-surface);
  border: 1px solid var(--vl-border);
  border-radius: 8px;
  overflow: hidden;
}

.playground-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--vl-border);
}

.playground-header h4 {
  font-size: 13px;
  font-weight: 600;
  color: var(--vl-text);
  margin: 0;
}

.reset-btn {
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  color: var(--vl-text-muted);
  background: var(--vl-bg);
  border: 1px solid var(--vl-border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.reset-btn:hover {
  color: var(--vl-text);
  border-color: var(--vl-accent);
}

.controls {
  padding: 16px;
  max-height: 400px;
  overflow-y: auto;
}

.no-props {
  text-align: center;
  padding: 24px;
  color: var(--vl-text-muted);
  font-size: 13px;
}

.control-item {
  margin-bottom: 16px;
}

.control-item:last-child {
  margin-bottom: 0;
}

.control-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.prop-name {
  font-family: var(--vl-font-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--vl-text);
}

.required-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(239, 68, 68, 0.15);
  color: var(--vl-error);
  border-radius: 3px;
  text-transform: uppercase;
}

.type-badge {
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(107, 114, 128, 0.15);
  color: var(--vl-text-muted);
  border-radius: 3px;
}

.control-input {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Toggle Switch */
.toggle {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 22px;
}

.toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--vl-border);
  transition: 0.2s;
  border-radius: 22px;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

.toggle input:checked + .toggle-slider {
  background-color: var(--vl-accent);
}

.toggle input:checked + .toggle-slider:before {
  transform: translateX(18px);
}

.toggle-value {
  font-size: 12px;
  font-family: var(--vl-font-mono);
  color: var(--vl-text-muted);
}

/* Text Input */
.text-input {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  font-family: var(--vl-font-mono);
  color: var(--vl-text);
  background: var(--vl-bg);
  border: 1px solid var(--vl-border);
  border-radius: 6px;
  outline: none;
  transition: border-color 0.15s;
}

.text-input:focus {
  border-color: var(--vl-accent);
}

.text-input::placeholder {
  color: var(--vl-text-muted);
}

/* Number Input */
.number-input {
  width: 120px;
  padding: 8px 12px;
  font-size: 13px;
  font-family: var(--vl-font-mono);
  color: var(--vl-text);
  background: var(--vl-bg);
  border: 1px solid var(--vl-border);
  border-radius: 6px;
  outline: none;
}

.number-input:focus {
  border-color: var(--vl-accent);
}

/* Select Input */
.select-input {
  flex: 1;
  padding: 8px 12px;
  font-size: 13px;
  font-family: var(--vl-font-mono);
  color: var(--vl-text);
  background: var(--vl-bg);
  border: 1px solid var(--vl-border);
  border-radius: 6px;
  outline: none;
  cursor: pointer;
}

.select-input:focus {
  border-color: var(--vl-accent);
}

/* Color Input */
.color-input {
  width: 40px;
  height: 32px;
  padding: 2px;
  border: 1px solid var(--vl-border);
  border-radius: 4px;
  cursor: pointer;
}

.color-value {
  font-size: 12px;
  font-family: var(--vl-font-mono);
  color: var(--vl-text-muted);
}

/* Date Input */
.date-input {
  padding: 8px 12px;
  font-size: 13px;
  font-family: var(--vl-font-mono);
  color: var(--vl-text);
  background: var(--vl-bg);
  border: 1px solid var(--vl-border);
  border-radius: 6px;
  outline: none;
}

.date-input:focus {
  border-color: var(--vl-accent);
}

.prop-default {
  margin-top: 4px;
  font-size: 11px;
  color: var(--vl-text-muted);
  font-family: var(--vl-font-mono);
}

.playground-output {
  padding: 12px 16px;
  border-top: 1px solid var(--vl-border);
  background: var(--vl-bg);
}

.playground-output h5 {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--vl-text-muted);
  margin: 0 0 8px 0;
}

.output-code {
  margin: 0;
  padding: 8px;
  font-size: 11px;
  font-family: var(--vl-font-mono);
  color: var(--vl-text);
  background: var(--vl-surface);
  border-radius: 4px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
