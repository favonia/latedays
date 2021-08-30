import type { Dayjs } from "dayjs";

export interface ActionRefund {
  readonly act: "refund";
  readonly days: number;
}

export interface ActionRequest {
  readonly act: "request";
  readonly days: number;
}

export interface ActionSummary {
  readonly act: "summary";
}

export type Action = ActionRefund | ActionRequest | ActionSummary;

export type AssignmentInfo = { deadline: string | Date | Dayjs };

export type Assignments<Assignment extends string> = Readonly<
  Record<Assignment, AssignmentInfo>
>;

export type Question<T> = {
  readonly title: string;
  readonly choices: [string, T][];
};

export interface FormSettings<Assignment> {
  readonly name: string;
  readonly description?: string;
  readonly questions: {
    readonly action: Question<Action>;
    readonly assignment: Question<Assignment>;
  };
}

export interface EmailSettings {
  // The email address for "reply-to" and various purposes
  readonly courseEmail: string;
  readonly subjectPrefix?: string;
}

export interface DataSheetSettings {
  readonly spreadsheetName: string;
  readonly dataSheetName: string;
}

export interface Policy {
  readonly maxLateDays: number;
  readonly maxLateDaysPerAssignment: number;
  readonly requestPeriodInDays: number;
  readonly refundPeriodInDays: number;
}

export interface Config<Assignment extends string> {
  readonly timezone: string;
  readonly assignments: Assignments<Assignment>;
  readonly policy: Policy;
  readonly form: FormSettings<Assignment>;
  readonly email: EmailSettings;
  readonly sheet: DataSheetSettings;
}
