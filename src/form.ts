import * as config from "../config/config";

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
  q: config.Question<T>
): void {
  const item = form.addMultipleChoiceItem();
  item
    .setTitle(q.title)
    .setRequired(true)
    .setChoices(Object.keys(q.choices).map((text) => item.createChoice(text)));
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

  const form = FormApp.create(config.formName);

  form
    .setRequireLogin(true)
    .setCollectEmail(true)
    .setShowLinkToRespondAgain(true)
    .setDescription(config.formDescription);

  addQuestion(form, config.actionQuestion);
  addQuestion(form, config.selectionQuestion);

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
