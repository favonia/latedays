import config from "../config/config";
import { Action, Question, Assignment } from "../config/config";
import * as time from "./time";

const propFormId = "FORM_ID";

let cachedForm: GoogleAppsScript.Forms.Form | null = null;

// global name in index.ts
const callbackNameOnFormSubmit = "callbackOnFormSubmit";

// Update the form with items around today.
function createDeadlineTriggers(): void {
  // TODO
}

function addQuestion<T>(
  form: GoogleAppsScript.Forms.Form,
  q: Question<T>
): void {
  const item = form.addMultipleChoiceItem();
  item
    .setTitle(q.title)
    .setRequired(true)
    .setChoices(q.choices.map(([text, _]) => item.createChoice(text)));
}

export function reset(): void {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty(propFormId);
  if (id !== null) {
    const form = FormApp.openById(id);
    ScriptApp.getUserTriggers(form).forEach((trigger) =>
      ScriptApp.deleteTrigger(trigger)
    );
    props.deleteProperty(propFormId);
  }
}

export function ensure(): GoogleAppsScript.Forms.Form {
  if (cachedForm !== null) {
    return cachedForm;
  }

  const props = PropertiesService.getScriptProperties();

  const id = props.getProperty(propFormId);
  if (id != null) {
    try {
      return (cachedForm = FormApp.openById(id));
    } catch (_) {}
  }

  const form = FormApp.create(config.form.name);

  form
    .setRequireLogin(true)
    .setCollectEmail(true)
    .setShowLinkToRespondAgain(true);

  if (config.form.description !== undefined) {
    form.setDescription(config.form.description);
  }

  addQuestion(form, config.form.questions.action);
  addQuestion(form, config.form.questions.assignment);

  // set up trigger on submission
  ScriptApp.newTrigger(callbackNameOnFormSubmit)
    .forForm(form)
    .onFormSubmit()
    .create();

  // create triggers to update the form
  createDeadlineTriggers();

  props.setProperty(propFormId, form.getId());
  return (cachedForm = form);
}

export function init(): void {
  const form = ensure();
  console.log("Form URL: %s", form.getPublishedUrl());
}

/**
 * @remarks This function assumes institutional emails follow the common pattern
 * where usernames are not quoted and do not contain unusual characters such as "@".
 */
function idOfEmail(email: string): string {
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
    time: time.newTime(r.getTimestamp().toISOString()),
  };
}
