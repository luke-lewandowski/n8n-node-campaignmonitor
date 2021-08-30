import { IExecuteFunctions } from "n8n-core";

import {
  IDataObject,
  ILoadOptionsFunctions,
  INodeExecutionData,
  INodePropertyOptions,
  INodeType,
  INodeTypeDescription,
} from "n8n-workflow";

import {
  campaignMonitorApiRequest,
  campaignMonitorApiRequestAllItems,
  validateJSON,
} from "./GenericFunctions";

interface ILocation {
  latitude?: number;
  longitude?: number;
}

interface ICreateMemberBody {
  EmailAddress: string;
  Name: string;
  Resubscribe: boolean;
  RestartSubscriptionBasedAutoresponders: boolean;
  ConsentToTrack: "Yes" | "No";
  CustomFields?: IDataObject[];
}

export class CampaignMonitor implements INodeType {
  description: INodeTypeDescription = {
    displayName: "CampaignMonitor",
    name: "campaignmonitor",
    icon: "file:campaignMonitor.svg",
    group: ["output"],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: "Consume Campaign Monitor API",
    defaults: {
      name: "CampaignMonitor",
      color: "#000000",
    },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "campaignMonitorApi",
        required: true,
        displayOptions: {
          show: {
            authentication: ["apiKey"],
          },
        },
      },
    ],
    properties: [
      {
        displayName: "Authentication",
        name: "authentication",
        type: "options",
        options: [
          {
            name: "API Key",
            value: "apiKey",
          },
        ],
        default: "apiKey",
        description: "Method of authentication.",
      },
      {
        displayName: "Client",
        name: "client",
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getClients",
        },
        default: "",
        description: "List of Clients",
      },
      {
        displayName: "Resource",
        name: "resource",
        type: "options",
        options: [
          {
            name: "Campaign",
            value: "campaign",
          },
          {
            name: "Subscriber",
            value: "member",
          },
          {
            name: "Transactional Email",
            value: "transactional",
          },
        ],
        displayOptions: {
          hide: {
            client: [""],
          },
        },
        default: "campaign",
        required: true,
        description: "Resource to consume.",
      },
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        required: true,
        displayOptions: {
          show: {
            resource: ["member"],
          },
        },
        options: [
          {
            name: "Create",
            value: "create",
            description: "Create a new subscriber on list",
          },
          {
            name: "Delete",
            value: "delete",
            description: "Delete a subscriber on list",
          },
          {
            name: "Get",
            value: "get",
            description: "Get a subscriber on list",
          },
          {
            name: "Get All",
            value: "getAll",
            description: "Get all subscriber on list",
          },
          {
            name: "Update",
            value: "update",
            description: "Update a new subscriber on list",
          },
        ],
        default: "create",
        description: "The operation to perform.",
      },
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        required: true,
        displayOptions: {
          show: {
            resource: ["campaign"],
          },
        },
        options: [
          {
            name: "Delete",
            value: "delete",
            description: "Delete a campaign",
          },
          {
            name: "Get",
            value: "get",
            description: "Get a campaign",
          },
          {
            name: "Get All",
            value: "getAll",
            description: "Get all the campaigns",
          },
          {
            name: "Send",
            value: "send",
            description: "Send a campaign",
          },
        ],
        default: "getAll",
        description: "The operation to perform.",
      },
      /* -------------------------------------------------------------------------- */
      /*                                 member:create                              */
      /* -------------------------------------------------------------------------- */
      {
        displayName: "List",
        name: "list",
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getLists",
        },
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["create"],
          },
        },
        default: "",
        options: [],
        required: true,
        description: "List of lists",
      },
      {
        displayName: "Email",
        name: "email",
        type: "string",
        required: true,
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["create"],
          },
        },
        default: "",
        description: "Email address for a subscriber.",
      },
      {
        displayName: "Name",
        name: "name",
        type: "string",
        required: true,
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["create"],
          },
        },
        default: "",
        description: "Name of a subscriber.",
      },
      {
        displayName: "Resubscribe",
        name: "resubscribe",
        type: "boolean",
        default: true,
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["create"],
          },
        },
      },
      {
        displayName: "Restart auto responders",
        name: "restartSubscriptionBasedAutoresponders",
        type: "boolean",
        default: false,
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["create"],
          },
        },
      },
      {
        displayName: "Consent to track",
        name: "consentToTrack",
        type: "boolean",
        default: true,
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["create"],
          },
        },
      },
      {
        displayName: "JSON Parameters",
        name: "jsonParameters",
        type: "boolean",
        default: false,
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["create"],
          },
        },
      },
      {
        displayName: "Custom Fields",
        name: "mergeFieldsUi",
        placeholder: "Add Custom Fields",
        type: "fixedCollection",
        default: {},
        typeOptions: {
          multipleValues: true,
        },
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["create"],
            jsonParameters: [false],
          },
        },
        description: "An individual custom field and value for a subscriber.",
        options: [
          {
            name: "mergeFieldsValues",
            displayName: "Field",
            typeOptions: {
              multipleValueButtonText: "Add Custom Field",
            },
            values: [
              {
                displayName: "Field Name",
                name: "name",
                type: "string",
                required: true,
                description: "Custom field name.",
                default: "",
              },
              {
                displayName: "Field Value",
                name: "value",
                required: true,
                type: "string",
                default: "",
                description: "Custom field value.",
              },
            ],
          },
        ],
      },
      {
        displayName: "Custom Fields",
        name: "mergeFieldsJson",
        type: "json",
        typeOptions: {
          alwaysOpenEditWindow: true,
        },
        default: "",
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["create"],
            jsonParameters: [true],
          },
        },
      },
      /* -------------------------------------------------------------------------- */
      /*                                 member:delete                              */
      /* -------------------------------------------------------------------------- */
      {
        displayName: "List",
        name: "list",
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getLists",
        },
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["delete"],
          },
        },
        default: "",
        options: [],
        required: true,
        description: "List of lists",
      },
      {
        displayName: "Email",
        name: "email",
        type: "string",
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["delete"],
          },
        },
        default: "",
        required: true,
        description: `Member's email`,
      },
      /* -------------------------------------------------------------------------- */
      /*                                 member:get                                 */
      /* -------------------------------------------------------------------------- */
      {
        displayName: "List",
        name: "list",
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getLists",
        },
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["get"],
          },
        },
        default: "",
        options: [],
        required: true,
        description: "List of lists",
      },
      {
        displayName: "Email",
        name: "email",
        type: "string",
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["get"],
          },
        },
        default: "",
        required: true,
        description: `Member's email`,
      },
      /* -------------------------------------------------------------------------- */
      /*                                 member:getAll                              */
      /* -------------------------------------------------------------------------- */
      {
        displayName: "List",
        name: "list",
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getLists",
        },
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["getAll"],
          },
        },
        default: "",
        options: [],
        required: true,
        description: "List of lists",
      },
      {
        displayName: "Return All",
        name: "returnAll",
        type: "boolean",
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["getAll"],
          },
        },
        default: false,
        description:
          "If all results should be returned or only up to a given limit.",
      },
      {
        displayName: "Limit",
        name: "limit",
        type: "number",
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["getAll"],
            returnAll: [false],
          },
        },
        typeOptions: {
          minValue: 1,
          maxValue: 1000,
        },
        default: 500,
        description: "How many results to return.",
      },
      {
        displayName: "Options",
        name: "options",
        type: "collection",
        placeholder: "Add Option",
        default: {},
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["getAll"],
          },
        },
        options: [
          {
            displayName: "Before Last Changed",
            name: "beforeLastChanged",
            type: "dateTime",
            default: "",
            description:
              "Restrict results to subscribers whose information changed before the set timeframe.",
          },
          {
            displayName: "Before Timestamp Opt",
            name: "beforeTimestampOpt",
            type: "dateTime",
            default: "",
            description:
              "Restrict results to subscribers who opted-in before the set timeframe",
          },
          {
            displayName: "Email Type",
            name: "emailType",
            type: "options",
            options: [
              {
                name: "HTML",
                value: "html",
              },
              {
                name: "Text",
                value: "text",
              },
            ],
            default: "",
            description: "Type of email this member asked to get",
          },
          {
            displayName: "Status",
            name: "status",
            type: "options",
            options: [
              {
                name: "Subscribed",
                value: "subscribed",
              },
              {
                name: "Unsubscribed",
                value: "unsubscribed",
              },
              {
                name: "Cleaned",
                value: "cleaned",
              },
              {
                name: "Pending",
                value: "pending",
              },
              {
                name: "Transactional",
                value: "transactional",
              },
            ],
            default: "",
            description: `Subscriber's current status.`,
          },
          {
            displayName: "Since Last Changed",
            name: "sinceLastChanged",
            type: "dateTime",
            default: "",
            description:
              "Restrict results to subscribers whose information changed after the set timeframe.",
          },
        ],
      },
      /* -------------------------------------------------------------------------- */
      /*                                 member:update                              */
      /* -------------------------------------------------------------------------- */
      {
        displayName: "List",
        name: "list",
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getLists",
        },
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["update"],
          },
        },
        default: "",
        options: [],
        required: true,
        description: "List of lists",
      },
      {
        displayName: "Email",
        name: "email",
        type: "string",
        required: true,
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["update"],
          },
        },
        default: "",
        description: "Email address of the subscriber.",
      },
      {
        displayName: "Name",
        name: "name",
        type: "string",
        required: true,
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["update"],
          },
        },
        default: "",
        description: "Name of a subscriber.",
      },
      {
        displayName: "Resubscribe",
        name: "resubscribe",
        type: "boolean",
        default: true,
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["update"],
          },
        },
      },
      {
        displayName: "Restart auto responders",
        name: "restartSubscriptionBasedAutoresponders",
        type: "boolean",
        default: false,
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["update"],
          },
        },
      },
      {
        displayName: "Consent to track",
        name: "consentToTrack",
        type: "boolean",
        default: true,
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["update"],
          },
        },
      },
      {
        displayName: "JSON Parameters",
        name: "jsonParameters",
        type: "boolean",
        default: false,
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["update"],
          },
        },
      },
      {
        displayName: "Custom Fields",
        name: "mergeFieldsUi",
        placeholder: "Add Custom Fields",
        type: "fixedCollection",
        default: {},
        typeOptions: {
          multipleValues: true,
        },
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["update"],
            jsonParameters: [false],
          },
        },
        description: "An individual custom field and value for a subscriber.",
        options: [
          {
            name: "mergeFieldsValues",
            displayName: "Field",
            typeOptions: {
              multipleValueButtonText: "Add Custom Field",
            },
            values: [
              {
                displayName: "Field Name",
                name: "name",
                type: "string",
                required: true,
                description: "Custom field name.",
                default: "",
              },
              {
                displayName: "Field Value",
                name: "value",
                required: true,
                type: "string",
                default: "",
                description: "Custom field value.",
              },
            ],
          },
        ],
      },
      {
        displayName: "Custom Fields",
        name: "mergeFieldsJson",
        type: "json",
        typeOptions: {
          alwaysOpenEditWindow: true,
        },
        default: "",
        displayOptions: {
          show: {
            resource: ["member"],
            operation: ["update"],
            jsonParameters: [true],
          },
        },
      },
      /* -------------------------------------------------------------------------- */
      /*                                 campaign:getAll                            */
      /* -------------------------------------------------------------------------- */
      {
        displayName: "Status",
        name: "campaignStatus",
        type: "options",
        required: true,
        displayOptions: {
          show: {
            resource: ["campaign"],
            operation: ["getAll"],
          },
        },
        options: [
          {
            name: "Sent",
            value: "sent",
            description: "Sent campaigns",
          },
          {
            name: "Scheduled",
            value: "scheduled",
            description: "Scheduled campaigns",
          },
        ],
        default: "sent",
        description: "Select campaigns status",
      },
      /* -------------------------------------------------------------------------- */
      /*                                 campaign:send                              */
      /* -------------------------------------------------------------------------- */
      {
        displayName: "Campaign",
        name: "campaign",
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getCampaigns",
        },
        displayOptions: {
          show: {
            resource: ["campaign"],
            operation: ["send", "get", "delete"],
          },
        },
        required: true,
        default: "",
        description: "List of Campaigns",
      },
      {
        displayName: "Email",
        name: "email",
        type: "string",
        required: true,
        displayOptions: {
          show: {
            resource: ["campaign"],
            operation: ["send"],
          },
        },
        default: "",
        description: "Email address of where to send confirmation email.",
      },
      /* -------------------------------------------------------------------------- */
      /*                                 transactional                      */
      /* -------------------------------------------------------------------------- */
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        required: true,
        displayOptions: {
          show: {
            resource: ["transactional"],
          },
        },
        options: [
          {
            name: "Send",
            value: "send",
            description: "Send transaction email",
          },
        ],
        default: "send",
        description: "The operation to perform.",
      },
      /* -------------------------------------------------------------------------- */
      /*                                 transactional:send                         */
      /* -------------------------------------------------------------------------- */
      {
        displayName: "Smart Email",
        name: "smartEmail",
        type: "options",
        typeOptions: {
          loadOptionsMethod: "getSmartEmails",
        },
        displayOptions: {
          show: {
            resource: ["transactional"],
            operation: ["send", "stats"],
          },
        },
        required: true,
        default: "",
        description: "List of Smart Emails",
      },
      {
        displayName: "Email",
        name: "email",
        type: "string",
        required: true,
        displayOptions: {
          show: {
            resource: ["transactional"],
            operation: ["send"],
          },
          hide: {
            smartEmail: [""],
          },
        },
        default: "",
        description:
          "Email address to where transactional email will be sent to.",
      },
      {
        displayName: "CC Email",
        name: "ccemail",
        type: "string",
        required: false,
        displayOptions: {
          show: {
            resource: ["transactional"],
            operation: ["send"],
          },
          hide: {
            smartEmail: [""],
          },
        },
        default: "",
        description:
          "Email address to where transactional email will be CC to.",
      },
      {
        displayName: "BCC Email",
        name: "bccemail",
        type: "string",
        required: false,
        displayOptions: {
          show: {
            resource: ["transactional"],
            operation: ["send"],
          },
          hide: {
            smartEmail: [""],
          },
        },
        default: "",
        description:
          "Email address to where transactional email will be BCC'd to.",
      },
      {
        displayName: "Custom Fields",
        name: "smartEmailFields",
        placeholder: "Add Custom Fields",
        type: "fixedCollection",
        default: {},
        typeOptions: {
          multipleValues: true,
        },
        displayOptions: {
          show: {
            resource: ["transactional"],
            operation: ["send"],
          },
          hide: {
            smartEmail: [""],
          },
        },
        description: "An individual custom field and value for a subscriber.",
        options: [
          {
            name: "smartEmailFieldsValues",
            displayName: "Field",
            typeOptions: {
              multipleValueButtonText: "Add Custom Field",
              loadOptionsMethod: "getSmartEmailCustomFields",
            },
            values: [
              {
                displayName: "Field Name",
                name: "name",
                type: "options",
                typeOptions: {
                  loadOptionsMethod: "getSmartEmailCustomFields",
                },
                required: true,
                default: "",
                description: "Custom field name.",
              },
              {
                displayName: "Field Value",
                name: "value",
                required: true,
                type: "string",
                default: "",
                description: "Custom field value.",
              },
            ],
          },
        ],
      },
    ],
  };

  methods = {
    loadOptions: {
      // Get all the available lists to display them to user so that he can
      // select them easily
      async getClients(
        this: ILoadOptionsFunctions
      ): Promise<INodePropertyOptions[]> {
        const returnData: INodePropertyOptions[] = [];
        const lists = await campaignMonitorApiRequest.call(
          this,
          "/clients.json",
          "GET",
          "clients"
        );
        console.log(JSON.stringify(lists));
        for (const list of lists) {
          const listName = list.Name;
          const listId = list.ClientID;
          returnData.push({
            name: listName,
            value: listId,
          });
        }
        return returnData;
      },

      // Get all the available lists to display them to user so that he can
      // select them easily
      async getLists(
        this: ILoadOptionsFunctions
      ): Promise<INodePropertyOptions[]> {
        const clientId = this.getCurrentNodeParameter("client");
        const returnData: INodePropertyOptions[] = [];

        if (!clientId) {
          return returnData;
        }

        const lists = await campaignMonitorApiRequest.call(
          this,
          `/clients/${clientId}/lists.json`,
          "GET"
        );
        for (const list of lists) {
          const listName = list.Name;
          const listId = list.ListID;
          returnData.push({
            name: listName,
            value: listId,
          });
        }
        return returnData;
      },

      // Get all smart emails available in the CampaignMonitor account
      async getSmartEmails(
        this: ILoadOptionsFunctions
      ): Promise<INodePropertyOptions[]> {
        const clientId = this.getCurrentNodeParameter("client");
        const returnData: INodePropertyOptions[] = [];

        if (!clientId) {
          return returnData;
        }

        const lists = await campaignMonitorApiRequest.call(
          this,
          `/transactional/smartEmail?status=active&clientID=${clientId}`,
          "GET"
        );
        for (const list of lists) {
          const listName = list.Name;
          const listId = list.ID;
          returnData.push({
            name: listName,
            value: listId,
          });
        }
        return returnData;
      },

      async getSmartEmailCustomFields(
        this: ILoadOptionsFunctions
      ): Promise<INodePropertyOptions[]> {
        const smartEmailId = this.getCurrentNodeParameter("smartEmail");
        const returnData: INodePropertyOptions[] = [];

        if (!smartEmailId) {
          return returnData;
        }

        const smartEmail = await campaignMonitorApiRequest.call(
          this,
          `/transactional/smartEmail/${smartEmailId}`,
          "GET"
        );

        if (smartEmail?.Properties?.Content?.EmailVariables.length > 0) {
          const lists = smartEmail?.Properties?.Content?.EmailVariables;
          for (const list of lists) {
            returnData.push({
              name: list,
              value: list,
            });
          }
        }

        return returnData;
      },

      // Get all the available campaigns to display them to users so that they can select them easily
      async getCampaigns(
        this: ILoadOptionsFunctions
      ): Promise<INodePropertyOptions[]> {
        const client = this.getCurrentNodeParameter("client");
        const returnData: INodePropertyOptions[] = [];

        if (!client) {
          return returnData;
        }

        const sentCampaigns = await campaignMonitorApiRequest.call(
          this,
          `/clients/${client}/campaigns.json`,
          "GET"
        );

        const draftCampaigns = await campaignMonitorApiRequest.call(
          this,
          `/clients/${client}/drafts.json`,
          "GET"
        );

        for (const campaign of sentCampaigns) {
          const campaignName = campaign.Name;
          const campaignId = campaign.CampaignID;
          returnData.push({
            name: campaignName,
            value: campaignId,
          });
        }

        for (const campaign of draftCampaigns) {
          const campaignName = campaign.Name;
          const campaignId = campaign.CampaignID;
          returnData.push({
            name: campaignName,
            value: campaignId,
          });
        }

        return returnData;
      },
    },
  };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData();
    const returnData: IDataObject[] = [];
    const length = items.length as unknown as number;
    let responseData;
    const qs: IDataObject = {};
    const resource = this.getNodeParameter("resource", 0) as string;
    const operation = this.getNodeParameter("operation", 0) as string;

    for (let i = 0; i < length; i++) {
      try {
        if (resource === "member") {
          //https://www.campaignmonitor.com/api/subscribers/#adding-a-subscriber
          if (operation === "create") {
            const listId = this.getNodeParameter("list", i) as string;
            const email = this.getNodeParameter("email", i) as string;
            const name = this.getNodeParameter("name", i) as string;
            const consentToTrack = this.getNodeParameter(
              "consentToTrack",
              i
            ) as boolean;
            const resubscribe = this.getNodeParameter(
              "resubscribe",
              i
            ) as boolean;
            const restartSubscriptionBasedAutoresponders =
              this.getNodeParameter(
                "restartSubscriptionBasedAutoresponders",
                i
              ) as boolean;
            const jsonActive = this.getNodeParameter(
              "jsonParameters",
              i
            ) as IDataObject;

            const body: ICreateMemberBody = {
              Name: name,
              EmailAddress: email,
              ConsentToTrack: consentToTrack ? "Yes" : "No",
              RestartSubscriptionBasedAutoresponders:
                restartSubscriptionBasedAutoresponders,
              Resubscribe: resubscribe,
            };
            if (!jsonActive) {
              const mergeFieldsValues = (
                this.getNodeParameter("mergeFieldsUi", i) as IDataObject
              ).mergeFieldsValues as IDataObject[];
              if (mergeFieldsValues) {
                const mergeFields: {
                  Key: string;
                  Value: string;
                }[] = [];
                for (let i = 0; i < mergeFieldsValues.length; i++) {
                  // @ts-ignore
                  mergeFields.push({
                    Key: mergeFieldsValues[i].name as string,
                    Value: mergeFieldsValues[i].value as string,
                  });
                }
                body.CustomFields = mergeFields;
              }
            } else {
              const mergeFieldsJson = validateJSON(
                this.getNodeParameter("mergeFieldsJson", i) as string
              );

              if (mergeFieldsJson) {
                body.CustomFields = mergeFieldsJson;
              }
            }
            responseData = await campaignMonitorApiRequest.call(
              this,
              `/subscribers/${listId}.json`,
              "POST",
              body
            );
          }
          //https://www.campaignmonitor.com/api/subscribers/#deleting-a-subscriber
          if (operation === "delete") {
            const listId = this.getNodeParameter("list", i) as string;
            const email = this.getNodeParameter("email", i) as string;

            responseData = await campaignMonitorApiRequest.call(
              this,
              `/subscribers/${listId}.json?email=${email}`,
              "DELETE"
            );
            responseData = { success: true };
          }
          //https://www.campaignmonitor.com/api/subscribers/#getting-subscribers-details
          if (operation === "get") {
            const listId = this.getNodeParameter("list", i) as string;
            const email = this.getNodeParameter("email", i) as string;

            responseData = await campaignMonitorApiRequest.call(
              this,
              `/subscribers/${listId}.json?email=${email}&includetrackingpreference=true`,
              "GET",
              {},
              qs
            );
          }
          //https://www.campaignmonitor.com/api/lists/#active-subscribers
          if (operation === "getAll") {
            const listId = this.getNodeParameter("list", i) as string;

            responseData = await campaignMonitorApiRequestAllItems.call(
              this,
              `/lists/${listId}/active.json`,
              "GET",
              "Results"
            );
          }
          //https://www.campaignmonitor.com/api/subscribers/#updating-a-subscriber
          if (operation === "update") {
            const listId = this.getNodeParameter("list", i) as string;
            const email = this.getNodeParameter("email", i) as string;
            const name = this.getNodeParameter("name", i) as string;
            const jsonActive = this.getNodeParameter(
              "jsonParameters",
              i
            ) as IDataObject;

            const body: ICreateMemberBody = {
              Name: name,
              EmailAddress: email,
              ConsentToTrack: "Yes",
              RestartSubscriptionBasedAutoresponders: false,
              Resubscribe: true,
            };
            if (!jsonActive) {
              const mergeFieldsValues = (
                this.getNodeParameter("mergeFieldsUi", i) as IDataObject
              ).mergeFieldsValues as IDataObject[];
              if (mergeFieldsValues) {
                const mergeFields: {
                  Key: string;
                  Value: string;
                }[] = [];
                for (let i = 0; i < mergeFieldsValues.length; i++) {
                  // @ts-ignore
                  mergeFields.push({
                    Key: mergeFieldsValues[i].name as string,
                    Value: mergeFieldsValues[i].value as string,
                  });
                }
                body.CustomFields = mergeFields;
              }
            } else {
              const mergeFieldsJson = validateJSON(
                this.getNodeParameter("mergeFieldsJson", i) as string
              );

              if (mergeFieldsJson) {
                body.CustomFields = mergeFieldsJson;
              }
            }
            responseData = await campaignMonitorApiRequest.call(
              this,
              `/subscribers/${listId}.json?email=${encodeURI(email)}`,
              "PUT",
              body
            );
          }
        }
        if (resource === "campaign") {
          //https://mailchimp.com/developer/api/marketing/campaigns/list-campaigns/
          if (operation === "getAll") {
            const status = this.getNodeParameter("campaignStatus", i) as string;
            const client = this.getNodeParameter("client", i) as string;

            if (status === "sent") {
              responseData = await campaignMonitorApiRequest.call(
                this,
                `/clients/${client}/campaigns.json`,
                "GET"
              );
            }
            if (status === "scheduled") {
              responseData = await campaignMonitorApiRequest.call(
                this,
                `/clients/${client}/scheduled.json`,
                "GET"
              );
            }
          }
          //https://www.campaignmonitor.com/api/campaigns/#sending-draft-campaign
          if (operation === "send") {
            const campaignId = this.getNodeParameter("campaign", i) as string;
            const email = this.getNodeParameter("email", i) as string;
            responseData = await campaignMonitorApiRequest.call(
              this,
              `/campaigns/${campaignId}/send.json`,
              "POST",
              {
                ConfirmationEmail: email,
                SendDate: "Immediately",
              }
            );
            responseData = { success: true };
          }
          //https://www.campaignmonitor.com/api/campaigns/#campaign-summary
          if (operation === "get") {
            const campaignId = this.getNodeParameter("campaign", i) as string;
            responseData = await campaignMonitorApiRequest.call(
              this,
              `/campaigns/${campaignId}/summary.json`,
              "GET",
              {}
            );
          }
          //https://www.campaignmonitor.com/api/campaigns/#deleting-a-campaign
          if (operation === "delete") {
            const campaignId = this.getNodeParameter("campaign", i) as string;
            responseData = await campaignMonitorApiRequest.call(
              this,
              `/campaigns/${campaignId}.json`,
              "DELETE",
              {}
            );
          }
        }

        // Sending all transactional emails etc.
        if (resource === "transactional") {
          //https://www.campaignmonitor.com/api/transactional/#send-smart-email
          if (operation === "send") {
            const smartEmail = this.getNodeParameter("smartEmail", i) as string;
            const email = this.getNodeParameter("email", i) as string;
            const ccemail = this.getNodeParameter("ccemail", i) as string;
            const bccemail = this.getNodeParameter("bccemail", i) as string;

            const body = {
              To: [email],
              CC: ccemail ? [ccemail] : null,
              BCC: bccemail ? [bccemail] : null,
              Data: {},
              AddRecipientsToList: false,
              ConsentToTrack: "Yes",
            };

            const smartEmailFields = (
              this.getNodeParameter("smartEmailFields", i) as IDataObject
            ).smartEmailFieldsValues as IDataObject[];
            if (smartEmailFields) {
              for (let i = 0; i < smartEmailFields.length; i++) {
                //@ts-ignore
                body.Data[smartEmailFields[i].name as string] =
                  smartEmailFields[i].value as string;
              }
            }

            responseData = await campaignMonitorApiRequest.call(
              this,
              `/transactional/smartEmail/${smartEmail}/send`,
              "POST",
              body
            );
          }
        }

        if (Array.isArray(responseData)) {
          returnData.push.apply(returnData, responseData as IDataObject[]);
        } else {
          returnData.push(responseData as IDataObject);
        }
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({ error: error.message });
          continue;
        }
        throw error;
      }
    }
    return [this.helpers.returnJsonArray(returnData)];
  }
}
