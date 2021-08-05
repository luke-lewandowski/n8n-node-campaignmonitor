# Campaign Monitor Node for n8n

The purpose of this node is to integrate n8n with Campaign Monitor.

## Credentials

This node supports API Key credentials only. Please see [Campaign Monitor's documentation](https://www.campaignmonitor.com/api/getting-started/#authenticating-api-key) for details.

## Scope

This node doesn't implement all that's available with Campaign Monitor. Instead, it focuses on;

1. Getting and sending _campaigns_.
2. Creating and adding subscribers to the _lists_.
3. Sending _transactional_ emails.

## Setup

We are using `n8n-node-dev` to prepare our code for it to be deployed to `.n8n/custom` folder on your n8n installation.

- Run `npm run build` to get package prepared to `dist/` folder.
- Run `npm run serve` to get your local instance setup and ready with this node installed. Note: It requires `docker` and `docker-compose` installed.

## Remarks

- Due to an issue where the n8n node modules were not found when a custom node is mounted to `custom` folder. I'm having to move `node_modules` folder together with the built n8n node code.

## License

MIT
