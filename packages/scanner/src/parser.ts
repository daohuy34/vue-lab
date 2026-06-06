import { parse } from '@vue/compiler-sfc';
import type { PropDefinition, EmitDefinition, SlotDefinition } from '@vue-lab/core';

export interface SFCParseOptions {
  filename?: string;
}

export interface SFCBlock {
  content: string;
  lang?: string;
  scoped?: boolean;
}

export interface ParsedSFC {
  template: SFCBlock | null;
  script: SFCBlock | null;
  style: SFCBlock | null;
  props: PropDefinition[];
  emits: EmitDefinition[];
  slots: SlotDefinition[];
  dependencies: string[];
}

export function parseSFC(source: string, options: SFCParseOptions = {}): ParsedSFC {
  const result = parse(source, { filename: options.filename });
  
  const template = extractBlock(result.descriptor.template);
  const script = extractBlock(result.descriptor.script);
  const style = extractBlock(result.descriptor.styles[0]);
  const scriptSetup = extractBlock(result.descriptor.scriptSetup);
  
  const scriptContent = script?.content || '';
  const scriptSetupContent = scriptSetup?.content || '';
  
  const props = extractProps(scriptContent, scriptSetupContent);
  const emits = extractEmits(scriptContent, scriptSetupContent);
  const slots = extractSlots(result.descriptor.template?.content || '');
  const dependencies = extractDependencies(result.descriptor.template?.content || '');
  
  return {
    template,
    script,
    style,
    props,
    emits,
    slots,
    dependencies,
  };
}

function extractBlock(block: any): SFCBlock | null {
  if (!block) return null;
  return {
    content: block.content || '',
    lang: block.lang,
    scoped: block.scoped,
  };
}

function extractProps(scriptContent: string, scriptSetupContent: string): PropDefinition[] {
  const props: PropDefinition[] = [];
  const content = scriptSetupContent || scriptContent;
  
  if (!content) return props;
  
  // Match defineProps<Props>() or defineProps<{ ... }>()
  const genericMatch = content.match(/defineProps\s*<[\s\S]*?\{[\s\S]*?\}[\s\S]*?>\s*\(\s*\)/);
  if (genericMatch) {
    const typeContent = genericMatch[0].match(/\{[\s\S]*?\}/);
    if (typeContent) {
      const parsed = parseInterfaceProps(typeContent[0]);
      props.push(...parsed);
    }
  }
  
  // Match defineProps() with object syntax
  const objectMatch = content.match(/defineProps\s*\(\s*\{[\s\S]*?\}\s*\)/s);
  if (objectMatch) {
    const propsMatch = objectMatch[0].match(/\{[\s\S]*?\}/s);
    if (propsMatch) {
      const parsed = parseObjectProps(propsMatch[0]);
      props.push(...parsed);
    }
  }
  
  // Match interface Props { ... }
  const interfaceMatch = content.match(/interface\s+Props\s*\{[\s\S]*?\}/);
  if (interfaceMatch) {
    const propsMatch = interfaceMatch[0].match(/\{[\s\S]*?\}/);
    if (propsMatch) {
      const parsed = parseInterfaceProps(propsMatch[0]);
      props.push(...parsed);
    }
  }
  
  return props;
}

function parseInterfaceProps(content: string): PropDefinition[] {
  const props: PropDefinition[] = [];
  const lines = content.replace(/[{}]/g, '').split(/[;\n]/);
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    
    const typeMatch = trimmed.match(/^(\w+)(\??):\s*(.+?)(?:\s*=\s*(.+))?$/);
    if (typeMatch) {
      const [, name, optional, type, defaultValue] = typeMatch;
      props.push({
        name,
        type: normalizeType(type.trim()),
        required: !optional,
        default: defaultValue ? parseDefaultValue(defaultValue.trim()) : undefined,
      });
    }
  }
  
  return props;
}

function parseObjectProps(content: string): PropDefinition[] {
  const props: PropDefinition[] = [];
  const propsContent = content.replace(/[{}]/g, '');
  const lines = propsContent.split(/[,\n]/);
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const nameMatch = trimmed.match(/^(\w+)\s*:/);
    if (nameMatch) {
      const name = nameMatch[1];
      
      const typeMatch = trimmed.match(/type:\s*(\w+)/);
      const requiredMatch = trimmed.match(/required:\s*(true|false)/);
      const defaultMatch = trimmed.match(/default:\s*(.+?)(?:,?\s*(?:type|required|validator|$))/);
      
      if (typeMatch || requiredMatch || defaultMatch) {
        props.push({
          name,
          type: typeMatch ? typeMatch[1] : 'any',
          required: requiredMatch ? requiredMatch[1] === 'true' : false,
          default: defaultMatch ? parseDefaultValue(defaultMatch[1].trim()) : undefined,
        });
      }
    }
  }
  
  return props;
}

