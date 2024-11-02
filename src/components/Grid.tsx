"use client";

import {Poster, type PosterVisualProps} from "./Poster";
import {type Source, type SourceFetcher, type SourceItem, sourceToFetcher} from "../libraries/Source";
import type {Catalog} from "../libraries/Catalog";
import type {HtmlDivProps} from "../libraries/HtmlProps";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {Mutex} from "../libraries/Mutex";
import styles from "./Grid.module.css"
import {clsx} from "clsx";

/**
 * @category Components
 */
export interface GridProps extends PosterVisualProps {
	/**
	 * The source of the items to display in the grid.
	 */
	source: Source;
	/**
	 * The priority catalogs to use when displaying the shows.
	 * The catalogs are prioritized in the order they are provided.
	 *
	 * If a show is available in multiple streaming catalogs,
	 * the first catalog in the list that contains the show will be used
	 * when showing the catalog logo and deep link.
	 */
	priorityCatalogs?: Catalog[];
	/**
	 * The props for the root div contains all the posters.
	 */
	rootDivProps?: HtmlDivProps;
}

function getDivPropsWithClassName(
	baseClassName: string,
	props?: HtmlDivProps,
): HtmlDivProps {
	const {className, ...rest} = props ?? {};
	return {
		className: clsx(baseClassName, className),
		...rest
	}
}

/**
 * A grid of posters that fetches items from a source.
 * Provides infinite scrolling to fetch more items out of the box.
 *
 * You can set a height or append the Grid component to a parent with a height
 * to limit the height of the grid, as the grid will grow indefinitely (as long as the source has items)
 * and keep fetching more items.
 *
 * @category Components
 */
export function Grid(props: GridProps): React.ReactElement {

	const [items, setItems] = useState<SourceItem[]>([]);
	const [fetching, setFetching] = useState(false);
	const [source, setSource] = useState<SourceFetcher | undefined>(sourceToFetcher(props.source));
	const mutex = useRef(new Mutex());
	const parentRef = useRef<HTMLDivElement | null>(null);
	const childRef = useRef<Element | undefined>(undefined);
	const observer = useRef<IntersectionObserver | null>(null);

	const update = useCallback(() => {
		mutex.current.runExclusive(async () => {
			if (!source || fetching || !parentRef.current) {
				return;
			}

			if(!observer.current) {
				observer.current = new IntersectionObserver(
					update
				)
			}

			const childrenSize = parentRef.current.children.length;
			if (childrenSize !== 0) {
				const target = Math.max(Math.floor(childrenSize * 0.75), childrenSize - 100);
				const newElement = parentRef.current.children[target]!;

				if (childRef.current) {
					if (childRef.current !== newElement) {
						observer.current.unobserve(childRef.current);
						childRef.current = newElement;
						observer.current.observe(newElement);
					}
				} else {
					childRef.current = newElement;
					observer.current.observe(newElement);
				}

				if (newElement.getBoundingClientRect().top > window.innerHeight) {
					return;
				}
			}

			setFetching(true);
			const item = await source.fetch();
			if (item) {
				setItems((oldItems) => {
					if (oldItems.map((oldItem) => oldItem.show.id).includes(item.show.id)) {
						return oldItems;
					}
					return [...oldItems, item];
				});
			} else {
				setSource(() => undefined);
			}
			setFetching(false);
		});

	}, [fetching, source]);

	useEffect(() => {
		update();
	}, [update, items, fetching]);

	useEffect(() => {
		window.addEventListener('resize', update);
		return () => window.removeEventListener('resize', update);
	}, [update]);

	return (
		<div {...getDivPropsWithClassName(styles["root"], props.rootDivProps)} ref={parentRef}>
			{items.map((item, index) => {
				return (
					<Poster
						key={index}
						{...props}
						posterImageProps={{
							...props.posterImageProps,
							onLoad: (e: React.SyntheticEvent<HTMLImageElement>) => {
								update();
								if (props.posterImageProps?.onLoad) {
									props.posterImageProps.onLoad(e);
								}
							},
							className: clsx(styles["poster-image"], props.posterImageProps?.className),
						}}
						posterContainerAnchorProps={{
							...props.posterContainerAnchorProps,
							className: clsx(styles["poster-root"], props.posterContainerAnchorProps?.className),
						}}
						highlightedChange={item.change}
						show={item.show}
						country={item.country}
						priorityCatalogs={[...item.priorityCatalogs ?? [], ...props.priorityCatalogs ?? []]}
						hidePosterIfNoStreamingOption={true}
					/>
				)
			})}
		</div>
	)
}
