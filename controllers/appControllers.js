// controllers/storeController.js
const pool = require('../config/db');
const XLSX = require('xlsx');

// Function to get store data by store ID
const getStoreDataById = (storeId, callback) => {
    pool.query(
        'SELECT * FROM storeData WHERE store_id = ?',
        [storeId],
        (error, results) => {
            if (error) {
                console.error('Error fetching data from storeData table:', error);
                callback({ error: 'Database query failed' }, null);
                return;
            }
            if (results.length === 0) {
                callback({ error: 'Store data not found' }, null);
                return;
            }
            callback(null, results);
        }
    );
};

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

async function readXlsxFile(sku, csvUrl) {
    try {
        const response = await fetchWithRetries(csvUrl);
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


async function findTheColumnWithAddOn(sku, csvUrl) {
    const data = await readXlsxFile(sku, csvUrl);
    const addOnKeys = Object.keys(data).filter(key => key.includes('add_on'));
    const addOnObjects = addOnKeys.map(key => ({ [key]: data[key] }));
    return addOnObjects;
}

async function fetchSkuData(sku, storefront_api, store_url) {
    const query = `
    query VariantById($variantSku: String!) {
      site {
        product(sku: $variantSku) {
          entityId
          name
          sku
          defaultImage {
            url(width: 500, height: 500)
          }
          addToCartUrl
          prices {
            price {
              currencyCode
              value
            }
            salePrice {
              value
              currencyCode
            }
          }
          path
          availabilityV2 {
            status
          }
          brand {
            name
          }
        }
      }
    }`;

    const variables = { variantSku: sku };
    const response = await fetch(store_url + '/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${storefront_api}`
        },
        body: JSON.stringify({ query, variables })
    });
    const result = await response.json();
    return result.data.site.product;
}

const splitTheSKUs = async (sku, storeId, storefront_api) => {
    try {
        const storeData = await getStoreDataByIdPromise(storeId);

        const metafields = await findTheColumnWithAddOn(sku, storeData.csv_url);
        const store_url = storeData.storeUrl;
        const result = {
            "All": [],
            "accessories": [],
            "control_arms": [],
            "required_hardware": [],
            "steering_stabilizers": [],
            "traction_bars": []
        };

        await Promise.all(metafields.map(async metafield => {
            for (let key in metafield) {
                const value = metafield[key];
                if (value && value !== "No Add Ons Available") {
                    const skus = value.split(',');
                    const responses = await Promise.all(skus.map(sku => fetchSkuData(sku, storefront_api, store_url)));
                    if (key.includes('add_ons')) {
                        result["All"].push(...responses);
                    } else if (key.includes('add_on_accessories')) {
                        result["accessories"].push(...responses);
                    } else if (key.includes('add_on_control_arms')) {
                        result["control_arms"].push(...responses);
                    } else if (key.includes('add_on_required_hardware')) {
                        result["required_hardware"].push(...responses);
                    } else if (key.includes('add_on_steering_stabilizers')) {
                        result["steering_stabilizers"].push(...responses);
                    } else if (key.includes('add_on_traction_bars')) {
                        result["traction_bars"].push(...responses);
                    }
                }
            }
        }));

        // console.log("result here", result);
        return { result, storeData };
        // return result;
    } catch (error) {
        console.error('Error in splitTheSKUs:', error);
        throw error;
    }
}

const getStoreDataByIdPromise = (storeId) => {
    return new Promise((resolve, reject) => {
        getStoreDataById(storeId, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results[0]);
            }
        });
    });
};


module.exports = {
    splitTheSKUs
};
