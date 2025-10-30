"use client";

import { useEffect, useState, useRef } from "react";
import {
  Reasoning,
  ReasoningContent,
  ReasoningTrigger,
} from "./elements/reasoning";

type MessageReasoningProps = {
  isLoading: boolean;
  reasoning: string;
};

export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  const [hasBeenStreaming, setHasBeenStreaming] = useState(isLoading);
  const [isReasoningStreaming, setIsReasoningStreaming] = useState(false);
  const previousReasoningLength = useRef(reasoning.length);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading && reasoning.length > 0) {
      setHasBeenStreaming(true);

      // Clear any existing timeout
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }

      // Check if reasoning content is actively growing
      if (reasoning.length > previousReasoningLength.current) {
        setIsReasoningStreaming(true);
        previousReasoningLength.current = reasoning.length;

        // Set a timeout to stop streaming if no new content arrives
        streamingTimeoutRef.current = setTimeout(() => {
          setIsReasoningStreaming(false);
        }, 300);
      }
    } else if (!isLoading) {
      // When loading stops, reasoning is definitely done
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
      setIsReasoningStreaming(false);
    }

    return () => {
      if (streamingTimeoutRef.current) {
        clearTimeout(streamingTimeoutRef.current);
      }
    };
  }, [isLoading, reasoning.length]);

  return (
    <Reasoning
      data-testid="message-reasoning"
      defaultOpen={hasBeenStreaming}
      isStreaming={isReasoningStreaming}
    >
      <ReasoningTrigger />
      <ReasoningContent>{reasoning}</ReasoningContent>
    </Reasoning>
  );
}
