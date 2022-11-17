import { Assignment, auth_token } from "../../config/config"; 
import config from "../../config/config";
import { timeDiff } from "../time";
import studentInfoQuery from "./queries/studentInfo.graphql";
import courseInfoQuery from "./queries/courseInfo.graphql";
import * as queryTypes from './queryTypes';
import { idOfEmail } from "../form";


const endpoint = 'https://canvas.umn.edu/api/graphql'
const courseId = '365541'

// Refunds all the days if possible 
// else the regular flow (with manual approval)
// get studentId
export function getSubmissions(studentIds: String[], assignment: String) {
  const variables = {
    courseId: courseId,
		studentIds: studentIds,
  }
  console.log(studentIds)
  const graphQLClient = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      authorization: `Bearer ${auth_token}`,
    },
    payload: JSON.stringify({query : courseInfoQuery, variables: variables}),
  })

  const data : queryTypes.CourseInfoQueryType = JSON.parse(graphQLClient.getContentText()).data
	var submissions = data.course?.submissionsConnection?.nodes
	var difference = []
	for (const [k, va] of Object.entries(submissions || {})) {
    var assignmentName = va?.assignment?.name as Assignment
		if (assignmentName == assignment) {
			difference.push(timeDiff(va?.submittedAt, config.assignments[assignmentName].deadline))
		}
	}
	var refund = difference.reduce((p, v) => p + v, 0)
  console.log(refund)
}

export function fetchAndWriteUsers(sheet: GoogleAppsScript.Spreadsheet.Sheet) {

  const graphQLClient = UrlFetchApp.fetch(endpoint, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      authorization: `Bearer ${auth_token}`,
    },
    payload: JSON.stringify({query : studentInfoQuery, variables: {courseId: courseId}}),
  })
  const data : queryTypes.StudInfoQueryType = JSON.parse(graphQLClient.getContentText()).data
  var roster = data.course?.usersConnection?.nodes || []
  var values = []
  for (var user of roster) {
    if (user != undefined) {
      values.push([idOfEmail(user.loginId || ''), user.email, user._id, user.name])
    }
  }
  sheet.getRange(2, 1, values.length, values[0].length).setValues(values)
  console.log("Roster sheet updated.")
}
