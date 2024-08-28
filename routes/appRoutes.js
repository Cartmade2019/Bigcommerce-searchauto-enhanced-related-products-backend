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
              </div>   
               <div class="card-bottom-container">
                  <div class="price--container">
                      <p class="price-money">${currencyCode} ${priceValue}</p>
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
        </div>
      `;
    }).join('');
  }


  // Function to create tabs and their respective product cards
  function createTabs(data) {
    // Filter out tabs that have no data or contain only null values
    const tabs = Object.keys(data).filter(key =>
      Array.isArray(data[key]) && data[key].length > 0 && data[key].some(item => item !== null)
    );

    // Return an empty string if there are no valid tabs
    if (tabs.length === 0) {
      return '';
    }

    // Function to format tab headers
    const formatHeader = (header) => {
      return header
        .split('_') // Split by underscore
        .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize each word
        .join(' '); // Join the words with a space
    };

    // Check if there is more than one non-empty tab
    const multipleTabs = tabs.length > 1;

    // Generate tab headers only if there is more than one tab
    const tabHeaders = multipleTabs ? tabs.map((tab, index) => `
      <button class="tablink ${index === 0 ? 'active' : ''}" onclick="openTab(event, '${tab}')">${formatHeader(tab)}</button>
    `).join('') : '';

    // Generate tab contents
    const tabContents = tabs.map((tab, index) => `
      <div id="${tab}" class="tabcontent related-products--tab-content" style="${index === 0 ? 'display:block;' : 'display:none;'}">
        <div class="related-products-swiper-container related-products-swiper-container-${index} swiper-container">
          <div class="related-products-swiper-wrapper swiper-wrapper">
            ${createProductCards(data[tab])}
          </div>
        </div>
        <div class="related-products-swiper-button-next swiper-button-next swiper-button-next-${index}"></div>
        <div class="related-products-swiper-button-prev swiper-button-prev swiper-button-prev-${index}"></div>
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
            ${multipleTabs ? `<div class="sacra-tab tab-wrapper">${tabHeaders}</div>` : ''}
            ${tabContents}
          </div>
        </div>
      </section>
    `;
  }




  // Append the created tabs to the PDP
  const appendElement = document.querySelector("main") ||
    document.querySelector(".body") ||
    document.body;

  const haloElement = document.querySelector(".halo-productView-top");

  if (haloElement) {
    // If the element with class "halo-productView-top" exists, append tabs next to it
    haloElement.insertAdjacentElement('afterend', createTabs(variant_data));
  } else if (appendElement) {
    // Otherwise, append tabs to the selected appendElement
    appendElement.appendChild(createTabs(variant_data));
  }


  // Function to handle tab switching
  function openTab(evt, tabName) {
    const tabcontent = document.querySelectorAll(".tabcontent");
    tabcontent.forEach(content => content.style.display = "none");

    const tablinks = document.querySelectorAll(".tablink");
    tablinks.forEach(link => link.classList.remove("active"));

    const selectedTab = document.getElementById(tabName);
    selectedTab.style.display = "block";
    evt.currentTarget.classList.add("active");

    // Initialize Swiper for the opened tab
    const tabIndex = Array.from(tablinks).findIndex(link => link.classList.contains("active"));
    initializeRelatedProdSwiper(tabIndex);
  }

  // Add the openTab function to the global scope
  window.openTab = openTab;

  function initializeRelatedProdSwiper(index) {
    // Destroy existing Swiper instance if it exists
    if (window.relatedProdSwipers && window.relatedProdSwipers[index]) {
      window.relatedProdSwipers[index].destroy(true, true);
    }

    // Initialize new Swiper instance
    const swiper = new Swiper(`.related-products-swiper-container-${index}`, {
      slidesPerView: 1,
      spaceBetween: 0,
      navigation: {
        nextEl: `.swiper-button-next-${index}`,
        prevEl: `.swiper-button-prev-${index}`,
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

    // Store the Swiper instance
    if (!window.relatedProdSwipers) {
      window.relatedProdSwipers = {};
    }
    window.relatedProdSwipers[index] = swiper;
  }

  // initialize first tab
  initializeRelatedProdSwiper(0)
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
              ${appendDiv.toString()}
              appendDiv('${sku}', ${JSON.stringify(result)}, '${defaultImageUrl}', ${JSON.stringify(storeData)});
          };
          document.head.appendChild(scriptSwiperJs);

          
  
        })();
  
        
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
