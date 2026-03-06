import { z } from "zod";

// Config schema
const configSchema = z.object({
  schedule: z.string(),
  apiUrl: z.string(),
  webhookUrl: z.string(),
  chainSelectorName: z.string(),
  consumerAddress: z.string(),
  gasLimit: z.string(),
});

export type Config = z.infer<typeof configSchema>;
