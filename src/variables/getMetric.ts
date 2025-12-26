export const getMetric = (
  label: string,
  dataset: Record<string, Record<string, unknown>> = {}
): unknown => {
  const metricMap: Record<string, () => unknown> = {
    /* example -- "Group!Header": () => dataset["group"]?.headerMetric, */
    "User!Count": () => dataset["user"]?.count,
    "Sales!Total": () => dataset["sales"]?.total,
  };

  const getter = metricMap[label];
  return getter ? getter() : undefined;
};
