## Canvas Integrations
[GraphQL](https://graphql.org/) is used to access the Canvas APIs for integration into the app. The in-browser IDE to explore the APIs for the UMN Canvas can be found [here](https://canvas.umn.edu/graphiql).

### Development
#### Accessing user token
Generate [developer keys](https://community.canvaslms.com/t5/Admin-Guide/How-do-I-obtain-an-API-access-token-in-the-Canvas-Data-Portal/ta-p/157) and paste them in
`config/config.ts`
`src/canvas/codegen.yml`

#### Writing typed GraphQL queries
[Graphql-codegen](https://www.the-guild.dev/graphql/codegen) package for typescript is used to generate types for different query responses based on the schema defined at https://canvas.umn.edu/api/graphql.
To write more graphql queries, add the new queries in the [queries](./queries) folder and run the following command (one-time during development).
```
npm run graphql-codegen
```
This will generate a `./queryTypes.ts` file with required types. The query response to be used is now strongly typed! 

### Production
#### Fetching class roster
Run the `fetchRoster` function in the Google Apps Script any number of times to fetch and overwrite the latest class roster details in the spreadsheet. These details will be present in a sheet called _Roster Sheet_ in the same google sheet that is the destination for the google form.
To enable Canvas functionalities, run atleast one time after the script-init.

#### Auto Refund of unused late days
For any assignment, use the `canvasEnabled` flag in [config file](../../config/sample.ts) to enable automated refund of the late days. [WIP]
