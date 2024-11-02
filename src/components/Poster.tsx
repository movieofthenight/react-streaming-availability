"use client";

import * as streamingAvailability from "streaming-availability";
import type {Catalog} from "../libraries/Catalog";
import React, {useEffect, useState} from "react";
import {StringUtils} from "../utils/StringUtils";
import {English} from "../translations/English";
import {clsx} from "clsx";
import styles from "./Poster.module.css";
import {getShowById} from "../actions/Actions";
import type {HtmlAnchorProps, HtmlDivProps, HtmlImgProps} from "../libraries/HtmlProps";

/**
 * PosterType is the type of the poster.
 * It can be either "vertical" or "horizontal".
 * Vertical posters are taller than they are wide.
 * Horizontal posters are wider than they are tall.
 */
export type PosterType = "vertical" | "horizontal";
const posterTypeVertical = "vertical";
const posterTypeHorizontal = "horizontal";

/**
 * CatalogLogoType is the type of the catalog logo.
 * It can be either "light", "dark" or "white".
 * Light logos are suitable for dark backgrounds.
 * Dark logos are suitable for light backgrounds.
 * White logos are colored completely white.
 */
export type CatalogLogoType = "light" | "dark" | "white";
const catalogLogoTypeLight = "light";
const catalogLogoTypeDark = "dark";
const catalogLogoTypeWhite = "white";

export interface PosterVisualProps {
	/**
	 * The type of the poster to display.
	 *
	 * @defaultValue "horizontal"
	 */
	posterType?: PosterType;
	/**
	 * The type of the catalog logo to display.
	 *
	 * @defaultValue "dark"
	 */
	catalogLogoType?: CatalogLogoType;
	/**
	 * The function to convert a change to text.
	 * Such as converting an "upcoming" change to "Coming Soon on August 1".
	 * The text will be displayed below the catalog logo.
	 * If not provided, the default {@link English.convertChangeToText} will be used.
	 * You can check that function as an example to create your own.
	 *
	 * This function is only used if there's a highlighted change.
	 *
	 * A highlighted change is automatically picked,
	 * if the poster is displayed within a
	 * {@link Row} or a {@link Grid} component
	 * with a {@link ChangesSource}.
	 *
	 * @defaultValue {@link English.convertChangeToText}
	 */
	convertChangeToText?: (change: streamingAvailability.Change) => string;

	/**
	 * The props for the root anchor that contains the poster, the catalog logo
	 * and the text div.
	 */
	posterContainerAnchorProps?: HtmlAnchorProps;
	/**
	 * The props for the poster image.
	 */
	posterImageProps?: HtmlImgProps;
	/**
	 * The props for the catalog logo image.
	 */
	catalogLogoImageProps?: HtmlImgProps;
	/**
	 * The props for the text div to display the text below the catalog logo
	 * regarding the highlighted change such as "Coming Soon on August 1".
	 *
	 * This field is only used if there's a highlighted change.
	 *
	 * A highlighted change is automatically picked,
	 * if the poster is displayed within a
	 * {@link Row} or a {@link Grid} component
	 * with a {@link ChangesSource}.
	 */
	textDivProps?: HtmlDivProps;
}

/**
 * @category Components
 */
export interface PosterProps extends PosterVisualProps, PosterContentProps {
	/**
	 * If set to true, the poster will not be displayed if there's no streaming option available.
	 *
	 * @defaultValue false
	 */
	hidePosterIfNoStreamingOption?: boolean;
}

export interface PosterContentProps {
	/**
	 * The ID of the show to display.
	 * It could be an IMDB id, a TMDB id or a Streaming Availability API id.
	 *
	 * Either this field or the {@link show} field must be provided.
	 *
	 * @example The Batman (IMDB)
	 * `tt1877830`
	 * @example The Batman (TMDB)
	 * `movie/414906`
	 * @example The Queen's Gambit (IMDB)
	 * `tt10048342`
	 * @example The Queen's Gambit (TMDB)
	 * `tv/87739`
	 */
	showId?: string;

	/**
	 * The show to display.
	 * This field is used if you already have the show object from
	 * the Streaming Availability API Client.
	 *
	 * Either this field or the {@link showId} field must be provided.
	 */
	show?: streamingAvailability.Show;

	/**
	 * A highlighted change to display,
	 * such as a new episode, an expiring movie or an upcoming series.
	 *
	 * This field is used if you want to display a highlighted change
	 * you already have from the Streaming Availability API Client.
	 *
	 * This field is automatically picked if the poster is displayed within a
	 * {@link Row} or a {@link Grid} component with a {@link ChangesSource}.
	 */
	highlightedChange?: streamingAvailability.Change;

	/**
	 * The priority catalogs to use when displaying the poster.
	 * The catalogs are prioritized in the order they are provided.
	 *
	 * If a show is available in multiple streaming catalogs,
	 * the first catalog in the list that contains the show will be used
	 * when showing the catalog logo and deep link.
	 */
	priorityCatalogs?: Catalog[];
	/**
	 * The country to use when checking the streaming options.
	 */
	country: string;
}

interface ShowPoster {
	srcSet: string,
	alt: string
}

