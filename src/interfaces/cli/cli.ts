#!/usr/bin/env node
import { Command } from "commander";
import { listQueuedTasksCommand } from "./commands";

const program = new Command("vero-cli");

program.addCommand(listQueuedTasksCommand);

program.parse(process.argv);
