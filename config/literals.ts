import { BodyParams } from "./literalTypes";

export const emailSubject = (type:string, a: string, success?: boolean, t?: string) => `Late day ${type} for ${a} `+
  (success===undefined? `received`: (success?`approved: new deadline ${t}`: `rejected`));

export const refBeyondBody = ({assignment: a, oldDeadline: t}: Partial<BodyParams>) => [
  `It is too late to request the refund for ${a}.`,
  `The request should have been made by ${t}.`,
  `Please check the rules in the syllabus.`,
];

export const refUnusedBody = ({assignment: a, oldDeadline: t}: Partial<BodyParams>) => [
  `You didn't use any late days for ${a}.`,
  `The original deadline for ${a} is ${t}.`,
];

export const refRecBody = ({numOfDays: d}: Partial<BodyParams>) => [
  `You requested a refund of ${d} late day(s).`,
  `It will take some time for us to review your refund request.`,
  `Reply-all (not just reply) to this email if nothing happens in a week.`,
];

export const refAppBody = ({assignment: a, numOfDays: d, oldDeadline: to, newDeadline: tn, freeDays: f}: Partial<BodyParams>) => [
  `This is a confirmation that you got ${d} late day(s) refunded for ${a}.`,
  ...((f && f>0) ? [`You have also received ${f} free late day(s) for ${a}.`] : []),
  `The original deadline for ${a} is ${to}.`,
  `The new deadline is ${tn}.`,
];

export const reqBeyondBody = ({assignment: a, oldDeadline: t}: Partial<BodyParams>) => [
  `It is too late to request late days for ${a}.`,
  `The request should have been made by ${t}.`,
  `Please check the rules in the syllabus.`,
];

export const reqUnusedBody = ({numOfDays: d}: Partial<BodyParams>) => [
  `You've already spent ${d} late day(s), so you cannot request fewer late day(s).`,
  `For refund, please choose the refund options.`,
];

export const reqGloBody = ({assignment: a, numOfDays: d, leftDays: l}: Partial<BodyParams>) => [
  `You cannot request ${d} late day(s) for ${a}, because you only have ${l} late day(s) available.`,
];

export const reqAppBody = ({assignment: a, numOfDays: d, oldDeadline: to, newDeadline: tn, freeDays: f}: Partial<BodyParams>) => [
  `This is a confirmation that you spent ${d} day(s) for ${a}.`,
  ...((f && f>0) ? [`You have also received ${f} free late day(s) for ${a}.`] : []),
  `The original deadline for ${a} is ${to}.`,
  `The new deadline is ${tn}.`,
];
