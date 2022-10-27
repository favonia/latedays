import * as lit from "./literals";
import { format as formatTime } from "../src/time";
import { DateTime } from "luxon";

export interface BodyParams {
  assignment: string;
  numOfDays: number;
  leftDays: number;
  newDeadline: DateTime;
  oldDeadline: DateTime;
  freeDays: number;
}

/** The function is a wrapper for literal methods to format & convert different datatypes to
 * string types for literal usage. Currently formats:
 *      Luxon DateTime object to string with formatTime formatter
 */
export function literalWrapper(func: (...args: any[]) => any) {
  return function (...args: any[]) {
    for (const i in args) {
      let arg = args[i];
      if (typeof arg === "object") {
        for (let a in arg) {
          if (arg[a] instanceof DateTime) {
            args[i][a] = formatTime(arg[a]);
          }
        }
      }
    }
    return func(
      ...args.map((arg) => (arg instanceof DateTime ? formatTime(arg) : arg))
    );
  };
}

interface EmailLiterals {
  readonly greeting: (name: string) => string;
  readonly subject: (a?: string, t?: DateTime) => string;
  readonly body: (params: Partial<BodyParams>) => string[];
}

const defaultLiterals: EmailLiterals = {
  greeting: (name: string) => `Hi ${name}`,
  subject: () => ``,
  body: () => [],
};

const summaryLiteral: EmailLiterals = {
  ...defaultLiterals,
  subject: () => `Late day summary`,
};

const refundBeyondLiteral: EmailLiterals = {
  ...defaultLiterals,
  subject: literalWrapper(lit.refundRejSubject),
  body: literalWrapper(lit.refBeyondBody),
};
const refundUnusedLiteral: EmailLiterals = {
  ...defaultLiterals,
  subject: literalWrapper(lit.refundRejSubject),
  body: literalWrapper(lit.refUnusedBody),
};
const refundReceiveLiteral: EmailLiterals = {
  ...defaultLiterals,
  subject: literalWrapper(lit.refundRecSubject),
  body: literalWrapper(lit.refRecBody),
};
const refundApproveLiteral: EmailLiterals = {
  ...defaultLiterals,
  subject: literalWrapper(lit.refundAppSubject),
  body: literalWrapper(lit.refAppBody),
};

const requestBeyondLiteral: EmailLiterals = {
  ...defaultLiterals,
  subject: literalWrapper(lit.requestRejSubject),
  body: literalWrapper(lit.reqBeyondBody),
};
const requestUnusedLiteral: EmailLiterals = {
  ...defaultLiterals,
  subject: literalWrapper(lit.requestRejSubject),
  body: literalWrapper(lit.reqUnusedBody),
};
const requestGlobalLiteral: EmailLiterals = {
  ...defaultLiterals,
  subject: literalWrapper(lit.requestRejSubject),
  body: literalWrapper(lit.reqGloBody),
};
const requestApproveLiteral: EmailLiterals = {
  ...defaultLiterals,
  subject: literalWrapper(lit.requestAppSubject),
  body: literalWrapper(lit.reqAppBody),
};

const literal = {
  default: defaultLiterals,
  summary: summaryLiteral,
  refund: {
    beyond: refundBeyondLiteral,
    received: refundReceiveLiteral,
    unused: refundUnusedLiteral,
    approved: refundApproveLiteral,
  },
  request: {
    beyond: requestBeyondLiteral,
    unused: requestUnusedLiteral,
    global: requestGlobalLiteral,
    approved: requestApproveLiteral,
  },
};

export default literal;
