export async function getDataset(
  project: string = "ASDF",
  block: string = "GGGGG",
  netver: string = "ZXCV",
  revision: string = "LLLL",
  econum: string = "KKKKK",
  func: string = "/api/example"
): Promise<any> {
  try {
    console.log(`${func}`);
    const response = await fetch(`${func}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project,
        block,
        netver,
        revision,
        econum,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error fetching dataset: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("getDataset error:", error);
    throw error;
  }
}
