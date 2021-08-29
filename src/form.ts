import * as config from "../config/config";

const propFormId = "FORM_ID";

let cachedForm: GoogleAppsScript.Forms.Form | null = null;

// Update the form with items around today.
function createDeadlineTriggers(): void {
  // TODO
}

function addQuestion<T>(
  form: GoogleAppsScript.Forms.Form,
  q: config.Question<T>
): void {
  const item = form.addMultipleChoiceItem();
  item.setTitle(q.question);
  item.setRequired(true);
  item.setChoices(Object.keys(q.options).map((text) => item.createChoice(text)));
}

export function ensure(): GoogleAppsScript.Forms.Form {
  if (cachedForm !== null) {
    return cachedForm;
  }

  const props = PropertiesService.getScriptProperties();

  const id = props.getProperty(propFormId);
  if (id != null) {
    return (cachedForm = FormApp.openById(id));
  }

  const form = FormApp.create(config.formName);
  props.setProperty(propFormId, form.getId());

  form.setDescription(config.formDescription).setCollectEmail(true);
  addQuestion(form, config.actionQuestion);
  addQuestion(form, config.selectionQuestion);

  // create triggers to update the form
  createDeadlineTriggers();

  return (cachedForm = form);
}

export function init(): void {
  ensure();
}
