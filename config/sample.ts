import type { Action, Question, Config } from "./configTypes";
export { Action, Question, Config };

export type Assignment = "Homework 1" | "Homework 2";

export const config: Config<Assignment> = {
  timezone: "America/Chicago",
  assignments: {
    "Homework 1": { deadline: "2021-08-29T17:00:00-06:00" },
    "Homework 2": { deadline: "2021-08-30T17:00:00-06:00" },
  },
  policy: {
    maxLateDays: 10,
    maxLateDaysPerAssignment: 2,
    requestPeriodInDays: 2,
    refundPeriodInDays: 7,
  },
  form: {
    name: "Late Days Request (My Course, 2999 Spring)",
    description: `You have 10 late days in total. For each assignment, you can use at most 2 late days. After submitting the form, you will receive an email showing the result of your request. If your request is approved, we will adjust the due dates on Canvas accordingly.`,
    questions: {
      action: {
        title: "What do you want to do?",
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
        choices: [
          ["Homework 1 (8/29, postponed by one week)", "Homework 1"],
          ["Homework 2 (8/30)", "Homework 2"],
        ],
      },
    },
  },
  email: {
    courseEmail: "cool@school.edu",
    subjectPrefix: "[awesome]",
  },
  sheet: {
    spreadsheetName: "Late Days Database (My Course, 2999 Spring)",
    dataSheetName: "Late Days",
  },
};

export default config;
