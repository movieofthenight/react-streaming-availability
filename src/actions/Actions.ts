"use server";

import * as streamingAvailability from "streaming-availability";
import {Api} from "../libraries/Api";

export async function getShowById(params: streamingAvailability.GetShowRequest): Promise<streamingAvailability.Show> {
	return Api.getClient().showsApi.getShow(params);
}

export async function searchShowsByFilters(params: streamingAvailability.SearchShowsByFiltersRequest): Promise<streamingAvailability.SearchResult> {
	return Api.getClient().showsApi.searchShowsByFilters(params);
}

export async function searchShowsByTitle(params: streamingAvailability.SearchShowsByTitleRequest): Promise<streamingAvailability.Show[]> {
	return Api.getClient().showsApi.searchShowsByTitle(params);
}

export async function getTopShows(params: streamingAvailability.GetTopShowsRequest): Promise<streamingAvailability.Show[]> {
	return Api.getClient().showsApi.getTopShows(params);
}

export async function getChanges(params: streamingAvailability.GetChangesRequest): Promise<streamingAvailability.ChangesResult> {
	return Api.getClient().changesApi.getChanges(params);
}
