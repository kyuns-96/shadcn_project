export async function getRevision(
  projectName: string,
  blockName: string,
  netverName: string
): Promise<string[]> {
  try {
    const response = await fetch("/api/get_revision_list", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project: projectName,
        block: blockName,
        netver: netverName,
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as { revision_list: string[] };
    return data.revision_list || [];
  } catch (error) {
    console.error("Error fetching revision data:", error);
    throw error;
  }
}
