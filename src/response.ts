import * as config from "../config/config";
import * as time from "./time";
import * as sheet from "./sheet";

type Request = {
  id: string;
  email: string;
  assignment: string;
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
  Object.keys(config.deadlines).forEach((assign) => {
    const used = entry[assign].used;
    const free = entry[assign].free;
    if (used + free > 0) {
      let line = `${assign}: ${used + free}`;
      if (free > 0) {
        line += ` (including ${free} free late day(s))`;
      }
      latedays.push(line);
    }
  });

  let remaining =
    config.maxLateDays -
    Object.keys(config.deadlines)
      .map((assign) => entry[assign].used)
      .reduce((a, b) => a + b, 0);

  if (latedays.length > 0) {
    return [
      "Late day(s) applied:",
      ...latedays,
      `Remaining late day(s): ${remaining}`,
    ];
  } else {
    return [`No late day spent.`];
  }
}

/**
 * @remarks This function assumes institutional emails follow the common pattern
 * where usernames are not quoted and do not contain unusual characters such as "@".
 */
function idOfEmail(email: string): string {
  return email.match(/^([^@]*)@/)![1];
}

function parseFormSubmission(v: Record<string, string[]>): Request {
  return {
    id: idOfEmail(v["Email Address"][0]),
    email: v["Email Address"][0],
    assignment:
      config.selectionQuestion.options[v[config.selectionQuestion.question][0]],
    action: config.actionQuestion.options[v[config.actionQuestion.question][0]],
    time: time.newTime(v["Timestamp"][0]),
  };
}

function validate(entry: sheet.Entry, request: Request): Response {
  const assignment = request.assignment;
  const deadline = time.newTime(config.deadlines[assignment]);

  const remaining =
    config.maxLateDays -
    Object.keys(config.deadlines)
      .map((assign) => entry[assign].used)
      .reduce((a, b) => a + b, 0);

  const oldUsed = entry[assignment].used;

  const free = entry[assignment].free;
  const msgFree =
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
      Math.max(0, oldUsed + request.action)
    );
    if (request.time.isAfter(deadline.addDays(config.refundPeriodInDays))) {
      return {
        subject: `Late day refund request for ${assignment} rejected`,
        body: [
          `It is too late to request the refund for ${assignment}.`,
          `The request should be sent before ${time.format(
            deadline.addDays(7)
          )}.`,
          `Please check the rules in the syllabus.`,
        ],
      };
    } else if (oldUsed === 0) {
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
      entry[assignment].used = Math.max(0, oldUsed + request.action);
      return {
        subject: `Late day request for ${assignment} approved: new deadline ${time.format(
          newDeadline
        )}`,
        body: [
          `This is a confirmation that you got ${Math.min(
            oldUsed,
            -request.action
          )} late day(s) refunded for ${assignment}.`,
          ...msgFree,
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
          `The request should be sent before ${time.format(
            deadline.addDays(config.requestPeriodInDays)
          )}.`,
          `Please check the rules in the syllabus.`,
        ],
      };
    } else if (request.action < oldUsed) {
      return {
        subject: `Late day request for ${assignment} rejected`,
        body: [
          `You've already spent ${oldUsed} late day(s), so you cannot request fewer late day(s).`,
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
      entry[assignment].used = request.action;
      return {
        subject: `Late day request for ${assignment} approved: new deadline ${time.format(
          newDeadline
        )}`,
        body: [
          `This is a confirmation that you spent ${request.action} day(s) for ${assignment}.`,
          ...msgFree,
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
  const body = (
    res.body.length > 0 && footer.length > 0
      ? [...res.body, , ...footer]
      : [...res.body, ...footer]
  ).join("\n");

  GmailApp.createDraft(
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
  ).send();
}

/** Validate the student form submission, writes appropriate data into
 ** the late day sheet, emails a proper response.
 **
 ** TODO: Auto-update the deadline on Canvas
 **/
export function handle(
  event: GoogleAppsScript.Events.SheetsOnFormSubmit
): void {
  const request = parseFormSubmission(event.namedValues);

  const ds = sheet.ensure();
  const entry = sheet.readRecord(ds, request.id);

  const response = validate(entry, request);
  sheet.writeRecord(ds, request.id, entry);
  const usageSummary = formatSummary(entry);

  sendEmail(request, response, usageSummary);
}
