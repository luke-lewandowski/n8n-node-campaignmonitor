import { OptionsWithUrl } from "request";

import {
  IExecuteFunctions,
  IExecuteSingleFunctions,
  IHookFunctions,
  ILoadOptionsFunctions,
} from "n8n-core";

import { IDataObject, NodeApiError, NodeOperationError } from "n8n-workflow";

export async function campaignMonitorApiRequest(
  this:
    | IHookFunctions
    | IExecuteFunctions
    | IExecuteSingleFunctions
    | ILoadOptionsFunctions,
  endpoint: string,
  method: string,
  body: any = {},
  qs: IDataObject = {},
  headers?: object
): Promise<any> {
  // tslint:disable-line:no-any
  const authenticationMethod = this.getNodeParameter(
    "authentication",
    0
  ) as string;

  const host = "api.createsend.com/api/v3.2";

  const options: OptionsWithUrl = {
    headers: {
      Accept: "application/json",
    },
    method,
    qs,
    body,
    url: ``,
    json: true,
  };

  if (Object.keys(body).length === 0) {
    delete options.body;
  }

  try {
    if (authenticationMethod === "apiKey") {
      const credentials = await this.getCredentials("campaignMonitorApi");

      if (credentials === undefined) {
        throw new NodeOperationError(
          this.getNode(),
          "No credentials got returned!"
        );
      }

      const apiKey = `${credentials.apiKey}:`;
      const B64ApiKey = Buffer.from(apiKey, "utf-8").toString("base64");

      options.headers = Object.assign({}, headers, {
        Authorization: `Basic ${B64ApiKey}`,
      });
      options.url = `https://${host}${endpoint}`;

      return await this.helpers.request!(options);
    }
  } catch (error) {
    throw new NodeApiError(this.getNode(), error);
  }
}

export async function campaignMonitorApiRequestAllItems(
  this: IExecuteFunctions | ILoadOptionsFunctions,
  endpoint: string,
  method: string,
  propertyName: string,
  body: any = {},
  query: IDataObject = {}
): Promise<any> {
  // tslint:disable-line:no-any

  const returnData: IDataObject[] = [];
  let totalNumberOfPages = 1;
  let pageNumber = 1;

  let responseData;

  //https://api.createsend.com/api/v3.2/lists/{listid}/active.{xml|json}
  //?page={pagenumber}
  //&pagesize={pagesize}
  //&orderfield={email|name|date}
  //&orderdirection={asc|desc}
  //&includetrackingpreference={true|false}

  query.page = 1;
  query.pageSize = 500;
  query.orderfield = "email";
  query.orderdirection = "asc";
  query.includetrackingpreference = "true";

  do {
    responseData = await campaignMonitorApiRequest.call(
      this,
      endpoint,
      method,
      body,
      query
    );
    returnData.push.apply(returnData, responseData[propertyName]);

    totalNumberOfPages = responseData.TotalNumberOfRecords;
    pageNumber = responseData.PageNumber;
    query.page++;
  } while (
    responseData[propertyName] &&
    responseData[propertyName]?.length > 0 &&
    pageNumber === totalNumberOfPages
  );

  return returnData;
}

export function validateJSON(json: string | undefined): any {
  // tslint:disable-line:no-any
  let result;
  try {
    result = JSON.parse(json!);
  } catch (exception) {
    result = "";
  }
  return result;
}