interface CatalogLogo {
	src: string;
	alt: string;
}

interface StreamingInfo {
	catalogLogo: CatalogLogo;
	link: string;
	text?: string;
}

interface PosterContent {
	showPoster: ShowPoster;
	posterType: PosterType;
	streamingInfo?: StreamingInfo;
}

function verticalImageToSrcset(image: streamingAvailability.VerticalImage): string {
	return [
		`${image.w240} 240w`,
		`${image.w360} 360w`,
		`${image.w480} 480w`,
		`${image.w600} 600w`,
		`${image.w720} 720w`,
	].join(", ");
}


function horizontalImageToSrcset(image: streamingAvailability.HorizontalImage): string {
	return [
		`${image.w360} 360w`,
		`${image.w480} 480w`,
		`${image.w720} 720w`,
		`${image.w1080} 1080w`,
		`${image.w1440} 1440w`,
	].join(", ");
}

function getShowPoster(posterType: PosterType, show: streamingAvailability.Show): ShowPoster {
	return {
		srcSet: getShowPosterSrcset(posterType, show),
		alt: show.title,
	}
}

function getShowPosterSrcset(posterType: PosterType, show: streamingAvailability.Show): string {
	if (posterType === posterTypeVertical) {
		return verticalImageToSrcset(show.imageSet.verticalPoster);
	}
	return horizontalImageToSrcset(show.imageSet.horizontalPoster);
}

function utilizeAddon(
	streamingOptionType: streamingAvailability.StreamingOptionType,
	addon: streamingAvailability.Addon | undefined,
	f: (addon: streamingAvailability.Addon) => void
): void {
	if (streamingOptionType !== streamingAvailability.StreamingOptionType.Addon || addon === undefined) {
		return;
	}
	f(addon);
}

function getStreamingInfoFromChange(
	change: streamingAvailability.Change,
	catalogLogoType?: CatalogLogoType,
	convertChangeToText?: (change: streamingAvailability.Change) => string
): StreamingInfo {
	let catalogLogoSrc: string | undefined;
	let catalogLogoAlt: string | undefined;
	let link: string | undefined;
	let text: string | undefined;
	utilizeAddon(change.streamingOptionType, change.addon, (addon) => {
		catalogLogoSrc = getCatalogLogo(catalogLogoType, addon.imageSet);
		catalogLogoAlt = addon.name;
	});

	if (StringUtils.isBlank(catalogLogoSrc)) {
		catalogLogoSrc = getCatalogLogo(catalogLogoType,change.service.imageSet);
	}
	if (StringUtils.isBlank(catalogLogoAlt)) {
		catalogLogoAlt = change.service.name;
	}

	link = change.link;
	if (StringUtils.isBlank(link)) {
		utilizeAddon(change.streamingOptionType, change.addon, (addon) => {
			link = addon.homePage;
		});
	}
	if (StringUtils.isBlank(link)) {
		link = change.service.homePage;
	}

	text = (convertChangeToText ?? English.convertChangeToText)(change);

	return {
		catalogLogo: {
			src: catalogLogoSrc!,
			alt: catalogLogoAlt!,
		},
		link: link!,
		text: text,
	}
}

function getStreamingInfoFromStreamingOption(
	option: streamingAvailability.StreamingOption,
	catalogLogoType?: CatalogLogoType,
): StreamingInfo {
	let catalogLogoSrc: string | undefined;
	let catalogLogoAlt: string | undefined;
	let link: string | undefined;
	utilizeAddon(option.type, option.addon, (addon) => {
		catalogLogoSrc = getCatalogLogo(catalogLogoType, addon.imageSet);
		catalogLogoAlt = addon.name;
	});

	if (StringUtils.isBlank(catalogLogoSrc)) {
		catalogLogoSrc = getCatalogLogo(catalogLogoType,option.service.imageSet);
	}
	if (StringUtils.isBlank(catalogLogoAlt)) {
		catalogLogoAlt = option.service.name;
	}

	link = option.link;
	if (StringUtils.isBlank(link)) {
		utilizeAddon(option.type, option.addon, (addon) => {
			link = addon.homePage;
		});
	}
	if (StringUtils.isBlank(link)) {
		link = option.service.homePage;
	}

	return {
		catalogLogo: {
			src: catalogLogoSrc!,
			alt: catalogLogoAlt!,
		},
		link: link!,
	}
}

function doesCatalogMatchWithStreamingOption(catalog: Catalog, streamingOption: streamingAvailability.StreamingOption): boolean {
	if (catalog.service !== streamingOption.service.id) {
		return false;
	}
	if (!catalog.streamingOptionType) {
		return true;
	}
	if (catalog.streamingOptionType !== streamingOption.type) {
		return false;
	}
	if (catalog.streamingOptionType === streamingAvailability.StreamingOptionType.Addon) {
		if (!catalog.addon) {
			return true;
		}
		if (catalog.addon !== streamingOption.addon?.id) {
			return false;
		}
	}
	return true;
}

