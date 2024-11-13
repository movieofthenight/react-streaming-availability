import * as streamingAvailability from "streaming-availability";
import {type Catalog, catalogFromString} from "./Catalog";
import {
	getChanges,
	getShowById,
	getTopShows,
	searchShowsByFilters,
	searchShowsByTitle
} from "../actions/Actions";

/**
 * A source represents a way to get a list of shows
 * to display in {@link Grid} or {@link Row}.
 *
 * @see {@link IdSetSource}
 * @see {@link TitleSearchSource}
 * @see {@link FilteredSearchSource}
 * @see {@link TopShowsSource}
 * @see {@link ChangesSource}
 * @see {@link SequentialMultiSource}
 * @see {@link RoundRobinMultiSource}
 * @see {@link RandomMultiSource}
 *
 * @category Sources
 */
export interface Source {
	type: string
}

export function sourceToFetcher(source: Source): SourceFetcher {
	switch (source.type) {
		case IdSetSourceFetcher.type:
			return new IdSetSourceFetcher(source as IdSetSource);
		case TitleSearchSourceFetcher.type:
			return new TitleSearchSourceFetcher(source as TitleSearchSource);
		case FilteredSearchSourceFetcher.type:
			return new FilteredSearchSourceFetcher(source as FilteredSearchSource);
		case TopShowsSourceFetcher.type:
			return new TopShowsSourceFetcher(source as TopShowsSource);
		case ChangesSourceFetcher.type:
			return new ChangesSourceFetcher(source as ChangesSource);
		case SequentialMultiSourceFetcher.type:
			return new SequentialMultiSourceFetcher(source as SequentialMultiSource);
		case RoundRobinMultiSourceFetcher.type:
			return new RoundRobinMultiSourceFetcher(source as RoundRobinMultiSource);
		case RandomMultiSourceFetcher.type:
			return new RandomMultiSourceFetcher(source as RandomMultiSource);
		default:
			throw new Error(`Unknown source type: ${source.type}`);
	}
}

export interface SourceItem {
	show: streamingAvailability.Show;
	country: string;
	change?: streamingAvailability.Change;
	priorityCatalogs?: Catalog[];
}

export interface SourceFetcher {
	fetch(): Promise<SourceItem | undefined>;
}

abstract class BufferedSource implements SourceFetcher {

	private buffer: SourceItem[] = [];
	private finished = false;

	async fetch(): Promise<SourceItem | undefined> {
		if (this.finished) {
			return undefined
		}

		if (this.buffer.length === 0) {
			this.buffer = await this.bufferedFetch();
		}

		if (this.buffer.length === 0) {
			this.finished = true;
			return undefined;
		}

		return this.buffer.shift();
	}

	abstract bufferedFetch(): Promise<SourceItem[]>;
}

abstract class OneShotBufferedSource extends BufferedSource {

	private fetched = false;

	async bufferedFetch(): Promise<SourceItem[]> {
		if (this.fetched) {
			return [];
		}
		this.fetched = true;
		return this.oneShotFetch();
	}

	abstract oneShotFetch(): Promise<SourceItem[]>;
}

/**
 * The properties of the IdSetSource.
 *
 * @see {@link https://docs.movieofthenight.com/resource/shows#get-a-show}
 *
 * @category Sources
 */
export interface IdSetSourceProps {
	/**
	 * The ids of the shows to fetch.
	 *
	 * The ids are popped from the array in order.
	 *
	 * You can use IMDb, TMDB, and Streaming Availability API ids.
	 *
	 * @example The Batman (IMDB)
	 * "tt1877830"
	 * @example The Batman (TMDB)
	 * "movie/414906"
	 * @example The Queen's Gambit (IMDB)
	 * "tt10048342"
	 * @example The Queen's Gambit (TMDB)
	 * "tv/87739"
	 */
	ids: string[];
	/**
	 * 2-letter country code to display the streaming availability information accordingly.
	 *
	 * E.g. if you set it to "us",
	 * the shows will be displayed with
	 * their streaming availability information in the US.
	 *
	 * @see {@link https://docs.movieofthenight.com/guide/countries-and-services} for the list of supported countries.
	 *
	 * @example "us"
	 * @example "gb"
	 */
	country: string;
}

/**
 * A source that returns a list of shows by their ids.
 *
 * @see {@link newIdSetSource}
 * @see {@link https://docs.movieofthenight.com/resource/shows#get-a-show}
 *
 * @category Sources
 */
export interface IdSetSource extends Source, IdSetSourceProps {}

