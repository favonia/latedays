import { Assignment } from "../config/config";
import { fromISO as newTime, addDays, Time } from "./time";
import * as sheet from "./sheet";
import * as form from "./form";
import config, { isAssignment } from "../config/config";
import literal from "../literals/literalTypes";

type UpdateSummary = {
  remainingDays: number,
  comments?: string[],
  usage: Array<{
    assignment: Assignment,
    free: number,
    used: number,
  }>,
};

export type Response = {
  assignment : Assignment,
  success?: boolean,
  review?: boolean,
  state: Partial<Record<"old" | "new", {deadline: Time, used: number}>>,
  updateSummary: UpdateSummary,
  freeDays?: string[],
  comments?: string[],
};

function formatSummary(entry: sheet.Entry): UpdateSummary {
  const latedays: UpdateSummary = {
    remainingDays: 0,
    usage: [],
  };
  Object.entries(entry.days).forEach(([assign, days]) => {
    if ((days.used + days.free > 0) && isAssignment(assign)) {
      latedays.usage.push({
        assignment: assign,
        free: days.free,
        used: days.used
      });
    }
  });

  latedays.remainingDays =
    config.policy.maxLateDays -
    Object.values(entry.days)
      .map((days) => days.used)
      .reduce((a, b) => a + b, 0);

  return latedays;
}

export function updateAndRespond(entry: sheet.Entry, request: form.Request): Response {
  const assignment = request.assignment;
  const deadline = newTime(config.assignments[assignment].deadline);

  const remaining =
    config.policy.maxLateDays -
    Object.values(entry.days)
      .map((days) => days.used)
      .reduce((a, b) => a + b, 0);

  const used = entry.days[assignment].used;
  const free = entry.days[assignment].free;
  let resp : Response = {
    assignment: assignment,
    state: {
      "old": {deadline: deadline, used: used},
    },
  } as Response;

  switch (request.action.act) {
    case "summary":
      resp.comments = literal.summary.body({});
      break;

    case "refund": {
      // refund
      const newDeadlineWithoutFreeDays = addDays(
        deadline,
        Math.max(0, used - request.action.days)
      );

      switch (true) {
        case request.time > addDays(deadline, config.policy.refundPeriodInDays):
          resp.success= false;
          resp.comments= literal.refund.beyond.body({
            assignment: assignment,
            oldDeadline: addDays(deadline, config.policy.refundPeriodInDays)
          })
          break;

        case used === 0:
          resp.success= false;
          resp.comments= literal.refund.unused.body({assignment: assignment, oldDeadline: deadline});
          break;

        case request.time > newDeadlineWithoutFreeDays:
          resp.comments= literal.refund.received.body({numOfDays: request.action.days});
          break;

        default: {
          resp.success= true;
          entry.days[assignment].used = Math.max(0, used - request.action.days);
          const newDeadline = addDays(
            deadline,
            Math.max(0, used - request.action.days) + free
          );
          resp.state.new = {
            deadline: newDeadline,
            used: entry.days[assignment].used
          };
          resp.comments= literal.refund.approved.body({
            assignment: assignment,
            numOfDays: Math.min(used,request.action.days),
            oldDeadline: deadline,
            newDeadline: newDeadline,
            freeDays: free,
          });
        }
      }
      break;
    }

    case "request": {
      switch (true) {
        case request.time >
          addDays(deadline, config.policy.requestPeriodInDays):
          resp.success= false;
          resp.comments= literal.request.beyond.body({
            assignment: assignment,
            oldDeadline: addDays(deadline, config.policy.requestPeriodInDays),
          });
          break;

        case request.action.days < used:
          resp.success= false;
          resp.comments= literal.request.unused.body({numOfDays: used});
          break;

        case request.action.days - used > remaining:
          resp.success= false;
          resp.comments= literal.request.global.body({
            assignment: assignment, 
            numOfDays: request.action.days,
            leftDays: remaining
          });
          break;

        default: {
          entry.days[assignment].used = request.action.days;
          const newDeadline = addDays(deadline, request.action.days + free);
          resp.success= true;
          resp.state.new = {
            deadline: newDeadline,
            used: entry.days[assignment].used
          };
          resp.comments = literal.request.approved.body({
            assignment: assignment,
            numOfDays: request.action.days,
            oldDeadline: deadline,
            newDeadline: newDeadline,
            freeDays: free,
          });
          break;
        }
      }
    }

    default: {}
  }
  resp.updateSummary = formatSummary(entry);
  return resp;
}
