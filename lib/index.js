const express = require('express');
const puppeteer = require('puppeteer');

express()
    .get('/', generatePDF)
    .listen(9009, () => console.log('Express listening on 9009!'));

const OUTPUT_WIDTH = 1100;
const INITIAL_VIEWPORT_WIDTH = 2000;
const REPORT_WIDTH = 2000;

const HEADLESS = true;

async function generatePDF(req, res) {
    const browser = await puppeteer.launch({ headless: HEADLESS });
    const page = await browser.newPage();


    await page.emulateMedia('screen');
    await page.setViewport({ width: INITIAL_VIEWPORT_WIDTH, height: 1200 });

    await page.goto('http://localhost:4200/report-summaries/71600/1/initial-costs', { waitUntil: 'networkidle0' });

    await page.evaluate(widthToSet=>{
        const el = document.querySelector('#tocContent');
        el.style.width = `${widthToSet}px`;
    }, REPORT_WIDTH)

    const domElementsToRemove = ['.ts-c-toc', '.cl-c-header',
        'body > ts-tessa-front-end-app > div > div > cl-drawer',
        'body > ts-tessa-front-end-app > div > cl-application-header',

        '#reportsPDFContent > div.cl-o-layout--flex-column.cl-o-layout--flex-1 > ts-reports-wrapper > kendo-tabstrip',
        '#reportsPDFContent > div.cl-o-layout--flex-column.cl-o-layout--flex-1 > ts-reports-wrapper > ts-report-initial-costs > cl-toolbar',
    ];

    domElementsToRemove.forEach(async selector => {
        await page.evaluate(selector => {
            let dom = document.querySelector(selector);
            dom.parentNode.removeChild(dom);
        }, selector);
    })

    await page.evaluate(() => {
        let doms = document.querySelectorAll('.cl-c-grid-toolbar');
        doms.forEach(dom => dom.parentNode.removeChild(dom))
    });

    const tocContentWidth = await page.evaluate(maxWidthDebt => {
        return document.querySelector('#tocContent').clientWidth;
    }); 

    console.log('tocContentWidth', tocContentWidth);

    page.setViewport({width: WIDTH, height: 1200})

    const scrollHeight = await page.evaluate(() => {
        return document.querySelector('#tocContent').scrollHeight;
    })

    console.log(`> Setting height to scrollHeight = ${scrollHeight} * 1.1`);

    if (HEADLESS) {
        const pdfBuffer = await page.pdf({
            width: OUTPUT_WIDTH,
            height: scrollHeight * 1.1,
            scale: 1,
            printBackground: true
        });


        res.type('application/pdf');
        res.send(pdfBuffer);

        await browser.close();
    }
}

function calculateDebtForResize() {

    // const maxWidthDebt = await page.evaluate(() => {
    //     let maxDebt = -1;
    //     document.querySelectorAll('.ag-body-horizontal-scroll-viewport').forEach(sc => {
    //         maxDebt = Math.max(maxDebt, sc.scrollWidth - sc.clientWidth);
    //     });
    //     return maxDebt;
    // }) || 343;

    // console.log('> maxWidthDebt', maxWidthDebt)

    // const newReportWidth = await page.evaluate(maxWidthDebt => {
    //     const el = document.querySelector('#tocContent'); //.getElementsByClassName.width = '1100px !important;';
    //     el.style.width += `${el.clientWidth + maxWidthDebt}px`;

    //     return el.style.width
    // }, maxWidthDebt);

    // console.log(newReportWidth);

    // const containerViewportWidth = await page.evaluate(()=>{
    //     return Number(document.querySelector('.ag-body-horizontal-scroll-viewport').style.width.replace('px', ''));
    // });

    // // set max scroll width
    // const maxScrollWidth = await page.evaluate(()=>{
    //     let maxWidth = 0;
    //     document.querySelectorAll('.ag-body-horizontal-scroll-container').forEach(sc => {
    //         const scrollWidth = Number(sc.style.width.replace('px', ''));
    //         maxWidth = Math.max(maxWidth, scrollWidth);
    //     });
    //     return maxWidth;
    // })

    // console.log('> container viewport width', containerViewportWidth);
    // console.log('> max scroll width for ag-body-horizontal-scroll-container', maxScrollWidth);
}