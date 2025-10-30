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

  useEffect(() => {
    if (isLoading) {
      setHasBeenStreaming(true);
      // Check if reasoning content is actively growing
      if (reasoning.length > previousReasoningLength.current) {
        setIsReasoningStreaming(true);
        previousReasoningLength.current = reasoning.length;
      }
    } else {
      // When loading stops, reasoning is done
      setIsReasoningStreaming(false);
    }
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
