import config from "../config/config";
import { fromISO as newTime, addDays, format as formatTime } from "./time";
import * as sheet from "./sheet";
import * as form from "./form";
import literal from "../literals/literalTypes";

type Response = {
  review?: boolean;
  subject: string;
  body: string[];
};

function formatSummary(entry: sheet.Entry): string[] {
  const latedays: string[] = [];
  Object.entries(entry.days).forEach(([assign, days]) => {
    if (days.used + days.free > 0) {
      latedays.push(
        `- ${assign}: ${days.used + days.free} day(s)` +
          (days.free > 0 ? ` (including ${days.free} free late day(s))` : "")
      );
    }
  });

  let remaining =
    config.policy.maxLateDays -
    Object.values(entry.days)
      .map((days) => days.used)
      .reduce((a, b) => a + b, 0);

  return latedays.length > 0
    ? [
        "You have applied these late day(s):",
        ...latedays,
        `Remaining late day(s): ${remaining}`,
      ]
    : [
        `You have not spent any late day.`,
        `Remaining late day(s): ${remaining}`,
      ];
}

function updateAndRespond(entry: sheet.Entry, request: form.Request): Response {
  const assignment = request.assignment;
  const deadline = newTime(config.assignments[assignment].deadline);

  const remaining =
    config.policy.maxLateDays -
    Object.values(entry.days)
      .map((days) => days.used)
      .reduce((a, b) => a + b, 0);

  const used = entry.days[assignment].used;
  const free = entry.days[assignment].free;

  switch (request.action.act) {
    case "summary":
      return {
        subject: literal.summary.subject(), // `Late day summary`,
        body: literal.summary.body({}),
      };

    case "refund": {
      // refund
      const newDeadlineWithoutFreeDays = addDays(
        deadline,
        Math.max(0, used - request.action.days)
      );

      switch (true) {
        case request.time > addDays(deadline, config.policy.refundPeriodInDays):
          return {
            subject: literal.refund.beyond.subject(assignment),
            body: literal.refund.beyond.body({
              assignment: assignment,
              oldDeadline: addDays(deadline, config.policy.refundPeriodInDays),
            }),
          };

        case used === 0:
          return {
            subject: literal.refund.unused.subject(assignment),
            body: literal.refund.unused.body({
              assignment: assignment,
              oldDeadline: deadline,
            }),
          };

        case request.time > newDeadlineWithoutFreeDays:
          return {
            review: true,
            subject: literal.refund.received.subject(assignment),
            body: literal.refund.received.body({
              numOfDays: request.action.days,
            }),
          };

        default: {
          entry.days[assignment].used = Math.max(0, used - request.action.days);
          const newDeadline = addDays(
            deadline,
            Math.max(0, used - request.action.days) + free
          );
          return {
            subject: literal.refund.approved.subject(
              assignment,
              formatTime(newDeadline)
            ),
            body: literal.refund.approved.body({
              assignment: assignment,
              numOfDays: Math.min(used, request.action.days),
              oldDeadline: deadline,
              newDeadline: newDeadline,
              freeDays: free,
            }),
          };
        }
      }
    }

    case "request": {
      switch (true) {
        case request.time >
          addDays(deadline, config.policy.requestPeriodInDays):
          return {
            subject: literal.request.beyond.subject(assignment),
            body: literal.request.beyond.body({
              assignment: assignment,
              oldDeadline: addDays(deadline, config.policy.requestPeriodInDays),
            }),
          };

        case request.action.days < used:
          return {
            subject: literal.request.unused.subject(assignment),
            body: literal.request.unused.body({ numOfDays: used }),
          };

        case request.action.days - used > remaining:
          return {
            subject: literal.request.global.subject(assignment),
            body: literal.request.global.body({
              assignment: assignment,
              numOfDays: request.action.days,
              leftDays: remaining,
            }),
          };

        default: {
          entry.days[assignment].used = request.action.days;
          const newDeadline = addDays(deadline, request.action.days + free);
          return {
            subject: literal.request.approved.subject(
              assignment,
              formatTime(newDeadline)
            ),
            body: literal.request.approved.body({
              assignment: assignment,
              numOfDays: request.action.days,
              oldDeadline: deadline,
              newDeadline: newDeadline,
              freeDays: free,
            }),
          };
        }
      }
    }
  }
}

function sendEmail(req: form.Request, res: Response, footer: string[]): void {
  const subject = config.email.subjectPrefix
    ? `${config.email.subjectPrefix} ${res.subject}`
    : res.subject;

  const body = (
    res.body.length && footer.length ? [...res.body, , ...footer] : footer
  ).join("\n");

  const cc = res.review ? config.email.courseEmail : undefined;

  // XXX Ideally, when `res.review` is true, "Reply-To" should be `[req.email, config.email.courseEmail].join(",")`,
  // containing both email addresses. This is allowed by RFC, but unfortunately NOT supported by Gmail. Thus,
  // the more useful one `req.email` is used instead.
  const replyTo = res.review ? req.email : config.email.courseEmail;

  MailApp.sendEmail({
    to: req.email,
    subject: subject,
    body: body,
    cc: cc,
    replyTo: replyTo,
  });
}

/** Validate the student form submission, writes appropriate data into
 ** the late day sheet, emails a proper response.
 **
 ** TODO: Auto-update the deadline on Canvas
 **/
export function handle(event: GoogleAppsScript.Events.FormsOnFormSubmit): void {
  const request = form.parseRequest(event.response);

  const ds = sheet.ensure();
  const entry = sheet.readRecord(ds, request.id);
  const response = updateAndRespond(entry, request);
  sheet.updateRecord(ds, entry);

  const usageSummary = formatSummary(entry);
  sendEmail(request, response, usageSummary);
}
