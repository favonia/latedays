import { gql } from 'graphql-request'

export const courseInfoQuery = gql`
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
}
`

export const studentInfoQuery = gql`
  query studInfo($courseId: ID!) {
      course(id: $courseId) {
        name
        usersConnection {
          nodes {
            _id
            email
            loginId
            name
            sisId
          }
        }
      }
    }
`;
