import {CustomConsole, LogMessage, LogType} from '@jest/console';

function simpleFormatter(type: LogType, message: LogMessage): string {
    const consoleIndent = '      ';

    return message
        .split(/\n/)
        .map((line) => consoleIndent + line)
        .join('\n');
}

global.console = new CustomConsole(process.stdout, process.stderr, simpleFormatter);
