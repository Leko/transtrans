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
  <span data-testid="status-initializing">
    <LoaderIcon className={`size-${size} animate-spin`} />
  </span>
);
export const AvailableIcon = ({ size = 4 }: { size?: number }) => (
  <span className="text-green-500" data-testid="status-available">
    <CheckIcon className={`size-${size}`} />
  </span>
);
export const UnavailableIcon = ({ size = 4 }: { size?: number }) => (
  <span className="text-red-500" data-testid="status-unavailable">
    <XIcon className={`size-${size}`} />
  </span>
);
export const DownloadableIcon = ({ size = 4 }: { size?: number }) => (
  <span className="text-yellow-500" data-testid="status-downloadable">
    <CloudDownloadIcon className={`size-${size}`} />
  </span>
);
export const DownloadingIcon = ({ size = 4 }: { size?: number }) => (
  <span className="text-gray-500" data-testid="status-downloading">
    <ClockIcon className={`size-${size}`} />
  </span>
);

function StatusIcon({ availability }: { availability: FeatureAvailability }) {
  const icon =
    availability.status === "initializing" ? (
      <InitializingIcon />
    ) : availability.status === "downloading" ? (
      <DownloadingIcon />
    ) : availability.status === "unavailable" ? (
      <UnavailableIcon />
    ) : availability.status === "downloadable" ? (
      <DownloadableIcon />
    ) : (
      <AvailableIcon />
    );

  if (availability.status === "unavailable" && availability.error) {
    return (
      <Tooltip.Root delayDuration={0}>
        <Tooltip.Trigger asChild>
          <button type="button" className="cursor-help">
            {icon}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="max-w-xs px-3 py-2 bg-zinc-800 text-gray-100 rounded-md shadow-lg border border-gray-700 z-50"
            sideOffset={5}
          >
            {availability.error}
            <Tooltip.Arrow className="fill-zinc-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    );
  }

  return icon;
}

function AvailabilityList({
  availabilities,
  onRequestDownload,
}: {
  availabilities: FeatureAvailability[];
  onRequestDownload: (name: FeatureAvailability["name"]) => void;
}) {
  return (
    <ul data-testid="api-availability-list">
      {availabilities.map((availability) => (
        <li
          key={availability.name}
          className="flex items-center justify-between"
          data-testid={`api-status-${availability.name}`}
        >
          <div className="text-gray-400 flex items-center gap-2">
            <StatusIcon availability={availability} />
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
  );
}

export default function WebAPIAvailability({
  availabilities,
  onRequestDownload,
}: WebAPIAvailabilityProps) {
  const required = availabilities.filter((a) => a.required);
  const optional = availabilities.filter((a) => !a.required);

  return (
    <Tooltip.Provider>
      <div className="flex flex-col gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-1">Required</h3>
          <AvailabilityList
            availabilities={required}
            onRequestDownload={onRequestDownload}
          />
        </div>
        {optional.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-300 mb-1">
              Optional (Language-specific)
            </h3>
            <AvailabilityList
              availabilities={optional}
              onRequestDownload={onRequestDownload}
            />
          </div>
        )}
      </div>
    </Tooltip.Provider>
  );
}
