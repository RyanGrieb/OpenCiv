/**
 * Logging level that Excalibur will tag
 */
export declare enum LogLevel {
    Debug = 0,
    Info = 1,
    Warn = 2,
    Error = 3,
    Fatal = 4
}
/**
 * Static singleton that represents the logging facility for Excalibur.
 * Excalibur comes built-in with a [[ConsoleAppender]] and [[ScreenAppender]].
 * Derive from [[Appender]] to create your own logging appenders.
 */
export declare class Logger {
    private static _INSTANCE;
    private _appenders;
    constructor();
    /**
     * Gets or sets the default logging level. Excalibur will only log
     * messages if equal to or above this level. Default: [[LogLevel.Info]]
     */
    defaultLevel: LogLevel;
    /**
     * Gets the current static instance of Logger
     */
    static getInstance(): Logger;
    /**
     * Adds a new [[Appender]] to the list of appenders to write to
     */
    addAppender(appender: Appender): void;
    /**
     * Clears all appenders from the logger
     */
    clearAppenders(): void;
    /**
     * Logs a message at a given LogLevel
     * @param level  The LogLevel`to log the message at
     * @param args   An array of arguments to write to an appender
     */
    private _log;
    /**
     * Writes a log message at the [[LogLevel.Debug]] level
     * @param args  Accepts any number of arguments
     */
    debug(...args: any[]): void;
    /**
     * Writes a log message at the [[LogLevel.Info]] level
     * @param args  Accepts any number of arguments
     */
    info(...args: any[]): void;
    /**
     * Writes a log message at the [[LogLevel.Warn]] level
     * @param args  Accepts any number of arguments
     */
    warn(...args: any[]): void;
    /**
     * Writes a log message at the [[LogLevel.Error]] level
     * @param args  Accepts any number of arguments
     */
    error(...args: any[]): void;
    /**
     * Writes a log message at the [[LogLevel.Fatal]] level
     * @param args  Accepts any number of arguments
     */
    fatal(...args: any[]): void;
}
/**
 * Contract for any log appender (such as console/screen)
 */
export interface Appender {
    /**
     * Logs a message at the given [[LogLevel]]
     * @param level  Level to log at
     * @param args   Arguments to log
     */
    log(level: LogLevel, args: any[]): void;
}
/**
 * Console appender for browsers (i.e. `console.log`)
 */
export declare class ConsoleAppender implements Appender {
    /**
     * Logs a message at the given [[LogLevel]]
     * @param level  Level to log at
     * @param args   Arguments to log
     */
    log(level: LogLevel, args: any[]): void;
}
/**
 * On-screen (canvas) appender
 */
export declare class ScreenAppender implements Appender {
    private _messages;
    private _canvas;
    private _ctx;
    /**
     * @param width   Width of the screen appender in pixels
     * @param height  Height of the screen appender in pixels
     */
    constructor(width?: number, height?: number);
    /**
     * Logs a message at the given [[LogLevel]]
     * @param level  Level to log at
     * @param args   Arguments to log
     */
    log(level: LogLevel, args: any[]): void;
}
