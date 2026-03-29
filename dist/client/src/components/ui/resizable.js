"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Group as PanelGroup, Panel, Separator as PanelResizeHandle, } from "react-resizable-panels";
import { cn } from "@/lib/utils";
const Resizable = (props) => {
    return _jsx(PanelGroup, { ...props });
};
const ResizablePanel = (props) => {
    return _jsx(Panel, { ...props });
};
const ResizableHandle = ({ className, withHandle = false, ...props }) => {
    return (_jsx(PanelResizeHandle, { className: cn("relative flex w-px items-center justify-center bg-border/50", className), ...props, children: withHandle ? (_jsx("div", { className: "z-10 flex h-4 w-3 items-center justify-center rounded-sm border bg-border/80", children: _jsx("div", { className: "h-3 w-[1px] bg-background" }) })) : null }));
};
export { Resizable, ResizablePanel, ResizableHandle };
