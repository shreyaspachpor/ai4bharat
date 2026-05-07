/**
 * Test endpoint to generate a sample interview for development/testing
 * Usage: GET /api/test/generate-interview?trade=electrician&language=en-IN
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trade = searchParams.get("trade") || "electrician";
    const language = searchParams.get("language") || "en-IN";
    const userId = searchParams.get("userId") || "test-user-001";

    // Call the backend API to generate interview
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";
    
    const response = await fetch(`${API_BASE}/api/interviews/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userid: userId,
        trade,
        language: language.split("-")[0], // Convert "en-IN" to "en"
        count: 4,
      }),
    });

    const data = await response.json();
    
    if (data.success && data.interviewId) {
      const frontendUrl = new URL(request.url).origin;
      const interviewLink = `${frontendUrl}/interview/${data.interviewId}`;
      
      return Response.json({
        success: true,
        interviewId: data.interviewId,
        trade,
        language,
        link: interviewLink,
        message: `Interview generated successfully. Access at: ${interviewLink}`,
      });
    } else {
      return Response.json(
        { success: false, error: data.error || "Failed to generate interview" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("[TEST API] Error:", error);
    return Response.json(
      { success: false, error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
