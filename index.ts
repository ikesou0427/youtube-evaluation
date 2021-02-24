import fs from 'fs';
import delay from 'delay';
import {Browser, Viewport, Page, launch} from 'puppeteer';

async function fetchEvaluationValue(page: Page, selector :string) : Promise<string>{
    return await page.evaluate(function (selector: string) {
        const evaluation_data: Element | null = document.querySelector(selector);

        if (! evaluation_data) return "0";
        
        return evaluation_data.innerHTML;
    }, selector);
}

async function main (): Promise<void> {
    const stream_url: string = process.argv[2];
    
    const browser: Browser = await launch({
        headless: true,
        slowMo: 50
    });

    const page: Page = await browser.newPage();
    const PAGE_SIZE: Viewport = {
        width: 1600, height: 1200
    };
    await page.setViewport(PAGE_SIZE);
    await page.goto(stream_url, { waitUntil: 'domcontentloaded' , timeout: 60000 });

    let now = new Date();
    const y = now.getFullYear();
    const m = ("00" + now.getMonth()).slice(-2);
    const d = ("00" + now.getDate()).slice(-2);

    const stream = fs.createWriteStream(__dirname + "/files/evaluation_" + y + '-' + m + '-' + d + ".csv");

    const GOOD_SELECTOR = '#top-level-buttons > ytd-toggle-button-renderer:nth-child(1) > a > yt-formatted-string';
    const BAD_SELECTOR = '#top-level-buttons > ytd-toggle-button-renderer:nth-child(2) > a > yt-formatted-string';
    
    while(true) {
        await page.reload();
        let now = new Date();

        const good_count: string = await fetchEvaluationValue(page, GOOD_SELECTOR);
        const bad_count: string = await fetchEvaluationValue(page, BAD_SELECTOR);
        stream.write(now.toString() + "," + good_count + "," + bad_count + "\n");
        console.log(now.toString() + "," + good_count + "," + bad_count);
        await delay(30000); // 30秒待機
    }
    stream.end();

    
}

main();