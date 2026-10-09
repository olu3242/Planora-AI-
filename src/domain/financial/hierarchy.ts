export type HierarchyMember = { id: string; parentId: string | null };

export function assertValidHierarchy(members: HierarchyMember[]) {
  const byId = new Map(members.map((member) => [member.id, member]));
  for (const member of members) {
    const seen = new Set([member.id]); let parentId = member.parentId;
    while (parentId) {
      if (!byId.has(parentId)) throw new Error(`Missing hierarchy parent: ${parentId}`);
      if (seen.has(parentId)) throw new Error(`Hierarchy cycle detected at ${parentId}`);
      seen.add(parentId); parentId = byId.get(parentId)!.parentId;
    }
  }
}
