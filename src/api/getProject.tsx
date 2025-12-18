export async function getProject(): Promise<any> {
  try {
    const response = await fetch("/api/get_project", {
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
    console.error("Error fetching project data:", error);
    throw error;
  }
}
