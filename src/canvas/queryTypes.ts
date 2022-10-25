

export type CourseInfoQueryType = { __typename?: 'Query', course: { __typename?: 'Course', submissionsConnection: { __typename?: 'SubmissionConnection', nodes: Array<{ __typename?: 'Submission', submittedAt: any | null, assignment: { __typename?: 'Assignment', name: string | null } | null } | null> | null } | null } | null };

export type StudInfoQueryType = { __typename?: 'Query', course: { __typename?: 'Course', name: string, usersConnection: { __typename?: 'UserConnection', nodes: Array<{ __typename?: 'User', _id: string, email: string | null, loginId: string | null, name: string | null, sisId: string | null } | null> | null } | null } | null };
