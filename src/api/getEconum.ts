export async function getEconum(
  projectName: string,
  blockName: string,
  netverName: string,
  revisionName: string
): Promise<string[]> {
  try {
    const response = await fetch("/api/get_econum", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project_name: projectName,
        block_name: blockName,
        netver_name: netverName,
        revision_name: revisionName,
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as { econum_list: string[] };
    return data.econum_list || [];
  } catch (error) {
    console.error("Error fetching econum data:", error);
    throw error;
  }
}
