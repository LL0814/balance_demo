export function generateRedisKey(lang: string, ...args: string[]): string {
    return lang + ':' + args.join(':')
}
