import config from "../config/config";
import { Action, Question, Assignment } from "../config/config";
import * as time from "./time";
import * as props from "./props";

const propFormId = "FORM_ID";
const propActionItemId = "ACTION_ITEM_ID";
const propAssignmentItemId = "ASSIGNMENT_ITEM_ID";

let cachedForm: GoogleAppsScript.Forms.Form | null = null;

// global name in index.ts
const callbackNameOnFormSubmit = "callbackOnFormSubmit";

// Update the form with items around today.
function createDeadlineTriggers(): void {
  // TODO
}

function ensureFormItem(
  form: GoogleAppsScript.Forms.Form,
  propName: string
): GoogleAppsScript.Forms.MultipleChoiceItem {
  const itemId = props.get(propName);
  if (itemId !== null) {
    // this try/catch is for asMultipleChoiceItem and perhaps getItemById
    try {
      const item = form.getItemById(Number(itemId));
      if (item !== undefined) {
        return item.asMultipleChoiceItem();
      }
    } catch {}
  }
  const item = form.addMultipleChoiceItem();
  props.set(propName, String(item.getId()));
  return item;
}

function ensureQuestion<T>(
  form: GoogleAppsScript.Forms.Form,
  propName: string,
  q: Question<T>
): void {
  const item = ensureFormItem(form, propName);

  item
    .setTitle(q.title)
    .setRequired(true)
    .setChoices(q.choices.map(([text, _]) => item.createChoice(text)));
}

function setupForm(form: GoogleAppsScript.Forms.Form): void {
  form
    .setTitle(config.form.title)
    .setRequireLogin(true)
    .setCollectEmail(true)
    .setShowLinkToRespondAgain(true);

  if (config.form.description !== undefined) {
    form.setDescription(config.form.description);
  }

  ensureQuestion(form, propActionItemId, config.form.questions.action);
  ensureQuestion(form, propAssignmentItemId, config.form.questions.assignment);
}

export function ensure(): GoogleAppsScript.Forms.Form {
  if (cachedForm !== null) {
    return cachedForm;
  }

  const id = props.get(propFormId);
  if (id != null) {
    // this try/catch is for openById
    try {
      return (cachedForm = FormApp.openById(id));
    } catch {}
  }

  const form = FormApp.create(config.form.title);
  setupForm(form);

  // set up trigger on submission
  ScriptApp.newTrigger(callbackNameOnFormSubmit)
    .forForm(form)
    .onFormSubmit()
    .create();

  // create triggers to update the form
  createDeadlineTriggers();

  props.set(propFormId, form.getId());
  return (cachedForm = form);
}

export function reset(): void {
  const id = props.get(propFormId);
  if (id !== null) {
    const form = FormApp.openById(id);
    ScriptApp.getUserTriggers(form).forEach((trigger) =>
      ScriptApp.deleteTrigger(trigger)
    );
    props.del(propFormId);
    props.del(propActionItemId);
    props.del(propAssignmentItemId);
  }
}

export function regenerate(): void {
  const form = ensure();
  setupForm(form);
  console.log("Form URL: %s", form.getPublishedUrl());
}

export function init(): void {
  const form = ensure();
  console.log("Form URL: %s", form.getPublishedUrl());
}

/**
 * `idOfEmail` extracts usernames from institutional email addresses.
 *
 * @remarks We do not use emails as IDs because, in the University of Minnesota,
 * some students might be changing their campus domains _while_ taking courses.
 * (For example, an email address at the Twin Cities campus ends with "@umn.edu"
 * and the corresponding one at the Duluth campus ends with "@d.umn.edu". A student
 * transferring from one campus to another could use a different address.)
 * The solution is to extract the username to correctly identify students.
 *
 * @remarks This function assumes institutional usernames are not quoted
 * and do not contain unusual characters such as "@". (RFCs allowed many
 * more email addresses that could not be handled by this function.)
 */
export function idOfEmail(email: string): string {
  return email.match(/^([^@]*)@/)![1];
}

function extractQuetionResponse<T>(
  q: Question<T>,
  rs: GoogleAppsScript.Forms.ItemResponse[]
): T {
  const response: string = rs
    .find((ir) => ir.getItem().getTitle() === q.title)!
    .getResponse() as string;
  return q.choices.find(([choice, _]) => choice === response)![1];
}

export type Request = {
  id: string;
  email: string;
  assignment: Assignment;
  action: Action;
  time: time.Time;
};

export function parseRequest(r: GoogleAppsScript.Forms.FormResponse): Request {
  const rs = r.getItemResponses();
  return {
    id: idOfEmail(r.getRespondentEmail()),
    email: r.getRespondentEmail(),
    action: extractQuetionResponse(config.form.questions.action, rs),
    assignment: extractQuetionResponse(config.form.questions.assignment, rs),
    time: time.fromISO(r.getTimestamp().toISOString()),
  };
}
