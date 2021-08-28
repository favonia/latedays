import * as config from "../config/config";

const propFormId = "FORM_ID";

// Update the form with items around today.
function createDeadlineTriggers(): void {
  // TODO
}

function addQuestion<T>(
  form: GoogleAppsScript.Forms.Form,
  q: config.question<T>,
  maxAssignmentsForDisplay?: number
): void {
  var item = form.addMultipleChoiceItem();
  item.setTitle(q.question);
  item.setRequired(true);
  item.setChoices(
    Object.keys(q.options)
      .map(item.createChoice)
      .slice(0, maxAssignmentsForDisplay)
  );
}

export function ensure(): GoogleAppsScript.Forms.Form {
  const props = PropertiesService.getScriptProperties();

  const id = props.getProperty(propFormId);
  if (id != null) {
    return FormApp.openById(id);
  }

  const form = FormApp.create(config.formName);
  props.setProperty(propFormId, form.getId());

  form.setDescription(config.formDescription).setCollectEmail(true);
  addQuestion(form, config.actionQuestion);
  addQuestion(form, config.selectionQuestion, config.maxAssignmentsForDisplay);

  // create triggers to update the form
  createDeadlineTriggers();

  return form;
}

export default { ensure };
