/****************************************************************************************
 * Copyright (c) 2020. HuiiBuh                                                          *
 * This file (download.ts) is part of InstagramDownloader which is released under     *
 * GNU LESSER GENERAL PUBLIC LICENSE.                                                   *
 * You are not allowed to use this code or this file for another project without        *
 * linking to the original source AND open sourcing your code.                          *
 ****************************************************************************************/

import * as JSZip from 'jszip';
import { browser } from 'webextension-polyfill-ts';
import { downloadFile } from '../downloaders/download-functions';
import { DownloadMessage, Metadata } from '../modles/extension';
import { MessageHandler } from './MessageHandler';

const IS_FIREFOX = 'browser' in window;

const downloadFailed = async (downloadId: number): Promise<boolean> => {
    const downloadItem = (await browser.downloads.search({id: downloadId})).pop();

    return downloadItem ? !!downloadItem.error : false;
};

const fetchDownload = async (url: string, fileName: string): Promise<number> => {
    const downloadBlob = await downloadFile(url, ev => {
        console.log(ev.loaded / ev.total);
    });

    return browser.downloads.download({url: window.URL.createObjectURL(downloadBlob), filename: fileName});
};

const nativeDownload = async (url: string, fileName: string): Promise<number> => {
    const headers: { name: string; value: string }[] = [];
    if (IS_FIREFOX) headers.push({name: 'Referer', value: 'instagram.com'});

    return browser.downloads.download({url, filename: fileName, headers});
};

export async function downloadSingleImage(message: DownloadMessage): Promise<void> {
    // Get the image id
    let imageName = getImageId(message.imageURL[0]);
    imageName = `${message.accountName}_${imageName}`;
    const downloadURL: string = message.imageURL[0];

    const downloadId = IS_FIREFOX ? await fetchDownload(downloadURL, imageName) : await nativeDownload(downloadURL, imageName);

    if (await downloadFailed(downloadId)) {
        setTimeout(() => {
            IS_FIREFOX ? nativeDownload(downloadURL, imageName) : fetchDownload(downloadURL, imageName);
        }, 100);
    }
}

export async function downloadBulk(urls: string[], accountName: string): Promise<void> {
    const zip: JSZip = new JSZip();
    for (const [imageIndex, url] of urls.entries()) {
        try {
            const response = await fetch(url);
            zip.file(getImageId(url), await response.blob(), {binary: true});
        } catch (e) {
            const blob = new Blob([
                `Request did not succeed. If you are using Firefox go into you privacy settings ans select the
                standard setting (https://support.mozilla.org/en-US/kb/content-blocking). If that is not the problem you tried to download to many images
                and instagram has blocked you temporarily.\n\n`,
                `If you are using chrome there is currently a bug in chrome which seems to block my requests. So stay strong and hope that this error gets fixed soon.`,
                e.toString()]);
            zip.file('error_read_me.txt', blob, {binary: true});
        }

        await new MessageHandler().sendMessage({
            percent: Number((imageIndex + 1 / urls.length).toFixed(2)),
            isFirst: imageIndex === 0,
            isLast: imageIndex + 1 === urls.length,
            type: 'download',
        });
    }
    await downloadZIP(zip, accountName);
}

/**
 * Download the zip file
 * @param zip The JSZip file which should be downloaded
 * @param accountName The account name
 */
export async function downloadZIP(zip: JSZip, accountName: string): Promise<void> {
    let isFirst = true;
    const dZIP = await zip.generateAsync({type: 'blob'}, (u: Metadata) => {
        new MessageHandler().sendMessage({
            percent: Number(u.percent.toFixed(2)),
            isFirst,
            isLast: u.percent === 100,
            type: 'compression',
        });
        isFirst = false;
    });

    const kindaUrl = window.URL.createObjectURL(dZIP);

    if (accountName) {
        await browser.downloads.download({url: kindaUrl, filename: `${accountName}.zip`});
    } else {
        await browser.downloads.download({url: kindaUrl, filename: 'bulk_download.zip'});
    }

}

/**
 * Gets the image name based on the url of the image
 * @param url the url of the image or video
 * @returns the image/video name
 */
function getImageId(url: string): string {
    // tslint:disable-next-line:no-non-null-assertion
    return url.split('?')[0]!.split('/').pop()!;
}
