import { Assignment, auth_token } from "../../config/config"; 
import config from "../../config/config";
import { GraphQLClient } from 'graphql-request';
import { timeDiff } from "../time";
import * as queries from './queries';
import * as queryTypes from './queryTypes';


// Refunds all the days if possible 
// else the regular flow (with manual approval)
// get studentId
async function getSubmissions() {
  const endpoint = 'https://canvas.umn.edu/api/graphql'
  const graphQLClient = new GraphQLClient(endpoint, {
    headers: {
      authorization: `Bearer ${auth_token}`,
    },
  })
  const query = queries.courseInfoQuery

  const variables = {
    courseId: 0,
		studentIds: 0,
  }

  const data : queryTypes.CourseInfoQueryType = await graphQLClient.request(query, variables)
	var submissions = data.course?.submissionsConnection?.nodes
	var difference = []
	for (const [k, va] of Object.entries(submissions || {})) {
    var assignmentName = va?.assignment?.name as Assignment
		if (assignmentName in config.assignments) {
			difference.push(timeDiff(va?.submittedAt, config.assignments[assignmentName].deadline))
		}
	}
	var refund = difference.reduce((p, v) => p + v, 0)
  console.log(refund)
}