/**
 * Create a new IdSetSource.
 *
 * @see {@link https://docs.movieofthenight.com/resource/shows#get-a-show}
 *
 * @param props The properties of the IdSetSource.
 * @returns The IdSetSource.
 *
 * @category Sources
 */
export function newIdSetSource(props: IdSetSourceProps): IdSetSource {
	return {
		type: IdSetSourceFetcher.type,
		...props
	}
}

export class IdSetSourceFetcher implements SourceFetcher {

	static type = "IdSetSource";

	constructor(private props: IdSetSourceProps) {}

	async fetch(): Promise<SourceItem | undefined> {
		const id = this.props.ids.shift();
		if (!id) {
			return undefined;
		}

		const show = await getShowById({
			country: this.props.country,
			id: id
		});

		return {show: show, country: this.props.country};
	}
}

/**
 * The properties of the TitleSearchSource.
 *
 * @see {@link https://docs.movieofthenight.com/resource/shows#search-shows-by-title}
 *
 * @category Sources
 */
export interface TitleSearchSourceProps extends streamingAvailability.SearchShowsByTitleRequest {
	/**
	 * The maximum number of shows to fetch.
	 */
	limit?: number;
}

/**
 * A source that returns a list of shows by searching for their title.
 *
 * @see {@link newTitleSearchSource}
 * @see {@link https://docs.movieofthenight.com/resource/shows#search-shows-by-title}
 *
 * @category Sources
 */
export interface TitleSearchSource extends Source, TitleSearchSourceProps {}

/**
 * Create a new TitleSearchSource.
 *
 * @see {@link https://docs.movieofthenight.com/resource/shows#search-shows-by-title}
 *
 * @param props The properties of the TitleSearchSource.
 * @returns The TitleSearchSource.
 *
 * @category Sources
 */
export function newTitleSearchSource(props: TitleSearchSourceProps): TitleSearchSource {
	return {
		type: TitleSearchSourceFetcher.type,
		...props
	}
}

export class TitleSearchSourceFetcher extends OneShotBufferedSource {

	static type = "TitleSearchSource";

	constructor(private props: TitleSearchSourceProps) {
		super();
	}

	async oneShotFetch(): Promise<SourceItem[]> {
		const shows = await searchShowsByTitle({
			seriesGranularity: streamingAvailability.SearchShowsByFiltersSeriesGranularityEnum.Show,
			...this.props
		});
		return shows.slice(0, this.props.limit)
			.map((show) => ({show: show, country: this.props.country}));
	}
}

/**
 * The properties of the FilteredSearchSource.
 *
 * @see {@link https://docs.movieofthenight.com/resource/shows#search-shows-by-filters}
 *
 * @category Sources
 */
export interface FilteredSearchSourceProps extends streamingAvailability.SearchShowsByFiltersRequest {
	/**
	 * The maximum number of shows to fetch.
	 */
	limit?: number;
}

/**
 * A source that returns a list of shows by filtering them.
 *
 * @see {@link newFilteredSearchSource}
 * @see {@link https://docs.movieofthenight.com/resource/shows#search-shows-by-filters}
 *
 * @category Sources
 */
export interface FilteredSearchSource extends Source, FilteredSearchSourceProps {}

/**
 * Create a new FilteredSearchSource.
 *
 * @see {@link https://docs.movieofthenight.com/resource/shows#search-shows-by-filters}
 *
 * @param props The properties of the FilteredSearchSource.
 * @returns The FilteredSearchSource.
 *
 * @category Sources
 */
export function newFilteredSearchSource(props: FilteredSearchSourceProps): FilteredSearchSource {
	return {
		type: FilteredSearchSourceFetcher.type,
		...props
	}
}

export class FilteredSearchSourceFetcher extends BufferedSource {

	static type = "FilteredSearchSource";

	private cursor: string | undefined = undefined;
	private hasMore = true;
	private alreadySent: number = 0;

	constructor(private props: FilteredSearchSourceProps) {
		super();
	}

	getPriorityCatalogs(): Catalog[] | undefined {
		return this.props.catalogs?.map(catalogFromString);
	}

	async bufferedFetch(): Promise<SourceItem[]> {
		if (!this.hasMore) {
			return [];
		}

		const result = await searchShowsByFilters({
			seriesGranularity: streamingAvailability.SearchShowsByFiltersSeriesGranularityEnum.Show,
			cursor: this.cursor,
			...this.props
		});

		const howMany = this.props.limit ? Math.min(this.props.limit - this.alreadySent, result.shows.length) : result.shows.length;
		this.alreadySent += howMany;

		if (this.props.limit && this.alreadySent >= this.props.limit) {
			this.hasMore = false;
		} else {
			this.cursor = result.nextCursor;
			this.hasMore = result.hasMore;
		}

		return result.shows.slice(0, howMany).map((show) => ({show: show, country: this.props.country, priorityCatalogs: this.getPriorityCatalogs()}))
	}
}

