import * as z from "zod";
import { AUTOFLOW_FREQUENCY } from "../../../utils/constants";

export const createTimeBasedSchema = z.object({
  frequency: z.enum(AUTOFLOW_FREQUENCY),
  dayOfMonth: z.number().min(1).max(31),
  amountToSave: z.number().positive(),
  tokenToSave: z.string(),
  name: z.string(),
});
