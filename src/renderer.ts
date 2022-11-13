import { Response } from "./responseType";
import literal from "../literals/literalTypes";
import * as form from "./form";
import Handlebars from "handlebars";
import baseTemplate from "../templates/base.html";

type updateSummaryRender = {
  spendLiteral: string;
  usageLiteral: Array<{
    assignment: string;
    comments: string;
  }>;
  remainingLiteral: string;
};

export function getEmailSubject(reqAct: string, res: Response): string {
  if (reqAct === "summary") return literal.summary.subject();
  return literal.default.subject(
    reqAct,
    res.assignment,
    res.success,
    res.state.new?.deadline
  );
}

export function renderHTML(req: form.Request, res: Response): string {
  var template = Handlebars.compile(baseTemplate);

  const spendLiteral =
    res.updateSummary.usage.length > 0
      ? `You have applied these late day(s):`
      : `You have not spent any late day`;
  var summary = {
    spendLiteral: spendLiteral,
    remainingLiteral: `Remaining late day(s): ${res.updateSummary.remainingDays}`,
  } as updateSummaryRender;
  summary.usageLiteral = res.updateSummary.usage.map((u) => {
    const container = {} as any;
    container.comments =
      `${u.used + u.free} day(s)` +
      (u.free > 0 ? ` (including ${u.free} free late day(s))` : ``);
    container.assignment = u.assignment;
    return container;
  });

  var placeholders = {
    greetings: `Hi ${req.id}`,
    approval: res.success,
    body: res.comments?.join(" "),
    summary: summary,
  };

  return template(placeholders);
}
