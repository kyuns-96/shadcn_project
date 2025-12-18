export const getMetric = (
  label: string,
  dataset: Record<string, any> = {}
): any => {
  const metricMap: Record<string, () => any> = {
    /* example -- "Group!Header": () => dataset["group"]?.headerMetric, */
    "User!Count": () => dataset["user"]?.count,
    "Sales!Total": () => dataset["sales"]?.total,
  };

  const getter = metricMap[label];
  return getter ? getter() : undefined;
};
