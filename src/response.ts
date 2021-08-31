import config from "../config/config";
import { newTime, addDays, format as formatTime } from "./time";
import * as sheet from "./sheet";
import * as form from "./form";

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
        `${assign}: ${days.used + days.free}` +
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
  const freeDaysMessage =
    free > 0
      ? [`You also received ${free} free late day(s) for ${assignment}.`]
      : [];

  switch (request.action.act) {
    case "summary":
      return {
        subject: `Late day summary`,
        body: [],
      };

    case "refund": {
      // refund
      const newDeadlineWithoutFreeDays = addDays(
        deadline,
        Math.max(0, used - request.action.days)
      );

      switch (true) {
        case request.time.isAfter(
          addDays(deadline, config.policy.refundPeriodInDays)
        ):
          return {
            subject: `Late day refund request for ${assignment} rejected`,
            body: [
              `It is too late to request the refund for ${assignment}.`,
              `The request should have been made by ${formatTime(
                addDays(deadline, config.policy.refundPeriodInDays)
              )}.`,
              `Please check the rules in the syllabus.`,
            ],
          };

        case used === 0:
          return {
            subject: `Late day refund request for ${assignment} rejected`,
            body: [
              `You didn't use any late days for ${assignment}.`,
              `The original deadline for ${assignment} is ${formatTime(
                deadline
              )}.`,
            ],
          };

        case request.time.isAfter(newDeadlineWithoutFreeDays):
          return {
            review: true,
            subject: `Late day refund request for ${assignment} received`,
            body: [
              `You requested a refund of ${request.action.days} late day(s).`,
              `It will take some time for us to review your refund request.`,
              `Reply to this email if nothing happens in a week.`,
            ],
          };

        default: {
          entry.days[assignment].used = Math.max(0, used - request.action.days);
          const newDeadline = addDays(
            deadline,
            Math.max(0, used - request.action.days) + free
          );
          return {
            subject: `Late day request for ${assignment} approved: new deadline ${formatTime(
              newDeadline
            )}`,
            body: [
              `This is a confirmation that you got ${Math.min(
                used,
                request.action.days
              )} late day(s) refunded for ${assignment}.`,
              ...freeDaysMessage,
              `The original deadline for ${assignment} is ${formatTime(
                deadline
              )}.`,
              `The new deadline is ${formatTime(newDeadline)}.`,
            ],
          };
        }
      }
    }

    case "request": {
      switch (true) {
        case request.time.isAfter(
          addDays(deadline, config.policy.requestPeriodInDays)
        ):
          return {
            subject: `Late day request rejected`,
            body: [
              `It is too late to request late days for ${assignment}.`,
              `The request should have been made by ${formatTime(
                addDays(deadline, config.policy.requestPeriodInDays)
              )}.`,
              `Please check the rules in the syllabus.`,
            ],
          };

        case request.action.days < used:
          return {
            subject: `Late day request for ${assignment} rejected`,
            body: [
              `You've already spent ${used} late day(s), so you cannot request fewer late day(s).`,
              `For refund, please choose the refund options.`,
            ],
          };

        case request.action.days > remaining:
          return {
            subject: `Late day request for ${assignment} rejected`,
            body: [
              `You cannot request ${request.action} late day(s) for ${assignment}, because you only have ${remaining} late day(s) available.`,
            ],
          };

        default: {
          entry.days[assignment].used = request.action.days;
          const newDeadline = addDays(deadline, request.action.days + free);
          return {
            subject: `Late day request for ${assignment} approved: new deadline ${formatTime(
              newDeadline
            )}`,
            body: [
              `This is a confirmation that you spent ${request.action} day(s) for ${assignment}.`,
              ...freeDaysMessage,
              `The original deadline for ${assignment} is ${formatTime(
                deadline
              )}.`,
              `The new deadline for ${assignment} is ${formatTime(
                newDeadline
              )}.`,
            ],
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
  const body = (res.body.length > 0 ? [...res.body, , ...footer] : footer).join(
    "\n"
  );

  MailApp.sendEmail(
    req.email,
    subject,
    body,
    res.review
      ? {
          cc: config.email.courseEmail,
          replyTo: req.email,
        }
      : {
          replyTo: config.email.courseEmail,
        }
  );
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
