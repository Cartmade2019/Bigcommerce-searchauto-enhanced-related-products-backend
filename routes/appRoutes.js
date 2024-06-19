// routes/storeRoutes.js
const express = require('express');
const router = express.Router();
require('dotenv').config();
const appController = require('../controllers/appControllers');

// router.get('/stores', appController.getStores);

// Function to create the product cards and tabs
function appendDiv(sku, variant_data, defaultImageUrl, storeData) {
  console.log("SKU:", sku, "Variant Data:", variant_data);
  // Function to create product cards
  function createProductCards(products) {
    return products.map(product => {
      // Ensure product object exists and is not null
      if (!product) return '';

      const imageUrl = product?.defaultImage?.url ?? defaultImageUrl;
      const brandName = product?.brand?.name ?? '';
      const productPath = product?.path ?? '#';
      const productName = product?.name ?? 'Product Title';
      const currencyCode = product?.prices?.price?.currencyCode ?? '';
      const priceValue = product?.prices?.price?.value ?? '0.00';

      return `
        <div class="related-products-swiper-slide swiper-slide">
          <div class="product-card">
            <div class="card-image-container">
              <img src="${imageUrl}" alt="${productName}" />
            </div>
            <div class="card-information-wrapper">
              <div class="card-information-container">
                ${brandName ? `
                  <div class="card-group-container">
                    <span class="brand--name">${brandName}</span>
                  </div>` : ''
        }
                <div class="product--title-container">
                  <a href="${productPath}" tabindex="0">
                    ${productName}
                  </a>
                </div>
                <div class="price--container">
                  <p class="price-money">${currencyCode} ${priceValue}</p>
                </div>
              </div>   
              <div class="card-button-container">
                <!-- Uncomment below lines if Add to Cart functionality is needed -->
                <!-- <p>Status: ${product?.availabilityV2?.status ?? 'Unavailable'}</p>
                <a href="${product?.addToCartUrl ?? '#'}" target="_blank" class="button button-container">Add to Cart</a> -->
                <a href="${productPath}" class="button-link-to">View Details</a>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }


  // Function to create tabs and their respective product cards
  function createTabs(data, storeData = {}) {
    // Filter out tabs that have no data
    const tabs = Object.keys(data).filter(key => data[key].length > 0);

    // Generate tab headers
    const tabHeaders = tabs.map(tab => `
      <button class="tablink" onclick="openTab(event, '${tab}')">${tab}</button>
    `).join('');

    // Generate tab contents
    const tabContents = tabs.map(tab => `
      <div id="${tab}" class="tabcontent related-products--tab-content">
        <div class="related-products-swiper-container swiper-container">
          <div class="related-products-swiper-wrapper swiper-wrapper">
            ${createProductCards(data[tab])}
          </div>
        </div>
        <div class="related-products-swiper-button-next swiper-button-next"></div>
        <div class="related-products-swiper-button-prev swiper-button-prev"></div>
      </div>
    `).join('');

    // Use optional chaining for storeData and provide fallback values
    const heading = storeData?.heading ?? '';
    const subHeading = storeData?.sub_heading ?? '';

    return `
      <section id="sacra-custom-related-product" class="sacra-section">
        <div class="sa-custom-related-product-container sacra-page-width">
          <div class="sacra-inner-wrapper">
            <div class="sacra-inner-container">
              <h2>${heading}</h2>
              <span>${subHeading}</span>
            </div>
          </div>
          <div class="related-products--wrapper">
            <div class="sacra-tab tab-wrapper">
              ${tabHeaders}
            </div>
            ${tabContents}
          </div>
        </div>
      </section>
    `;
  }


  // Append the created tabs to the body
  const appendElement = document.querySelector("main");
  if (appendElement) {
    appendElement.innerHTML += createTabs(variant_data);
  }

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

router.get('/related-products/products', async (req, res) => {
  const { sku, storeId, storefront_api } = req.query;
  // If sku is empty, return without running any code
  if (!sku) {
    res.status(400).send('SKU is required');
    return;
  }
  try {
    const { result, storeData } = await appController.splitTheSKUs(sku, storeId, storefront_api);
    if (result) {
      const defaultImageUrl = process.env.DEFAULTIMAGEURL || '';
      const appStyleURL = process.env.APPSTYLESHEETURL || '';
      res.setHeader('Content-Type', 'application/javascript');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(`
        (function() {
          ${appendDiv.toString()}
          appendDiv('${sku}', ${JSON.stringify(result)}, '${defaultImageUrl}', ${JSON.stringify(storeData)});
  
          // Adding link to external CSS file
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.type = 'text/css';
          link.href = '${appStyleURL}';
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
              initializeRelatedProdSwiper();
          };
          document.head.appendChild(scriptSwiperJs);
        })();
  
        function initializeRelatedProdSwiper() {
          const swiper = new Swiper('.related-products-swiper-container', {
            slidesPerView: 4,
            spaceBetween: 15,
  
            navigation: {
              nextEl: '.related-products-swiper-button-next',
              prevEl: '.related-products-swiper-button-prev',
            },
            breakpoints: {
              640: {
                slidesPerView: 2,
                spaceBetween: 15,
              },
              768: {
                slidesPerView: 3,
                spaceBetween: 15,
              },
              1024: {
                slidesPerView: 3,
                spaceBetween: 15,
              },
              1280: {
                  slidesPerView: 4,
                  spaceBetween: 15,
                }
              }
          });
        }
      `);
    } else {
      res.status(404).send('Data not found');
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send('Internal Server Error');
  }
});


module.exports = router;