function pickHighlightedStreamingOption(streamingOptions?: streamingAvailability.StreamingOption[], priorityCatalogs?: Catalog[]): streamingAvailability.StreamingOption | undefined {
	if (!streamingOptions || streamingOptions.length === 0) {
		return undefined;
	}
	if (priorityCatalogs) {
		for (const catalog of priorityCatalogs) {
			const streamingOption = streamingOptions.find((streamingOption) => doesCatalogMatchWithStreamingOption(catalog, streamingOption));
			if (streamingOption) {
				return streamingOption;
			}
		}
	}

	const freeOrSubscription = streamingOptions.find((streamingOption) => streamingOption.type === streamingAvailability.StreamingOptionType.Subscription || streamingOption.type === streamingAvailability.StreamingOptionType.Free);
	if (freeOrSubscription) {
		return freeOrSubscription;
	}
	const addon = streamingOptions.find((streamingOption) => streamingOption.type === streamingAvailability.StreamingOptionType.Addon);
	if (addon) {
		return addon;
	}
	return streamingOptions[0];
}

function getStreamingInfo(props: PosterProps, show: streamingAvailability.Show): StreamingInfo | undefined {
	if (props.highlightedChange) {
		return getStreamingInfoFromChange(props.highlightedChange, props.catalogLogoType, props.convertChangeToText);
	}
	const highlightedStreamingOption = pickHighlightedStreamingOption(show.streamingOptions[props.country], props.priorityCatalogs);
	if (!highlightedStreamingOption) {
		return undefined;
	}
	return getStreamingInfoFromStreamingOption(highlightedStreamingOption, props.catalogLogoType);
}

function getCatalogLogo(
	catalogLogoType: CatalogLogoType = catalogLogoTypeDark,
	serviceImageSet: streamingAvailability.ServiceImageSet
): string {
	switch (catalogLogoType) {
		case catalogLogoTypeLight:
			return serviceImageSet.lightThemeImage;
		case catalogLogoTypeDark:
			return serviceImageSet.darkThemeImage;
		case catalogLogoTypeWhite:
			return serviceImageSet.whiteImage;
	}
}

function getPosterContent(props: PosterProps, show: streamingAvailability.Show): PosterContent {
	const posterType = props.posterType ?? posterTypeHorizontal;
	return {
		showPoster: getShowPoster(posterType, show),
		posterType: posterType,
		streamingInfo: getStreamingInfo(props, show),
	}
}

function getContainerAnchorProps(
	content: PosterContent,
	props?: HtmlAnchorProps
): HtmlAnchorProps {
	const {className, target, href, ...rest} = props ?? {};
	return {
		className: clsx(styles.container, className),
		target: target ?? "_blank",
		href: content.streamingInfo?.link,
		...rest
	}
}

function getPosterImageProps(
	content: PosterContent,
	props: HtmlImgProps | undefined
): HtmlImgProps {
	const {className, srcSet, src, alt, ...rest} = props ?? {};
	return {
		className: clsx(styles.poster, {
			[styles["poster-vertical"]]: content.posterType === posterTypeVertical,
			[styles["poster-horizontal"]]: content.posterType === posterTypeHorizontal,
		}, className),
		srcSet: content.showPoster.srcSet,
		alt: content.showPoster.alt,
		...rest
	}
}

function getCatalogLogoImageProps(
	content: PosterContent,
	props?: HtmlImgProps
) {
	const {className, srcSet, src, alt, ...rest} = props ?? {};
	return {
		className: clsx(styles.logo, className),
		src: content.streamingInfo?.catalogLogo.src,
		alt: content.streamingInfo?.catalogLogo.alt,
		...rest
	}
}

function getTextDivProps(
	props?: HtmlDivProps
) {
	const {className, ...rest} = props ?? {};
	return {
		className: clsx(styles.text, className),
		...rest
	}
}

/**
 * The Poster component displays a poster image of a show with a streaming catalog logo.
 *
 * The provided Poster is a clickable anchor that deep-links to show's page on the streaming service.
 *
 * @category Components
 */
export function Poster(props: PosterProps): React.ReactElement | null {
	const {showId, show} = props;

	const [data, setData] = useState<streamingAvailability.Show | undefined>(undefined);

	useEffect(() => {
		if (show) {
			setData(show);
		} else if (showId) {
			getShowById({id: showId!, country: props.country}).then(setData);
		}
	}, [props.country, setData, show, showId]);

	if (!show && !showId) {
		throw new Error("Either show or showId must be provided");
	}

	if (!data) {
		return null;
	}

	const posterContent = getPosterContent(props, data);
	const catalogLogoImageProps = getCatalogLogoImageProps(posterContent, props.catalogLogoImageProps);

	if (StringUtils.isBlank(catalogLogoImageProps.src) && props.hidePosterIfNoStreamingOption) {
		return null;
	}

	return (
		<a {...getContainerAnchorProps(posterContent, props.posterContainerAnchorProps)}>
			<img {...getPosterImageProps(posterContent, props.posterImageProps)} />
			{catalogLogoImageProps.src && <img {...catalogLogoImageProps} />}
			{posterContent.streamingInfo?.text && <div {...getTextDivProps(props.textDivProps)}>{posterContent.streamingInfo.text}</div>}
		</a>
	);
}
