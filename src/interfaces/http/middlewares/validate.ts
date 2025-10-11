import * as z from "zod";
import { ValidationError } from "../../../utils/errors";

export function validateRequest(schema: z.ZodType, payload: any) {
  const { error, data } = z.safeParse(schema, payload);

  if (error) {
    const combinedMessage = z.treeifyError(error);
    throw new ValidationError("Invalid request input", combinedMessage.errors);
  }

  return data as z.infer<typeof schema>;
}
