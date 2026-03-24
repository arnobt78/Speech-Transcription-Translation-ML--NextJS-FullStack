/**
 * Tabs — Composable Tab Component using Radix UI
 *
 * Built on @radix-ui/react-tabs for accessible, keyboard-navigable tabs.
 * Radix UI provides the accessibility primitives (ARIA roles, keyboard
 * navigation, focus management) while we add the styling.
 *
 * Composition pattern:
 *   <Tabs defaultValue="tab1">
 *     <TabsList>
 *       <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *       <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *     </TabsList>
 *     <TabsContent value="tab1">Content 1</TabsContent>
 *     <TabsContent value="tab2">Content 2</TabsContent>
 *   </Tabs>
 */

"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center rounded-xl bg-slate-100 p-1 shadow-inner",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-5 py-2 text-sm font-semibold transition-all duration-200",
      "text-slate-500 hover:text-slate-700",
      "data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = forwardRef<
  React.ComponentRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2",
      className,
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
