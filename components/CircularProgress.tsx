import { FC } from "react";

type Props = {
  size: number;
  width?: number;
  loaded: number;
  total: number;
};

export const CircularProgress: FC<Props> = ({
  size,
  loaded,
  total,
  width = 2,
}) => {
  const ratio = loaded / total;
  const radius = size / 2 - width;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - ratio * circumference;
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)", width: size, height: size }} // そのままだと3時の方向が起点になってしまうので-90°回転させる
    >
      <circle
        r={radius}
        cx={size / 2}
        cy={size / 2}
        stroke="var(--color-gray-700)"
        strokeWidth={width}
        fill="transparent"
        strokeLinecap="round"
      />
      <circle
        r={radius}
        cx={size / 2}
        cy={size / 2}
        stroke="var(--color-gray-400)"
        strokeWidth={width}
        fill="transparent"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
      />
    </svg>
  );
};
