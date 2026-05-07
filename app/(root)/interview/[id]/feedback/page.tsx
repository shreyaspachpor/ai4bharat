import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  apiGetFeedback,
  apiGetInterview,
  apiGetCurrentUser,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import DownloadFeedbackPDFButton from "@/components/DownloadFeedbackPDFButton";
import { FeedbackTabs } from "@/components/FeedbackTabs";

export const dynamic = "force-dynamic";


const Feedback = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  const { user } = await apiGetCurrentUser();

  const interview = await apiGetInterview(id);
  if (!interview) redirect("/");

  const feedback = await apiGetFeedback(id, user?.id!);

  // Handle case where feedback hasn't been generated yet
  if (!feedback) {
    return (
      <section className="section-feedback" id="feedback-section">
        <div className="flex flex-col items-center justify-center min-h-[500px] gap-6">
          <div className="text-center">
            <h1 className="text-4xl font-semibold mb-4">Assessment Pending</h1>
            <p className="text-gray-400 text-lg mb-6">
              Your skill assessment result is being generated. Please check back shortly.
            </p>
          </div>
          <Link href="/">
            <Button className="btn-primary">Back to Dashboard</Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section-feedback" id="feedback-section">
      <div className="flex flex-row justify-between items-center mb-6">
        <h1 className="text-4xl font-semibold">
          Skill Assessment Result —{" "}
          <span className="capitalize">{interview.role}</span>
        </h1>
        <Link href={`/interview/${id}/answers`}>
          <Button className="btn-primary">View Answers</Button>
        </Link>
      </div>

      <div className="flex flex-row justify-center ">
        <div className="flex flex-row gap-5">
          {/* Fitment */}
          <div className="flex flex-row gap-2 items-center">
            <Image src="/star.svg" width={22} height={22} alt="star" />
            <p>
              Fitment:{" "}
              <span className="text-primary-200 font-bold">
                {feedback?.fitmentLabel || "N/A"}
              </span>
            </p>
          </div>

          {/* Date */}
          <div className="flex flex-row gap-2">
            <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
            <p>
              {feedback?.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <hr />

      {/* Tabs with Feedback, Speaking Quality, and Transcript */}
      <FeedbackTabs
        feedback={feedback}
        interviewId={id}
        interview={{
          role: interview.role,
          questions: interview.questions,
        }}
      />

      <div className="buttons flex gap-3 mt-8">
        <Button className="btn-secondary flex-1">
          <Link href="/" className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">
              Back to dashboard
            </p>
          </Link>
        </Button>

        <Button className="btn-primary flex-1">
          <Link
            href={`/interview/${id}`}
            className="flex w-full justify-center"
          >
            <p className="text-sm font-semibold text-black text-center">
              Retake Assessment
            </p>
          </Link>
        </Button>

        {/* Answers Button */}
        <Button className="btn-primary flex-1">
          <Link
            href={`/interview/${id}/answers`}
            className="flex w-full justify-center"
          >
            <p className="text-sm font-semibold text-black text-center">
              Answers
            </p>
          </Link>
        </Button>
        <DownloadFeedbackPDFButton />
      </div>
    </section>
  );
};

export default Feedback;
