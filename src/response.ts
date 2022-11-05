import config from "../config/config";
import * as sheet from "./sheet";
import * as form from "./form";
import { Response, updateAndRespond } from "./responseType";
import { getEmailSubject, renderHTML } from "./renderer";

function sendEmail(req: form.Request, res: Response): void {
  const resSubject = getEmailSubject(req.action.act, res);
  const subject = config.email.subjectPrefix
    ? `${config.email.subjectPrefix} ${resSubject}`
    : resSubject;

  const cc = res.review ? config.email.courseEmail : undefined;

  // XXX Ideally, when `res.review` is true, "Reply-To" should be `[req.email, config.email.courseEmail].join(",")`,
  // containing both email addresses. This is allowed by RFC, but unfortunately NOT supported by Gmail. Thus,
  // the more useful one `req.email` is used instead.
  const replyTo = res.review ? req.email : config.email.courseEmail;

  MailApp.sendEmail({
    to: req.email,
    subject: subject,
    htmlBody: renderHTML(req, res),
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

  sendEmail(request, response);
}
