## Canvas Integrations
[GraphQL](https://graphql.org/) is used to access the Canvas APIs for integration into the app. The in-browser IDE to explore the APIs for the UMN Canvas can be found [here](https://canvas.umn.edu/graphiql).

#### Accessing user token
Generate [developer keys](https://community.canvaslms.com/t5/Admin-Guide/How-do-I-obtain-an-API-access-token-in-the-Canvas-Data-Portal/ta-p/157) and paste them in
`config/config.ts`
`src/canvas/codegen.yml`

#### Writing typed GraphQL queries
[Graphql-codegen](https://www.the-guild.dev/graphql/codegen) package for typescript is used to generate types for different query responses based on the schema defined at https://canvas.umn.edu/api/graphql.
To write more graphql queries, add the new queries in the [queries](./queries.ts) file and run the following command (one-time during development).
```
npm run graphql-codegen
```
This will generate a `./queryTypes.ts` file with required types. The query response to be used is now strongly typed! 