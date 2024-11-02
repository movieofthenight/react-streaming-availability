import {Grid, newChangesSource, newFilteredSearchSource, newTopShowsSource, Row} from "react-streaming-availability";

export default function Home() {
	return (
		<main>
			<h1>Streaming Availability React Components Demo</h1>
			<p>Click on the posters or logos to follow the deep links into streaming service apps.</p>
			<Row
				title="Apple TV+ Germany Top Shows Row with Vertical Posters"
				posterType="horizontal"
				source={newTopShowsSource({
					country: "de",
					service: "apple",
				})} />
			<Row
				title="Netflix US Top 10 Series Row with Vertical Posters"
				posterType="vertical"
				source={newTopShowsSource({
				country: "us",
				showType: "series",
				service: "netflix",
			})} />
			<Row
				title="Expiring Movies & Series in US"
				posterType="horizontal"
				source={newChangesSource({
					country: "us",
					changeType: "expiring",
					itemType: "show",
				})} />
			<h2>Popular Movies & Series in US</h2>
			<Grid source={
				newFilteredSearchSource({
					country: "us",
					orderBy: "popularity_1month",
					orderDirection: "desc",
					limit: 100,
				})
			} />
		</main>
	);
}
