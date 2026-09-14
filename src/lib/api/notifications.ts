"use server";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireAuth } from "../auth.server";

export const getNotificationsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { session } = await requireAuth();

  const { userService } = await import("@/services/user.service");
  const notifs = await userService.getNotificationsByUserId(session.user.id);

  return notifs.map((n: any) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    read_at: n.read_at ? new Date(n.read_at).toISOString() : null,
    created_at: n.created_at ? new Date(n.created_at).toISOString() : null,
  }));
});

export const markNotificationsReadFn = createServerFn({ method: "POST" })
  .validator((data) => z.array(z.string()).parse(data))
  .handler(async ({ data }) => {
    await requireAuth();
    const now = new Date();

    const { userService } = await import("@/services/user.service");
    for (const id of data) {
      await userService.updateNotification(id, { read_at: now });
    }

    return { success: true };
  });
