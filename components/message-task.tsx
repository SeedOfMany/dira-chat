"use client";

import { FileTextIcon } from "lucide-react";
import { useEffect, useState } from "react";
import type { TaskProgress } from "@/lib/types";
import {
  Task,
  TaskContent,
  TaskItem,
  TaskItemFile,
  TaskTrigger,
} from "./elements/task";

interface MessageTaskProps {
  taskProgress: TaskProgress;
  isLoading?: boolean;
}

export function MessageTask({ taskProgress, isLoading }: MessageTaskProps) {
  const [isOpen, setIsOpen] = useState(true);

  // Auto-collapse when task is completed and not loading
  useEffect(() => {
    if (taskProgress.status === "completed" && !isLoading) {
      // Keep open briefly so user sees completion, then auto-collapse
      const timer = setTimeout(() => {
        setIsOpen(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [taskProgress.status, isLoading]);

  // Keep open while running
  useEffect(() => {
    if (taskProgress.status === "running" || isLoading) {
      setIsOpen(true);
    }
  }, [taskProgress.status, isLoading]);

  return (
    <Task open={isOpen} onOpenChange={setIsOpen}>
      <TaskTrigger title={taskProgress.title} />
      <TaskContent>
        {taskProgress.items.map((item, index) => (
          <TaskItem key={`${taskProgress.taskId}-${index}`}>
            {item.file ? (
              <span className="inline-flex items-center gap-1">
                {item.text}
                <TaskItemFile>
                  <FileTextIcon className="size-4" />
                  <span>{item.file.name}</span>
                </TaskItemFile>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1">
                {item.status === "running" && (
                  <span className="animate-pulse">⋯</span>
                )}
                {item.text}
              </span>
            )}
          </TaskItem>
        ))}
      </TaskContent>
    </Task>
  );
}
