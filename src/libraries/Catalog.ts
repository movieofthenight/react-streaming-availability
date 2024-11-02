/**
 * The type of streaming option for a catalog.
 *
 * "subscription" represents a catalog that is available with a paid subscription.
 *
 * "free" represents a catalog that is available with a free account.
 *
 * "buy" represents the catalog of items that are available for purchase.
 *
 * "rent" represents the catalog of items that are available for rent.
 *
 * "addon" represents the catalog of items that are available as an add-on to a subscription
 * such as Amazon Prime Video Channels.
 */
export type StreamingOptionType = "subscription" | "free" | "buy" | "rent" | "addon";

/**
 * A catalog represents a streaming catalog in a country.
 *
 * If it only contains a service, it represents all the catalogs for that service.
 *
 * E.g. "netflix" represents the whole Netflix catalog.
 *
 * "prime" represents the whole Amazon Prime Video catalog including
 * Amazon Prime Video Channels and buyable/rentable content.
 *
 * If it contains a service and a streaming option type, it represents
 * the catalog for that service and streaming option type.
 *
 * E.g. "prime" and "subscription" represents the Amazon Prime Video catalog
 * that is free to watch with a Prime subscription.
 *
 * "prime" and "buy" represents the Amazon Prime Video catalog that is buyable.
 *
 * "peacock" and "free" represents the Peacock catalog that is free to watch
 * without a premium subscription.
 *
 * If it contains a service, "addon" as the streamingOptionType, and an addon,
 * it represents the catalog of that addon for that service.
 *
 * E.g. "prime" "addon" "hbomaxus" combo represents the catalog of HBO Max Amazon Prime Video Channel.
 */
export interface Catalog {
	/**
	 * Id of the main streaming service of the catalog
	 *
	 * @see {@link https://docs.movieofthenight.com/guide/countries-and-services} to get the list of services and their ids.
	 * @see {@link https://docs.movieofthenight.com/resource/countries}
	 */
	service: string
	/**
	 * The type of streaming option for the catalog.
	 * If not provided, it represents all the streaming options for the catalog.
	 */
	streamingOptionType?: StreamingOptionType
	/**
	 * If the catalog is an addon, the id of the addon.
	 */
	addon?: string
}

/**
 * Creates a catalog from a string.
 *
 * The string should be in the format of "service.streamingOptionType.addon".
 */
export function catalogFromString(text: string): Catalog {
	const res = text.split(".", 3);
	if (res.length === 0) {
		throw new Error(`Invalid catalog string ${text}`);
	}

	let streamingOptionType: StreamingOptionType | undefined;
	if (res.length >= 2) {
		if (res[1] !== "subscription" && res[1] !== "free" && res[1] !== "buy" && res[1] !== "rent" && res[1] !== "addon") {
			throw new Error(`Invalid streaming option type ${res[1]}`);
		}
		streamingOptionType = res[1] as StreamingOptionType;
	}

	return {
		service: res[0]!,
		streamingOptionType: streamingOptionType,
		addon: res.at(2)
	}
}
