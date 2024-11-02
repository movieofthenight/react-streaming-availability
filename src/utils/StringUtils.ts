export class StringUtils {
	static isBlank(str: string | null | undefined): boolean {
		return str == null || str.trim().length === 0;
	}
}
