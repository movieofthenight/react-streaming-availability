"use client";

import type {Catalog} from "../libraries/Catalog";
import {Poster, type PosterVisualProps} from "../components/Poster";
import {
	type Source,
	type SourceFetcher,
	type SourceItem,
	sourceToFetcher
} from "../libraries/Source";
import React, {useCallback, useEffect, useRef, useState} from "react";
import {Mutex} from "../libraries/Mutex";
import styles from "./Row.module.css";
import {clsx} from "clsx";
import type {HtmlDivProps} from "../libraries/HtmlProps";

/**
 * The props for the arrows displayed on {@link Row}.
 */
export interface ArrowProps {
	/**
	 * The color of the arrow.
	 */
	color: string;

	/**
	 * The accessibility text for the arrow.
	 */
	accessibilityText: string;
}

/**
 * @category Components
 */
export interface RowProps extends PosterVisualProps {
	/**
	 * The source of the items to display in the row.
	 *
	 * @see {@link Source}
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
	 * Title to display above the row.
	 */
	title?: string;
	/**
	 * A function to create the title div.
	 * If not supplied, a default title div will be created
	 * if a {@link title} is provided.
	 */
	getTitleDiv?: (title?: string, props?: HtmlDivProps) => React.ReactNode;
	/**
	 * The props for the root div
	 * that contains the entire row.
	 */
	rootDivProps?: HtmlDivProps;
	/**
	 * The props for the top bar div that contains the title and arrows.
	 */
	topBarDivProps?: HtmlDivProps;
	/**
	 * The props for the title div.
	 */
	titleDivProps?: HtmlDivProps;
	/**
	 * The props for the arrow container div that contains the arrows.
	 */
	arrowContainerDivProps?: HtmlDivProps;
	/**
	 * The base class name for the arrow buttons.
	 * Applied to both the left and right arrow buttons all the time.
	 */
	arrowButtonBaseClassName?: string;
	/**
	 * The base style for the arrow buttons.
	 * Applied to both the left and right arrow buttons all the time.
	 */
	arrowButtonBaseStyle?: React.CSSProperties;
	/**
	 * The class name for arrows only applied when the arrow is enabled.
	 */
	arrowButtonEnabledClassName?: string;
	/**
	 * The style for arrows only applied when the arrow is enabled.
	 */
	arrowButtonEnabledStyle?: React.CSSProperties;
	/**
	 * The class name for arrows only applied when the arrow is disabled.
	 */
	arrowButtonDisabledClassName?: string;
	/**
	 * The style for arrows only applied when the arrow is disabled
	 */
	arrowButtonDisabledStyle?: React.CSSProperties;
	/*
	 * The color of the arrows.
	 *
	 * @defaultValue "white"
	 */
	arrowColor?: string;
	/**
	 * The accessibility text for the left arrow.
	 *
	 * @defaultValue "Left arrow"
	 */
	leftArrowAccessibilityText?: string;
	/**
	 * The function to get the left arrow component.
	 * If not provided, a default left arrow will be used.
	 */
	getLeftArrow?: (props: ArrowProps) => React.ReactNode;
	/**
	 * The accessibility text for the right arrow.
	 *
	 * @defaultValue "Right arrow"
	 */
	rightArrowAccessibilityText?: string;
	/**
	 * The function to get the right arrow component.
	 * If not provided, a default right arrow will be used.
	 */
	getRightArrow?: (props: ArrowProps) => React.ReactNode;
	/**
	 * The props for the poster list container div that contains the posters.
	 */
	posterListContainerDivProps?: HtmlDivProps;
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
 * A row of posters that fetches items from a source.
 *
 * Provides infinite scrolling to sides fetch more items out of the box.
 *
 * Users can scroll via the arrows buttons or by dragging the row.
 *
 * @category Components
 */
export function Row(props: RowProps): React.ReactElement {
	const ref = useRef<HTMLDivElement>(null);

	const [items, setItems] = useState<SourceItem[]>([]);
	const [leftArrowEnabled, setLeftArrowEnabled] = useState(false);
	const [rightArrowEnabled, setRightArrowEnabled] = useState(false);
	const [fetching, setFetching] = useState(false);
	const [source, setSource] = useState<SourceFetcher | undefined>(sourceToFetcher(props.source));
	const mutex = useRef(new Mutex());

	const update = useCallback(() => {
		ref.current && setRightArrowEnabled(ref.current.scrollLeft < ref.current.scrollWidth - ref.current.offsetWidth - 1);
		ref.current && setLeftArrowEnabled(ref.current.scrollLeft > 0);
		mutex.current.runExclusive(async () => {
			if (!source || fetching || !ref.current ||
				(ref.current.scrollLeft < ref.current.scrollWidth - 3*ref.current.offsetWidth)) {
				return;
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
    <div {...props.rootDivProps}>
      <div {...getDivPropsWithClassName(styles["top-bar"], props.topBarDivProps)}>
        {(props.getTitleDiv ??
          ((title, props) => {
            return (
              <div {...getDivPropsWithClassName(styles["title"], props)}>
                {title ?? ""}
              </div>
            )
          }))(props.title, props.titleDivProps)}
        <div
          {...getDivPropsWithClassName(
            styles["arrow-container"],
            props.arrowContainerDivProps,
          )}
        >
          <button
            className={clsx(
              styles['arrow'],
              props.arrowButtonBaseClassName,
              { [styles['arrow-enabled']]: leftArrowEnabled },
              { [props.arrowButtonEnabledClassName ?? '']: leftArrowEnabled },
              { [styles['arrow-disabled']]: !leftArrowEnabled },
              { [props.arrowButtonDisabledClassName ?? '']: !leftArrowEnabled },
            )}
            style={{
              ...props.arrowButtonBaseStyle,
              ...(leftArrowEnabled
                ? props.arrowButtonEnabledStyle
                : props.arrowButtonDisabledStyle),
            }}
            onClick={() => {
              const div = ref.current
              if (!div) {
                return
              }
              let ns = div.scrollLeft - (3 * div.clientWidth) / 4
              if (ns <= 0) {
                ns = 0
              }
              div.scrollTo({
                top: 0,
                left: ns,
                behavior: 'smooth',
              })
            }}
          >
	          {(props.getLeftArrow ?? LeftArrow)({
		          color: props.arrowColor ?? "white",
		          accessibilityText: props.leftArrowAccessibilityText ?? "Left arrow",
	          })}
          </button>
          <button
            className={clsx(
              styles['arrow'],
              props.arrowButtonBaseClassName,
              { [styles['arrow-enabled']]: rightArrowEnabled },
              { [props.arrowButtonEnabledClassName ?? '']: rightArrowEnabled },
              { [styles['arrow-disabled']]: !rightArrowEnabled },
              { [props.arrowButtonDisabledClassName ?? '']: !rightArrowEnabled },
            )}
            style={{
              ...props.arrowButtonBaseStyle,
              ...(rightArrowEnabled
                ? props.arrowButtonEnabledStyle
                : props.arrowButtonDisabledStyle),
            }}
            onClick={() => {
              {
                const div = ref.current
                if (!div) {
                  return
                }
                let ns = div.scrollLeft + (3 * div.clientWidth) / 4
                if (ns >= div.scrollWidth - div.clientWidth) {
                  ns = div.scrollWidth - div.clientWidth
                }
                div.scrollTo({
                  top: 0,
                  left: ns,
                  behavior: 'smooth',
                })
              }
            }}
          >
	          {(props.getRightArrow ?? RightArrow)({
		          color: props.arrowColor ?? "white",
		          accessibilityText: props.rightArrowAccessibilityText ?? "Right arrow",
	          })}
          </button>
        </div>
      </div>
      <div
        {...getDivPropsWithClassName(
          styles["poster-list-container"],
          props.posterListContainerDivProps,
        )}
        onScroll={update}
        ref={ref}
      >
        {items.map((item, index) => {
          return (
            <Poster
              {...props}
              posterImageProps={{
                ...props.posterImageProps,
                onLoad: (e) => {
                  update()
                  if (props.posterImageProps?.onLoad) {
                    props.posterImageProps.onLoad(e)
                  }
                },
              }}
              key={index}
              highlightedChange={item.change}
              show={item.show}
              country={item.country}
              priorityCatalogs={[
                ...(item.priorityCatalogs ?? []),
                ...(props.priorityCatalogs ?? []),
              ]}
              hidePosterIfNoStreamingOption={true}
            />
          )
        })}
      </div>
    </div>
  )
}

function LeftArrow(props: ArrowProps) {
  return (
    <svg
      role="img"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill={props.color}
    >
      <title>{props.accessibilityText}</title>
      <path d="M0 0h24v24H0z" fill="none" />
      <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
    </svg>
  )
}

function RightArrow(props: ArrowProps) {
  return (
	  <svg
		  role="img"
		  xmlns="http://www.w3.org/2000/svg"
		  viewBox="0 0 24 24"
		  fill={props.color}
	  >
		  <title>{props.accessibilityText}</title>
		  <path d="M0 0h24v24H0z" fill="none"/>
		  <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
	  </svg>
  )
}
