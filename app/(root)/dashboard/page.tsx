import { redirect } from "next/navigation";
import { apiGetCurrentUser, apiGetCompletedInterviews, apiGetAllFeedbackForUser } from "@/lib/api";
import UserDashboardClient from "./UserDashboardClient";

export default async function DashboardPage() {
  const { user } = await apiGetCurrentUser();
  if (!user?.id) redirect("/sign-in");

  const completedInterviews = await apiGetCompletedInterviews(user.id) || [];

  // Fetch all feedback for the user in a single query
  const allFeedback = await apiGetAllFeedbackForUser(user.id) || [];
  const feedbackMap = new Map(allFeedback.map(f => [f.interviewId, f]));

  // Map feedback to completed interviews synchronously
  const feedbackData = completedInterviews.map((inv) => {
    const interview = inv as any;
    const feedback = feedbackMap.get(interview.id);
    
    return {
      interviewId: interview.id as string,
      role: interview.role as string,
      createdAt: interview.createdAt as string,
      feedback: feedback ? {
        relevance: feedback.relevance as number,
        clarity: feedback.clarity as number,
        skillConfidence: feedback.skillConfidence as number,
        fitmentLabel: feedback.fitmentLabel as string,
        summary: feedback.summary as string,
        createdAt: feedback.createdAt as string,
      } : null,
    };
  });

  return (
    <UserDashboardClient
      userName={user.name}
      assessments={feedbackData as any}
    />
  );
}
