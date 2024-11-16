import {Grid, newFilteredSearchSource, newTopShowsSource, Row} from "react-streaming-availability";

export default function Home() {
	return (
		<main>
			<h1>Streaming Availability React Components Demo</h1>
			<p>Click on the posters or logos to follow the deep links into streaming service apps.</p>
			<Row
				title="Top 10 Series - Netflix US"
				posterType="horizontal"
				source={newTopShowsSource({
					country: "us",
					service: "netflix",
					showType: "series",
				})} />
			<Row
				title="Top 10 Movies & Series - Disney+ Germany"
				posterType="horizontal"
				source={newTopShowsSource({
				country: "de",
				service: "disney",
			})} />
			<Row
				title="Highest Rated Science Fiction Movies in United States"
				posterType="vertical"
				source={newFilteredSearchSource({
					country: "us",
					genres: ["scifi"],
					showType: "movie",
					orderBy: "rating",
					orderDirection: "desc",
				})} />
			<h2>Popular Series in US This Year</h2>
			<Grid source={
				newFilteredSearchSource({
					country: "us",
					showType: "series",
					orderBy: "popularity_1year",
					orderDirection: "desc",
					limit: 100,
				})
			} />
		</main>
	);
}
