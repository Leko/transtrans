"use client";

import {
  CheckIcon,
  ClockIcon,
  CloudDownloadIcon,
  LoaderIcon,
  XIcon,
} from "lucide-react";
import * as Tooltip from "@radix-ui/react-tooltip";
import { CircularProgress } from "./CircularProgress";
import { FeatureAvailability } from "@/hooks/api-availability";

interface WebAPIAvailabilityProps {
  availabilities: FeatureAvailability[];
  onRequestDownload: (name: FeatureAvailability["name"]) => void;
}

export const InitializingIcon = ({ size = 4 }: { size?: number }) => (
  <LoaderIcon className={`size-${size} animate-spin`} />
);
export const AvailableIcon = ({ size = 4 }: { size?: number }) => (
  <span className="text-green-500">
    <CheckIcon className={`size-${size}`} />
  </span>
);
export const UnavailableIcon = ({ size = 4 }: { size?: number }) => (
  <span className="text-red-500">
    <XIcon className={`size-${size}`} />
  </span>
);
export const DownloadableIcon = ({ size = 4 }: { size?: number }) => (
  <span className="text-yellow-500">
    <CloudDownloadIcon className={`size-${size}`} />
  </span>
);
export const DownloadingIcon = ({ size = 4 }: { size?: number }) => (
  <span className="text-gray-500">
    <ClockIcon className={`size-${size}`} />
  </span>
);

export default function WebAPIAvailability({
  availabilities,
  onRequestDownload,
}: WebAPIAvailabilityProps) {
  return (
    <Tooltip.Provider>
      <ul>
        {availabilities.map((availability) => (
          <li
            key={availability.name}
            className="flex items-center justify-between"
          >
            <div className="text-gray-400 flex items-center gap-2">
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  {availability.status === "initializing" ? (
                    <InitializingIcon />
                  ) : availability.status === "downloading" ? (
                    <DownloadingIcon />
                  ) : availability.status === "unavailable" ? (
                    <UnavailableIcon />
                  ) : availability.status === "downloadable" ? (
                    <DownloadableIcon />
                  ) : (
                    <AvailableIcon />
                  )}
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  {availability.status === "unavailable" && (
                    <Tooltip.Content
                      className="max-w-xs px-3 py-2 bg-zinc-800 text-gray-100 rounded-md shadow-lg border border-gray-700"
                      sideOffset={5}
                    >
                      {availability.error}
                      <Tooltip.Arrow className="fill-zinc-800" />
                    </Tooltip.Content>
                  )}
                </Tooltip.Portal>
              </Tooltip.Root>
              {availability.name}
            </div>
            {availability.status === "downloadable" && (
              <button
                onClick={() => onRequestDownload(availability.name)}
                className="text-xs text-gray-400 hover:text-gray-100 transition-colors px-2 py-1 rounded-md border border-gray-600 hover:border-gray-500 cursor-pointer"
              >
                Download
              </button>
            )}
            {availability.status === "downloading" && (
              <div className="flex items-center gap-1 text-xs text-gray-400">
                Downloading
                <CircularProgress
                  size={16}
                  loaded={availability.progress.loaded}
                  total={availability.progress.total}
                />
              </div>
            )}
          </li>
        ))}
      </ul>
    </Tooltip.Provider>
  );
}
