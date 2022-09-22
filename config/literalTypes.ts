import * as lit from './literals'

export interface BodyParams {
    assignment : string,
    numOfDays : number,
    leftDays: number,
    newDeadline : string,
    oldDeadline : string,
    freeDayMsg: string[],
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
    body: lit.refBeyondBody,
}
const refundUnusedLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: lit.refundRejSubject,
    body: lit.refUnusedBody,
}
const refundReceiveLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: lit.refundRecSubject,
    body: lit.refRecBody,
}
const refundApproveLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: lit.refundAppSubject,
    body: lit.refAppBody,
}

const requestBeyondLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: lit.requestRejSubject,
    body: lit.reqBeyondBody,
}
const requestUnusedLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: lit.requestRejSubject,
    body: lit.reqUnusedBody,
}
const requestGlobalLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: lit.requestRejSubject,
    body: lit.reqGloBody,
}
const requestApproveLiteral: EmailLiterals = {
    ...defaultLiterals,
    subject: lit.requestAppSubject,
    body: lit.reqAppBody,
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
