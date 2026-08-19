
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

  // Build the adjacency list and in-degree map
  const inDegree = new Map<string, number>();
  const graph = new Map<string, string[]>();

  for (const step of steps) {
    const id = step.step_id || step.id;
    if (id) {
      inDegree.set(id, 0);
      graph.set(id, []);
    }
  }

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

  // Group steps by service_order_id
  const orderGroups = new Map<string, any[]>();
  for (const step of steps) {
    const serviceOrderId = step.service_order_id;
    if (serviceOrderId) {
      if (!orderGroups.has(serviceOrderId)) {
        orderGroups.set(serviceOrderId, []);
      }
      orderGroups.get(serviceOrderId)!.push(step);
    }
  }

  // Sort steps inside each service order group by created_at time
  for (const [key, groupSteps] of orderGroups.entries()) {
    groupSteps.sort((a, b) => getCreatedTime(a) - getCreatedTime(b));
  }

  const sorted: any[] = [];
  const sortedIds = new Set<string>();

  // Helper to process a step, decrementing neighbors' inDegrees
  const processNeighbors = (step: any, q: any[]) => {
    const id = step.step_id || step.id;
    if (!id) return;
    const neighbors = graph.get(id) || [];
    for (const neighborId of neighbors) {
      const currentDeg = inDegree.get(neighborId);
      if (currentDeg !== undefined) {
        const newDeg = currentDeg - 1;
        inDegree.set(neighborId, newDeg);
        if (newDeg === 0) {
          const neighborStep = steps.find((s) => (s.step_id || s.id) === neighborId);
          if (neighborStep) {
            q.push(neighborStep);
          }
        }
      }
    }
  };

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

  // Find start nodes
  const startNodes = steps.filter((step) => {
    const id = step.step_id || step.id;
    return !id || inDegree.get(id) === 0;
  });

  const queue = [...startNodes];
  sortQueue(queue);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const currentId = current.step_id || current.id;

    if (currentId && sortedIds.has(currentId)) {
      continue; // Already processed as part of a service order group
    }

    sorted.push(current);
    if (currentId) {
      sortedIds.add(currentId);
    }

    // Process neighbors of the current step
    processNeighbors(current, queue);

    // Grouping logic: If this is a Payment step belonging to a service order,
    // pull all its sibling test steps and output them immediately.
    if (isPaymentStep(current) && current.service_order_id) {
      const siblings = orderGroups.get(current.service_order_id) || [];
      const testSiblings = siblings.filter((s) => !isPaymentStep(s));

      for (const sibling of testSiblings) {
        const siblingId = sibling.step_id || sibling.id;
        if (siblingId && !sortedIds.has(siblingId)) {
          sorted.push(sibling);
          sortedIds.add(siblingId);
          // Process neighbors of the sibling as well
          processNeighbors(sibling, queue);
        }
      }
    }

    sortQueue(queue);
  }

  // Fallback for any step not processed
  for (const step of steps) {
    const id = step.step_id || step.id;
    if (id && !sortedIds.has(id)) {
      sorted.push(step);
      sortedIds.add(id);
    } else if (!id && !sorted.includes(step)) {
      sorted.push(step);
    }
  }

  return sorted;
};
