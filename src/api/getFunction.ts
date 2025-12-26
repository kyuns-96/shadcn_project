export async function getFunction(): Promise<unknown> {
  try {
    const response = await fetch("/api/get_all_function", {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching function data:", error);
    throw error;
  }
}
