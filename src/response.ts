import * as config from "../config/config";
import * as time from "./time";
import * as sheet from "./sheet";

type Request = {
  id: string;
  email: string;
  assignment: config.Assignment;
  action: number;
  time: time.Time;
};

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
    config.maxLateDays -
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

/**
 * @remarks This function assumes institutional emails follow the common pattern
 * where usernames are not quoted and do not contain unusual characters such as "@".
 */
function idOfEmail(email: string): string {
  return email.match(/^([^@]*)@/)![1];
}

function extractQuetionResponse<T>(
  q: config.Question<T>,
  rs: GoogleAppsScript.Forms.ItemResponse[]
): T {
  return q.choices[
    rs
      .find((ir) => ir.getItem().getTitle() === q.title)!
      .getResponse() as string
  ];
}

function parseFormSubmission(r: GoogleAppsScript.Forms.FormResponse): Request {
  const rs = r.getItemResponses();
  return {
    id: idOfEmail(r.getRespondentEmail()),
    email: r.getRespondentEmail(),
    assignment: extractQuetionResponse(config.selectionQuestion, rs),
    action: extractQuetionResponse(config.actionQuestion, rs),
    time: time.newTime(r.getTimestamp().toISOString()),
  };
}

function updateAndRespond(entry: sheet.Entry, request: Request): Response {
  const assignment = request.assignment;
  const deadline = time.newTime(config.deadlines[assignment]);

  const remaining =
    config.maxLateDays -
    Object.values(entry.days)
      .map((days) => days.used)
      .reduce((a, b) => a + b, 0);

  const used = entry.days[assignment].used;
  const free = entry.days[assignment].free;
  const freeDaysMessage =
    free > 0
      ? [`You also received ${free} free late day(s) for ${assignment}.`]
      : [];

  if (request.action === 0) {
    // summary
    return {
      subject: `Late day summary`,
      body: [],
    };
  } else if (request.action < 0) {
    // refund
    const newDeadlineWithoutFreeDays = deadline.addDays(
      Math.max(0, used + request.action)
    );
    if (request.time.isAfter(deadline.addDays(config.refundPeriodInDays))) {
      return {
        subject: `Late day refund request for ${assignment} rejected`,
        body: [
          `It is too late to request the refund for ${assignment}.`,
          `The request should have been made by ${time.format(
            deadline.addDays(config.refundPeriodInDays)
          )}.`,
          `Please check the rules in the syllabus.`,
        ],
      };
    } else if (used === 0) {
      return {
        subject: `Late day refund request for ${assignment} rejected`,
        body: [
          `You didn't use any late days for ${assignment}.`,
          `The original deadline for ${assignment} is ${time.format(
            deadline
          )}.`,
        ],
      };
    } else if (request.time.isAfter(newDeadlineWithoutFreeDays)) {
      return {
        review: true,
        subject: `Late day refund request for ${assignment} received`,
        body: [
          `You sent a refund request for a ${-request.action} late day(s) refund.`,
          `It will take some time for us to review your refund request.`,
        ],
      };
    } else {
      const newDeadline = newDeadlineWithoutFreeDays.addDays(free);
      entry.days[assignment].used = Math.max(0, used + request.action);
      return {
        subject: `Late day request for ${assignment} approved: new deadline ${time.format(
          newDeadline
        )}`,
        body: [
          `This is a confirmation that you got ${Math.min(
            used,
            -request.action
          )} late day(s) refunded for ${assignment}.`,
          ...freeDaysMessage,
          `The original deadline for ${assignment} is ${time.format(
            deadline
          )}.`,
          `The new deadline is ${time.format(newDeadline)}.`,
        ],
      };
    }
  } else {
    // request
    if (request.time.isAfter(deadline.addDays(config.requestPeriodInDays))) {
      return {
        subject: `Late day request rejected`,
        body: [
          `It is too late to request late days for ${assignment}.`,
          `The request should have been made by ${time.format(
            deadline.addDays(config.requestPeriodInDays)
          )}.`,
          `Please check the rules in the syllabus.`,
        ],
      };
    } else if (request.action < used) {
      return {
        subject: `Late day request for ${assignment} rejected`,
        body: [
          `You've already spent ${used} late day(s), so you cannot request fewer late day(s).`,
          `For refund, please choose the refund options.`,
        ],
      };
    } else if (request.action > remaining) {
      return {
        subject: `Late day request for ${assignment} rejected`,
        body: [
          `You cannot request ${request.action} late day(s) for ${assignment}, because you only have ${remaining} late day(s) available.`,
        ],
      };
    } else {
      const newDeadline = deadline.addDays(request.action + free);
      entry.days[assignment].used = request.action;
      return {
        subject: `Late day request for ${assignment} approved: new deadline ${time.format(
          newDeadline
        )}`,
        body: [
          `This is a confirmation that you spent ${request.action} day(s) for ${assignment}.`,
          ...freeDaysMessage,
          `The original deadline for ${assignment} is ${time.format(
            deadline
          )}.`,
          `The new deadline for ${assignment} is ${time.format(newDeadline)}.`,
        ],
      };
    }
  }
}

function sendEmail(req: Request, res: Response, footer: string[]): void {
  const subject = `${config.emailSubjectPrefix} ${res.subject}`;
  const body = (res.body.length > 0 ? [...res.body, , ...footer] : footer).join(
    "\n"
  );

  MailApp.sendEmail(
    req.email,
    subject,
    body,
    res.review
      ? {
          cc: config.courseEmail,
          replyTo: req.email,
        }
      : {
          replyTo: config.courseEmail,
        }
  );
}

/** Validate the student form submission, writes appropriate data into
 ** the late day sheet, emails a proper response.
 **
 ** TODO: Auto-update the deadline on Canvas
 **/
export function handle(event: GoogleAppsScript.Events.FormsOnFormSubmit): void {
  const request = parseFormSubmission(event.response);

  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ds = sheet.ensure();
    const entry = sheet.readRecord(ds, request.id);
    const response = updateAndRespond(entry, request);
    sheet.updateRecord(ds, entry);

    const usageSummary = formatSummary(entry);
    sendEmail(request, response, usageSummary);
  } finally {
    lock.releaseLock();
  }
}
