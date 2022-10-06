import { auth_token } from "../config/config"; 
import config from "../config/config";
import { GraphQLClient, gql } from 'graphql-request'
import { fromISO as newTime, timeDiff } from "./time";

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

  const query = gql`
    query courseInfo($courseId: ID!, $studentIds: [ID!]) {
			course(id: $courseId) {
			submissionsConnection(studentIds: $studentIds) {
				nodes {
					submittedAt
					assignment {
						name
					}
				}
			}
		}
  `

  const variables = {
    courseId: 0,
		studentIds: 0,
  }


  const data = await graphQLClient.request(query, variables)
	var submissions = data.submissionsConnection.nodes
	var difference = []
	for (const [k, va] of Object.entries(submissions)) {
		if (va.assignment.name in config.assignments) {
			difference.push(timeDiff(va.submittedAt,config.assignments[va.assignment.name].deadline));
		}
	}
	var refund = difference.reduce((p, v) => p + v, 0)
  console.log(refund)
}

