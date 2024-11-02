import * as streamingAvailability from "streaming-availability";
import type {FetchParams, RequestContext} from "streaming-availability";

class CacheMiddleware implements streamingAvailability.Middleware {
	constructor(private cacheDurationInSeconds?: number) {}
	pre(context: RequestContext): Promise<FetchParams | void> {
		const anyContext = context as any;
		if (anyContext.init.next === undefined) {
			anyContext.init.next = {};
		}
		anyContext.init.next.revalidate = this.cacheDurationInSeconds
		return Promise.resolve(context);
	}
}

let client: streamingAvailability.Client | undefined;

/**
 * The API client for the Streaming Availability API.
 *
 * Uses the STREAMING_AVAILABILITY_API_KEY environment variable
 * to authenticate requests.
 *
 * If used within Next.js, API responses will be cached for 1 hour.
 */
export class Api {

	/**
	 * Get the API client for the Streaming Availability API.
	 *
	 * @returns The API client.
	 */
	static getClient(): streamingAvailability.Client {
		if (!client) {
			const apiKey = process.env["STREAMING_AVAILABILITY_API_KEY"];
			if (!apiKey) {
				throw new Error("Missing STREAMING_AVAILABILITY_API_KEY environment variable");
			}
			client = new streamingAvailability.Client(new streamingAvailability.Configuration({
				middleware: [new CacheMiddleware(3600)],
				apiKey: apiKey
			}));
		}
		return client;
	}
}
