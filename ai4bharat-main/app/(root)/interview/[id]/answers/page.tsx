import { apiGetInterview, apiGetFeedback, apiGetCurrentUser } from "@/lib/api";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const AnswersPage = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { user } = await apiGetCurrentUser();

  const interview = await apiGetInterview(id);
  if (!interview) redirect("/");

  const feedback = await apiGetFeedback(id, user?.id!);

  const questions = interview.questions || [];
  const modelAnswers = feedback?.modelAnswers || [];
  const transcript = feedback?.transcript || [];

  // Extract answers by grouping user messages between AI (question) messages
  const extractCompleteUserAnswers = (transcript: Array<{ role: string; content: string }>, questionCount: number) => {
    const answers: string[] = [];
    let currentAnswer = "";
    let aiMessageCount = 0;

    for (let i = 0; i < transcript.length; i++) {
      const msg = transcript[i];

      if (msg.role === "assistant" || msg.role === "system") {
        // When AI responds (question or completion), save the accumulated user answer
        if (currentAnswer.trim() && aiMessageCount > 0) {
          answers.push(currentAnswer.trim());
          currentAnswer = "";
        }
        aiMessageCount++;
      } else if (msg.role === "user") {
        // Accumulate all user messages as one complete answer
        if (currentAnswer) {
          currentAnswer += " " + msg.content;
        } else {
          currentAnswer = msg.content;
        }
      }
    }

    // Don't forget the last accumulated answer
    if (currentAnswer.trim()) {
      answers.push(currentAnswer.trim());
    }

    return answers.slice(0, questionCount);
  };

  const userAnswers = extractCompleteUserAnswers(transcript, questions.length);

  return (
    <section className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Answers Review — {interview.role} Assessment</h1>
        <Link href={`/interview/${id}/feedback`}>
          <Button className="btn-primary">View Feedback</Button>
        </Link>
      </div>
      
      <div className="flex flex-col gap-8">
        {questions.map((q: string, i: number) => {
          const userAnswer = userAnswers[i] || "";
          const modelAnswer = typeof modelAnswers[i] === "string"
            ? modelAnswers[i]
            : (modelAnswers[i] as any)?.answer || "Not available";

          return (
            <div key={i} className="bg-dark-200 rounded-lg p-6 shadow border border-dark-300">
              {/* Question */}
              <p className="font-semibold text-lg mb-6 text-primary-200">Q{i + 1}: {q}</p>
              
              {/* Model Answer */}
              <div className="mb-6 pb-6 border-b border-dark-300">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">🎯</span>
                  <span className="font-bold text-green-300">Ideal Answer:</span>
                </div>
                <p className="text-gray-300 mb-4 leading-relaxed">
                  {modelAnswer}
                </p>
              </div>

              {/* Your Answer */}
              {userAnswer && (
                <div className="pb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">👤</span>
                    <span className="font-bold text-blue-300">Your Answer:</span>
                  </div>
                  <p className="text-gray-300 leading-relaxed">
                    {userAnswer}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary - Learn from these answers */}
      <div className="mt-10 p-6 bg-dark-300 rounded-lg border border-dark-400">
        <h3 className="text-lg font-bold mb-4">📚 How to Use These Answers</h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex gap-2">
            <span className="text-green-400">✓</span>
            <span><strong>Read the ideal answer</strong> carefully and understand the structure</span>
          </li>
          <li className="flex gap-2">
            <span className="text-blue-400">✓</span>
            <span><strong>Compare your spoken answer</strong> with the ideal one</span>
          </li>
          <li className="flex gap-2">
            <span className="text-yellow-400">✓</span>
            <span><strong>Practice explaining</strong> each answer in your own words with more detail and examples</span>
          </li>
        </ul>
      </div>
    </section>
  );
};

export default AnswersPage;