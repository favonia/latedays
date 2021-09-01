import type { Action, Question, Config } from "./configTypes";
export { Action, Question, Config };

// Assignment the type of assignment IDs. Use union types instead of just `string`
// to fully utilize TypeScript's type-checking.
export type Assignment = "Homework 1" | "Homework 2";

export const config: Config<Assignment> = {
  // Timezone used to format deadlines in email messages
  timezone: "America/Chicago",
  // A map from assignment IDs to assignment information.
  // Currently, the only information is its deadline.
  assignments: {
    "Homework 1": { deadline: "2021-08-29T17:00:00-06:00" },
    "Homework 2": { deadline: "2021-08-30T17:00:00-06:00" },
  },
  policy: {
    // The maximum number of late days a student can use.
    maxLateDays: 10,
    // The maximum number of late days _per assignment_ a student can use.
    maxLateDaysPerAssignment: 2,
    // The deadline of requesting late days, relative to the assignment deadline.
    // @remarks Favonia tried different policies and this one seems to be simple and effective.
    requestPeriodInDays: 2,
    // The deadline of making refund requests, relative to the assignment deadline.
    refundPeriodInDays: 7,
  },
  form: {
    // Title of the form.
    title: "Late Days Request (My Course, 2999 Spring)",
    // Description on the form.
    description: "You have 10 late days in total. For each assignment, you can use at most 2 late days. After submitting the form, you will receive an email showing the result of your request. If your request is approved, we will adjust the due dates on Canvas accordingly.",
    questions: {
      action: {
        title: "What do you want to do?",
        // An associative array representing the available choices to the students.
        // The key is the text on the form, and the value is the action to be taken.
        // The following example shows a typical setup.
        //
        // @remarks This is an associative array, so do not list choices with the same text;
        // the second one with the same text will share the same value of the first one.
        choices: [
          [
            "Use 1 late day (in total) for this assignment",
            { act: "request", days: 1 },
          ],
          [
            "Use 2 late days (in total) for this assignment",
            { act: "request", days: 2 },
          ],
          [
            "Refund 1 late day from this assignment",
            { act: "refund", days: 1 },
          ],
          [
            "Refund 2 late days from this assignment",
            { act: "refund", days: 2 },
          ],
          ["Check my late day usage", { act: "summary" }],
        ],
      },
      assignment: {
        title: "For which assignment?",
        // An associative array representing the available choices to the students.
        // The key is the text on the form, and the value is the ID of the assignment.
        //
        // @remarks You do not have to list all the assignments here. In fact, listing all
        // assignments on the form could be confusing or intimidating. Follow the instructions
        // in README to regenerate the form after updating the configuration file.
        choices: [
          ["Homework 1 (8/29, postponed by one week)", "Homework 1"],
          ["Homework 2 (8/30)", "Homework 2"],
        ],
      },
    },
  },
  email: {
    // The course email to handle questions and requests from students (if manual review
    // is needed). Typically, this address is monitored by the instructors or head TAs.
    courseEmail: "cool@school.edu",
    // The subject prefix. Use `null` to disable this feature.
    subjectPrefix: "[awesome]",
  },
  sheet: {
    // The name of the spreadsheet when it is created. This does not affect how the code work,
    // but could help you locate the files in your Google Drive.
    spreadsheetName: "Late Days Database (My Course, 2999 Spring)",
    // The name of the data sheet when it is created. This does not affect how the code work,
    // but could make the spreadsheet look nicer.
    dataSheetName: "Late Days",
  },
};

export default config;
