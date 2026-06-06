import { describe, it, expect } from 'vitest';
import { parseSFC } from '@/parser';

describe('SFC Parser', () => {
  describe('Basic Parsing', () => {
    it('should parse empty SFC', () => {
      const result = parseSFC('<template><div>Hello</div></template>');
      
      expect(result.template).toBeTruthy();
      expect(result.template?.content).toContain('Hello');
    });

    it('should parse script with content', () => {
      const source = `<template><div>Hello</div></template>
<script>
const msg = 'hello';
</script>`;
      const result = parseSFC(source);
      
      expect(result.script).toBeTruthy();
    });
  });

  describe('Props Extraction', () => {
    it('should extract props from defineProps generic', () => {
      const source = `<template><div>{{ title }}</div></template>
<script setup lang="ts">
defineProps<{
  title: string;
  count?: number;
}>()
</script>`;
      const result = parseSFC(source);
      
      expect(result.props).toHaveLength(2);
      expect(result.props[0].name).toBe('title');
      expect(result.props[0].type).toBe('string');
      expect(result.props[0].required).toBe(true);
      expect(result.props[1].name).toBe('count');
      expect(result.props[1].required).toBe(false);
    });

    it('should extract props from interface', () => {
      const source = `<template><div>{{ msg }}</div></template>
<script setup lang="ts">
interface Props {
  msg: string;
  disabled?: boolean;
}
defineProps<Props>()
</script>`;
      const result = parseSFC(source);
      
      expect(result.props).toHaveLength(2);
      expect(result.props[0].name).toBe('msg');
      expect(result.props[0].required).toBe(true);
      expect(result.props[1].name).toBe('disabled');
      expect(result.props[1].required).toBe(false);
    });
  });

  describe('Emits Extraction', () => {
    it('should extract emits from defineEmits array syntax', () => {
      const source = `<template><button @click="$emit('submit')">Submit</button></template>
<script setup>
const emit = defineEmits(['submit', 'cancel'])
</script>`;
      const result = parseSFC(source);
      
      expect(result.emits).toHaveLength(2);
      expect(result.emits.find(e => e.event === 'submit')).toBeTruthy();
      expect(result.emits.find(e => e.event === 'cancel')).toBeTruthy();
    });
  });

  describe('Slots Extraction', () => {
    it('should extract default slot', () => {
      const source = `<template>
  <div>
    <slot />
  </div>
</template>`;
      const result = parseSFC(source);
      
      expect(result.slots).toHaveLength(1);
      expect(result.slots[0].name).toBe('default');
    });

    it('should extract named slots', () => {
      const source = `<template>
  <div>
    <slot name="header" />
    <slot name="footer" />
  </div>
</template>`;
      const result = parseSFC(source);
      
      expect(result.slots).toHaveLength(2);
      expect(result.slots.find(s => s.name === 'header')).toBeTruthy();
      expect(result.slots.find(s => s.name === 'footer')).toBeTruthy();
    });
  });

  describe('Dependencies Extraction', () => {
    it('should extract component dependencies', () => {
      const source = `<template>
  <div>
    <Button />
    <Input label="Name" />
    <Modal />
  </div>
</template>`;
      const result = parseSFC(source);
      
      expect(result.dependencies).toContain('Button');
      expect(result.dependencies).toContain('Input');
      expect(result.dependencies).toContain('Modal');
    });

    it('should not include built-in HTML tags', () => {
      const source = `<template>
  <div>
    <button>Click</button>
    <input />
    <span>Text</span>
  </div>
</template>`;
      const result = parseSFC(source);
      
      expect(result.dependencies).not.toContain('button');
      expect(result.dependencies).not.toContain('input');
      expect(result.dependencies).not.toContain('span');
    });

    it('should not include Vue built-in components', () => {
      const source = `<template>
  <div>
    <transition name="fade">
      <span>Content</span>
    </transition>
    <keep-alive>
      <component :is="current" />
    </keep-alive>
  </div>
</template>`;
      const result = parseSFC(source);
      
      expect(result.dependencies).not.toContain('transition');
      expect(result.dependencies).not.toContain('keep-alive');
      expect(result.dependencies).not.toContain('component');
    });
  });

  describe('Type Normalization', () => {
    it('should normalize primitive types', () => {
      const source = `<script setup lang="ts">
defineProps<{
  str: String;
  num: Number;
  bool: Boolean;
}>()
</script>`;
      const result = parseSFC(source);
      
      expect(result.props[0].type).toBe('string');
      expect(result.props[1].type).toBe('number');
      expect(result.props[2].type).toBe('boolean');
    });
  });
});
