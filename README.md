# Streaming Availability React Components

[![npm](https://img.shields.io/npm/v/react-streaming-availability?style=flat-square&logo=npm&color=blue)](https://www.npmjs.com/package/react-streaming-availability)
[![tsdoc](https://img.shields.io/badge/tsdoc-reference-blue?style=flat-square)](https://movieofthenight.github.io/react-streaming-availability/)

Streaming Availability React Components is a set of React components
that allow you to display streaming availability information
for movies and TV shows; with posters and deep links to streaming services.

It uses [Streaming Availability API](https://www.movieofthenight.com/about/api)
to fetch the data.

It is designed to be used in React applications
with any framework that supports
["use server" directive](https://react.dev/reference/rsc/use-server)
such as Next.js.

## Getting Started

### API Key

First, you need an API key to use the Streaming Availability React Components.
It's free to get it without any credit card information.

To get one, please follow the instructions in the
[Authorization Guide](https://docs.movieofthenight.com/guide/authorization).

Once you have an API key,
you need to add it as an environment variable called `STREAMING_AVAILABILITY_API_KEY`.

If you are using Next.js, you can create a `.env` file in the root of the project
and add your API key as follows (replace `<your-api-key>` with your
actual API key):

```
STREAMING_AVAILABILITY_API_KEY=<your-api-key>
```

### Installation

Then, install the package:

```bash
npm install react-streaming-availability
```

## Usage

### Row

The `Row` component displays a row of movies or TV shows.

```tsx
import { Row, newTopShowsSource } from 'react-streaming-availability';

export default function MyComponent() {
  return (
	  <Row
		  title="Netflix US Top 10 Series"
		  posterType="vertical"
		  source={newTopShowsSource({
			  country: "us",
			  showType: "series",
			  service: "netflix",
		  })}
	  />
  );
}
```

### Grid

The `Grid` component displays a grid of movies or TV shows.

```tsx
import { Grid, newFilteredSearchSource } from 'react-streaming-availability';

export default function MyComponent() {
	return (
		<Grid
			source={newFilteredSearchSource({
				country: "us",
				orderBy: "popularity_1year",
				orderDirection: "desc",
				limit: 100,
			})}
		/>
	);
}
```

## Guide

You can find a detailed guide here: https://docs.movieofthenight.com/guide/widget
