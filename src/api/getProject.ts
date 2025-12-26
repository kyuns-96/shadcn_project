interface ProjectResponse {
  project_list: string[]
}

export async function getProject(): Promise<ProjectResponse> {
  const response = await fetch("/api/get_project", {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}
