/**
 * Sorts flow steps topologically based on their `depends_on` field.
 * A step will be positioned after the steps it depends on.
 */
export const sortStepsTopologically = (steps: any[]): any[] => {
  const sorted: any[] = [];
  const visited = new Set<string>();
  const temp = new Set<string>();

  const getStatusWeight = (status: string): number => {
    const s = (status || '').toUpperCase().trim();
    if (s === 'COMPLETED') return 0;
    if (s === 'IN_PROGRESS' || s === 'WAITING') return 1;
    return 2; // PENDING or others
  };

  const preSortedSteps = [...steps].sort((a, b) => {
    return getStatusWeight(a.step_status) - getStatusWeight(b.step_status);
  });

  const visit = (step: any) => {
    const stepId = step.step_id || step.id;
    if (!stepId) {
      if (!sorted.includes(step)) sorted.push(step);
      return;
    }
    if (visited.has(stepId)) return;
    if (temp.has(stepId)) return;

    temp.add(stepId);

    const deps = step.depends_on || [];
    for (const depId of deps) {
      const depStep = preSortedSteps.find((s) => (s.step_id || s.id) === depId);
      if (depStep) {
        visit(depStep);
      }
    }

    temp.delete(stepId);
    visited.add(stepId);
    sorted.push(step);
  };

  for (const step of preSortedSteps) {
    visit(step);
  }
  return sorted;
};
