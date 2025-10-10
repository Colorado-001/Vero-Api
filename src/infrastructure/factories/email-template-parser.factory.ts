import { Env } from "../../config/env";
import { IEmailTemplateParser } from "../../domain/ports";
import { MockEmailTemplateParser } from "../email";

export function createEmailTemplateParserService(
  config: Env
): IEmailTemplateParser {
  switch (config.EMAIL_TEMPLATE_PARSER_SERVICE) {
    case "file":
      throw new Error("Not Implemented");

    case "mock":
    default:
      return new MockEmailTemplateParser();
  }
}
