const express = require('express');
const app = express();
const XLSX = require('xlsx');
const port = 7755;

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});


// app.get('/api/related-products/products', (req, res) => {
//     const { sku, storeId } = req.query;
//     res.setHeader('Content-Type', 'application/javascript');
//     res.send(`
//       console.log('SKU:', '${sku}');
//       console.log('Store ID:', '${storeId}');
//     `);
// });

// async function readXlsxFile(url, sku) {
//     const fetch = await import('node-fetch').then(module => module.default);
//     const response = await fetch(url);
//     const arrayBuffer = await response.arrayBuffer();
//     const data = new Uint8Array(arrayBuffer);
//     const workbook = XLSX.read(data, { type: 'array' });
//     const sheetName = workbook.SheetNames[0];
//     const sheet = workbook.Sheets[sheetName];
//     const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

//     const headerRow = jsonData[0];
//     const skuIndex = headerRow.findIndex((header) => header === 'Variant SKU');
//     if (skuIndex === -1) {
//         throw new Error('Variant SKU column not found in the file.');
//     }

//     const skuData = jsonData.find((row) => row[skuIndex] === sku);

//     jsonData.forEach((row) => {
//         if (row[skuIndex] === sku) {
//             console.log(row);
//             // Perform any other actions you need here
//         }
//     });

//     if (skuData) {
//         // console.log("All column headers:", skuData);
//         const result = {};
//         headerRow.forEach((header, index) => {
//             // console.log(header, index, '----', String(skuData[index]))
//             result[header] = skuData[index] !== undefined ? String(skuData[index]) : '';
//         });
//         // Log all column headers
//         // console.log("All column headers:", headerRow);
//         return result;
//     } else {
//         return null;
//     }
// }
const url = 'https://cdn.shopify.com/s/files/1/0626/6067/3692/files/product_web_data_2023_bds_suspension_bros.xlsx';

async function fetchWithRetries(url, options, retries = 3, backoff = 3000) {
    for (let i = 0; i < retries; i++) {
        try {
            const fetch = await import('node-fetch').then(module => module.default);
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response;
        } catch (error) {
            if (i < retries - 1) {
                console.log(`Retrying... (${i + 1})`);
                await new Promise(resolve => setTimeout(resolve, backoff));
            } else {
                throw error;
            }
        }
    }
}

async function readXlsxFile(sku) {
    try {
        const response = await fetchWithRetries(url);
        const arrayBuffer = await response.arrayBuffer();
        const data = new Uint8Array(arrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        const headerRow = jsonData[0];
        const skuIndex = headerRow.findIndex((header) => header === 'Variant SKU');
        if (skuIndex === -1) {
            throw new Error('Variant SKU column not found in the file.');
        }

        // Find the row with the specified SKU
        const skuData = jsonData.find(row => row.includes(sku));

        if (skuData) {
            const result = headerRow.reduce((acc, header, index) => {
                acc[header] = skuData[index] !== undefined ? skuData[index] : '';
                return acc;
            }, {});
            return result;
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error reading XLSX file:', error);
        throw error;
    }
}


async function findTheColumnWithAddOn(sku) {
    const data = await readXlsxFile(sku);
    const addOnKeys = Object.keys(data).filter(key => key.includes('add_on'));
    const addOnObjects = addOnKeys.map(key => ({ [key]: data[key] }));
    return addOnObjects;
}

async function splitTheSKUs(sku) {
    const metafields = await findTheColumnWithAddOn(sku);
    metafields.forEach(metafield => {
        for (let key in metafield) {
            const value = metafield[key];
            if (value && value !== "No Add Ons Available") {
                const skus = value.split(',');
                console.log(`Title: ${key}, SKUs: ${skus}`);
            }
        }
    });
    return sku;
}

function appendDiv(sku, variant_data) {
    console.log("SKU:", sku, "Variant Data:", variant_data);
}

app.get('/api/related-products/products', async (req, res) => {
    const { sku } = req.query;

    try {
        const data = await splitTheSKUs(sku);

        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(`
      (${appendDiv.toString()})('${sku}', ${JSON.stringify(data)});
    `);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});




