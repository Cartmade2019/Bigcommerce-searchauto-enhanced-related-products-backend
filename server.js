const express = require('express');
const app = express();
const path = require('path');
const XLSX = require('xlsx');
const port = 7755;

app.use('/static', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});

const url = 'https://cdn.shopify.com/s/files/1/0674/1449/1385/files/product_web_data_2023_bds_suspension_bros_test.xlsx?v=1716360566';

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

async function splitTheSKUs(sku, storefront_api) {
    const metafields = await findTheColumnWithAddOn(sku);
    const store_url = 'https://lifted-4x4.mybigcommerce.com';
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
                // const responses = await Promise.all(skus.map(fetchSkuData));
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

    console.log("result here", result);
    return result;
}

// Function to create the product cards and tabs
function appendDiv(sku, variant_data) {
    console.log("SKU:", sku, "Variant Data:", variant_data);

    // Function to create product cards
    function createProductCards(products) {
        return products.map(product => {
            const imageUrl = product.defaultImage ? product.defaultImage.url : '';
            return `
        <div class="related-products-swiper-slide swiper-slide">
          <div class="product-card">
            <div class="card-image-container">
                <img src="${imageUrl}" alt="${product.name}" />
            </div>
            <div class="card-information-wrapper">
                <div class="card-information-container">
                    <div class="card-group-container">
                        <span class="brand--name">${product.brand.name}</span>
                    </div>
                    <div class="product--title-container">
                            <a href="${product.path}" tabindex="0">
                            ${product.name}
                        </a>
                    </div>
                    <div class="price--container">
                        <p class="price-money">${product.prices.price.currencyCode} ${product.prices.price.value}</p>
                    </div>
                </div>   
                <div class="card-button-container">
                    <!-- 
                     <p>Status: ${product.availabilityV2.status}</p>
                     <a href="${product.addToCartUrl}" target="_blank" class="button button-container">Add to Cart</a>\
                    -->
                    <a href="${product.path}" class="button-link-to">View Details</a>
                </div>
            </div>
          </div>
        </div>
      `;
        }).join('');
    }

    // Function to create tabs and their respective product cards
    function createTabs(data) {
        const tabs = Object.keys(data).filter(key => data[key].length > 0);
        const tabHeaders = tabs.map(tab => `<button class="tablink" onclick="openTab(event, '${tab}')">${tab}</button>`).join('');
        const tabContents = tabs.map(tab => `
      <div id="${tab}" class="tabcontent related-products--tab-content">
        <div class="related-products-swiper-container swiper-container">
          <div class="related-products-swiper-wrapper swiper-wrapper">
            ${createProductCards(data[tab])}
          </div>
          <!-- Add Pagination -->
          <div class="related-products-swiper-pagination swiper-pagination"></div>
          <!-- Add Navigation -->
          <div class="related-products-swiper-button-next swiper-button-next"></div>
          <div class="related-products-swiper-button-prev swiper-button-prev"></div>
        </div>
      </div>
    `).join('');

        return `
        <section id="sacra-custom-realted-product" class="sacra-section">
        <div class="sa-custom-related-product-container sacra-page-width" >
            <div class="sacra-inner-wrapper">
                <div class="sacra-inner-container">
                    <h2>Complete Your Build</h2>
                    <span>Complete your build with these products designed to work with the product you added to your
                        cart</span>
                </div>
                </div>
                <div class="related-products--wrapper">
                <div class="tab tab-wrapper">
                    ${tabHeaders}
                </div>
                ${tabContents}
            </div>
        </div>
      </section>
    `;
    }

    // Append the created tabs to the body
    document.body.innerHTML += createTabs(variant_data);

    // Function to handle tab switching
    function openTab(evt, tabName) {
        const tabcontent = document.querySelectorAll(".tabcontent");
        tabcontent.forEach(content => content.style.display = "none");

        const tablinks = document.querySelectorAll(".tablink");
        tablinks.forEach(link => link.classList.remove("active"));

        document.getElementById(tabName).style.display = "block";
        evt.currentTarget.classList.add("active");
    }

    // Add the openTab function to the global scope
    window.openTab = openTab;

    // Set default tab to open
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelector('.tablink').click();
    });
}

app.get('/api/related-products/products', async (req, res) => {
    const { sku, storefront_api } = req.query;

    try {
        const data = await splitTheSKUs(sku, storefront_api);

        res.setHeader('Content-Type', 'application/javascript');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.send(`
      (function() {
        ${appendDiv.toString()}
        appendDiv('${sku}', ${JSON.stringify(data)});

        // Adding link to external CSS file
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = 'http://localhost:7755/static/styles.css';
        document.head.appendChild(link);
        
        // Adding link to Swiper CSS
        const linkSwiperCss = document.createElement('link');
        linkSwiperCss.rel = 'stylesheet';
        linkSwiperCss.type = 'text/css';
        linkSwiperCss.href = 'https://unpkg.com/swiper/swiper-bundle.min.css';
        document.head.appendChild(linkSwiperCss);

        // Adding Swiper JS script
        const scriptSwiperJs = document.createElement('script');
        scriptSwiperJs.src = 'https://unpkg.com/swiper/swiper-bundle.min.js';
        scriptSwiperJs.onload = function() {
          initializeSwiper();
        };
        document.head.appendChild(scriptSwiperJs);
      })();

      function initializeSwiper() {
        const swiper = new Swiper('.related-products-swiper-container', {
          slidesPerView: 4,
          spaceBetween: 30,
          navigation: {
            nextEl: '.related-products-swiper-button-next',
            prevEl: '.related-products-swiper-button-prev',
          },
        });
      }
    `);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});





