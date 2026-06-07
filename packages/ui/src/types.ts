export interface GraphNode {
  id: string;
  label: string;
  namespace: string;
  depth: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: 'import' | 'slot' | 'prop';
}

export interface TreeNode {
  id: string;
  label: string;
  namespace?: string;
  children: TreeNode[];
}