function normalizeType(type: string): string {
  return type
    .replace(/\bString\b/g, 'string')
    .replace(/\bNumber\b/g, 'number')
    .replace(/\bBoolean\b/g, 'boolean')
    .replace(/\bObject\b/g, 'object')
    .replace(/\bArray\b/g, 'array')
    .replace(/\bAny\b/g, 'any')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseDefaultValue(value: string): unknown {
  try {
    const trimmed = value.replace(/,$/, '').trim();
    if (trimmed === 'true') return true;
    if (trimmed === 'false') return false;
    if (trimmed === 'null') return null;
    if (trimmed === 'undefined') return undefined;
    if (trimmed.startsWith("'") || trimmed.startsWith('"')) return trimmed.slice(1, -1);
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) return JSON.parse(trimmed);
    const num = Number(trimmed);
    if (!isNaN(num)) return num;
    return trimmed;
  } catch {
    return value;
  }
}

function extractEmits(scriptContent: string, scriptSetupContent: string): EmitDefinition[] {
  const emits: EmitDefinition[] = [];
  const content = scriptSetupContent || scriptContent;
  
  if (!content) return emits;
  
  // Match defineEmits<{ event: payload }>()
  const genericMatch = content.match(/defineEmits\s*<[\s\S]*?\{[\s\S]*?\}[\s\S]*?>\s*\(\s*\)/);
  if (genericMatch) {
    const emitsMatch = genericMatch[0].match(/\{[\s\S]*?\}/);
    if (emitsMatch) {
      const parsed = parseEmitsInterface(emitsMatch[0]);
      emits.push(...parsed);
    }
  }
  
  // Match defineEmits<[...]>()
  const arrayMatch = content.match(/defineEmits\s*<\s*\[[\s\S]*?\]\s*>\s*\(\s*\)/);
  if (arrayMatch) {
    const arrayContent = arrayMatch[0].match(/\[[\s\S]*?\]/);
    if (arrayContent) {
      const emitNames = arrayContent[0]
        .replace(/[\[\]]/g, '')
        .split(',')
        .map(e => e.trim().replace(/['"`]/g, ''))
        .filter(Boolean);
      
      for (const name of emitNames) {
        emits.push({ event: name });
      }
    }
  }
  
  // Match defineEmits([...])
  const objectArrayMatch = content.match(/defineEmits\s*\(\s*\[\s*[\s\S]*?\]\s*\)/);
  if (objectArrayMatch) {
    const arrayContent = objectArrayMatch[0].match(/\[[\s\S]*?\]/);
    if (arrayContent) {
      const emitNames = arrayContent[0]
        .replace(/[\[\]]/g, '')
        .split(',')
        .map(e => {
          const m = e.trim().match(/['"](\w+)['"]/);
          return m ? m[1] : '';
        })
        .filter(Boolean);
      
      for (const name of emitNames) {
        emits.push({ event: name });
      }
    }
  }
  
  return emits;
}

function parseEmitsInterface(content: string): EmitDefinition[] {
  const emits: EmitDefinition[] = [];
  const inner = content.replace(/[{}]/g, '');
  const lines = inner.split(/[;\n]/);
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    
    const emitMatch = trimmed.match(/^(\w+)\s*:\s*(.*?)$/);
    if (emitMatch) {
      const [, event, payload] = emitMatch;
      emits.push({
        event,
        payload: payload || undefined,
      });
    }
  }
  
  return emits;
}

function extractSlots(templateContent: string): SlotDefinition[] {
  const slots: SlotDefinition[] = [];
  const seenSlots = new Set<string>();
  
  const slotRegex = /<slot\s+([^>]*?)\/?\s*>/g;
  let match;
  
  while ((match = slotRegex.exec(templateContent)) !== null) {
    const attrs = match[1];
    
    const nameMatch = attrs.match(/name\s*=\s*['"]([^'"]+)['"]/);
    const slotName = nameMatch ? nameMatch[1] : 'default';
    
    if (!seenSlots.has(slotName)) {
      seenSlots.add(slotName);
      slots.push({ name: slotName });
    }
  }
  
  return slots;
}

function extractDependencies(templateContent: string): string[] {
  const dependencies: string[] = [];
  const seen = new Set<string>();
  
  const builtInTags = new Set([
    'component', 'slot', 'template', 'keep-alive', 'transition', 'transition-group',
    'teleport', 'suspense', 'Teleport', 'Suspense', 'Transition', 'TransitionGroup',
    'KeepAlive', 'Comment', 'Fragment', 'Text',
    'div', 'span', 'p', 'a', 'img', 'button', 'input', 'form', 'ul', 'li', 'table',
    'header', 'footer', 'nav', 'main', 'section', 'article', 'aside',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'br', 'hr', 'strong', 'em', 'code', 'pre',
    'ol', 'dl', 'dt', 'dd', 'figure', 'figcaption', 'canvas', 'svg', 'path', 'rect',
    'circle', 'line', 'polyline', 'polygon', 'text', 'g', 'defs', 'use', 'style', 'script',
  ]);
  
  // Match PascalCase component tags - both self-closing and regular
  const componentRegex = /<([A-Z][A-Za-z0-9]*)(?:\s|>|\/>)/g;
  let match;
  
  while ((match = componentRegex.exec(templateContent)) !== null) {
    const componentName = match[1];
    
    if (builtInTags.has(componentName)) continue;
    
    if (!seen.has(componentName)) {
      seen.add(componentName);
      dependencies.push(componentName);
    }
  }
  
  return dependencies;
}
