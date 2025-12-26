export interface DatasetParams {
  project: string;
  block: string;
  netver: string;
  revision: string;
  econum: string;
}

export async function getDataset(
  params: DatasetParams
): Promise<Record<string, any>> {
  try {
    const response = await fetch("/api/get_dataset", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(params),
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
