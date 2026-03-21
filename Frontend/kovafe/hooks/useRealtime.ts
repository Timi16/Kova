"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export function useRealtime() {
  const pathname = usePathname();
  const queryClient = useQueryClient();

  useEffect(() => {
    const postsChannel = supabase
      .channel("posts-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["feed"] });
        },
      )
      .subscribe();

    const activityChannel = supabase
      .channel("activity-feed")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity" },
        () => {
          void queryClient.invalidateQueries({ queryKey: ["activity"] });
        },
      )
      .subscribe();

    const mintsChannel = supabase
      .channel("mints-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mints" },
        (payload: any) => {
          void queryClient.invalidateQueries({ queryKey: ["collection"] });
          if (
            pathname?.startsWith("/token/") ||
            pathname?.startsWith("/post/")
          ) {
            toast.success("New mint!");
          }

          queryClient.setQueryData(["activity", "live"], (current: unknown) => {
            if (!Array.isArray(current)) {
              return [payload.new];
            }
            return [payload.new, ...current].slice(0, 25);
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(postsChannel);
      void supabase.removeChannel(activityChannel);
      void supabase.removeChannel(mintsChannel);
    };
  }, [pathname, queryClient]);
}
