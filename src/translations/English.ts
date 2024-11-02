import * as streamingAvailability from "streaming-availability";

/**
 * English translations of the text creation functions.
 */
export const English = {
	convertChangeToText: (change: streamingAvailability.Change): string => {
		let text = "";
		switch (change.changeType) {
			case streamingAvailability.ChangeType.New:
				text = "Recently Added";
				break;
			case streamingAvailability.ChangeType.Expiring:
				text = "Expires";
				break;
			case streamingAvailability.ChangeType.Removed:
				text = "Recently Removed";
				break;
			case streamingAvailability.ChangeType.Upcoming:
				text = "Coming";
				break;
			case streamingAvailability.ChangeType.Updated:
				text = "Recently Updated";
				break

		}
		if (change.timestamp) {
			text += " on\n" + (new Date(change.timestamp * 1000)).toLocaleDateString();
		} else {
			const futureChanges: streamingAvailability.ChangeType[] = [
				streamingAvailability.ChangeType.Expiring,
				streamingAvailability.ChangeType.Upcoming
			];
			if (futureChanges.includes(change.changeType)) {
				text += " Soon";
			}
		}
		return text;
	}
}