
export const sortStepsTopologically = (steps: any[]): any[] => {
  if (!Array.isArray(steps) || steps.length === 0) return [];

  const isPaymentStep = (step: any): boolean => {
    const name = (step.step_name || '').toLowerCase();
    const isPayName = name.includes('thanh toán') || name.includes('thanh toan');
    const isPayType = (step.step_type || '').toUpperCase() === 'PAYMENT';
    const isPendingPay = step.payment_status === 'PENDING';
    return isPayName || isPayType || isPendingPay;
  };

  const getCreatedTime = (step: any): number => {
    const dateStr = step.created_at || step.create_at || step.updated_at;
    if (!dateStr) return 0;
    return new Date(dateStr).getTime();
  };

  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();

  for (const step of steps) {
    const id = step.step_id || step.id;
    if (id) {
      inDegree.set(id, 0);
      graph.set(id, []);
    }
  }

  // Build the dependency graph
  for (const step of steps) {
    const id = step.step_id || step.id;
    if (!id) continue;

    const deps = step.depends_on || [];
    for (const depId of deps) {
      if (inDegree.has(depId)) {
        graph.get(depId)!.push(id);
        inDegree.set(id, inDegree.get(id)! + 1);
      }
    }
  }

  const sortQueue = (arr: any[]) => {
    return arr.sort((a, b) => {

      const payA = isPaymentStep(a) ? 1 : 0;
      const payB = isPaymentStep(b) ? 1 : 0;
      if (payA !== payB) return payB - payA;

      const tA = getCreatedTime(a);
      const tB = getCreatedTime(b);
      if (tA !== tB) return tA - tB;
      return 0;
    });
  };

  const startNodes = steps.filter((step) => {
    const id = step.step_id || step.id;
    return !id || inDegree.get(id) === 0;
  });

  const queue = [...startNodes];
  sortQueue(queue);

  const sorted: any[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    sorted.push(current);

    const currentId = current.step_id || current.id;
    if (!currentId) continue;

    const neighbors = graph.get(currentId) || [];
    for (const neighborId of neighbors) {
      const currentDeg = inDegree.get(neighborId);
      if (currentDeg !== undefined) {
        const newDeg = currentDeg - 1;
        inDegree.set(neighborId, newDeg);
        if (newDeg === 0) {
          const neighborStep = steps.find((s) => (s.step_id || s.id) === neighborId);
          if (neighborStep) {
            queue.push(neighborStep);
          }
        }
      }
    }
    sortQueue(queue);
  }

  for (const step of steps) {
    if (!sorted.includes(step)) {
      sorted.push(step);
    }
  }

  return sorted;
};
