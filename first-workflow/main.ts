import { CronCapability, handler, Runner } from "@chainlink/cre-sdk";
import { Config } from "./utils/config";
import { writeDataOnchain } from "./controllers/onCronTrigger-Write";

const initWorkflow = (config: Config) => {
  const cron = new CronCapability();

  return [
    handler(cron.trigger({ schedule: config.schedule }), writeDataOnchain),
  ];
};

export async function main() {
  const runner = await Runner.newRunner<Config>();
  await runner.run(initWorkflow);
}
