const playwright = require('playwright')
const fs = require('fs');
const url = 'https://www.wildberries.ru/catalog/0/search.aspx?sort=popular&search=%D0%BA%D1%80%D0%BE%D1%81%D1%81%D0%BE%D0%B2%D0%BA%D0%B8'
const count_per_page = 3;

async function main() {
    const start = new Date().getTime();
    const browser = await playwright.chromium.launch({
        headless: true
    })

    const page = await browser.newPage()
    const catalog = await collectData(page, count_per_page, url)
    saveData(catalog);

    await browser.close();
    const end = new Date().getTime();
    console.log(`Время выполнения: ${end / 1000 - start / 1000}s`);
}


async function collectData(page, page_count, url) {
    let catalog = [];

    for (let i = 1; i <= page_count; i++) {
        if (i === 1) {
            await page.goto(url)
        } else await page.goto(url + `&page=${i}`)
        // await page.waitForTimeout(50000); 
        await page.waitForLoadState('networkidle')
        const market = await page.$eval('#catalog-content', headerElm => {
            const data = [];
            const listElms = headerElm.getElementsByClassName('product-card');
            listElms.forEach(elm => {
                if (elm.getElementsByClassName('lower-price')[0]) {
                    data.push(
                        {
                            discount: elm.getElementsByClassName('product-card__sale')[0] ? elm.getElementsByClassName('product-card__sale')[0].innerText : null,
                            image: elm.getElementsByClassName('j-thumbnail')[0] ? elm.getElementsByClassName('j-thumbnail')[0].src : null,
                            sale_price: elm.getElementsByClassName('lower-price')[0] ? elm.getElementsByClassName('lower-price')[0].innerText : null,
                            price: elm.querySelector('.price-old-block > del') ? elm.querySelector('.price-old-block > del').innerText : null,
                        }
                    )
                }
            });
            return data;
        });
        console.log(market);
        catalog.push(market)
    }
    return catalog;
}

function saveData(data) {
    let date = new Date().getTime();
    fs.writeFileSync(`./collected_data/catalog${date}.json`, JSON.stringify(data))
}

main()