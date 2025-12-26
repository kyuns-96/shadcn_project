export interface DatasetParams {
  project: string;
  block: string;
  netver: string;
  revision: string;
  econum: string;
  func: string;
}

export async function getDataset(
  params: DatasetParams
): Promise<Record<string, any>> {
  try {
    console.log(`${params.func}`);
    const response = await fetch(`${params.func}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project: params.project,
        block: params.block,
        netver: params.netver,
        revision: params.revision,
        econum: params.econum,
      }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as Record<string, any>;
    return data;
  } catch (error) {
    console.error("Error fetching dataset:", error);
    throw error;
  }
}
