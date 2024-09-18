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
                    <!-- Uncomment below lines if Add to Cart functionality is needed 
                    <p>Status: ${product?.availabilityV2?.status ?? 'Unavailable'}</p> -->
                      <div class="card-button-wrapper">
                        <a href="${product?.availabilityV2?.status ? product?.addToCartUrl : '#'}" 
                          class="sacra-button button-sa-outline ${!product?.availabilityV2?.status ? 'disabled' : ''}" 
                          ${!product?.availabilityV2?.status ? 'disabled' : ''}>
                          Add to Cart
                        </a>   
                      </div>
                     <!-- <a href="${productPath}" class="button-link-to">View Details</a> -->
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

    const tabContainers = `
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


    const GlobalDiv = document.createElement('div');
    GlobalDiv.className = 'sacra-tabs-global---container';
    GlobalDiv.innerHTML = tabContainers;
    return GlobalDiv;
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


// Function to create the product popup on cartside drawer
function saerpAppendPopupDiv(sku, variantData, defaultImageUrl, storeData) {
  const productData = variantData;

  // Filter out tabs that have no data or contain only null values
  const tabs = Object.keys(productData).filter(key =>
    Array.isArray(productData[key]) && productData[key].length > 0 && productData[key].some(item => item !== null)
  );

  // Return an empty string if there are no valid tabs
  if (tabs.length === 0) {
    return;
  }

  // Use optional chaining for storeData and provide fallback values
  const heading = storeData?.heading ?? '';
  const subHeading = storeData?.sub_heading ?? '';

  // Function to check if array has any valid data
  const saerpHasValidData = (arr) => arr && Array.isArray(arr) && arr.some(item => item !== null && item !== undefined);

  // Function to generate HTML structure for each item
  const saerpGenerateItemHTML = (item) => {
    if (!item || !item.name || !item.sku || !item.prices) return '';

    const imageUrl = item.defaultImage?.url || defaultImageUrl;

    return `
      <div class="saerp-product-item">
          <div class="saerp-product-name"><h4>${item.name}</h4></div>
          <div class="saerp-product-item-content">
            <div class="saerp-product-item-img-container">
              <img class="saerp-product-image" src="${imageUrl}" alt="${item.name}">
              <div class="saerp-product-sku">SKU: ${item.sku}</div>
              <div class="saerp-product-price">Price: ${item?.prices?.price?.currencyCode || '$'} ${item.prices.price.value || 'NaN'}</div>
            </div>
            <div class="saerp-product-item-button-container">
              <div class="saerp-quantity-wrapper saerp-form-increment">
                  <button class="saerp-button saerp-button-icon saerp-qty-dec" data-action="dec"></button>
                  <input type="number" value="1" class="saerp-form-input saerp-form-input-increment">
                  <button class="saerp-button saerp-button-icon saerp-qty-inc" data-action="inc"></button>
              </div>
              <div class="saerp-product-item-atc-button">
                <button class="saerp-add-to-cart-btn" data-id="${item.entityId}">Add</button>
               </div>
            </div>
          </div>
      </div>
    `;
  };

  // Function to create a product category section
  const saerpCreateCategorySection = (products, heading) => {
    const section = document.createElement('div');
    section.classList.add('saerp-product-category-section');

    const headingElement = document.createElement('h3');
    headingElement.textContent = heading;
    section.appendChild(headingElement);

    products.forEach(item => {
      if (item) {
        const productElement = document.createElement('div');
        productElement.innerHTML = saerpGenerateItemHTML(item);
        if (productElement.firstElementChild) {
          section.appendChild(productElement.firstElementChild);
        }
      }
    });

    return section;
  };

  // Function to generate the "Add All to Cart" button
  const saerpCreateAddAllButton = (cartUrls) => {
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('saerp-add-all-to-cart-btn-container');
    const button = document.createElement('button');
    // button.classList.add('saerp-add-all-to-cart-btn button button-primary');
    button.classList.add('saerp-add-all-to-cart-btn', 'button', 'button-primary');
    button.id = 'saerp-add-all-to-cart-btn';
    // button.dataset.urls = cartUrls.join(',');
    button.textContent = 'Add All to Cart';
    buttonContainer.appendChild(button);
    return buttonContainer;
  };

  // /Button functions start
  async function fetchCart(route) {
    try {
      const response = await fetch(route, {
        method: "GET",
        credentials: "same-origin",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch cart: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching cart:", error);
      return null;
    }
  }

  async function addItemToCart(apiBaseUrl, cartId, cartItems) {
    const route = `${apiBaseUrl}${cartId}/items`;

    try {
      const response = await fetch(route, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(cartItems),
      });

      if (!response.ok) {
        throw new Error(`Failed to add item to cart: ${response.status} - ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error("Error adding item to cart:", error);
      return null;
    }
  }

  async function addSaerpProductToCart(lineItems, buttonElement) {
    try {
      // Show loading state on button
      if (buttonElement) {
        buttonElement.disabled = true;
        buttonElement.innerHTML = 'Loading...'; // Update button text to show loading
      }

      const cartData = await fetchCart('/api/storefront/carts');

      // Edge case 1: If no valid cart is returned
      if (!cartData || !cartData[0]?.id) {
        throw new Error("No valid cart found");
      }

      const cartId = cartData[0].id;

      // Edge case 2: If no line items to add
      if (!lineItems || lineItems.length === 0) {
        throw new Error("No products to add to cart");
      }

      const addCartResponse = await addItemToCart(`/api/storefront/carts/`, cartId, { lineItems });

      if (addCartResponse) {
        var inputElement = document.querySelector('.previewCartItem-qty input');
        if (inputElement) {
          var event = new Event('change', { bubbles: true });
          inputElement.dispatchEvent(event);
        } else {
          console.warn('Input element not found within .previewCartItem-qty.');
        }
        console.log("Products successfully added to cart:", addCartResponse);
      }
    } catch (error) {
      // Edge case 3: Handle all types of errors (e.g., network errors)
      console.error("Error adding products to cart:", error);
      alert(`Failed to add products: ${error.message}`);
    } finally {
      // Remove loading state on button
      if (buttonElement) {
        buttonElement.disabled = false;
        buttonElement.innerHTML = 'Add'; // Revert button text after loading
      }
    }
  };

  // Attach event listeners for quantity increment/decrement
  const setupQuantityControls = () => {
    document.querySelectorAll('.saerp-qty-inc, .saerp-qty-dec').forEach(button => {
      button.addEventListener('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        const input = this.closest('.saerp-quantity-wrapper').querySelector('.saerp-form-input-increment');
        const action = this.getAttribute('data-action');

        let currentQuantity = parseInt(input.value, 10);
        if (isNaN(currentQuantity)) currentQuantity = 1; // Handle invalid input gracefully

        if (action === 'inc') {
          input.value = currentQuantity + 1;
        } else if (action === 'dec' && currentQuantity > 1) {
          input.value = currentQuantity - 1;
        }
      });
    });
  };

  // Function to attach event listeners to individual 'Add to Cart' buttons
  const setupAddToCartButtons = () => {
    const buttons = document.querySelectorAll('.saerp-add-to-cart-btn');

    if (buttons.length > 0) {
      buttons.forEach(button => {
        button.addEventListener('click', async function (event) {
          event.preventDefault();
          event.stopPropagation();
          const productId = this.getAttribute('data-id');
          const quantityInput = this.closest('.saerp-product-item-button-container').querySelector('.saerp-form-input-increment');
          const quantity = parseInt(quantityInput.value, 10);

          // Edge case 4: Validate productId
          if (!productId || isNaN(parseInt(productId, 10))) {
            console.error("Invalid product ID:", productId);
            alert("Invalid product ID. Please try again.");
            return;
          }

          if (isNaN(quantity) || quantity <= 0) {
            console.error("Invalid quantity:", quantity);
            alert("Invalid quantity. Please enter a positive number.");
            return;
          }

          const lineItems = [
            {
              quantity,
              productId: parseInt(productId, 10),
            },
          ];

          // Pass button element to manage loading state
          await addSaerpProductToCart(lineItems, this);
        });
      });
    }
  };

  // Function to add all products to the cart
  const addAllProductsToCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    const buttons = document.querySelectorAll('.saerp-add-to-cart-btn');
    const lineItems = [];

    // Collect all product IDs from buttons
    buttons.forEach(button => {
      const productId = button.getAttribute('data-id');
      const quantityInput = button.closest('.saerp-product-item-button-container').querySelector('.saerp-form-input-increment');
      const quantity = parseInt(quantityInput.value, 10);

      // Edge case 6: Validate product ID and quantity, and avoid duplicates
      if (productId && !isNaN(parseInt(productId, 10)) && quantity > 0) {
        const parsedProductId = parseInt(productId, 10);

        // Avoid adding the same product twice
        if (!lineItems.some(item => item.productId === parsedProductId)) {
          lineItems.push({
            quantity,
            productId: parsedProductId,
          });
        }
      } else {
        console.error("Invalid product ID:", productId, quantity);
      }
    });

    // Edge case 7: No products available to add
    if (lineItems.length === 0) {
      alert("No valid products available to add to cart.");
      return;
    }

    // Disable the "Add All" button during the request
    const addAllButton = document.getElementById('saerp-add-all-to-cart-btn');
    if (addAllButton) {
      addAllButton.disabled = true;
      addAllButton.innerHTML = 'Adding All...';
    }

    await addSaerpProductToCart(lineItems, addAllButton);

    if (addAllButton) {
      addAllButton.disabled = false;
      addAllButton.innerHTML = 'Add All to Cart';
    }
  };

  // Setup 'Add All' button functionality
  const setupAddAllButton = () => {
    const addAllButton = document.getElementById('saerp-add-all-to-cart-btn');
    if (addAllButton) {
      addAllButton.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        await addAllProductsToCart(event);
      });
    }
  };

  // Button functions end

  // Add to cart button functionlity - hide the button adn append ours
  const setupDomATCButton = () => {
    // Find the form by data attribute or fallback to ID
    const form = document.querySelector('[data-cart-item-add]') || document.getElementById('add-to-cart-form');
    if (!form) {
      console.error('Form not found');
      return;
    }
    // Find the submit button inside the form or fallback to ID
    let submitButton = form.querySelector('button[type="submit"]') || document.getElementById('form-action-addToCart');
    if (!submitButton) {
      console.error('Submit button not found');
      return;
    }

    // Get all classes of the submit button except "has_related_product" and "disable-data"
    const buttonClasses = Array.from(submitButton.classList).filter(cls => cls !== 'has_related_product' && cls !== 'disabled');

    // Hide the original submit button
    submitButton.style.display = 'none';

    // Create a custom button element
    const customButton = document.createElement('button');
    customButton.id = 'Saerp-form-action-addToCart';
    customButton.textContent = 'Add to Cart';
    customButton.classList.add(...buttonClasses);

    // Append the custom button in the same position
    submitButton.parentNode.insertBefore(customButton, submitButton.nextSibling);


    // Add event listener to custom button
    customButton.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      customButton.disabled = true;
      customButton.innerHTML = 'Adding to Cart…';
      saerpProcessData(productData);
      // Trigger the hidden submit button
      submitButton.click();

      customButton.disabled = false;
      customButton.innerHTML = 'Add to Cart';
    });

  };
  // Add to cart button functionlity - hide the button adn append ours

  const setupDomPrevention = () => {
    const saerpContainer = document.querySelector('.saerp-content-container');
    if (saerpContainer) {
      saerpContainer.addEventListener('click', function (event) {
        const target = event.target;
        if (
          target.classList.contains('saerp-button-icon') ||
          target.classList.contains('saerp-form-input-increment') ||
          target.tagName === 'BUTTON' ||
          target.tagName === 'INPUT'
        ) {
          // Allow the default behavior for these elements
          console.log('Button, input, or allowed element clicked');
        } else {
          event.stopPropagation();
          event.preventDefault();
        }
      });

      // Close popup when clicking outside the content area
      // window.addEventListener('click', (e) => {
      //   if (e.target === saerpContainer) {
      //     saerpContainer.style.display = 'none';
      //   }
      // });
    }
  }

  // initiaze all CTA buttons
  const initializeCTAfunctionsManager = () => {
    // Initialze button function
    setupQuantityControls();
    setupAddToCartButtons();
    setupAddAllButton();
    setupDomPrevention();
  };

  // Function to detect device type and log message
  function detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const width = window.innerWidth;
    if (/mobile/i.test(userAgent) || width <= 767) {
      return false;
    } else if (/tablet|ipad|playbook|silk/i.test(userAgent) || (width > 767 && width <= 1024)) {
      return false;
    } else {
      return true;
    }
  }



  // Main function to analyze data and create the product display
  const saerpProcessData = (data) => {
    if (!data || typeof data !== 'object') {
      console.error('SAERP: Invalid data provided');
      return;
    }

    const { All, accessories, control_arms, required_hardware, steering_stabilizers, traction_bars } = data;
    const cartUrls = [];
    const contentContainer = document.createElement('div');
    contentContainer.classList.add('saerp-content-container');

    const globalHeader = document.createElement('h2');
    globalHeader.textContent = heading;
    contentContainer.appendChild(globalHeader);

    // Helper function to append products for a category
    const saerpAppendCategory = (categoryData, heading) => {
      if (saerpHasValidData(categoryData)) {
        const filteredData = categoryData.filter(item => item !== null);
        const categorySection = saerpCreateCategorySection(filteredData, heading);
        contentContainer.appendChild(categorySection);
        cartUrls.push(...filteredData.filter(item => item && item.addToCartUrl).map(item => item.addToCartUrl));
        return true;
      }
      return false;
    };

    // Define specific categories (excluding 'All')
    const specificCategories = [
      [accessories, 'Accessories'],
      [control_arms, 'Control Arms'],
      [required_hardware, 'Required Hardware'],
      [steering_stabilizers, 'Steering Stabilizers'],
      [traction_bars, 'Traction Bars']
    ];

    let specificCategoriesAppended = 0;

    // First, try to append specific categories
    specificCategories.forEach(([category, heading]) => {
      if (saerpAppendCategory(category, heading)) {
        specificCategoriesAppended++;
      }
    });

    // If no specific categories have data, then try to append 'All' category
    if (specificCategoriesAppended === 0 && saerpHasValidData(All)) {
      saerpAppendCategory(All, 'Available Products');
    }

    // Handle edge case where no data is available at all
    if (contentContainer.children.length === 1) { // Only the header is present
      const noDataMessage = document.createElement('p');
      noDataMessage.textContent = 'No product data available.';
      noDataMessage.classList.add('saerp-no-data-message');
      contentContainer.appendChild(noDataMessage);
    }

    // Add the "Add All to Cart" button if there are URLs
    if (cartUrls.length > 0) {
      const addAllButton = saerpCreateAddAllButton(cartUrls);
      contentContainer.appendChild(addAllButton);
    }

    // Clear the main container and append the new content
    // const saerpMainContainer = document.getElementById('product-container-bundle');
    const isDesktop = detectDevice();
    let saerpMainContainer;

    if (!isDesktop) {
      saerpMainContainer = document.getElementById('halo-cart-sidebar');
    } else {
      saerpMainContainer = document.querySelector('main') || document.querySelector('body');
    }

    if (saerpMainContainer) {
      const saerpPopupMainContainer = document.querySelector('.saerp-content-container');

      if (saerpPopupMainContainer) {
        saerpPopupMainContainer.remove();
      }
      saerpMainContainer.appendChild(contentContainer);
    } else {
      console.error('SAERP: Main container not found');
    }

    // Initialize all functions
    initializeCTAfunctionsManager()
  };

  // Run the function with the provided data
  // saerpProcessData(productData);

  setupDomATCButton();;
}
// Function to create the product popup on cartside drawer

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
              // Carousel div
              ${appendDiv.toString()}
              appendDiv('${sku}', ${JSON.stringify(result)}, '${defaultImageUrl}', ${JSON.stringify(storeData)});
               // popup div
              ${saerpAppendPopupDiv.toString()}
              saerpAppendPopupDiv('${sku}', ${JSON.stringify(result)}, '${defaultImageUrl}', ${JSON.stringify(storeData)});
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
