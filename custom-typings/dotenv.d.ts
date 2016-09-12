declare module 'dotenv' {
    export function parse(src: string|Buffer): { [key: string]: string };
}
