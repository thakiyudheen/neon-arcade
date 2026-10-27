"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface SheetContextValue {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const SheetContext = React.createContext<SheetContextValue>({ open: false, setOpen: () => {} });

export function Sheet({ open: openProp, onOpenChange, children }: { open?: boolean; onOpenChange?: (v: boolean) => void; children: React.ReactNode }) {
  const [internal, setInternal] = React.useState(false);
  const open = openProp !== undefined ? openProp : internal;
  const setOpen = (v: boolean) => {
    if (onOpenChange) onOpenChange(v);
    else setInternal(v);
  };
  React.useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);
  return <SheetContext.Provider value={{ open, setOpen }}>{children}</SheetContext.Provider>;
}

export function SheetTrigger({ asChild, children, onClick }: { asChild?: boolean; children: React.ReactNode; onClick?: () => void }) {
  const ctx = React.useContext(SheetContext);
  const handle = (e: any) => {
    onClick?.();
    ctx.setOpen(true);
  };
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, { onClick: (e: any) => { (children as any).props?.onClick?.(e); handle(e); } });
  }
  return <button onClick={handle}>{children}</button>;
}

export function SheetContent({ children, className, side = "bottom" }: { children: React.ReactNode; className?: string; side?: "bottom" | "right" }) {
  const ctx = React.useContext(SheetContext);
  if (!ctx.open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/60" onClick={() => ctx.setOpen(false)} />
      <div
        className={cn(
          "absolute bg-night-900 border border-white/10 shadow-2xl",
          side === "bottom" ? "inset-x-0 bottom-0 rounded-t-2xl max-h-[90vh] overflow-auto" : "inset-y-0 right-0 w-full max-w-sm overflow-auto",
          className
        )}
      >
        <div className="flex items-center justify-between p-3 border-b border-white/5">
          <div className="h-1 w-10 rounded-full bg-white/20 mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
          <button onClick={() => ctx.setOpen(false)} className="ml-auto p-1 rounded-md hover:bg-white/5"><X className="h-4 w-4" /></button>
        </div>
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
}

export function SheetHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-2">{children}</div>;
}
export function SheetTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-base font-medium">{children}</div>;
}
export function SheetDescription({ children }: { children: React.ReactNode }) {
  return <div className="text-xs text-slate-400">{children}</div>;
}
