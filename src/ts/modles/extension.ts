/****************************************************************************************
 * Copyright (c) 2021. HuiiBuh                                                          *
 * This file (extension.ts) is part of InstagramDownloader which is released under      *
 * GNU LESSER GENERAL PUBLIC LICENSE.                                                   *
 * You are not allowed to use this code or this file for another project without        *
 * linking to the original source AND open sourcing your code.                          *
 ****************************************************************************************/
import { AlertType } from '../components/Alert';
import { PostItem, ShortcodeMedia } from './post';

export interface DownloadMessage {
    imageURL: string[];
    accountName: string;
    type: DownloadType;
}

export interface AlertMessage {
    text: string;
    type?: AlertType;
    dismissible?: boolean;
    timeout?: number;
}

export enum DownloadType {
    single,
    bulk
}

export interface ContentResponse {
    accountName: string;
    mediaURL: string[];
    originalResponse: PostItem | ShortcodeMedia;
}

export type DownloadProgressType = 'download' | 'compression'

export interface DownloadProgress {
    isLast: boolean;
    isFirst: boolean;
    percent: number;
    type: DownloadProgressType;
}

export enum LoggingLevel {
    default = 'log',
    warn = 'warn',
    error = 'error',
}

export interface Metadata {
    percent: number;
    currentFile: string;
}
