import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().min(1),
  size: z.coerce.number().min(1),
});
