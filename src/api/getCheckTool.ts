export interface CheckToolParams {
  project: string;
  block: string;
  netver: string;
  revision: string;
  eco_num: string;
}

export async function getCheckTool(params: CheckToolParams): Promise<string> {
  try {
    console.log("[DEBUG] getCheckTool function invoked with params:", params);

    const payload = {
      project: params.project,
      block: params.block,
      netver: params.netver,
      revision: params.revision,
      eco_num: params.eco_num,
    };
    console.log("[DEBUG] Request payload:", JSON.stringify(payload));

    console.log("[DEBUG] Initiating POST request to /api/get_check_tool");
    const response = await fetch("/api/get_check_tool", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(
      "[DEBUG] Response received - Status:",
      response.status,
      "OK:",
      response.ok
    );

    if (!response.ok) {
      console.error("[DEBUG] HTTP error detected - Status:", response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as {
      check_tool_data: { html: { html_data: string } };
    };
    console.log("[DEBUG] Response data parsed");

    const result = data.check_tool_data?.html?.html_data || "";
    console.log("[DEBUG] Returning HTML result");
    return result;
  } catch (error) {
    console.error("[DEBUG] Error caught in getCheckTool:", {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorObject: error,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    throw error;
  }
}
