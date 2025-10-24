import type { MarkAsSeenRequest, MarkAsSeenResponse } from "@shared/types";
import { useMutation } from "@tanstack/react-query";
import { fetcher } from "itty-fetcher";
import { toast } from "react-hot-toast";

const api = fetcher({ base: "/api" });

// mutation to mark as seen
export const useMarkAsSeenMutation = () => {
  return useMutation({
    mutationFn: (request: MarkAsSeenRequest) =>
      api.post<MarkAsSeenResponse>("/itunes/mark-as-seen", request),
    onSuccess: (data) => {
      if (data.success) {
        toast.success("Episode marked as seen");
      } else {
        throw new Error(data.error ?? "Failed to mark episode as seen");
      }
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Failed to mark episode as seen");
    },
  });
};
