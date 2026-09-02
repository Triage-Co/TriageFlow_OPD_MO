
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
  for (const groupSteps of orderGroups.values()) {
    groupSteps.sort((a, b) => getCreatedTime(a) - getCreatedTime(b));
  }

  const sorted: any[] = [];
  const sortedIds = new Set<string>();
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
      continue;
    }

    sorted.push(current);
    if (currentId) {
      sortedIds.add(currentId);
    }

    processNeighbors(current, queue);

    if (isPaymentStep(current) && current.service_order_id) {
      const siblings = orderGroups.get(current.service_order_id) || [];
      const testSiblings = siblings.filter((s) => !isPaymentStep(s));

      for (const sibling of testSiblings) {
        const siblingId = sibling.step_id || sibling.id;
        if (siblingId && !sortedIds.has(siblingId)) {
          sorted.push(sibling);
          sortedIds.add(siblingId);
          processNeighbors(sibling, queue);
        }
      }
    }

    sortQueue(queue);
  }

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

export interface StepVisualInfo {
  icon: "flask-outline" | "eye-outline" | "medkit-outline";
  color: string;
  label: string;
}

export function getStepVisualInfo(stepType?: string, primaryColor = "#5B9BD5"): StepVisualInfo {
  switch (stepType) {
    case "LAB_TEST":
      return {
        icon: "flask-outline",
        color: "#6366F1",
        label: "Xét nghiệm",
      };
    case "IMAGING":
      return {
        icon: "eye-outline",
        color: "#0EA5E9",
        label: "Chẩn đoán hình ảnh",
      };
    case "CLINICAL":
    default:
      return {
        icon: "medkit-outline",
        color: primaryColor,
        label: "Khám lâm sàng",
      };
  }
}
