export async function getMethodList(): Promise<string[]> {
  try {
    const response = await fetch("/api/get_method_list", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = (await response.json()) as { method_list: string[] };
    return data.method_list || [];
  } catch (error) {
    console.error("Error fetching method list:", error);
    throw error;
  }
}