/**
 * The properties of the TopShowsSource.
 *
 * @see {@link https://docs.movieofthenight.com/resource/shows#get-top-shows}
 *
 * @category Sources
 */
export type TopShowsSourceProps = streamingAvailability.GetTopShowsRequest

/**
 * A source that returns a list of top shows in the given streaming service.
 *
 * Supported streaming services are
 * Netflix (`netflix`),
 * Amazon Prime Video (`prime`),
 * Disney+ (`disney`),
 * Apple TV+ (`apple`),
 * and Max (`hbo`)
 *
 * @see {@link newTopShowsSource}
 * @see {@link https://docs.movieofthenight.com/resource/shows#get-top-shows}
 *
 * @category Sources
 */
export interface TopShowsSource extends Source, TopShowsSourceProps {}

/**
 * Create a new TopShowsSource.
 *
 * @see {@link https://docs.movieofthenight.com/resource/shows#get-top-shows}
 *
 * @param props The properties of the TopShowsSource.
 * @returns The TopShowsSource.
 *
 * @category Sources
 */
export function newTopShowsSource(props: TopShowsSourceProps): TopShowsSource {
	return {
		type: TopShowsSourceFetcher.type,
		...props
	}
}

export class TopShowsSourceFetcher extends OneShotBufferedSource {

	static type = "TopShowsSource";

	constructor(private props: TopShowsSourceProps) {
		super();
	}

	getPriorityCatalogs(): Catalog[] | undefined {
		return [{
			service: this.props.service,
		}]
	}

	async oneShotFetch(): Promise<SourceItem[]> {
		const shows = await getTopShows(this.props);
		return shows.map((show) => ({show: show, country: this.props.country, priorityCatalogs: this.getPriorityCatalogs()}));
	}

}

/**
 * The properties of the ChangesSource.
 *
 * @see {@link https://docs.movieofthenight.com/resource/changes#get-changes}
 *
 * @category Sources
 */
export interface ChangesSourceProps extends streamingAvailability.GetChangesRequest {
	limit?: number;
}

/**
 * A source that returns a list of changes in the given streaming catalogs.
 *
 * @see {@link newChangesSource}
 * @see {@link https://docs.movieofthenight.com/resource/changes#get-changes}
 *
 * @category Sources
 */
export interface ChangesSource extends Source, ChangesSourceProps {}

/**
 * Create a new ChangesSource.
 *
 * @see {@link https://docs.movieofthenight.com/resource/changes#get-changes}
 *
 * @param props The properties of the ChangesSource.
 * @returns The ChangesSource.
 *
 * @category Sources
 */
export function newChangesSource(props: ChangesSourceProps): ChangesSource {
	return {
		type: ChangesSourceFetcher.type,
		...props
	}
}

export class ChangesSourceFetcher extends BufferedSource {

	static type = "ChangesSource";

	private cursor: string | undefined = undefined;
	private hasMore = true;
	private alreadySent: number = 0;

	constructor(private props: ChangesSourceProps) {
		super();
	}

	async bufferedFetch(): Promise<SourceItem[]> {
		if (!this.hasMore) {
			return [];
		}

		const result = await getChanges({
			cursor: this.cursor,
			...this.props
		});

		const howMany = this.props.limit ? Math.min(this.props.limit - this.alreadySent, result.changes.length) : result.changes.length;
		this.alreadySent += howMany;
		if (this.props.limit && this.alreadySent >= this.props.limit) {
			this.hasMore = false;
		} else {
			this.cursor = result.nextCursor;
			this.hasMore = result.hasMore;
		}
		return result.changes.slice(0, howMany)
			.filter((change) => result.shows[change.showId] !== undefined)
			.map((change) => ({show: result.shows[change.showId]!, country: this.props.country, change: change}));
	}
}

/**
 * @category Sources
 */
export interface SequentialMultiSourceProps {
	/**
	 * The sources to aggregate.
	 */
	sources: Source[];
}

