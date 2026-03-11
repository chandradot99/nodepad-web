import type { Node, Edge } from 'reactflow'

export function n8nToFlow(data: Record<string, unknown>) {
  const rawNodes = (data.nodes as any[]) || []
  const rawConns = (data.connections as Record<string, any>) || {}

  const nodes: Node[] = rawNodes.map((n: any) => ({
    id: n.id,
    position: { x: n.position[0], y: n.position[1] },
    data: {
      label:       n.name,
      nodeType:    n.type,
      parameters:  n.parameters  ?? {},
      credentials: n.credentials ?? {},
      disabled:    n.disabled    ?? false,
      notes:       n.notes,
      typeVersion: n.typeVersion,
    },
    type: 'n8nNode',
  }))

  const nameToId: Record<string, string> = {}
  rawNodes.forEach((n: any) => { nameToId[n.name] = n.id })

  const edges: Edge[] = []
  for (const [sourceName, outputs] of Object.entries(rawConns)) {
    const sourceId = nameToId[sourceName]
    if (!sourceId) continue
    for (const outputGroup of (outputs as any).main || []) {
      for (const conn of outputGroup || []) {
        const targetId = nameToId[conn.node]
        if (targetId) {
          edges.push({
            id: `${sourceId}-${targetId}`,
            source: sourceId,
            target: targetId,
            animated: true,
            style: { stroke: '#4b5563', strokeWidth: 2 },
          })
        }
      }
    }
  }

  return { nodes, edges }
}
