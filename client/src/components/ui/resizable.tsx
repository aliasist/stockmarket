"use client"

import * as React from "react"
import {
  Group as PanelGroup,
  Panel,
  Separator as PanelResizeHandle,
} from "react-resizable-panels"

import { cn } from "@/lib/utils"


import type { GroupProps as PanelGroupProps } from "react-resizable-panels"
import type { PanelProps } from "react-resizable-panels"
import type { SeparatorProps as PanelResizeHandleProps } from "react-resizable-panels"

type ResizableProps = PanelGroupProps;
const Resizable = (props: ResizableProps) => {
  return <PanelGroup {...props} />
}

const ResizablePanel = (props: PanelProps) => {
  return <Panel {...props} />
}

type ResizableHandleProps = PanelResizeHandleProps & {
  withHandle?: boolean
}

const ResizableHandle = ({
  className,
  withHandle = false,
  ...props
}: ResizableHandleProps) => {
  return (
    <PanelResizeHandle
      className={cn(
        "relative flex w-px items-center justify-center bg-border/50",
        className
      )}
      {...props}
    >
      {withHandle ? (
        <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border/80">
          <div className="h-3 w-[1px] bg-background" />
        </div>
      ) : null}
    </PanelResizeHandle>
  )
}

export { Resizable, ResizablePanel, ResizableHandle }
