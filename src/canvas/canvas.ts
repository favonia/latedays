import config from "../../config/config";
import studentInfoQuery from "./queries/studentInfo.graphql";
import courseInfoQuery from "./queries/courseInfo.graphql";
import * as queryTypes from "./queryTypes";
import { idOfEmail } from "../form";

const endpoint = "https://canvas.umn.edu/api/graphql";
const courseId = config.canvas.courseId;
const auth_token = config.canvas.auth_token;

/**
 * Makes the API call and fetches the submission data for a set of student Ids in an assignment
 * @param studentIds Student Ids (Canvas Ids)
 * @param assignment Assignment name (the same as in canvas)
 * @returns A map of <student id, submission time> for the given assignment & students
 */
export function getSubmissions(
  studentIds: String[],
  assignment: String
): Map<string, string> {
  const variables = {
    courseId: courseId,
    studentIds: studentIds,
  };
  const graphQLClient = UrlFetchApp.fetch(endpoint, {
    method: "post",
    contentType: "application/json",
    headers: {
      authorization: `Bearer ${auth_token}`,
    },
    payload: JSON.stringify({ query: courseInfoQuery, variables: variables }),
  });

  const data: queryTypes.CourseInfoQueryType = JSON.parse(
    graphQLClient.getContentText()
  ).data;
  var submissions = data.course?.submissionsConnection?.nodes;
  let returnSubmissions = new Map<string, string>();
  for (const [k, va] of Object.entries(submissions || [])) {
    var assignmentName = va?.assignment?.name;
    if (va?.user && assignmentName == assignment && va?.submittedAt) {
      returnSubmissions.set(va.user?._id, va.submittedAt);
    }
  }
  return returnSubmissions;
}

/**
 * Makes an API call to fetch the roster for the current course and writes it to the given sheet
 * @param sheet Roster sheet
 */
export function fetchAndWriteUsers(sheet: GoogleAppsScript.Spreadsheet.Sheet) {
  const graphQLClient = UrlFetchApp.fetch(endpoint, {
    method: "post",
    contentType: "application/json",
    headers: {
      authorization: `Bearer ${auth_token}`,
    },
    payload: JSON.stringify({
      query: studentInfoQuery,
      variables: { courseId: courseId },
    }),
  });
  const data: queryTypes.StudInfoQueryType = JSON.parse(
    graphQLClient.getContentText()
  ).data;
  var roster = data.course?.usersConnection?.nodes || [];
  var values = [];
  for (var user of roster) {
    if (user != undefined) {
      let id = "-";
      try {
        id = idOfEmail(user.loginId || "");
      } catch {
        // if user login is not a valid email id; could be a bot
      }
      values.push([id, user.email, user._id, user.name]);
    }
  }
  sheet.getRange(2, 1, values.length, values[0].length).setValues(values);
  console.log("Roster sheet updated.");
}
