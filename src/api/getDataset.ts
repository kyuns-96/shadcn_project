export async function getDataset(
  project: string,
  block: string,
  netver: string,
  revision: string,
  econum: string,
  func: string
): Promise<unknown> {
  const response = await fetch(func, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ project, block, netver, revision, econum }),
  });

  if (!response.ok) {
    throw new Error(`Error fetching dataset: ${response.statusText}`);
  }

  return response.json();
}
