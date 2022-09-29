import { Response } from "./responseType";
import * as form from "./form";
import Handlebars from "handlebars";
import baseTemplate from "../templates/base.html";

export function renderHTML(req: form.Request, res: Response): string {

    var template = Handlebars.compile(baseTemplate);
    var placeholders = { 
      "greetings": `Hi ${req.id}`,
      "approval": `Success.`,
      "heading": `emailLiterals`,
      "body": `body`,
      "footer": `footer`
    };

    return template(placeholders);
}
