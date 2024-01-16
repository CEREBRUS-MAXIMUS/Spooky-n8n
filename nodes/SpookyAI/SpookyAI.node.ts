import {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

const axios = require('axios');
const { DateTime } = require('luxon');

async function queryHuman(apiKey: string, agentID: string, agentName: string, query: string, metadata = '', timeout = 86400) {
	const SPOOKY_URL = 'https://cerebrus-prod-eastus.azurewebsites.net/'; // Replace with your actual Spooky URL

	// Get the current Unix timestamp
	const current_time = DateTime.local().toSeconds();

	// Make a unique ID for the query with the userID and timestamp
	const queryID = `${apiKey}-${current_time}`;

	const data = {
		apiKey: apiKey,
		query: query,
		queryID: queryID,
		agentID: agentID,
		agentName: agentName,
		metadata: metadata,
	};

	const headers = {
		'Content-Type': 'application/json',
	};

	const url = `${SPOOKY_URL}queryHuman`;

	const start_time = Date.now();

	while (true) {
		try {
			const response = await axios.post(url, data, { headers: headers, timeout: timeout * 1000 });
			if (response.status === 200) {
				console.log('Success:', response.data);
				return response.data;
			} else {
				console.log('Error:', response.data);
				return response.data;
			}
		} catch (error) {
			console.log('Request failed:', error.message);
		}

		const elapsed_time = Date.now() - start_time;
		if (elapsed_time > timeout * 1000) {
			console.log('Timeout occurred');
			return 'Timeout occurred';
		}

		// Add a sleep to avoid constant retries and reduce server load
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
}

export class QueryHumanNode implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Query Human',
		name: 'queryHuman',
		group: ['transform'],
		version: 1,
		description: 'Basic Node for Querying Humans',
		defaults: {
			name: 'Query Human',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			{
				displayName: 'Query Text',
				name: 'queryText',
				type: 'string',
				default: '',
				placeholder: 'Enter your query',
				description: 'The text of the query to ask the human.',
			},
			{
				displayName: 'Metadata',
				name: 'metadata',
				type: 'string',
				default: '',
				placeholder: 'Enter metadata (optional)',
				description: 'All relevant information about the query, including context and consequences.',
			},
			{
				displayName: 'Timeout (seconds)',
				name: 'timeout',
				type: 'number',
				default: 86400,
				description: 'The maximum amount of time to wait for a response from the human, in seconds. Defaults to 24 hours.',
			},
			// New properties for API key, agent ID, and agent name
			{
				displayName: 'API Key',
				name: 'apiKey',
				type: 'string',
				default: '',
				description: 'The API key for authentication.',
			},
			{
				displayName: 'Agent ID',
				name: 'agentID',
				type: 'string',
				default: '',
				description: 'The ID of the agent making the query.',
			},
			{
				displayName: 'Agent Name',
				name: 'agentName',
				type: 'string',
				default: '',
				description: 'The name of the agent making the query.',
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're calling the `queryHuman` function.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const queryText = this.getNodeParameter('queryText', 0, '') as string;
		const metadata = this.getNodeParameter('metadata', 0, '') as string;
		const timeout = this.getNodeParameter('timeout', 0, 86400) as number;
		const apiKey = this.getNodeParameter('apiKey', 0, '') as string;
		const agentID = this.getNodeParameter('agentID', 0, '') as string;
		const agentName = this.getNodeParameter('agentName', 0, '') as string;

		try {
			const response = await queryHuman(apiKey, agentID, agentName, queryText, metadata, timeout);
			// Do something with the response if needed
			console.log(response);

			// // You might want to update the items with the response data
			// for (const item of items) {
			// 	// Update item with response data
			// 	// Example: item.json['response'] = response;
			// }
		} catch (error) {
			// Handle errors
			console.error(error);
			throw new NodeOperationError(this.getNode(), error);
		}

		return this.prepareOutputData(items);
	}
}