/**
 * A source that aggregates multiple sources together.
 **
 * The sources are used in the order they are provided,
 * SequentialMultiSource does not fetch from the next source
 * until the current source is exhausted.
 *
 * E.g. if the given sources are [A, B, C],
 * SequentialMultiSource will fetch from A until it is exhausted,
 * then fetch from B until it is exhausted,
 * then fetch from C until it is exhausted.
 *
 * @see {@link newSequentialMultiSource}
 *
 * @category Sources
 */
export interface SequentialMultiSource extends Source, SequentialMultiSourceProps {}

/**
 * Create a new SequentialMultiSource.
 *
 * @param props The properties of the SequentialMultiSource.
 * @returns The SequentialMultiSource.
 *
 * @category Sources
 */
export function newSequentialMultiSource(props: SequentialMultiSourceProps): SequentialMultiSource {
	return {
		type: SequentialMultiSourceFetcher.type,
		...props
	}
}

class SequentialMultiSourceFetcher implements SourceFetcher {

	static type = "SequentialMultiSource";

	private readonly sources: SourceFetcher[];

	constructor(props: SequentialMultiSourceProps) {
		this.sources = props.sources.map(sourceToFetcher);
	}

	async fetch(): Promise<SourceItem | undefined> {
		for (const source of this.sources) {
			const item = await source.fetch();
			if (item) {
				return item;
			}
		}
		return undefined;
	}
}

/**
 * @category Sources
 */
export interface RoundRobinMultiSourceProps {
	/**
	 * The sources to aggregate.
	 */
	sources: Source[];
}

/**
 * A source that aggregates multiple sources together.
 *
 * The sources are used in a round-robin fashion.
 *
 * E.g. if the given sources are [A, B, C],
 * RoundRobinMultiSource will fetch from A, then B, then C, then A, then B, then C, and so on.
 *
 * @see {@link newRoundRobinMultiSource}
 *
 * @category Sources
 */
export interface RoundRobinMultiSource extends Source, RoundRobinMultiSourceProps {}

/**
 * Create a new RoundRobinMultiSource.
 *
 * @param props The properties of the RoundRobinMultiSource.
 * @returns The RoundRobinMultiSource.
 *
 * @category Sources
 */
export function newRoundRobinMultiSource(props: RoundRobinMultiSourceProps): RoundRobinMultiSource {
	return {
		type: RoundRobinMultiSourceFetcher.type,
		...props
	}
}

class RoundRobinMultiSourceFetcher implements SourceFetcher {

	static type = "MultiRoundRobinSource";

	private currentSourceIndex = 0;

	private readonly sources: SourceFetcher[];

	constructor(props: RoundRobinMultiSourceProps) {
		this.sources = props.sources.map(sourceToFetcher);
	}

	async fetch(): Promise<SourceItem | undefined> {
		return this.innerFetch(0);
	}

	async innerFetch(count: number): Promise<SourceItem | undefined> {
		if (count >= this.sources.length) {
			return undefined;
		}

		const item = await this.sources[this.currentSourceIndex]!.fetch();
		this.currentSourceIndex = (this.currentSourceIndex + 1) % this.sources.length;
		if (item) {
			return item;
		}
		return this.innerFetch(count + 1);
	}
}

/**
 * @category Sources
 */
export interface RandomMultiSourceProps {
	/**
	 * The sources to aggregate.
	 */
	sources: Source[];
}

/**
 * A source that aggregates multiple sources together.
 *
 * The sources are used in a random fashion.
 *
 * E.g. if the given sources are [A, B, C],
 * RandomMultiSource will fetch from C, then A, then B, then B, then C, then A, and so on.
 *
 * @category Sources
 */
export interface RandomMultiSource extends Source, RandomMultiSourceProps {}

/**
 * Create a new RandomMultiSource.
 *
 * @param props The properties of the RandomMultiSource.
 * @returns The RandomMultiSource.
 *
 * @category Sources
 */
export function newRandomMultiSource(props: RandomMultiSourceProps): RandomMultiSource {
	return {
		type: RandomMultiSourceFetcher.type,
		...props
	}
}

class RandomMultiSourceFetcher implements SourceFetcher {

	static type = "RandomMultiSource";

	private readonly sources: SourceFetcher[];

	constructor(props: RoundRobinMultiSourceProps) {
		this.sources = props.sources.map(sourceToFetcher);
	}

	async fetch(): Promise<SourceItem | undefined> {
		while (this.sources.length > 0) {
			const index = Math.floor(Math.random() * this.sources.length);
			const item = await this.sources[index]!.fetch();
			if (item) {
				return item;
			}
			this.sources.splice(index, 1);
		}
		return undefined;
	}
}

