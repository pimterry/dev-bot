// TODO: Contribute this back to fs-extra on DT
declare module "fs-extra" {
	import { Stats } from "fs";

	export function walk(path: string): WalkEventEmitter;

	export interface WalkEventEmitter {
		on(event: 'data', callback: (file: WalkEventFile) => void);
		on(event: 'end', callback: () => void);
		on(event: string, callback: Function);
	}

	export interface WalkEventFile {
		path: string;
		stats: Stats;
	}
}
