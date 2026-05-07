import { cn } from "@/lib/utils";

interface DisplayTechIconsProps {
  techStack: string[];
}

const DisplayTechIcons = ({ techStack }: DisplayTechIconsProps) => {
  return (
    <div className="flex flex-row flex-wrap gap-1.5">
      {techStack.slice(0, 4).map((skill: string) => (
        <span
          key={skill}
          className={cn(
            "bg-dark-300 text-light-100 rounded-full px-3 py-1 text-xs font-medium border border-primary-200/20"
          )}
        >
          {skill}
        </span>
      ))}
    </div>
  );
};

export default DisplayTechIcons;
