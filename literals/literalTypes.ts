import * as lit from './literals'
import { format as formatTime } from "../src/time";
import { DateTime } from 'luxon';

export interface BodyParams {
    assignment : string,
    numOfDays : number,
    leftDays: number,
    newDeadline : DateTime,
    oldDeadline : DateTime,
    freeDays: number,
}

/** The function is a wrapper for literal methods to format & convert different datatypes to 
 * string types for literal usage. Currently formats:
 *      Luxon DateTime object to string with formatTime formatter
*/
export function literalWrapper(func: (...args: any[]) => any) {
    return function(...args: any[]) {
        for (const i in args) { 
            let arg=args[i];
            if(typeof arg === "object") {
                for (let a in arg) {
                    if (arg[a] instanceof DateTime) {
                        args[i][a] = formatTime(arg[a]);
                    }
                }
            }
        };
        return func(...args.map(arg=> (arg instanceof DateTime)? formatTime(arg): arg));
    }
}

interface EmailLiterals {
    readonly greeting: (name: string) => string,
    readonly subject: (type?:string, a?: string, success?: boolean, t?: DateTime) => string,
    readonly body: (params: Partial<BodyParams>) => string[],
}

interface Literals {
    default: EmailLiterals,
    summary: EmailLiterals,
    refund: Record<"beyond" | "unused" | "received" | "approved" ,EmailLiterals>,
    request: Record<"beyond" | "unused" | "global" | "approved" , EmailLiterals>,
}

const defaultLiterals: EmailLiterals = {
    greeting : (name: string) => `Hi ${name}`,
    subject: literalWrapper(lit.emailSubject),
    body: () => [],
};

const summaryLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: () => `Late day summary`,
}


const refundBeyondLiteral: EmailLiterals = {
    ...defaultLiterals,
    body: literalWrapper(lit.refBeyondBody),
}
const refundUnusedLiteral: EmailLiterals = {
    ...defaultLiterals,
    body: literalWrapper(lit.refUnusedBody),
}
const refundReceiveLiteral: EmailLiterals = {
    ...defaultLiterals,
    body: literalWrapper(lit.refRecBody),
}
const refundApproveLiteral: EmailLiterals = {
    ...defaultLiterals,
    body: literalWrapper(lit.refAppBody),
}

const requestBeyondLiteral: EmailLiterals = {
    ...defaultLiterals,
    body: literalWrapper(lit.reqBeyondBody),
}
const requestUnusedLiteral: EmailLiterals = {
    ...defaultLiterals,
    body: literalWrapper(lit.reqUnusedBody),
}
const requestGlobalLiteral: EmailLiterals = {
    ...defaultLiterals,
    body: literalWrapper(lit.reqGloBody),
}
const requestApproveLiteral: EmailLiterals = {
    ...defaultLiterals,
    body: literalWrapper(lit.reqAppBody),
}


const literal : Literals = {
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
}

export default literal;
