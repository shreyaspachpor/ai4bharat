interface UserAvatarProps {
  name: string;
  size?: "small" | "medium" | "large";
}

export function UserAvatar({ name, size = "large" }: UserAvatarProps) {
  // Extract initials from name
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Generate consistent color based on initials
  const getColorFromName = (text: string): string => {
    const colors = [
      "from-blue-500 to-purple-600",
      "from-pink-500 to-rose-600",
      "from-green-500 to-emerald-600",
      "from-yellow-500 to-orange-600",
      "from-indigo-500 to-violet-600",
      "from-cyan-500 to-blue-600",
      "from-teal-500 to-green-600",
      "from-fuchsia-500 to-pink-600",
    ];

    const charCode = text.charCodeAt(0) || 0;
    return colors[charCode % colors.length];
  };

  const sizeClasses = {
    small: "w-12 h-12 text-sm",
    medium: "w-20 h-20 text-lg",
    large: "w-[120px] h-[120px] text-4xl",
  };

  const colorGradient = getColorFromName(name);

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full
        flex items-center justify-center
        font-bold text-white
        bg-gradient-to-br ${colorGradient}
        shadow-lg
      `}
    >
      {initials}
    </div>
  );
}
