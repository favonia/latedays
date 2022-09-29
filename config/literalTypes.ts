import * as lit from './literals'
import {format as formatTime } from "../src/time";
import { DateTime } from 'luxon';

export interface BodyParams {
    assignment : string,
    numOfDays : number,
    leftDays: number,
    newDeadline : DateTime,
    oldDeadline : DateTime,
    freeDays: number,
}

// A wrapper function to convert any time variable in any literal to a specified format
// Can add wrappers for Number literals etc on this
function timeFormatLiteral(func: (...args: any[]) => any) {
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
    readonly subject: (a?: string, t?: string) => string,
    readonly body: (params: Partial<BodyParams>) => string[],
    readonly footer: string,
}

interface Literals {
    summary: EmailLiterals,
    refund: Record<"beyond" | "unused" | "received" | "approved" ,EmailLiterals>,
    request: Record<"beyond" | "unused" | "global" | "approved" , EmailLiterals>,
}

const defaultLiterals: EmailLiterals = {
    greeting : (name: string) => `Hi ${name}`,
    subject: () => ``,
    body: () => [],
    footer: ``,
};

const summaryLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: () => `Late day summary`,
}


const refundBeyondLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: lit.refundRejSubject,
    body: timeFormatLiteral(lit.refBeyondBody),
}
const refundUnusedLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: lit.refundRejSubject,
    body: timeFormatLiteral(lit.refUnusedBody),
}
const refundReceiveLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: lit.refundRecSubject,
    body: timeFormatLiteral(lit.refRecBody),
}
const refundApproveLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: lit.refundAppSubject,
    body: timeFormatLiteral(lit.refAppBody),
}

const requestBeyondLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: lit.requestRejSubject,
    body: timeFormatLiteral(lit.reqBeyondBody),
}
const requestUnusedLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: lit.requestRejSubject,
    body: timeFormatLiteral(lit.reqUnusedBody),
}
const requestGlobalLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: lit.requestRejSubject,
    body: timeFormatLiteral(lit.reqGloBody),
}
const requestApproveLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: lit.requestAppSubject,
    body: timeFormatLiteral(lit.reqAppBody),
}


const literal : Literals = {
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
