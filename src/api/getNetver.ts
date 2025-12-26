export async function getNetver(
  projectName: string,
  blockName: string
): Promise<string[]> {
  try {
    const response = await fetch("/api/get_netver_list", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project: projectName,
        block: blockName,
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as { netver_list: string[] };
    return data.netver_list || [];
  } catch (error) {
    console.error("Error fetching netver data:", error);
    throw error;
  }
}
