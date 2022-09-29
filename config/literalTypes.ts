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
export function timeFormatLiteral(func: (...args: any[]) => any) {
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
    readonly footer: string,
}

interface Literals {
    default: EmailLiterals,
    summary: EmailLiterals,
    refund: Record<"beyond" | "unused" | "received" | "approved" ,EmailLiterals>,
    request: Record<"beyond" | "unused" | "global" | "approved" , EmailLiterals>,
}

const defaultLiterals: EmailLiterals = {
    greeting : (name: string) => `Hi ${name}`,
    subject: timeFormatLiteral(lit.emailSubject),
    body: () => [],
    footer: ``,
};

const summaryLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: () => `Late day summary`,
}


const refundBeyondLiteral: EmailLiterals = {
    ...defaultLiterals,
    body: timeFormatLiteral(lit.refBeyondBody),
}
const refundUnusedLiteral: EmailLiterals = {
    ...defaultLiterals,
    body: timeFormatLiteral(lit.refUnusedBody),
}
const refundReceiveLiteral: EmailLiterals = {
    ...defaultLiterals,
    body: timeFormatLiteral(lit.refRecBody),
}
const refundApproveLiteral: EmailLiterals = {
    ...defaultLiterals,
    body: timeFormatLiteral(lit.refAppBody),
}

const requestBeyondLiteral: EmailLiterals = {
    ...defaultLiterals,
    body: timeFormatLiteral(lit.reqBeyondBody),
}
const requestUnusedLiteral: EmailLiterals = {
    ...defaultLiterals,
    body: timeFormatLiteral(lit.reqUnusedBody),
}
const requestGlobalLiteral: EmailLiterals = {
    ...defaultLiterals,
    body: timeFormatLiteral(lit.reqGloBody),
}
const requestApproveLiteral: EmailLiterals = {
    ...defaultLiterals,
    body: timeFormatLiteral(lit.reqAppBody),
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
