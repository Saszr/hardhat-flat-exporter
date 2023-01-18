declare module "tsort" {
  type GraphNode = Record<string, string[]>;

  class Graph {
    node: GraphNode;
    add(from: string, to: string): GraphNode;
    sort(): string[];
  }

  function tsort(initial?: GraphNode): Graph;

  export = tsort;
}
