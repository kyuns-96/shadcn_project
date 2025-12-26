export async function getBlock(projectName: string): Promise<string[]> {
  const response = await fetch("/api/get_block_list", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ project: projectName }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as { block_list: string[] };
  return data.block_list || [];
}
