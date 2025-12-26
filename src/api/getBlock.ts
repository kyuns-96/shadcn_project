export async function getBlock(projectName: string): Promise<string[]> {
  try {
    // Entry Point: Log function invocation and incoming parameter
    console.log('[DEBUG] getBlock function invoked with projectName:', projectName);

    // Prepare payload
    const payload = {
      project_name: projectName,
    };
    console.log('[DEBUG] Request payload:', JSON.stringify(payload));

    // Make the POST request
    console.log('[DEBUG] Initiating POST request to /api/get_block_list');
    const response = await fetch("/api/get_block_list", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Log response metadata
    console.log('[DEBUG] Response received - Status:', response.status, 'OK:', response.ok);

    if (!response.ok) {
      console.error('[DEBUG] HTTP error detected - Status:', response.status);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Parse and log response data
    const data = (await response.json()) as { block_list: string[] };
    console.log('[DEBUG] Response data parsed:', data);
    console.log('[DEBUG] Block list extracted:', data.block_list);

    const result = data.block_list || [];
    console.log('[DEBUG] Returning final result:', result);
    return result;
  } catch (error) {
    console.error("[DEBUG] Error caught in getBlock:", {
      errorMessage: error instanceof Error ? error.message : String(error),
      errorObject: error,
      errorType: error instanceof Error ? error.constructor.name : typeof error,
    });
    throw error;
  }
}
