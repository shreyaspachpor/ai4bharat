import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";

import { Button } from "./ui/button";
import DisplayTechIcons from "./DisplayTechIcons";
import DeleteInterviewButton from "./DeleteInterviewButton";

import { cn, getRoleIcon } from "@/lib/utils";
import { apiGetFeedback } from "@/lib/api";

interface InterviewCardComponentProps {
  interviewId?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
}

const InterviewCard = async ({
  interviewId,
  userId,
  role,
  type,
  techstack,
  createdAt,
}: InterviewCardComponentProps) => {
  const feedback =
    userId && interviewId
      ? await apiGetFeedback(interviewId, userId)
      : null;

  const formattedDate = dayjs(
    feedback?.createdAt || createdAt || Date.now()
  ).format("MMM D, YYYY");

  return (
    <div className="card-border w-[360px] max-sm:w-full min-h-96">
      <div className="card-interview">
        <div>
          {/* Type Badge */}
          <div
            className={cn(
              "absolute top-0 right-0 w-fit px-4 py-2 rounded-bl-lg",
              "bg-emerald-600"
            )}
          >
            <p className="badge-text">Skill Assessment</p>
          </div>

          {/* Role-Based Icon */}
          <div className="rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 w-[90px] h-[90px] flex items-center justify-center text-6xl">
            {getRoleIcon(role)}
          </div>

          {/* Interview Role */}
          <h3 className="mt-5 capitalize">{role} Assessment</h3>

          {/* Date & Fitment */}
          <div className="flex flex-row gap-5 mt-3">
            <div className="flex flex-row gap-2">
              <Image
                src="/calendar.svg"
                width={22}
                height={22}
                alt="calendar"
              />
              <p>{formattedDate}</p>
            </div>

            <div className="flex flex-row gap-2 items-center">
              <Image src="/star.svg" width={22} height={22} alt="star" />
              <p>{feedback?.fitmentLabel || "---"}</p>
            </div>
          </div>

          {/* Feedback or Placeholder Text */}
          <p className="line-clamp-2 mt-5">
            {feedback?.summary ||
              "Start this assessment to evaluate job readiness in a voice-first, multilingual format."}
          </p>
        </div>

        <div className="flex flex-row justify-between items-center">
          {techstack && techstack.length > 0 ? <DisplayTechIcons techStack={techstack} /> : <div />}

          <div className="flex flex-col gap-2 items-end">
            <Button className="btn-primary">
              <Link
                href={
                  feedback
                    ? `/interview/${interviewId}/feedback`
                    : `/interview/${interviewId}`
                }
              >
                {feedback ? "View Result" : "Start"}
              </Link>
            </Button>
            
            {/* Only show delete button for interviews created by the user */}
            {userId && interviewId && (
              <DeleteInterviewButton
                interviewId={interviewId}
                userId={userId}
                interviewTitle={role}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewCard;
