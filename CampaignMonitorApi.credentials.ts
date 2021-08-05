import {
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class CampaignMonitorApi implements ICredentialType {
	name = 'campaignMonitorApi';
	displayName = 'Campaign Monitor API';
	documentationUrl = 'campaignmonitor';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			default: '',
		},
	];
}
